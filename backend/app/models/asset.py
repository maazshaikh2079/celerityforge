import datetime
import enum
from uuid import UUID, uuid4
from sqlalchemy import Uuid, String, Integer, Enum as SQLEnum, Numeric, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base_class import Base


class StockStatus(enum.Enum):
    LOW_STOCK = "Low Stock"
    IN_STOCK = "In Stock"
    OUT_OF_STOCK = "Out of Stock"


class Asset(Base):
    """
    SQLAlchemy model for the 'assets' table.
    Inherits from the central Base class in app.db.base_class.
    """

    __tablename__ = "assets"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)

    image_url: Mapped[str] = mapped_column(
        Text,
        default="https://i.ibb.co/tMtqLqWm/container.jpg"
    )

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    category: Mapped[str] = mapped_column(String(100), nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    stock: Mapped[int] = mapped_column(Integer, default=0)

    # Low Stock Threshold/Point
    min_stock: Mapped[int] = mapped_column(Integer, default=0)

    stock_status: Mapped[StockStatus] = mapped_column(
        SQLEnum(StockStatus, name="stock_status", create_type=False),
        nullable=False
    )

    # --- COLUMNS FOR TOP PRODUCTS WIDGET ---

    # Tracks the total number of units ever sold (e.g., 1,247)
    units_sold: Mapped[int] = mapped_column(Integer, default=0)

    # Tracks the total money this specific product has brought in
    total_revenue: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)

    # SQL Query for Top Products Widget:-
    # SELECT name, units_sold, total_revenue
    # FROM assets
    # ORDER BY total_revenue DESC
    # LIMIT 3;

    # The Business Logic Update (API Layer):-
    # When a technician clicks "Pay/Complete Order", API route logic should do three things:
    # 1. Mark Order in database as "Paid". (If order "canceled" then Asset.stock gets rollback to the earlier state(number))
    # 2. Add the item quantities to Asset.units_sold and add the price to Asset.total_revenue.

    # -------------------------------------

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
