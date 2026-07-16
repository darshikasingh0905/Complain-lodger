from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database.db import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, nullable=False)
    citizen_phone = Column(String(20), nullable=True)
    message = Column(String(255), nullable=False)
    type = Column(String(30), nullable=False, default="status_change")  # status_change, escalation, feedback
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "citizen_phone": self.citizen_phone,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
