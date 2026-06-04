from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# PASSWORD HASHING
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT TOKEN GENERATION
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Creates a secure JSON Web Token (JWT) containing the user's payload.
    """

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Fallback to the default 30 minutes you defined in config.py
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt
