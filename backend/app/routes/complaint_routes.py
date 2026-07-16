import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintStatusUpdate, ComplaintAIUpdate, EvidenceAuditResult, ConfirmResolutionRequest
import app.services.complaint_service as service
from app.services import ai_service

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)

# Resolve path to backend/app/uploads/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/map-data")
def get_map_data(
    role: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns a lean payload of all complaints that have GPS coordinates,
    used by the frontend Leaflet heatmap to render pins and density layers.
    Only returns fields required for map rendering — no large text bodies.
    """
    from app.models.complaint import Complaint
    from sqlalchemy import or_
    
    query = db.query(
        Complaint.id,
        Complaint.latitude,
        Complaint.longitude,
        Complaint.department,
        Complaint.priority,
        Complaint.status,
        Complaint.description,
        Complaint.address,
        Complaint.category,
    ).filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))
    
    if role == "department_admin" and department:
        name = department.lower().strip()
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
            dept_filters.append(Complaint.department.ilike(f"%{department}%"))
        query = query.filter(or_(*dept_filters))
        
    complaints = query.all()
    return [
        {
            "id": c.id,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "department": c.department,
            "priority": c.priority,
            "status": c.status,
            "description": c.description,
            "address": c.address,
            "category": c.category,
        }
        for c in complaints
    ]


@router.post("/submit", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint_form(
    citizen_name: Optional[str] = Form(None),
    citizen_phone: Optional[str] = Form(None),
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Submits a new grievance with an optional image evidence file attachment via multipart form.
    """
    image_url = None
    if image and image.filename:
        # Guarantee local uploads path exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Save file with unique ID to prevent name overlaps
        file_ext = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            # relative path for representation
            image_url = f"uploads/{unique_filename}"
            print(f"File saved successfully to {file_path}")
        except Exception as e:
            print(f"File copy error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save evidence image: {str(e)}"
            )

    try:
        # Construct Create Pydantic payload
        schema = ComplaintCreate(
            citizen_name=citizen_name,
            citizen_phone=citizen_phone,
            description=description,
            latitude=latitude,
            longitude=longitude,
            address=address,
            image_url=image_url
        )
        return service.create_complaint(db, schema)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to submit complaint: {str(e)}"
        )

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_new_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Submits a new grievance record. (Used for JSON direct calls)
    """
    try:
        return service.create_complaint(db, complaint)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to submit complaint: {str(e)}"
        )

@router.get("/", response_model=List[ComplaintResponse])
def read_all_complaints(
    role: Optional[str] = None,
    department: Optional[str] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    List all filed grievances. Supports optional parameters 'role', 'department' or 'status'.
    """
    if role == "department_admin" and department:
        return service.get_complaints_by_admin_dept(db, admin_department=department, status=status)
    return service.get_complaints(db, department=department, status=status)

@router.get("/track/{query}", response_model=List[ComplaintResponse])
def track_citizen_complaints(query: str, db: Session = Depends(get_db)):
    """
    Search and track grievances by matching ID query OR owner phone number.
    """
    complaints = service.track_complaints(db, query)
    if not complaints:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No complaints found matching reference query '{query}'"
        )
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def read_complaint_detail(complaint_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full details of a specific grievances report by ID.
    """
    complaint = service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} does not exist"
        )
    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_id: int, 
    status_payload: ComplaintStatusUpdate, 
    db: Session = Depends(get_db)
):
    """
    Updates progress state for a specific complaint report.
    Valid states: Submitted, Assigned, In Progress, Resolved.
    """
    valid_statuses = ["Submitted", "Assigned", "In Progress", "Resolved"]
    if status_payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status state. Must be one of: {', '.join(valid_statuses)}"
        )
        
    updated = service.update_complaint_status(db, complaint_id, status_payload.status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} does not exist"
        )
    return updated

@router.post("/{complaint_id}/classify", response_model=ComplaintResponse)
def reclassify_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    (Re)runs AI classification on an existing complaint.
    Uses Ollama if available, otherwise the keyword fallback.
    """
    complaint = service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} does not exist"
        )
    try:
        ai_result = ai_service.classify_complaint(complaint.description)
        ai_update = service.update_complaint_ai(
            db,
            complaint_id,
            ai_data=ComplaintAIUpdate(
                department=ai_result["department"],
                category=ai_result["category"],
                priority=ai_result["priority"],
                ai_summary=ai_result["ai_summary"],
            ),
        )
        return ai_update
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI classification failed: {str(e)}"
        )

