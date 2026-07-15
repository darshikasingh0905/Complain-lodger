import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.database.db import get_db, Base, engine
from app.routes.complaint_routes import router as complaint_router

# Autogenerate database tables defined in sqlalchemy models mapping on boot
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized successfully.")
except Exception as err:
    print(f"Error running database synchronization: {err}")

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

# Register routes group
app.include_router(complaint_router, prefix="/api")

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
