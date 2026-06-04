import logging
from datetime import timedelta
from pydantic import EmailStr

from fastapi import APIRouter, Depends, HTTPException, status, Form,  File, UploadFile, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.schemas.admin import AdminOut, AdminUpdatePassword
from app.db.session import get_db
from app.models.admin import Admin as DBAdmin
from app.core.config import settings
from app.core.security import pwd_context, create_access_token
from app.api.deps import get_current_admin
from app.services.cloudinary import upload_on_cloudinary, delete_from_cloudinary

logger = logging.getLogger(__name__)
logging.getLogger("passlib").setLevel(logging.ERROR)


router = APIRouter()

# --- Routes ----

@router.get("/details", response_model=AdminOut)
def get_admin_details(db: Session = Depends(get_db)):
    """Fecth admin details"""

    logger.info("GET req in `/admin/details`")

    return db.query(DBAdmin).first()


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=dict)
async def signup_admin(
    # admin_in: AdminSignup,
    # Extract fields from form-data to allow file uploads in the same request
    name: str = Form(...),
    email: EmailStr = Form(...),
    phone: int = Form(...),
    password: str = Form(...),
    profile_image: UploadFile | None = File(None),  # explicitly optional
    db: Session = Depends(get_db)
    ):
    """Register admin (Singleton)"""

    logger.info("POST req in `/admin/signup` (Signup)")

    try:
        # THE SINGLETON CHECK
        existing_admin = db.query(DBAdmin).first()
        if existing_admin:
            logger.warning("Attempted admin signup, but an admin already exists.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="System already has an active Administrator. Registration locked."
            )

        # HASH PASSWORD
        hashed_password = pwd_context.hash(password)

        # HANDLE FILE UPLOAD & DEFAULT URL
        profile_image_url = "https://i.ibb.co/vxLH9d92/default-avatar-light.png"

        if profile_image:
            if profile_image.content_type not in settings.ALLOWED_MIME_TYPES:
               raise HTTPException(
                   status_code=status.HTTP_400_BAD_REQUEST,
                   detail="Invalid file type. Only JPEG and PNG are allowed."
               )

            # Read file content into memory
            file_bytes = await profile_image.read()

            # Check file size (2MB)
            if len(file_bytes) > 2000000:
                raise HTTPException(status_code=400, detail="File too large")

            profile_image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)


        # SAVE TO DATABASE
        new_admin = DBAdmin(
            profile_image_url=profile_image_url,
            name=name,
            phone=phone,
            email=email,
            password_hash=hashed_password
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        # GENERATE TOKEN
        token = create_access_token(
            data={"admin_id": str(new_admin.id), "email": new_admin.email, "role": "Admin"},
            expires_delta=timedelta(hours=1)
        )

        return {
            "admin_registration": {
                "message": "Admin registered successfully.",
                "admin_id": new_admin.id,
                "profile_image_url": profile_image_url,
                "name": new_admin.name,
                "email": new_admin.email,
                "phone": new_admin.phone,
                "created_at": new_admin.created_at,
                "updated_at": new_admin.updated_at,
                "token": token  # access token
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Admin Signup Failed {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during Admin Signup."
        )


@router.post("/login", status_code=status.HTTP_200_OK, response_model=dict)
async def login_admin(
    # admin_credentials: AdminLogin,
    admin_credentials: OAuth2PasswordRequestForm = Depends(), # This tells FastAPI to expect Form Data from Swagger UI
    db: Session = Depends(get_db)
    ):
    """Authenticate Admin and return a JWT token."""

    # logger.info(f"POST req in `/admin/login` for email: {admin_credentials.email}")
    logger.info(f"POST req in `/admin/login` for email: {admin_credentials.username}")

    try:
        # FETCH ADMIN BY EMAIL
        # admin = db.query(DBAdmin).filter(DBAdmin.email == admin_credentials.email).first()
        admin = db.query(DBAdmin).filter(DBAdmin.email == admin_credentials.username).first()


        if not admin or not pwd_context.verify(admin_credentials.password, admin.password_hash):
            # logger.warning(f"Failed login attempt for email: {admin_credentials.email}")
            logger.warning(f"Failed login attempt for email: {admin_credentials.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # GENERATE TOKEN
        token = create_access_token(
            data={"admin_id": str(admin.id), "email": admin.email, "role": "Admin"},
            expires_delta=timedelta(hours=1)
        )

        return {
            "access_token": token,   # V
            "token_type": "bearer",  # Swagger specifically looks for these two exact keys
            "admin_login": {
                "message": "Admin login successfully.",
                "admin_id": admin.id,
                "profile_image_url": admin.profile_image_url,
                "name": admin.name,
                "email": admin.email,
                "phone": admin.phone,
                "created_at":admin.created_at,
                "updated_at":admin.updated_at,
                "token": token  # access token
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Admin Login Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during Admin Login."
        )


@router.get("/me", status_code=status.HTTP_200_OK, response_model=AdminOut)
def get_my_profile(current_admin: DBAdmin = Depends(get_current_admin)):
    """Fetch the currently logged-in admin's profile details."""

    logger.info(f"GET req in `/admin/me` by {current_admin.email}")

    return current_admin


@router.patch("/me", status_code=status.HTTP_200_OK, response_model=dict)
async def update_my_profile(
    background_tasks: BackgroundTasks,
    name: str | None = Form(None),
    phone: int | None = Form(None),
    profile_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_admin: DBAdmin = Depends(get_current_admin)
):
    """Allow the logged-in admin to update their own profile."""

    logger.info(f"PATCH req in `/admin/me` by {current_admin.email}")

    try:
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

            old_profile_image_url = current_admin.profile_image_url

            new_profile_image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)
            current_admin.profile_image_url = new_profile_image_url

            if old_profile_image_url and "ibb.co" not in old_profile_image_url:
                background_tasks.add_task(delete_from_cloudinary, old_profile_image_url)

        # UPDATE OPTIONAL TEXT FIELDS
        if name is not None:
            current_admin.name = name

        if phone is not None:
            current_admin.phone = phone

        # SAVE CHANGES
        db.commit()
        db.refresh(current_admin)

        return {
            "message": "Admin profile updated successfully.",
            "admin_data": {
                "id": current_admin.id,
                "name": current_admin.name,
                "email": current_admin.email,
                "phone": current_admin.phone,
                "profile_image_url": current_admin.profile_image_url,
                "updated_at": current_admin.updated_at
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update admin profile for {current_admin.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during admin profile update."
        )


@router.patch("/me/password", status_code=status.HTTP_200_OK, response_model=dict)
async def update_my_password(
    password_in: AdminUpdatePassword,
    db: Session = Depends(get_db),
    current_admin: DBAdmin = Depends(get_current_admin)
):
    """Allow the logged-in admin to update their own password."""

    logger.info(f"PATCH req in `/admin/me/password` by {current_admin.email}")

    try:
        # VERIFY CURRENT PASSWORD
        if not pwd_context.verify(password_in.current_password, current_admin.password_hash):
            logger.warning(f"Failed password update attempt for Admin {current_admin.email}: Incorrect current password.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect current password."
            )

        # PREVENT REUSING THE SAME PASSWORD
        if password_in.current_password == password_in.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as the current password."
            )

        # HASH AND SAVE NEW PASSWORD
        current_admin.password_hash = pwd_context.hash(password_in.new_password)

        db.commit()
        db.refresh(current_admin)

        return {
            "message": "Admin password updated successfully."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update password for admin {current_admin.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error during password update."
        )
