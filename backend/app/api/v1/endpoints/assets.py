import logging
import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException, status, Form, File, UploadFile, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset as DBAsset, StockStatus
from app.schemas.asset import AssetOut, AssetSummary, AssetTopProductOut, CategorySalesOut
from app.api.deps import get_current_user, get_current_admin
from app.core.config import settings
from app.services.cloudinary import upload_on_cloudinary, delete_from_cloudinary

logger = logging.getLogger(__name__)
logging.getLogger("passlib").setLevel(logging.ERROR)


router = APIRouter()

# def get_all_assets  # (admin & techinician both)
@router.get("/", status_code=status.HTTP_200_OK, response_model=list[AssetOut])
def get_all_assets(
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # Automatically secures the route for BOTH roles (RBAC)
):
    """Fetch all inventory assets. Accessible by Admin and Technicians."""

    # logger.info(f"GET req in `/assets/` by {current_user.email} ({current_user.__tablename__})")
    logger.info(f"GET req in `/assets/`")

    assets = db.query(DBAsset).all()

    return assets

# def get_inventory_summary_stats (total_assets, total_valuation, in_stock_count, low_stock_count, out_of_stock_count)
@router.get("/stats/summary", status_code=status.HTTP_200_OK, response_model=AssetSummary)
def get_inventory_summary_stats(
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    """Fetch aggregated inventory statistics for the dashboard widgets."""

    # logger.info(f"GET req in `/assets/stats/summary` by {current_user.email}")
    logger.info("GET req in /assets/stats/summary")

    total_assets = db.query(func.count(DBAsset.id)).scalar()

    total_valuation = db.query(
        func.coalesce(func.sum(DBAsset.unit_price * DBAsset.stock), 0)
    ).scalar()

    in_stock_count = db.query(func.count(DBAsset.id)).filter(
        DBAsset.stock_status == StockStatus.IN_STOCK
    ).scalar()

    low_stock_count = db.query(func.count(DBAsset.id)).filter(
        DBAsset.stock_status == StockStatus.LOW_STOCK
    ).scalar()

    out_of_stock_count = db.query(func.count(DBAsset.id)).filter(
        DBAsset.stock_status == StockStatus.OUT_OF_STOCK
    ).scalar()

    return {
        "total_assets": total_assets,
        "total_valuation": float(total_valuation),
        "stock_distribution": {
            "in_stock": in_stock_count,
            "low_stock": low_stock_count,
            "out_of_stock": out_of_stock_count
        }
    }

# for main dashboard top products list
@router.get("/top", status_code=status.HTTP_200_OK, response_model=List[AssetTopProductOut])
async def list_top_products(
    limit: int = Query(5, ge=1, le=20, description="Number of top products to fetch"),
    db: Session = Depends(get_db),
    current_admin: Session = Depends(get_current_admin)
):
    """
    Retrieve the highest-grossing products based on total revenue.
    """

    logger.info(f"GET req in `/assets/top` by {current_admin.email}")

    top_products = db.query(DBAsset).order_by(DBAsset.total_revenue.desc()).limit(limit).all()

    return top_products


# for main dashboard sales by category pie chart
@router.get("/sales/categories", status_code=status.HTTP_200_OK, response_model=list[CategorySalesOut])
async def get_sales_by_category(
    db: Session = Depends(get_db),
    current_admin: Session = Depends(get_current_admin)
):
    """
    Retrieve total sales revenue grouped by asset category to power dashboard charts.
    """

    logger.info(f"GET req in `/assets/sales/categories` by {current_admin.email}")

    try:
        # THE AGGREGATION QUERY
        # Translates to: SELECT category, SUM(total_revenue) FROM assets GROUP BY category;
        raw_data = db.query(
            DBAsset.category,
            func.coalesce(func.sum(DBAsset.total_revenue), 0).label("revenue")
        ).group_by(DBAsset.category).all()
        # eg.:
        # raw_data =
        # [
        #     { "category": "PC", "revenue": 100000 },
        #     { "category": "Speakers", "revenue": 20000 },
        #     ...
        # ]

        if not raw_data:
            return []

        # CALCULATE THE GRAND TOTAL
        # We need the sum of ALL revenue to calculate the percentages
        grand_total = sum(float(row.revenue) for row in raw_data)

        # Prevent division by zero if the store is brand new and has $0 in sales
        if grand_total == 0:
            return [
                CategorySalesOut(category=row.category, revenue=0.0, percentage=0.0)
                for row in raw_data
            ]

        # FORMAT THE RESPONSE WITH EXACT PERCENTAGES
        response = []
        for row in raw_data:
            category_revenue = float(row.revenue)
            # Round percentage to 1 decimal place (e.g., 45.0) for clean UI rendering
            percentage = round((category_revenue / grand_total) * 100, 1)

            response.append(
                CategorySalesOut(
                    category=row.category,
                    revenue=category_revenue,
                    percentage=percentage
                )
            )

        # Optional: Sort the response so the biggest slices of the pie chart are always first
        response.sort(key=lambda x: x.percentage, reverse=True)

        return response

    except Exception as e:
        logger.error(f"Failed to fetch category sales: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while calculating category distribution."
        )

# def get_asset_by_id  # (admin & techinician both)
@router.get("/{asset_id}", status_code=status.HTTP_200_OK, response_model=AssetOut)
async def get_asset_by_id(
    asset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Automatically secures the route for BOTH roles (RBAC)
):
    """Fetch a specific asset by its ID. Accessible by Admin and Technicians."""

    logger.info(f"GET req in `/assets/{asset_id}` by {current_user.email} ({current_user.__tablename__})")

    asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()

    if not asset:
        logger.warning(f"Asset fetch failed: Asset {asset_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found."
        )

    return asset


# def create_asset / add_new_assest (only admin)
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AssetOut)
async def create_asset(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    unit_price: Decimal = Form(...),
    stock: int = Form(...),
    min_stock: int = Form(...),
    asset_image: UploadFile | None = File(None),  # Optional file upload
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new inventory asset. Strictly restricted to Admins."""

    logger.info(f"POST req in `/assets/` by Admin {current_admin.email}")

    try:
        # HANDLE OPTIONAL IMAGE UPLOAD & DEFAULT URL
        image_url = "https://i.ibb.co/tMtqLqWm/container.jpg"

        if asset_image:
            if asset_image.content_type not in settings.ALLOWED_IMAGE_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file type. Only JPEG, PNG, and GIF are allowed."
                )

            file_bytes = await asset_image.read()

            if len(file_bytes) > 5000000: # 5MB limit
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File too large. Maximum size is 5MB."
                )

            image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)

        # CALCULATE AUTOMATIC STOCK STATUS
        initial_stock_status = StockStatus.IN_STOCK
        if stock <= 0:
            initial_stock_status = StockStatus.OUT_OF_STOCK
        elif stock <= min_stock:
            initial_stock_status = StockStatus.LOW_STOCK

        # MAP TO DATABASE MODEL
        new_asset = DBAsset(
            image_url=image_url,
            name=name,
            description=description,
            category=category,
            unit_price=unit_price,
            stock=stock,
            min_stock=min_stock,
            stock_status=initial_stock_status
            # units_sold and total_revenue automatically default to 0
        )

        # SAVE TO DATABASE
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)

        return new_asset

    except HTTPException as he:
        # Catch explicit HTTPExceptions (like file size/type errors) so they don't trigger the 500 fallback
        raise he
    except Exception as e:
        logger.error(f"Failed to create new asset: {str(e)}")
        db.rollback() # Crucial to rollback the session if a database error occurs
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while creating the asset."
        )


# def update_asset (only admin)
@router.patch("/{asset_id}", status_code=status.HTTP_200_OK, response_model=AssetOut)
async def update_asset(
    background_tasks: BackgroundTasks,
    asset_id: uuid.UUID,
    name: str | None = Form(None),
    description: str | None = Form(None),
    category: str | None = Form(None),
    unit_price: Decimal | None = Form(None),
    stock: int | None = Form(None),
    min_stock: int | None = Form(None),
    asset_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing inventory asset. Strictly restricted to Admins."""

    logger.info(f"PATCH req in `/assets/{asset_id}` by Admin {current_admin.email}")

    try:
        # FIND THE ASSET
        asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()
        if not asset:
            logger.warning(f"Update failed: Asset {asset_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        # HANDLE OPTIONAL IMAGE UPLOAD
        if asset_image:
            if asset_image.content_type not in settings.ALLOWED_IMAGE_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file type. Only JPEG, PNG, and GIF are allowed."
                )

            file_bytes = await asset_image.read()

            if len(file_bytes) > 5000000: # 5MB limit
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File too large. Maximum size is 5MB."
                )

            old_image_url = asset.image_url

            new_image_url = await run_in_threadpool(upload_on_cloudinary, file_bytes)
            asset.image_url = new_image_url

            if old_image_url and "ibb.co" not in old_image_url:
                background_tasks.add_task(delete_from_cloudinary, old_image_url)


        # UPDATE OPTIONAL TEXT/NUMBER FIELDS
        if name is not None:
            asset.name = name
        if description is not None:
            asset.description = description
        if category is not None:
            asset.category = category
        if unit_price is not None:
            asset.unit_price = unit_price
        if stock is not None:
            asset.stock = stock
        if min_stock is not None:
            asset.min_stock = min_stock

        # RECALCULATE AUTOMATIC STOCK STATUS
        if asset.stock <= 0:
            asset.stock_status = StockStatus.OUT_OF_STOCK
        elif asset.stock <= asset.min_stock:
            asset.stock_status = StockStatus.LOW_STOCK
        else:
            asset.stock_status = StockStatus.IN_STOCK

        # SAVE CHANGES
        db.commit()
        db.refresh(asset)

        return asset

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update asset {asset_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating the asset."
        )


