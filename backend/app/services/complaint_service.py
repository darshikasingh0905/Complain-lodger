from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, ComplaintAIUpdate
from app.services import ai_service, ai_classifier, priority_engine, notification_service

def recalculate_complaint_priority(db: Session, complaint_id: int, ai_result: dict = None) -> Optional[Complaint]:
    """Helper to recalculate priority parameters using the rule-based engine."""
    db_obj = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_obj:
        return None
        
    if ai_result:
        ai_metadata = {
            "safetyRisk": ai_result.get("safetyRisk", "Medium"),
            "publicImpact": ai_result.get("publicImpact", "Medium"),
            "essentialService": ai_result.get("essentialService", False),
            "urgency": ai_result.get("urgency", "Medium")
        }
    else:
        is_essential = db_obj.department in ["Electricity Department", "Water Supply Department", "Public Health", "Fire Department"]
        ai_metadata = {
            "safetyRisk": db_obj.ai_severity or "Medium",
            "publicImpact": "Medium",
            "essentialService": is_essential,
            "urgency": db_obj.priority or "Medium"
        }
        
    res = priority_engine.calculate_priority(
        db=db,
        complaint_id=db_obj.id,
        description=db_obj.description or "",
        address=db_obj.address or "",
        category=db_obj.category or "",
        created_at=db_obj.created_at,
        status=db_obj.status or "Submitted",
        ai_metadata=ai_metadata,
        is_escalated=bool(db_obj.is_escalated)
    )
    
    db_obj.priorityScore = res["priorityScore"]
    db_obj.priorityLevel = res["priorityLevel"]
    db_obj.priorityBreakdown = res["priorityBreakdown"]
    db_obj.priority = res["priorityLevel"]  # sync legacy priority
    db_obj.ai_reason = res["reason"]  # set human-readable explanation
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_all_related_priorities(db: Session, category: str, address: str):
    """Update priorities for all complaints in the same category/address to recalculate duplicate count."""
    if not category or not address:
        return
    try:
        complaints = db.query(Complaint).filter(
            Complaint.category == category,
            Complaint.address == address
        ).all()
        for c in complaints:
            recalculate_complaint_priority(db, c.id)
    except Exception as e:
        print(f"[Complaint Service] Error updating related priorities: {e}")

def check_sla_and_escalate(db: Session):
    """
    Checks all complaints in Assigned or In Progress states against their SLA limits.
    Escalates them if they exceed the duration limit.
    """
    try:
        # SLA hour limits based on priority
        SLA_LIMITS = {
            "Critical": 24,
            "High": 72,      # 3 days
            "Medium": 168,   # 7 days
            "Low": 336       # 14 days
        }
        
        # Look for complaints in Assigned or In Progress
        complaints = db.query(Complaint).filter(
            Complaint.status.in_(["Assigned", "In Progress"]),
            or_(Complaint.is_escalated == False, Complaint.is_escalated == None)
        ).all()
        
        for c in complaints:
            if not c.created_at:
                continue
                
            priority = c.priorityLevel or c.priority or "Medium"
            limit_hours = SLA_LIMITS.get(priority, 168)
            
            elapsed_hours = (datetime.now() - c.created_at).total_seconds() / 3600
            
            if elapsed_hours >= limit_hours:
                # Escalation trigger!
                c.is_escalated = True
                print(f"[SLA Checker] Escalation triggered for Complaint #{c.id} ({priority} priority, pending {elapsed_hours:.1f} hours, limit {limit_hours} hours).")
                
                # Notify supervisor and citizen
                escalation_msg = f"Grievance Ticket #{c.id} has exceeded its SLA of {limit_hours} hours and has been escalated."
                notification_service.create_notification(db, c.id, c.citizen_phone, escalation_msg, "escalation")
                
                citizen_msg = f"Your grievance Ticket #{c.id} has been escalated to senior supervisor review due to resolution delay."
                notification_service.create_notification(db, c.id, c.citizen_phone, citizen_msg, "escalation")
                
                db.commit()
                # Recalculate priority with the new escalation boost
                recalculate_complaint_priority(db, c.id)
                
    except Exception as e:
        print(f"[SLA Checker] Error during SLA escalation run: {e}")

def refresh_pending_times(db: Session):
    """Refresh priorities for all active/pending complaints to reflect elapsed time pending."""
    try:
        # 1. First run the SLA escalator check
        check_sla_and_escalate(db)
        
        # 2. Then recalculate other unresolved complaints
        unresolved = db.query(Complaint).filter(Complaint.status.in_(["Submitted", "Assigned", "In Progress"])).all()
        for c in unresolved:
            recalculate_complaint_priority(db, c.id)
    except Exception as e:
        print(f"[Complaint Service] Error refreshing pending times: {e}")

