from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, ComplaintAIUpdate
from app.services import ai_service

def create_complaint(db: Session, schema: ComplaintCreate) -> Complaint:
    """
    Inserts a new grievance record, then immediately runs AI classification
    to populate department, category, priority, and ai_summary.
    """
    db_obj = Complaint(
        citizen_name=schema.citizen_name,
        citizen_phone=schema.citizen_phone,
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
        ai_result = ai_service.classify_complaint(schema.description)
        db_obj.department = ai_result["department"]
        db_obj.category   = ai_result["category"]
        db_obj.priority   = ai_result["priority"]
        db_obj.ai_summary = ai_result["ai_summary"]
        source = ai_result.get("source", "unknown")
        print(f"[AI] Complaint #{db_obj.id} classified via '{source}': "
              f"{db_obj.department} / {db_obj.priority}")
        db.commit()
        db.refresh(db_obj)
    except Exception as e:
        print(f"[AI] Classification failed for complaint #{db_obj.id}: {e}")

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