# def mark_asset_out_of_stock (only admin)
@router.patch("/{asset_id}/mark-out-of-stock", status_code=status.HTTP_200_OK, response_model=AssetOut)
async def mark_asset_out_of_stock(
    asset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Instantly zero out an asset's stock. Strictly restricted to Admins."""

    logger.info(f"PATCH req in `/assets/{asset_id}/out-of-stock` by Admin {current_admin.email}")

    try:
        # FIND THE ASSET
        asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()
        if not asset:
            logger.warning(f"Out-of-stock action failed: Asset {asset_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        asset.stock = 0
        asset.stock_status = StockStatus.OUT_OF_STOCK

        db.commit()
        db.refresh(asset)

        return asset

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to mark asset {asset_id} out of stock: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating asset stock."
        )


# def delete_asset (only admin)
@router.delete("/{asset_id}", status_code=status.HTTP_200_OK, response_model=dict)
async def delete_asset(
    asset_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """Permanently delete an asset and its associated cloud image. Strictly restricted to Admins."""

    logger.info(f"DELETE req in `/assets/{asset_id}` by Admin {current_admin.email}")

    try:
        # FIND THE ASSET
        asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()
        if not asset:
            logger.warning(f"Delete failed: Asset {asset_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        # QUEUE CLOUDINARY IMAGE DELETION
        if asset.image_url and "ibb.co" not in asset.image_url:
            background_tasks.add_task(delete_from_cloudinary, asset.image_url)

        db.delete(asset)
        db.commit()

        return {
            "message": f"Asset '{asset.name}' has been permanently deleted.",
            "deleted_asset_id": asset_id
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to hard delete asset {asset_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while deleting the asset."
        )
