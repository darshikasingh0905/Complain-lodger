from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database.db import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    citizen_name = Column(String(100), nullable=True)
    citizen_phone = Column(String(20), nullable=True)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    
    # AI Extraction Fields (Auto-filled by LLM later)
    department = Column(String(50), nullable=True, default="Other")
    category = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=True, default="Medium")
    ai_summary = Column(Text, nullable=True)
    
    # Lifecycle Status: Submitted, Assigned, In Progress, Resolved
    status = Column(String(30), nullable=False, default="Submitted")
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "citizen_name": self.citizen_name,
            "citizen_phone": self.citizen_phone,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "image_url": self.image_url,
            "department": self.department,
            "category": self.category,
            "priority": self.priority,
            "ai_summary": self.ai_summary,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
