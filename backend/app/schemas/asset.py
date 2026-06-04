import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from decimal import Decimal

from app.models.asset import StockStatus
    # LOW_STOCK = "Low Stock"
    # IN_STOCK = "In Stock"

# base logic
class AssetBase(BaseModel):
    image_url: str = "https://i.ibb.co/tMtqLqWm/container.jpg"
    name: str
    description: str
    category: str
    unit_price: Decimal
    stock: int
    min_stock: int


# schema for creating / adding a new asset
class AssetCreate(AssetBase):
    pass


# schema for returning data
class AssetOut(AssetBase):
    id: UUID

    stock_status: StockStatus

    units_sold: int
    total_revenue: Decimal

    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# schema for updating an asset (Everything optional to allow partial updates)
class AssetUpdate(AssetBase):
    image_url: str | None = None
    name: str | None = None
    description: str | None = None
    category: str | None = None
    unit_price: Decimal | None = None
    stock: int | None = None
    min_stock: int | None = None


# class AssetDelete


# --- Summary ---
# The nested model for stock breakdown
class StockDistribution(BaseModel):
    in_stock: int
    low_stock: int
    out_of_stock: int

class AssetSummary(BaseModel):
    total_assets: int
    total_valuation: float
    stock_distribution: StockDistribution

# --- dasboard ---
class AssetTopProductOut(BaseModel):
    id: UUID
    name: str
    units_sold: int
    total_revenue: float

    model_config = ConfigDict(from_attributes=True)


class CategorySalesOut(BaseModel):
    category: str
    revenue: float
    percentage: float

    model_config = ConfigDict(from_attributes=True)
