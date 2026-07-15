from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ComplaintBase(BaseModel):
    citizen_name: Optional[str] = Field(None, max_length=100)
    citizen_phone: Optional[str] = Field(None, max_length=20)
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

class ComplaintResponse(ComplaintBase):
    id: int
    department: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    ai_summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
