import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintStatusUpdate
import app.services.complaint_service as service

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)

# Resolve path to backend/app/uploads/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

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
    department: Optional[str] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    List all filed grievances. Supports optional parameters 'department' or 'status'.
    """
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
