import os
from fastapi import FastAPI, Depends
from app.services.security import require_auth
from app.routes.auth_routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.database.db import get_db, Base, engine
from app.routes.complaint_routes import router as complaint_router
from app.routes.assistant_routes import router as assistant_router
from app.models.notification import Notification

# Autogenerate database tables defined in sqlalchemy models mapping on boot
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized successfully.")
    
    # Run database seeder if complaints is empty
    from app.database.db import SessionLocal
    db_session = SessionLocal()
    try:
        from app.database.seeder import seed_database_if_empty
        seed_database_if_empty(db_session)
    finally:
        db_session.close()
    
    # Run database seeder if complaints is empty
    from app.database.db import SessionLocal
    db_session = SessionLocal()
    try:
        from app.database.seeder import seed_database_if_empty
        seed_database_if_empty(db_session)
    finally:
        db_session.close()
except Exception as err:
    print(f"Error running database synchronization or seeder: {err}")

# Check and add missing columns to complaints table (MySQL only — SQLite
# databases are created fresh by create_all with the full current schema)
try:
    if engine.dialect.name != "mysql":
        raise RuntimeError("skip: non-MySQL dialect")
    with engine.connect() as conn:
        result = conn.execute(text("SHOW COLUMNS FROM complaints"))
        columns = [row[0] for row in result.fetchall()]
        
        # Alter table to add missing fields if they don't exist
        if "is_escalated" not in columns:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN is_escalated TINYINT(1) DEFAULT 0"))
            print("Database migration: Added is_escalated column to complaints table.")
        if "rating" not in columns:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN rating INT DEFAULT NULL"))
            print("Database migration: Added rating column to complaints table.")
        if "feedback" not in columns:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN feedback TEXT DEFAULT NULL"))
            print("Database migration: Added feedback column to complaints table.")
        if "assigned_officer" not in columns:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN assigned_officer VARCHAR(100) DEFAULT 'Officer Sharma'"))
            print("Database migration: Added assigned_officer column to complaints table.")
        conn.commit()
except RuntimeError:
    pass  # non-MySQL dialect — nothing to migrate
except Exception as e:
    print(f"Error checking/adding missing columns: {e}")

# Dialect-agnostic migration for newer columns (works on MySQL AND the SQLite
# fallback, whose existing db files are not updated by create_all)
try:
    from sqlalchemy import inspect as sa_inspect
    inspector = sa_inspect(engine)
    existing_cols = {col["name"] for col in inspector.get_columns("complaints")}
    NEW_COLUMNS = {
        "fix_image_url": "VARCHAR(255)",
        "fix_verdict": "VARCHAR(20)",
        "fix_reason": "TEXT",
        "fix_confidence": "FLOAT",
    }
    with engine.connect() as conn:
        for col, ddl in NEW_COLUMNS.items():
            if col not in existing_cols:
                conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col} {ddl}"))
                print(f"Database migration: Added {col} column to complaints table.")
        conn.commit()
except Exception as e:
    print(f"Error running fix-verification column migration: {e}")

app = FastAPI(
    title="AI-Powered Grievance Lodging & Tracking System API",
    description="Backend API for lodging grievances, classifications, visual evidence checks, and visual hotspots analytics.",
    version="1.0.0"
)

# CORS Setup: Allow local frontend and test domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/development environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Guarantee the local uploads structure exists and mount static routes
UPLOAD_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_PATH), name="uploads")

# Register routes group.
# JWT protection: complaint + assistant routers require a Bearer token issued
# by /api/auth/*. Public surface: /api/auth, /api/health, /api/scoreboard,
# /uploads (image display), /api/heatmap and /api/classify (demo utilities).
app.include_router(auth_router, prefix="/api")
app.include_router(complaint_router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(assistant_router, prefix="/api", dependencies=[Depends(require_auth)])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to AI-Powered Grievance Lodging & Tracking System API",
        "doc_url": "/docs",
        "status": "online"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check route querying MySQL to verify active connectivity
    and confirming the microservices are online.
    """
    db_ok = False
    error_msg = None
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        error_msg = str(e)
    
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
        "database_error": error_msg,
        "environment": {
            "ollama_api_url": os.getenv("OLLAMA_API_URL", "http://localhost:11434"),
            "ollama_model": os.getenv("OLLAMA_MODEL", "llama3.2")
        }
    }

from app.schemas.complaint import ClassifyRequest, ClassifyResponse
from app.services import ai_classifier

@app.post("/api/classify", response_model=ClassifyResponse)
def classify_complaint_endpoint(payload: ClassifyRequest):
    """
    Direct endpoint for AI complaint classification using Ollama or rule-based fallback.
    """
    result = ai_classifier.classify_complaint(
        title=payload.title,
        description=payload.description,
        location=payload.location
    )
    return result

@app.get("/api/scoreboard")
def get_public_scoreboard(db: Session = Depends(get_db)):
    """
    PUBLIC accountability scoreboard (no login required): ranks every
    department by resolution rate, speed, SLA compliance and citizen ratings.
    """
    from app.services import scoreboard_service
    return scoreboard_service.build_scoreboard(db)


@app.get("/api/heatmap")
def get_heatmap_api(db: Session = Depends(get_db)):
    """
    Returns only complaints that contain valid coordinates.
    """
    from app.models.complaint import Complaint
    from datetime import datetime
    complaints = (
        db.query(Complaint)
        .filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))
        .all()
    )
    return [
        {
            "_id": str(c.id),
            "id": c.id,
            "category": c.category or "Other",
            "department": c.department or "Other",
            "priority": c.priority or "Medium",
            "status": c.status or "Submitted",
            "latitude": c.latitude,
            "longitude": c.longitude,
            "description": c.description or "",
            "address": c.address or "",
            "createdAt": c.created_at.isoformat() if isinstance(c.created_at, datetime) else str(c.created_at)
        }
        for c in complaints
    ]
