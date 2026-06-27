from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

class Settings(BaseSettings):

    # Project Metadata
    PROJECT_NAME: str = "CelerityForge"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    # DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'users.db'}"
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # Computed Property for the Full Connection String
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # JWT Secret Key
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_FOLDER: str

    # # Setting allowed image types
    ALLOWED_IMAGE_MIME_TYPES: list[str] = ["image/jpeg", "image/png", "image/jpg", "image/gif"]

    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    CURRENCY: str = "INR"

    # Tell pydantic to read from a .env file
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


# Instantiate the settings object to be used accorss the app
settings = Settings()
