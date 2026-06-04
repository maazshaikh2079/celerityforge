import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Uuid, BigInteger, Text, DateTime, Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base_class import Base

class Admin(Base):
    """
    SQLAlchemy model for the 'admins' table.
    Inherits from the central Base class in app.db.base_class
    Desinged as a Singleton table (strictly one row).
    """

    __tablename__ = "admin"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)

    profile_image_url: Mapped[str] = mapped_column(Text, default="https://i.ibb.co/vxLH9d92/default-avatar-light.png")

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    phone: Mapped[int] = mapped_column(BigInteger, nullable=False)

    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    singleton_lock: Mapped[bool] = mapped_column(Boolean, default=True, unique=True, nullable=False)
    # Database-level constraint enforcing the singleton lock
    __table_args__ = (
        CheckConstraint("singleton_lock = true", name="admin_singleton_check"),
    )
    # Explanation: https://docs.google.com/document/d/1tAE33JBNx7NBLFI0YBy4vlWm3rZ5n56l4PuExBScDUA/edit?usp=sharing
