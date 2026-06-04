import uuid
import logging
from pydantic import EmailStr

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.db.session import get_db
from app.models.technician import Technician as DBTechnician
from app.models.admin import Admin as DBAdmin
from app.schemas.technician import  TechnicianOut, TechnicianUpdateAvailability, TechnicianUpdatePassword
from app.core.security import pwd_context, create_access_token
from app.api.deps import get_current_admin, get_current_user
from app.services.cloudinary import upload_on_cloudinary, delete_from_cloudinary

logger = logging.getLogger(__name__)
logging.getLogger("passlib").setLevel(logging.ERROR)


router = APIRouter()

# --- Routes ----

@router.get("/list", response_model=list[TechnicianOut])
def list_technicians(
    db: Session = Depends(get_db)
):
    """Fecth all registered technicians."""

    logger.info("GET req in `/technicians/list`")

    return db.query(DBTechnician).all()


@router.get("/{techinician_id}", response_model=TechnicianOut)
def get_technician_by_id(
    technician_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Fecth admin details"""

    logger.info("GET req in `/admin/details`")

    # FIND THE TECHNICIAN
    technician = db.query(DBTechnician).filter(DBTechnician.id == technician_id).first()
    if not technician:
        logger.warning(f"Update failed: Technician {technician_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found."
        )

    return technician


@router.get("/{technician_id}", status_code=status.HTTP_200_OK, response_model=TechnicianOut)
def get_technician_profile(
    technician_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: DBAdmin | DBTechnician = Depends(get_current_user)
    ):
    """Fetch the currently logged-in admin's profile details."""

    logger.info(f"GET req in `/technicians/{technician_id}` by {current_user.email}")

    technician = db.query(DBTechnician).filter(DBTechnician.id == technician_id).first()

    if current_user.__tablename__ == "technicians":
        if str(technician_id) != str(current_user.id):
            logger.warning(f"Unauthorized view attempt by Technician {current_user.id} on Technician {technician_id}'s Profile")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update the profile of other technicians."
            )

    return technician


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=dict)
async def register_technician(
    name: str = Form(...),
    email: EmailStr = Form(...),
    phone: int = Form(...),
    password: str = Form(...),
    profile_image: UploadFile | None = File(None), # explicitly optional
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin) # Security: Only Admins can hit this route
):
    """Register/create a new technician. Strictly restricted to Admins."""

    logger.info(f"POST req in `/technicians/register` by Admin {current_admin.email}")

    try:
        existing_technician = db.query(DBTechnician).filter(DBTechnician.email == email).first()
        if existing_technician:
            logger.warning(f"Registration failed: Email {email} already exists.")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A technician with this email is already registered."
            )

        hashed_password = pwd_context.hash(password)

        profile_image_url = "https://i.ibb.co/vxLH9d92/default-avatar-light.png"

        if profile_image:
            if profile_image.content_type not in settings.ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file type. Only JPEG, PNG, and GIF are allowed."
                )

            file_bytes = await profile_image.read()

            if len(file_bytes) > 2000000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File too large. Maximum size is 2MB."
                )

            profile_image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)


        # SAVE TO DB
        new_technician = DBTechnician(
            profile_image_url=profile_image_url,
            name=name,
            phone=phone,
            email=email,
            password_hash=hashed_password,
            is_available=True,
            # is_active=True
        )

        db.add(new_technician)
        db.commit()
        db.refresh(new_technician)

        # GENERATE TOKEN
        token = create_access_token(
            data={"technician_id": str(new_technician.id), "email": new_technician.email, "role": "Technician"},
            expires_delta=timedelta(hours=1)
        )

        return {
            "technician_registration": {
                "message": "Technician registered successfully.",
                "technician_id": new_technician.id,
                "profile_image_url": profile_image_url,
                "name": new_technician.name,
                "email": new_technician.email,
                "phone": new_technician.phone,
                "is_available": new_technician.is_available,
                "created_at": new_technician.created_at,
                "updated_at": new_technician.updated_at,
                "token": token  # access token
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Technician Registration Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during Technician Registration."
        )


@router.post("/login", status_code=status.HTTP_200_OK, response_model=dict)
async def login_technician(
    # technician_credentials: TechnicianLogin,
    technician_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Authenticate Technician and return a JWT token."""

    # logger.info(f"POST req in `/technicians/login` for email: {technician_credentials.email}")
    logger.info(f"POST req in `/technicians/login` for email: {technician_credentials.username}")

    try:
        # FETCH TECHNICIAN BY EMAIL
        # technician = db.query(DBTechnician).filter(DBTechnician.email == technician_credentials.email).first()
        technician = db.query(DBTechnician).filter(DBTechnician.email == technician_credentials.username).first()

        # VERIFY EXISTENCE AND PASSWORD (Generic Error)
        if not technician or not pwd_context.verify(technician_credentials.password, technician.password_hash):
            # logger.warning(f"Failed login attempt for email: {technician_credentials.email}")
            logger.warning(f"Failed login attempt for email: {technician_credentials.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # GENERATE ACCESS TOKEN
        token = create_access_token(
            data={"technician_id": str(technician.id), "email": technician.email, "role": "Technician"},
            expires_delta=timedelta(hours=1)
        )

        # RETURN SECURE PAYLOAD
        return {
            "access_token": token,   # V
            "token_type": "bearer",  # Swagger specifically looks for these two exact keys
            "technician_login": {
                "message": "Technician login successfully.",
                "technician_id": technician.id,
                "profile_image_url": technician.profile_image_url,
                "name": technician.name,
                "email": technician.email,
                "phone": technician.phone,
                "is_available": technician.is_available,
                "created_at":technician.created_at,
                "updated_at":technician.updated_at,
                "token": token  # access token
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Technician Login Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during Technician Login."
        )


@router.patch("/{technician_id}", status_code=status.HTTP_200_OK, response_model=dict)
async def update_technician_profile(
    background_tasks: BackgroundTasks,
    technician_id: uuid.UUID,
    name: str | None = Form(None),
    phone: int | None = Form(None),
    profile_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: DBAdmin | DBTechnician = Depends(get_current_user)
):
    """
    Update a technician's profile.
    Admins can update anyone. Technicians can only update themselves.
    """

    logger.info(f"PATCH req in `/technicians/{technician_id}` by {current_user.email}")

    try:
        technician = db.query(DBTechnician).filter(DBTechnician.id == technician_id).first()
        if not technician:
            logger.warning(f"Update failed: Technician {technician_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Technician not found."
            )


        if current_user.__tablename__ == "technicians":
            if str(technician_id) != str(current_user.id):
                logger.warning(f"Unauthorized update attempt by Technician {current_user.id} on Technician {technician_id}'s Profile")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update the profile of other technicians."
                )

        # HANDLE OPTIONAL IMAGE UPLOAD
        if profile_image:
            if profile_image.content_type not in settings.ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file type. Only JPEG, PNG, and GIF are allowed."
                )

            file_bytes = await profile_image.read()

            if len(file_bytes) > 2000000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File too large. Maximum size is 2MB."
                )

            old_profile_image_url = technician.profile_image_url

            # Upload new image and overwrite the database URL
            profile_image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)
            technician.profile_image_url = profile_image_url

            if old_profile_image_url and "ibb.co" not in old_profile_image_url:
                background_tasks.add_task(delete_from_cloudinary, old_profile_image_url)

        # UPDATE OPTIONAL TEXT FIELDS
        if name is not None:
            technician.name = name

        if phone is not None:
            technician.phone = phone

        db.commit()
        db.refresh(technician)

        return {
            "message": "Technician profile updated successfully.",
            "technician_data": {
                "id": technician.id,
                "name": technician.name,
                "email": technician.email,
                "phone": technician.phone,
                "profile_image_url": technician.profile_image_url,
                "is_available": technician.is_available,
                "updated_at": technician.updated_at
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update technician {technician_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during profile update."
        )


@router.patch("/{technician_id}/availability", status_code=status.HTTP_200_OK, response_model=dict)
async def update_technician_availability(
    technician_id: uuid.UUID,
    availability_in: TechnicianUpdateAvailability,
    db: Session = Depends(get_db),
    current_user: DBAdmin | DBTechnician = Depends(get_current_user)
):
    """Update a technician's availability. Admins can update anyone; Technicians can only update themselves."""

    logger.info(f"PATCH req in `/technicians/{technician_id}/availability` by user {current_user.email}")

    try:
        technician = db.query(DBTechnician).filter(DBTechnician.id == technician_id).first()
        if not technician:
            logger.warning(f"Availability update failed: Technician {technician_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Technician not found."
            )

        if current_user.__tablename__ == "technicians":
            if str(technician_id) != str(current_user.id):
                logger.warning(f"Unauthorized update attempt by Technician {current_user.id} on Technician {technician_id}'s Availability")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update the availability of other technicians."
                )

        # UPDATE THE STATUS
        technician.is_available = availability_in.is_available

        # SAVE CHANGES
        db.commit()
        db.refresh(technician)

        return {
            "message": "Technician availability status updated successfully.",
            "technician_id": technician.id,
            "is_available": technician.is_available
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update availability for technician {technician_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating technician availability."
        )


@router.patch("/{technician_id}/password", status_code=status.HTTP_200_OK, response_model=dict)
async def update_technician_password(
    technician_id: uuid.UUID,
    password_in: TechnicianUpdatePassword,
    db: Session = Depends(get_db),
    current_user: DBAdmin | DBTechnician = Depends(get_current_user)
):
    """
    Update a technician's password.
    Admins can forcibly reset any password. Technicians can only update their own and MUST provide their current password.
    """

    logger.info(f"PATCH req in `/technicians/{technician_id}/password` by user {current_user.email}")

    try:
        technician = db.query(DBTechnician).filter(DBTechnician.id == technician_id).first()
        if not technician:
            logger.warning(f"Password update failed: Technician {technician_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Technician not found."
            )

        # TECHNICIAN-SPECIFIC SECURITY CHECKS
        if current_user.__tablename__ == "technicians":
            if str(technician_id) != str(current_user.id):
                logger.warning(f"Unauthorized update attempt by Technician {current_user.id} on Technician {technician_id}'s password")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update the password of other technicians."
                )

            if not password_in.current_password:
                logger.warning(f"Failed password update attempt for {current_user.email}: Missing current_password payload.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You must provide your current password to update it."
                )

            if not pwd_context.verify(password_in.current_password, current_user.password_hash):
                logger.warning(f"Failed password update attempt for {current_user.email}: Incorrect current password.")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect current password."
                )

            if password_in.current_password == password_in.new_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="New password cannot be the same as the current password."
                )

        # APPLY THE NEW PASSWORD (Reaches here if Admin, OR if Technician passed all checks)
        technician.password_hash = pwd_context.hash(password_in.new_password)

        db.commit()
        db.refresh(technician)

        return {
            "message": f"Password for technician {technician.email} has been successfully reset."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to reset password for technician {technician_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during technician password reset."
        )
