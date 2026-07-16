from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum, JSON, Boolean
from app.database.db import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    citizen_name = Column(String(100), nullable=True)
    citizen_phone = Column(String(20), nullable=True)
    title = Column(String(150), nullable=True)
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
    ai_confidence = Column(Float, nullable=True)
    ai_reason = Column(Text, nullable=True)
    ai_severity = Column(String(20), nullable=True)
    ai_keywords = Column(Text, nullable=True)
    
    # Priority Engine Scoring Fields
    priorityScore = Column(Integer, nullable=True, default=0)
    priorityLevel = Column(String(20), nullable=True, default="Medium")
    priorityBreakdown = Column(JSON, nullable=True)
    is_escalated = Column(Boolean, nullable=True, default=False)

    # Resolution Confirmation Rating/Feedback
    rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    assigned_officer = Column(String(100), nullable=True, default="Officer Sharma")

    # Evidence Audit Fields (filled by Vision LLM)
    evidence_verdict = Column(String(20), nullable=True)  # MATCH, MISMATCH, UNCERTAIN
    evidence_reason = Column(Text, nullable=True)
    evidence_confidence = Column(Float, nullable=True)

    # Fix Verification Fields (before/after Vision LLM audit at resolution time)
    fix_image_url = Column(String(255), nullable=True)
    fix_verdict = Column(String(20), nullable=True)  # FIXED, NOT_FIXED, UNCERTAIN
    fix_reason = Column(Text, nullable=True)
    fix_confidence = Column(Float, nullable=True)

    # Lifecycle Status: Submitted, Assigned, In Progress, Resolved
    status = Column(String(30), nullable=False, default="Submitted")
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "citizen_name": self.citizen_name,
            "citizen_phone": self.citizen_phone,
            "title": self.title,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "image_url": self.image_url,
            "department": self.department,
            "category": self.category,
            "priority": self.priority,
            "ai_summary": self.ai_summary,
            "ai_confidence": self.ai_confidence,
            "ai_reason": self.ai_reason,
            "ai_severity": self.ai_severity,
            "ai_keywords": self.ai_keywords,
            "priorityScore": self.priorityScore,
            "priorityLevel": self.priorityLevel,
            "priorityBreakdown": self.priorityBreakdown,
            "is_escalated": self.is_escalated,
            "rating": self.rating,
            "feedback": self.feedback,
            "assigned_officer": self.assigned_officer,
            "evidence_verdict": self.evidence_verdict,
            "evidence_reason": self.evidence_reason,
            "evidence_confidence": self.evidence_confidence,
            "fix_image_url": self.fix_image_url,
            "fix_verdict": self.fix_verdict,
            "fix_reason": self.fix_reason,
            "fix_confidence": self.fix_confidence,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
