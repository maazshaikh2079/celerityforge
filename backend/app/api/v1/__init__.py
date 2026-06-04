from fastapi import APIRouter

from app.api.v1.endpoints import admin
from app.api.v1.endpoints import assets
from app.api.v1.endpoints import orders
from app.api.v1.endpoints import technicians

# Create the v1 router
api_router = APIRouter()

# Include inidividual endpoint routes
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(technicians.router, prefix="/technicians", tags=["Technicians"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
