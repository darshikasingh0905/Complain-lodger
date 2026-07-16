from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.complaint import Complaint

def seed_database_if_empty(db: Session):
    count = db.query(Complaint).count()
    if count > 0:
        return
        
    print("[Database Seeder] Seeding database with initial complaints...")
    
    now = datetime.now()
    
    seeds = [
        Complaint(
            citizen_name="Demo Citizen",
            citizen_phone="9876543210",
            title="Water pipeline leakage",
            description="There is a massive water pipeline leakage near Shivaji Nagar bus stand. Millions of liters of clean water are being wasted. Please address this urgently.",
            latitude=18.5312,
            longitude=73.8445,
            address="Shivaji Nagar Bus Stand, Pune",
            department="Water Supply Department",
            category="Water Leakage / Deficit",
            priority="Critical",
            ai_severity="Critical",
            ai_confidence=0.95,
            ai_reason="Complaint mentions massive pipeline leakage wasting millions of liters.",
            ai_keywords="water, pipeline, leakage",
            ai_summary="Complaint mentions massive pipeline leakage wasting millions of liters.",
            priorityScore=82,
            priorityLevel="Critical",
            priorityBreakdown={
                "safetyRisk": 30,
                "publicImpact": 20,
                "essentialService": 20,
                "urgency": 10,
                "duplicates": 0,
                "location": 5,
                "timePending": 2,
                "escalationBoost": 0
            },
            status="In Progress",
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=3)
        ),
        Complaint(
            citizen_name="Demo Citizen",
            citizen_phone="9876543210",
            title="Street light not functioning",
            description="Three street lights are completely dark on the lane opposite to D-Mart. It is unsafe for women and children to walk at night.",
            latitude=18.5074,
            longitude=73.8077,
            address="Kothrud, Pune",
            department="Electricity Department",
            category="Power Issue",
            priority="High",
            ai_severity="Moderate",
            ai_confidence=0.88,
            ai_reason="Dark road reported causing unsafe walking conditions.",
            ai_keywords="street light, dark road",
            ai_summary="Dark road reported causing unsafe walking conditions.",
            priorityScore=55,
            priorityLevel="Medium",
            priorityBreakdown={
                "safetyRisk": 15,
                "publicImpact": 10,
                "essentialService": 20,
                "urgency": 5,
                "duplicates": 0,
                "location": 0,
                "timePending": 2,
                "escalationBoost": 0
            },
            status="Submitted",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2)
        ),
        Complaint(
            citizen_name="Aarav Sharma",
            citizen_phone="9876500000",
            title="Potholes on main road",
            description="Severe potholes on the main road causing vehicular damage and potential accidents. They have become very deep after the rain.",
            latitude=18.5679,
            longitude=73.9143,
            address="Viman Nagar, Pune",
            department="Roads and Drainage",
            category="Water Logging and Road Damage",
            priority="High",
            ai_severity="Critical",
            ai_confidence=0.92,
            ai_reason="Deep potholes causing immediate road danger and vehicle damage.",
            ai_keywords="potholes, road, vehicular damage",
            ai_summary="Deep potholes causing immediate road danger and vehicle damage.",
            priorityScore=73,
            priorityLevel="High",
            priorityBreakdown={
                "safetyRisk": 30,
                "publicImpact": 20,
                "essentialService": 0,
                "urgency": 10,
                "duplicates": 5,
                "location": 5,
                "timePending": 3,
                "escalationBoost": 0
            },
            status="Assigned",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(hours=10)
        ),
        Complaint(
            citizen_name="Priya Patel",
            citizen_phone="9876511111",
            title="Garbage dumping on roadside",
            description="Large garbage dump has accumulated on the roadside. It emits foul smell and attracts stray dogs/insects.",
            latitude=18.5089,
            longitude=73.9258,
            address="Hadapsar, Pune",
            department="Solid Waste Management",
            category="Garbage Accumulation",
            priority="Low",
            ai_severity="Minor",
            ai_confidence=0.90,
            ai_reason="Roadside garbage accumulation attracting stray animals.",
            ai_keywords="garbage, dump, roadside",
            ai_summary="Roadside garbage accumulation attracting stray animals.",
            priorityScore=22,
            priorityLevel="Low",
            priorityBreakdown={
                "safetyRisk": 5,
                "publicImpact": 5,
                "essentialService": 0,
                "urgency": 2,
                "duplicates": 5,
                "location": 5,
                "timePending": 0,
                "escalationBoost": 0
            },
            status="Resolved",
            created_at=now - timedelta(days=6),
            updated_at=now - timedelta(days=4)
        )
    ]
    
    db.add_all(seeds)
    db.commit()
    print("[Database Seeder] Seeding finished successfully.")