@router.post("/{complaint_id}/analyze-evidence", response_model=ComplaintResponse)
def analyze_evidence(complaint_id: int, db: Session = Depends(get_db)):
    """
    Runs vision AI analysis on a complaint's attached evidence image to verify
    if it matches the complaint description. Stores verdict (MATCH/MISMATCH/UNCERTAIN),
    reason, and confidence score on the complaint record.
    """
    complaint = service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} does not exist"
        )
    if not complaint.image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This complaint has no attached evidence image to analyze."
        )

    # Resolve the absolute path of the locally saved image
    image_path = os.path.join(BASE_DIR, complaint.image_url.replace("/", os.sep))
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence image file not found on server: {complaint.image_url}"
        )

    try:
        audit = ai_service.analyze_evidence(image_path, complaint.description)
        updated = service.update_evidence_audit(
            db,
            complaint_id,
            verdict=audit["verdict"],
            reason=audit["reason"],
            confidence=audit["confidence"],
        )
        print(f"[Vision] Complaint #{complaint_id} audit: {audit['verdict']} "
              f"({audit['confidence']:.0%} confidence) via '{audit.get('source', 'unknown')}'")
        return updated
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evidence analysis failed: {str(e)}"
        )

@router.get("/trends")
def get_complaint_trends(
    role: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological trending data, department frequencies, priority metrics,
    and emerging high-risk hotspot warning zones.
    """
    try:
        if role == "department_admin" and department:
            return service.get_analytics_data(db, admin_department=department)
        return service.get_analytics_data(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chronological analytics data: {str(e)}"
        )

@router.get("/notifications/{phone}", response_model=List[dict])
def get_citizen_notifications(phone: str, db: Session = Depends(get_db)):
    """
    Retrieves all notifications for a specific citizen by registered phone number.
    """
    from app.models.notification import Notification
    notifications = (
        db.query(Notification)
        .filter(Notification.citizen_phone == phone)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [n.to_dict() for n in notifications]

@router.get("/admin-notifications", response_model=List[dict])
def get_admin_notifications(
    role: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves notifications filtered by department for admin roles.
    If role == super_admin, returns all notifications.
    If role == department_admin, returns only notifications for complaints in the admin's department.
    """
    from app.models.notification import Notification
    from app.models.complaint import Complaint
    from sqlalchemy import or_
    
    query = db.query(Notification)
    if role == "department_admin" and department:
        name = department.lower().strip()
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
            dept_filters.append(Complaint.department.ilike(f"%{department}%"))
            
        complaint_ids = db.query(Complaint.id).filter(or_(*dept_filters)).subquery()
        query = query.filter(Notification.complaint_id.in_(complaint_ids))
        
    notifications = query.order_by(Notification.created_at.desc()).all()
    return [n.to_dict() for n in notifications]

@router.patch("/notifications/{notification_id}/read", response_model=dict)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    """
    Marks a notification as read.
    """
    from app.models.notification import Notification
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )
    n.is_read = True
    db.commit()
    return {"status": "success", "id": notification_id}

@router.post("/{complaint_id}/confirm-resolution", response_model=ComplaintResponse)
def confirm_resolution(
    complaint_id: int,
    payload: ConfirmResolutionRequest,
    db: Session = Depends(get_db)
):
    """
    Confirms a resolved complaint, logs the citizen's rating & feedback, and shifts the status to Closed.
    """
    updated = service.confirm_complaint_resolution(
        db,
        complaint_id,
        rating=payload.rating,
        feedback=payload.feedback
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} does not exist"
        )
    return updated


