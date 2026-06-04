import datetime
import enum
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID
from decimal import Decimal
from typing import Literal

from app.models.order import OrderStatus
    # PENDING = "Pending"
    # PAID = "Paid"
    # CANCELLED = "Cancelled"

class OrderAssigneeRole(enum.Enum):
    ADMIN = "Admin"
    TECHNICIAN = "Technician"


# schema for `assignee` JSONB
class OrderAssigneeSnapshot(BaseModel):
    id: UUID
    profile_image_url: str = "https://i.ibb.co/vxLH9d92/default-avatar-light.png"
    name: str
    email: EmailStr
    phone: int
    role: OrderAssigneeRole


# schema for `customer` JSONB
class OrderCustomerSnapshot(BaseModel):
    name: str
    email: EmailStr
    phone: int
    shipping_address: str


# schema for `item` JSONB
class OrderItemSnapshot(BaseModel):
    id: UUID
    image_url: str = "https://i.ibb.co/tMtqLqWm/container.jpg"
    name: str
    description: str
    category: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal


# base logic
class OrderBase(BaseModel):
    assignee: OrderAssigneeSnapshot
    customer: OrderCustomerSnapshot
    items: list[OrderItemSnapshot]
    notes: str = ""
    total_amount: Decimal


# schema for create a new order
class OrderCreate(OrderBase):
    status: Literal[OrderStatus.PENDING] = OrderStatus.PENDING


class OrderOut(OrderBase):
    id: UUID

    status: OrderStatus

    created_at: datetime.datetime
    updated_at: datetime.datetime


    model_config = ConfigDict()


class OrderUpdate(OrderBase):
    # assignee: OrderAssigneeSnapshot | None = None
    customer: OrderCustomerSnapshot | None = None
    items: list[OrderItemSnapshot] | None = None
    notes: str | None = None
    total_amount: Decimal | None = None


class OrderMetadataUpdate(BaseModel):
    customer: OrderCustomerSnapshot | None = None
    notes: str | None = None


class OrderCancel(BaseModel):
    status: Literal[OrderStatus.CANCELLED] = OrderStatus.CANCELLED


class OrderMarkAsPaid(BaseModel):
    status: Literal[OrderStatus.PAID] = OrderStatus.PAID


# class OrderMakePayment(BaseModel):
#     status: Literal[OrderStatus.PAID] = OrderStatus.PAID


# --- Summary ---

# The nested model for OrderStatsSummary fields
class OrderStatDetail(BaseModel):
    count: int = 0
    total_value: float = 0.0

class OrderStatsSummary(BaseModel):
    total_orders: OrderStatDetail
    pending_orders: OrderStatDetail
    paid_orders: OrderStatDetail
    cancelled_orders: OrderStatDetail


# --- dasboard ---
class MonthlyRevenueOut(BaseModel):
    month: str
    revenue: float

    model_config = ConfigDict(from_attributes=True)


# --- razorpay payment -----
class RazorpayVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
