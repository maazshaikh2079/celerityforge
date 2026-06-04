import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID


# Base logic
class TechnicianBase(BaseModel):
    profile_image_url: str = "https://i.ibb.co/vxLH9d92/default-avatar-light.png"
    name: str
    email: EmailStr
    phone: int


# Schema for SigningUp / creating a technician: Inherits safe fields, ADDs the password
class TechnicianSignup(TechnicianBase):
    password: str


# Schema for Login an admin
class TechnicianLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for returning admin data: Inherits safe fields, ADDs the ID
class TechnicianOut(TechnicianBase):
    id: UUID

    is_available: bool

    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Schema for changing availability
class TechnicianUpdateAvailability(BaseModel):
    is_available: bool


# Schema for updating basic profile
class TechnicianUpdateProfile(BaseModel):
    profile_image_url: str | None = None
    name: str | None = None
    phone: int | None = None


# Schema for password changes
class TechnicianUpdatePassword(BaseModel):
    new_password: str
    current_password: str | None = None

    model_config = ConfigDict(from_attributes=True)
