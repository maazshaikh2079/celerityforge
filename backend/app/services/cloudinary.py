import cloudinary
import cloudinary.uploader  # This is the exact line you are missing
from fastapi import HTTPException, status
import logging

from app.core.config import settings


logger = logging.getLogger(__name__)

# Configure Cloudinary globally
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    # secure=True
)

def upload_on_cloudinary(file_stream, folder: str = settings.CLOUDINARY_FOLDER) -> str:
    """Uploads a file stream directly to Cloudinary and returns the secure URL."""

    try:
        # Python Cloudinary SDK automatically handles memory streams
        result = cloudinary.uploader.upload(
            file_stream,
            folder=folder,
            resource_type="auto"
        )
        logger.info(f"Image uploaded to Cloudinary successfully: {result.get('secure_url')}")
        return result.get("secure_url")

    except Exception as e:
        logger.error(f"Cloudinary Upload Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary upload failed"
        )


def delete_from_cloudinary(image_url: str, folder: str = settings.CLOUDINARY_FOLDER):
    """Background task: Deletes an image from Cloudinary using its URL."""

    try:
        img_file_name = image_url.split("/")[-1] # "tklrxe042qhb5kmu1n9n.jpg"
        img_public_id = img_file_name.split(".")[0] # "tklrxe042qhb5kmu1n9n"

        response = cloudinary.uploader.destroy(f"{folder}/{img_public_id}")
        logger.info(f"Cloudinary image deleted: {response}")

    except Exception as e:
        logger.error(f"Cloudinary Delete Error: {e}")
        # Note: We don't raise an HTTPException here because this runs in the background
