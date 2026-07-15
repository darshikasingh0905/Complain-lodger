from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, ComplaintAIUpdate
from app.services import ai_service, ai_classifier

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
        
        print(f"[AI Classifier] Complaint #{db_obj.id} classified: "
              f"{db_obj.department} / {db_obj.priority} / Confidence: {db_obj.ai_confidence}")
        db.commit()
        db.refresh(db_obj)
    except Exception as e:
        print(f"[AI Classifier] Classification failed for complaint #{db_obj.id}: {e}")

    return db_obj

def get_complaints(db: Session, department: Optional[str] = None, status: Optional[str] = None) -> List[Complaint]:
    """Retrieves list of all complaints with filters on department or status."""
    query = db.query(Complaint)
    if department:
        query = query.filter(Complaint.department == department)
    if status:
        query = query.filter(Complaint.status == status)
    return query.order_by(Complaint.created_at.desc()).all()

def get_complaint_by_id(db: Session, complaint_id: int) -> Optional[Complaint]:
    """Queries database for grievance by integer ID."""
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()

def track_complaints(db: Session, search_query: str) -> List[Complaint]:
    """
    Search for grievances matching either:
    1. Integer ID matching search_query
    2. Phone number matching search_query
    """
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
    db_obj = get_complaint_by_id(db, complaint_id)
    if not db_obj:
        return None
    db_obj.status = status
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_complaint_ai(db: Session, complaint_id: int, ai_data: ComplaintAIUpdate) -> Optional[Complaint]:
    """Updates classification outputs extracted by Ollama model."""
    db_obj = get_complaint_by_id(db, complaint_id)
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
    return db_obj

def update_evidence_audit(
    db: Session,
    complaint_id: int,
    verdict: str,
    reason: str,
    confidence: float
) -> Optional[Complaint]:
    """Saves vision AI evidence audit results to the complaint record."""
    db_obj = get_complaint_by_id(db, complaint_id)
    if not db_obj:
        return None
    db_obj.evidence_verdict = verdict
    db_obj.evidence_reason = reason
    db_obj.evidence_confidence = confidence
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_analytics_data(db: Session):
    """
    Computes chronological trends, department counts, priority ratios,
    and emerging high-risk hotspot surges by comparing complaint velocities.
    """
    from sqlalchemy import func, and_
    from datetime import datetime, timedelta
    
    # 1. Chronological Trend (last 14 days)
    today = datetime.now().date()
    start_date = today - timedelta(days=13)
    
    # Query daily counts
    daily_results = (
        db.query(func.date(Complaint.created_at).label("day"), func.count(Complaint.id).label("count"))
        .filter(Complaint.created_at >= datetime.combine(start_date, datetime.min.time()))
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
    dept_results = (
        db.query(Complaint.department, func.count(Complaint.id).label("count"))
        .group_by(Complaint.department)
        .all()
    )
    departments = [
        {"name": str(r.department or "Other"), "Grievances": int(r.count)}
        for r in dept_results
    ]
    
    # 3. Priority levels
    priority_results = (
        db.query(Complaint.priority, func.count(Complaint.id).label("count"))
        .group_by(Complaint.priority)
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
    hotspots_data = (
        db.query(
            Complaint.department,
            Complaint.address,
            func.count(Complaint.id).label("total_count"),
            func.sum(func.if_(Complaint.created_at >= three_days_ago, 1, 0)).label("recent_count"),
            func.sum(func.if_(and_(Complaint.created_at >= ten_days_ago, Complaint.created_at < three_days_ago), 1, 0)).label("prev_count")
        )
        .group_by(Complaint.department, Complaint.address)
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

