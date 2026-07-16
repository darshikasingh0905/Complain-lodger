from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(db: Session, complaint_id: int, citizen_phone: str, message: str, type: str = "status_change") -> Notification:
    """
    Creates an in-app notification in MySQL database
    and dispatches simulated SMS and Email alerts to stdout logs.
    """
    db_notif = Notification(
        complaint_id=complaint_id,
        citizen_phone=citizen_phone,
        message=message,
        type=type,
        is_read=False
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)

    # Simulate SMS and Email notifications (terminal printouts)
    print(f"\n=================== [SIMULATED SMS & EMAIL GATEWAY] ===================")
    print(f"[*] Alert triggered for Complaint ID: {complaint_id}")
    print(f"[SMS SIMULATOR] Recipient: +91 {citizen_phone or 'N/A'}")
    print(f"[SMS SIMULATOR] Text: \"{message}\"")
    print(f"[EMAIL SIMULATOR] Recipient: citizen_{citizen_phone or 'anonymous'}@gmail.com")
    print(f"[EMAIL SIMULATOR] Subject: Grievance Update Notification - Ticket #{complaint_id}")
    print(f"[EMAIL SIMULATOR] Body: \"{message}\"")
    print(f"========================================================================\n")

    return db_notif
