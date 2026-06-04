from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import uuid
import logging

from app.core.config import settings
from app.db.session import get_db
from app.models.admin import Admin as DBAdmin
from app.models.technician import Technician as DBTechnician


logger = logging.getLogger(__name__)
logging.getLogger("passlib").setLevel(logging.ERROR)


# THE TOKEN EXTRACTORS (Swagger UI Hooks)
admin_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/admin/login",
    scheme_name="Admin_Login"
)
technician_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/technicians/login",
    scheme_name="Technician_Login"
)
# A generic Bearer token extractor for shared routes (RBAC)
shared_scheme = HTTPBearer(bearerFormat="JWT")


# ADMIN DEPENDENCY
def get_current_admin(token: str = Depends(admin_oauth2_scheme), db: Session = Depends(get_db)):
    """Extracts the token, decodes it, and returns the current active Admin."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Something went wrong while jwt(access token) verification",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        # Verify and decode the token (access token)
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin_id: str = payload.get("admin_id")

        if admin_id is None:
            logger.warning("Error: `token` payload is invalid")
            raise credentials_exception

        # convert the string from the token back into a proper Python UUID object
        uuid_admin_id = uuid.UUID(admin_id)

    except (JWTError, ValueError) as err:
        logger.warning("Something went wrong while jwt(access token) verification")
        logger.warning(f"Error: {err}")
        raise credentials_exception

    db_admin = db.query(DBAdmin).filter(DBAdmin.id == uuid_admin_id).first()
    if db_admin is None:
        logger.warning(f"Admin w/ ID `{uuid_admin_id}` not found during token validation")
        raise credentials_exception

    return db_admin


# TECHNICIAN DEPENDENCY
def get_current_technician(token: str = Depends(technician_oauth2_scheme), db: Session = Depends(get_db)):
    """Extracts the token, decodes it, and returns the current active Technician."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        technician_id: str = payload.get("technician_id")
        logger.info(f"payload: {payload}")

        if technician_id is None:
            logger.warning("Error: `token` payload is invalid")
            raise credentials_exception

        uuid_technician_id = uuid.UUID(technician_id)

    except (JWTError, ValueError) as err:
        logger.warning(f"Technician JWT Verification Error: {err}")
        raise credentials_exception

    db_technician = db.query(DBTechnician).filter(DBTechnician.id == uuid_technician_id).first()
    if db_technician is None:
        logger.warning(f"Technician w/ ID `{uuid_technician_id}` not found during token validation")
        raise credentials_exception

    return db_technician


# `ADMIN` OR `TECHNICIAN` (RBAC / shared routes)  DEPENDENCY
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(shared_scheme),
    db: Session = Depends(get_db)
):
    """Extracts the token, checks the 'role' claim, and returns either an Admin or a Technician."""

    # HTTPBearer returns an object; the actual string is in .credentials
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        # Decode the token
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        role: str = payload.get("role")
        role: str | None = payload.get("role")

        # Dynamically fetch the user based on their specific role claim
        if role == "Admin":
            user_id = payload.get("admin_id")
            if not user_id:
                raise credentials_exception
            user = db.query(DBAdmin).filter(DBAdmin.id == uuid.UUID(user_id)).first()

        elif role == "Technician":
            user_id = payload.get("technician_id") # Matching the exact key you used in technicians.py
            if not user_id:
                raise credentials_exception
            user = db.query(DBTechnician).filter(DBTechnician.id == uuid.UUID(user_id)).first()

        else:
            logger.warning(f"Unknown role in token: {role}")
            raise credentials_exception

        if user is None:
            logger.warning(f"Token decoded successfully, but user {user_id} not found in DB.")
            raise credentials_exception

        return user

    except (JWTError, ValueError) as err:
        logger.warning(f"Shared JWT Verification Error: {err}")
        raise credentials_exception



# def get_current_admin(
#     current_user: DBAdmin | DBTechnician = Depends(get_current_user)
# ) -> DBAdmin:
#     """Strict dependency for Admin-only routes."""
#     if current_user.__tablename__ != "admin":  # Ensure this matches your DBAdmin __tablename__
#         logger.warning(f"Unauthorized access attempt by non-admin: {current_user.email}")
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="The user doesn't have enough privileges"
#         )
#     return current_user


# def get_current_technician(
#     current_user: DBAdmin | DBTechnician = Depends(get_current_user)
# ) -> DBTechnician:
#     """Strict dependency for Technician-only routes."""
#     if current_user.__tablename__ != "technicians": # Ensure this matches your DBTechnician __tablename__
#         logger.warning(f"Unauthorized access attempt by non-technician: {current_user.email}")
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="The user doesn't have enough privileges"
#         )
#     return current_user
