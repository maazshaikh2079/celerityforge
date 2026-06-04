import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Uuid, BigInteger, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base_class import Base


class Technician(Base):
    """
    SQLAlchemy model for the 'technicians' table.
    Inherits from the central Base class in app.db.base_class
    """

    __tablename__ = "technicians"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)

    profile_image_url: Mapped[str] = mapped_column(Text, default="https://i.ibb.co/vxLH9d92/default-avatar-light.png")

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    phone: Mapped[int] = mapped_column(BigInteger, nullable=False)

    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # # Soft delete:
    # # is_deleted || is_fired
    # is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
