from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintStatusUpdate
import app.services.complaint_service as service

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_new_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Submits a new grievance record. 
    Category/department routing will be assigned to 'Other' initially.
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
    Retrieves full details of a specific grievance report by ID.
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
