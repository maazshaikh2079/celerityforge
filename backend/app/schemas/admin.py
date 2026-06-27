import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID


# Base logic
class AdminBase(BaseModel):
    profile_image_url: str = "https://i.ibb.co/vxLH9d92/default-avatar-light.png"
    name: str
    email: EmailStr
    phone: int


# Schema for SigningUp / creating an admin: Inherits safe fields, ADDs the password
class AdminSignup(AdminBase):
    password: str


# Schema for Login an admin
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for returning admin data: Inherits safe fields, ADDS the ID
class AdminOut(AdminBase):
    id: UUID

    created_at: datetime.datetime
    updated_at: datetime.datetime

    role: Literal["Admin"] = "Admin"

    model_config = ConfigDict(from_attributes=True)


# class AdminUpdateProfile(BaseModel):
#     name: str
#     phone: int
#     is_password_changed: bool = False
#     current_password: str | None = None
#     new_password: str | None = None
#     confirm_new_password: str | None = None


# Schema for updating basic profile info
class AdminUpdateProfile(BaseModel):
    profile_image_url: str | None = None
    name: str | None = None
    phone: int | None = None


# Schema for password changes
class AdminUpdatePassword(BaseModel):
    current_password: str
    new_password: str
