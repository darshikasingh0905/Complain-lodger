from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class ComplaintBase(BaseModel):
    citizen_name: Optional[str] = Field(None, max_length=100)
    citizen_phone: Optional[str] = Field(None, max_length=20)
    title: Optional[str] = Field(None, max_length=150, description="Title of the grievance")
    description: str = Field(..., description="Details regarding the grievance")
    latitude: Optional[float] = Field(None, description="GPS Latitude coordinate")
    longitude: Optional[float] = Field(None, description="GPS Longitude coordinate")
    address: Optional[str] = Field(None, max_length=255, description="Physical location address")
    image_url: Optional[str] = Field(None, max_length=255, description="File location for uploaded evidence")

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., description="New progress state: Submitted, Assigned, In Progress, Resolved")

class ComplaintAIUpdate(BaseModel):
    department: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_summary: Optional[str] = None

class EvidenceAuditResult(BaseModel):
    verdict: str  # MATCH, MISMATCH, UNCERTAIN
    reason: str
    confidence: float
    source: str  # 'ollama_vision' or 'fallback'

class ConfirmResolutionRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: int
    department: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    ai_severity: Optional[str] = None
    ai_keywords: Optional[str] = None
    priorityScore: Optional[int] = None
    priorityLevel: Optional[str] = None
    priorityBreakdown: Optional[dict] = None
    is_escalated: Optional[bool] = False
    rating: Optional[int] = None
    feedback: Optional[str] = None
    assigned_officer: Optional[str] = None
    evidence_verdict: Optional[str] = None
    evidence_reason: Optional[str] = None
    evidence_confidence: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ClassifyRequest(BaseModel):
    title: str = Field(..., description="Complaint Title")
    description: str = Field(..., description="Complaint Description")
    location: Optional[str] = Field(None, description="Optional physical location")

class ClassifyResponse(BaseModel):
    department: str
    category: str
    priority: str
    severity: str
    confidence: float
    reason: str
    keywords: List[str] = Field(default_factory=list)