def create_complaint(db: Session, schema: ComplaintCreate) -> Complaint:
    """
    Inserts a new grievance record, then immediately runs AI classification
    to populate department, category, priority, severity, confidence, reason, and keywords.
    """
    db_obj = Complaint(
        citizen_name=schema.citizen_name,
        citizen_phone=schema.citizen_phone,
        title=schema.title,
        description=schema.description,
        latitude=schema.latitude,
        longitude=schema.longitude,
        address=schema.address,
        image_url=schema.image_url,
        status="Submitted",
        department="Other",
        priority="Medium",
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Run AI classification (Ollama or keyword fallback)
    try:
        ai_result = ai_classifier.classify_complaint(
            title=schema.title or "",
            description=schema.description,
            location=schema.address
        )
        db_obj.department = ai_result["department"]
        db_obj.category   = ai_result["category"]
        db_obj.priority   = ai_result["priority"]
        db_obj.ai_severity = ai_result["severity"]
        db_obj.ai_confidence = ai_result["confidence"]
        db_obj.ai_reason = ai_result["reason"]
        
        # Convert keywords list to comma-separated string
        kw_list = ai_result.get("keywords", [])
        db_obj.ai_keywords = ", ".join(kw_list) if isinstance(kw_list, list) else str(kw_list)

        # Simple single sentence summary for ai_summary
        db_obj.ai_summary = ai_result.get("reason", "")
        
        print(f"[AI Classifier] Complaint #{db_obj.id} classified. Recalculating priority score...")
        db.commit()
        db.refresh(db_obj)
        
        # Run priority engine calculation
        recalculate_complaint_priority(db, db_obj.id, ai_result)
        
        # Recalculate other related complaints' duplicate score
        update_all_related_priorities(db, db_obj.category, db_obj.address)
        
        db.refresh(db_obj)
    except Exception as e:
        print(f"[AI Classifier] Classification failed for complaint #{db_obj.id}: {e}")

    return db_obj

def get_complaints(db: Session, department: Optional[str] = None, status: Optional[str] = None) -> List[Complaint]:
    """Retrieves list of all complaints with filters on department or status."""
    refresh_pending_times(db)
    query = db.query(Complaint)
    if department:
        query = query.filter(Complaint.department == department)
    if status:
        query = query.filter(Complaint.status == status)
    return query.order_by(Complaint.created_at.desc()).all()

def get_complaints_by_admin_dept(db: Session, admin_department: str, status: Optional[str] = None) -> List[Complaint]:
    """Retrieves list of complaints filtered flexibly by admin department mapping."""
    refresh_pending_times(db)
    query = db.query(Complaint)
    
    name = admin_department.lower().strip()
    dept_filters = []
    if "roads" in name:
        dept_filters.append(Complaint.department == "Roads and Drainage")
    elif "electricity" in name:
        dept_filters.append(Complaint.department == "Electricity Department")
    elif "water" in name:
        dept_filters.append(Complaint.department == "Water Supply Department")
    elif "sanitation" in name or "garbage" in name or "solid waste" in name:
        dept_filters.append(Complaint.department == "Solid Waste Management")
    elif "health" in name:
        dept_filters.append(Complaint.department == "Public Health")
    elif "transport" in name or "traffic" in name:
        dept_filters.append(Complaint.department == "Traffic Police")
    else:
        dept_filters.append(Complaint.department.ilike(f"%{admin_department}%"))
        
    query = query.filter(or_(*dept_filters))
    
    if status:
        query = query.filter(Complaint.status == status)
        
    return query.order_by(Complaint.created_at.desc()).all()

def get_complaint_by_id(db: Session, complaint_id: int) -> Optional[Complaint]:
    """Queries database for grievance by integer ID."""
    refresh_pending_times(db)
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()

def track_complaints(db: Session, search_query: str) -> List[Complaint]:
    """
    Search for grievances matching either:
    1. Integer ID matching search_query
    2. Phone number matching search_query
    """
    refresh_pending_times(db)
    query_filters = []
    
    # Try parsing search_query as ID integer
    if search_query.isdigit():
        query_filters.append(Complaint.id == int(search_query))
    
    # Filter by phone number
    query_filters.append(Complaint.citizen_phone == search_query)
    
    if not query_filters:
        return []
        
    return db.query(Complaint).filter(or_(*query_filters)).order_by(Complaint.created_at.desc()).all()

def update_complaint_status(db: Session, complaint_id: int, status: str) -> Optional[Complaint]:
    """Updates the status of an existing grievance report."""
    db_obj = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_obj:
        return None
        
    old_status = db_obj.status
    db_obj.status = status
    
    # If reopened, reset escalation status
    if status == "In Progress" and old_status in ["Resolved", "Closed"]:
        db_obj.is_escalated = False
        
        # Notify assigned officer
        officer_msg = f"[OFFICER ALERT] Complaint #{db_obj.id} has been REOPENED by the citizen. Please resume resolution immediately."
        print(f"\n=================== [OFFICER MOCK NOTIFICATION] ===================")
        print(f"[*] Dispatching internal alert to Assigned Officer: {db_obj.assigned_officer or 'Officer Sharma'}")
        print(f"[ALERT Message]: \"{officer_msg}\"")
        print(f"===================================================================\n")
        
    db.commit()
    db.refresh(db_obj)
    
    # Create notification for status change
    msg = f"Your grievance Ticket #{complaint_id} status has been updated to '{status}'."
    notification_service.create_notification(db, complaint_id, db_obj.citizen_phone, msg, "status_change")
    
    # Trigger priority update since status changed (e.g. resolved or reopened)
    recalculate_complaint_priority(db, complaint_id)
    # Recalculate duplicate counts for others
    update_all_related_priorities(db, db_obj.category, db_obj.address)
    
    return db_obj

def confirm_complaint_resolution(db: Session, complaint_id: int, rating: int, feedback: str = None) -> Optional[Complaint]:
    """Confirms complaint resolution, registers feedback & rating, and closes ticket."""
    db_obj = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_obj:
        return None
        
    db_obj.status = "Closed"
    db_obj.rating = rating
    db_obj.feedback = feedback
    db_obj.is_escalated = False
    db.commit()
    db.refresh(db_obj)
    
    # Send notification
    msg = f"Thank you for confirming resolution for Ticket #{complaint_id}. Your feedback and {rating}-star rating have been recorded."
    notification_service.create_notification(db, complaint_id, db_obj.citizen_phone, msg, "feedback")
    
    # Trigger priority update
    recalculate_complaint_priority(db, complaint_id)
    # Recalculate duplicate counts
    update_all_related_priorities(db, db_obj.category, db_obj.address)
    
    return db_obj

def update_complaint_ai(db: Session, complaint_id: int, ai_data: ComplaintAIUpdate) -> Optional[Complaint]:
    """Updates classification outputs extracted by Ollama model."""
    db_obj = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_obj:
        return None
        
    if ai_data.department is not None:
        db_obj.department = ai_data.department
    if ai_data.category is not None:
        db_obj.category = ai_data.category
    if ai_data.priority is not None:
        db_obj.priority = ai_data.priority
    if ai_data.ai_summary is not None:
        db_obj.ai_summary = ai_data.ai_summary
        
    db.commit()
    db.refresh(db_obj)
    
    # Recalculate priority
    recalculate_complaint_priority(db, complaint_id)
    
    return db_obj

def update_evidence_audit(
    db: Session,
    complaint_id: int,
    verdict: str,
    reason: str,
    confidence: float
) -> Optional[Complaint]:
    """Saves vision AI evidence audit results to the complaint record."""
    db_obj = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_obj:
        return None
    db_obj.evidence_verdict = verdict
    db_obj.evidence_reason = reason
    db_obj.evidence_confidence = confidence
    db.commit()
    db.refresh(db_obj)
    
    # Recalculate priority (new evidence added/analyzed)
    recalculate_complaint_priority(db, complaint_id)
    
    return db_obj

def get_analytics_data(db: Session, admin_department: Optional[str] = None):
    """
    Computes chronological trends, department counts, priority ratios,
    and emerging high-risk hotspot surges by comparing complaint velocities.
    """
    refresh_pending_times(db)
    from sqlalchemy import func, and_, or_, case
    from datetime import datetime, timedelta
    
    # Resolve department filters if provided
    dept_filters = []
    if admin_department:
        name = admin_department.lower().strip()
        if "roads" in name:
            dept_filters.append(Complaint.department == "Roads and Drainage")
        elif "electricity" in name:
            dept_filters.append(Complaint.department == "Electricity Department")
        elif "water" in name:
            dept_filters.append(Complaint.department == "Water Supply Department")
        elif "sanitation" in name or "garbage" in name or "solid waste" in name:
            dept_filters.append(Complaint.department == "Solid Waste Management")
        elif "health" in name:
            dept_filters.append(Complaint.department == "Public Health")
        elif "transport" in name or "traffic" in name:
            dept_filters.append(Complaint.department == "Traffic Police")
        else:
            dept_filters.append(Complaint.department.ilike(f"%{admin_department}%"))
    
    # 1. Chronological Trend (last 14 days)
    today = datetime.now().date()
    start_date = today - timedelta(days=13)
    
    # Query daily counts
    daily_query = db.query(func.date(Complaint.created_at).label("day"), func.count(Complaint.id).label("count"))
    if dept_filters:
        daily_query = daily_query.filter(or_(*dept_filters))
    daily_results = (
        daily_query.filter(Complaint.created_at >= datetime.combine(start_date, datetime.min.time()))
        .group_by(func.date(Complaint.created_at))
        .all()
    )
    
    # Fill in potential zero-count gaps for the timeseries
    daily_map = {r.day: r.count for r in daily_results}
    trend = []
    for i in range(14):
        d = start_date + timedelta(days=i)
        # Handle string formats vs date object comparisons
        count = 0
        for day_key, val in daily_map.items():
            if str(day_key) == str(d):
                count = val
                break
        trend.append({
            "date": d.strftime("%b %d"),
            "Grievances": count
        })
        
    # 2. General Department Breakdown
    dept_query = db.query(Complaint.department, func.count(Complaint.id).label("count"))
    if dept_filters:
        dept_query = dept_query.filter(or_(*dept_filters))
    dept_results = (
        dept_query.group_by(Complaint.department)
        .all()
    )
    departments = [
        {"name": str(r.department or "Other"), "Grievances": int(r.count)}
        for r in dept_results
    ]
    
    # 3. Priority levels
    priority_query = db.query(Complaint.priority, func.count(Complaint.id).label("count"))
    if dept_filters:
        priority_query = priority_query.filter(or_(*dept_filters))
    priority_results = (
        priority_query.group_by(Complaint.priority)
        .all()
    )
    priorities = [
        {"name": str(r.priority or "Medium"), "value": int(r.count)}
        for r in priority_results
    ]
    
    # 4. Chronological Surge Prediction (Emerging Hotspots)
    # Compare count in last 3 days vs preceding 7 days to estimate acceleration/surge
    three_days_ago = datetime.now() - timedelta(days=3)
    ten_days_ago = datetime.now() - timedelta(days=10)
    
    # Group by location/area and department to locate specific hotspot issues
    # case() is dialect-portable (works on both MySQL and the SQLite fallback),
    # unlike MySQL's IF() function.
    hotspots_query = db.query(
        Complaint.department,
        Complaint.address,
        func.count(Complaint.id).label("total_count"),
        func.sum(case((Complaint.created_at >= three_days_ago, 1), else_=0)).label("recent_count"),
        func.sum(case((and_(Complaint.created_at >= ten_days_ago, Complaint.created_at < three_days_ago), 1), else_=0)).label("prev_count")
    )
    if dept_filters:
        hotspots_query = hotspots_query.filter(or_(*dept_filters))
    hotspots_data = (
        hotspots_query.group_by(Complaint.department, Complaint.address)
        .all()
    )
    
    emerging_hotspots = []
    for h in hotspots_data:
        # We only consider hotspots with at least 1 recent complain and some address or department focus
        dept = h.department or "Other"
        addr = h.address or "General Zone"
        total = int(h.total_count or 0)
        recent = int(h.recent_count or 0)
        prev = int(h.prev_count or 0)
        
        # Calculate surge velocity
        # If no previous complaints, but recent ones exist, spike is defined as recent * 100%
        # If previous complaints exist, spike % is (recent / prev) factor
        if recent > 0:
            if prev == 0:
                surge_rate = 100.0 if total == recent else (recent * 50.0)
            else:
                surge_rate = (recent / (prev / 2.33)) * 100.0 # normalized weight
                
            # Cap surge rate to realistic numbers
            surge_rate = round(min(500.0, surge_rate), 1)
            
            # Categorize Risk
            if surge_rate >= 150.0 or (recent >= 3 and surge_rate >= 100.0):
                risk = "CRITICAL"
                forecast = "High probability of complete failure / backup within 24-48 hours. Dispatch recommended."
            elif surge_rate >= 70.0:
                risk = "WARNING"
                forecast = "Spike in activity detected. Infrastructure showing signs of stress. Monitor closely."
            else:
                risk = "STABLE"
                forecast = "Normal consistent reports. No sudden spikes detected."
                
            # Filter stability if it doesn't represent any real emergence of issue
            if risk in ["CRITICAL", "WARNING"] or total >= 2:
                emerging_hotspots.append({
                    "id": len(emerging_hotspots) + 1,
                    "department": dept,
                    "location": addr,
                    "total": total,
                    "recent": recent,
                    "surge_rate": surge_rate,
                    "risk": risk,
                    "forecast": forecast
                })
                
    # Sort hotspots by surge rate or severity descending
    emerging_hotspots.sort(key=lambda x: (x["risk"] == "CRITICAL", x["surge_rate"]), reverse=True)
    
    return {
        "trend": trend,
        "departments": departments,
        "priorities": priorities,
        "emerging_hotspots": emerging_hotspots[:8] # Send top 8
    }

