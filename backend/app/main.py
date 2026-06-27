import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base_class import Base
from app.db.session import engine
from app.core.config import settings
from app.api.v1 import api_router

# Configure the global root logger first
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:\t  %(message)s"
)

# Create database tables at setup
Base.metadata.create_all(bind=engine)

# Initialize the FastAPI app with settings from core/config.py
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Top-level Health Check
@app.get("/", tags=["Health"])
def health_status():
    """Endpoint to verify the API in running correctly."""

    return {"status": "Healthy"}


# Include the bundled API router using the global prefix
app.include_router(api_router, prefix=settings.API_V1_STR)
