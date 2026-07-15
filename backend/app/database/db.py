import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import text

# Resolve full path to .env in backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "mysql+pymysql://root:2401115@localhost:3306/grievance_system"

def create_database_if_not_exists(url_str: str):
    """
    Connects to MySQL server at root/server level first to ensure 
    the targeted database schema exists.
    """
    try:
        from sqlalchemy.engine import make_url, URL
        url = make_url(url_str)
        dbname = url.database
        
        # Build server URI without the database name using SQLAlchemy URL object
        # (avoids manual string splicing which breaks on special chars like @)
        server_url = URL.create(
            drivername=url.drivername,
            username=url.username,
            password=url.password,
            host=url.host,
            port=url.port,
            database=None,
        )
        
        server_engine = create_engine(server_url)
        with server_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{dbname}`"))
            conn.execute(text(f"ALTER DATABASE `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
        server_engine.dispose()
        print(f"Database verification finished. Verified database '{dbname}' exists.")
    except Exception as e:
        print(f"Warning: Database auto-creation failed: {e}. Attempting connection anyway.")

# Try creating the database if it doesn't exist
create_database_if_not_exists(DATABASE_URL)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Pool session dependency generator."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
