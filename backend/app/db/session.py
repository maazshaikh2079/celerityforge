from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings


# Create engine using DATABASE_URL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True # vital for production to handle dropped connections
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database Dependency
def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a database session for a request.
    Ensures the session is closed after the request is finished.
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
