import datetime
import enum
from uuid import UUID, uuid4
from uuid6 import uuid7
from sqlalchemy import Text, Numeric, Date, Enum as SQLEnum, Uuid, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db.base_class import Base


class OrderStatus(enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    CANCELLED = "Cancelled"


class Order(Base):
    """
    SQLAlchemy model for the "orders" table.
    Inherits from the cerntral Base class in app.db.base_class
    """

    __tablename__ = "orders"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)

    # assignee_id: Mapped[UUID | None] = mapped_column(Uuid, nullable=True)
    assignee: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {id, profile_image_url, name, email, phone, role}

    customer: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {name, email, phone, shipping_address}

    items: Mapped[list] = mapped_column(JSONB, nullable=False)  # [{id, image_url, name, description, category, unit_price, quantity, total_price}, {...}, ...]

    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, name="order_status", create_type=False),
        nullable=False
    )

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Generalized Inverted Index (GIN)
    # 1. Provide a name for the index (standard convention: ix_tablename_columnname_type)
    # 2. Provide the column name as a string: "assignee"
    # 3. Specify the index type: postgresql_using="gin"
    __table_args__ = (
        Index("ix_orders_assignee_gin", "assignee", postgresql_using="gin"),
    )
    # Explanation: https://docs.google.com/document/d/1HSFjQpj22uqxSNlsdpFOIR8FFTWhlSux16S0PHFVQZY/edit?usp=sharing

    # # if we have customer table then to get a specific customer's orders:-
    # __table_args__ = (
    #     Index("ix_orders_customer_gin", "customer", postgresql_using="gin"),
    # )
    # # Explanation: https://docs.google.com/document/d/19ILOj2WXtUkTpT8GD1XAWFZ-b2CiadEJ7vTh9cSpa5E/edit?usp=sharing
