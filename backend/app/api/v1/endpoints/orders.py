import logging
import uuid
import datetime
import razorpay

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from decimal import Decimal


from app.db.session import get_db
from app.models.order import Order as DBOrder, OrderStatus
from app.models.asset import Asset as DBAsset, StockStatus
from app.schemas.order import OrderCreate, OrderOut, OrderCancel, OrderUpdate, OrderMetadataUpdate, OrderMarkAsPaid, OrderStatDetail, OrderStatsSummary, MonthlyRevenueOut, RazorpayVerify
from app.api.deps import get_current_user
from app.core.config import settings
from app.services.razorpay import rzp_payment_service

logger = logging.getLogger(__name__)
logging.getLogger("passlib").setLevel(logging.ERROR)


router = APIRouter()


# def list_orders  # (admin & techinician both)
# GET /api/v1/orders?skip=10&limit=10
@router.get("/", status_code=status.HTTP_200_OK, response_model=list[OrderOut])
async def list_orders(
    skip: int = Query(0, ge=0, description="Pagination: items to skip"),
    # Query(...): Explicitly tells FastAPI to look for this value in the URL query string, not in the JSON body.
    limit: int = Query(100, ge=1, le=1000, description="Pagination: maximum items to return"),
    order_status: OrderStatus | None = Query(None, alias="status", description="Filter by order status"),
    assignee_id: uuid.UUID | None = Query(None, description="Admin only: filter by specific technician"),
    db: Session =  Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve orders with pagination and filtering.
    Technicians will only see their assigned orders. Admins can see all.
    """

    logger.info(f"GET req in `/orders/` by {current_user.email}")

    try:
        # Start the base query
        query = db.query(DBOrder)  # SELECT * FROM orders

        # IMPLICIT RBAC & ASSIGNEE FILTERING
        if current_user.__tablename__ == "technicians":
            query = query.filter(DBOrder.assignee.contains({"id": str(current_user.id)})) # using GIN Index `ix_orders_assignee_gin` in model/order.py
            # SELECT * FROM orders WHERE assignee @> '{"id": "their-uuid"}'::jsonb
        else:
            # If the user is an Admin, they can optionally filter by a specific assignee
            if assignee_id:
                query = query.filter(DBOrder.assignee.contains({"id": str(assignee_id)}))
                # SELECT * FROM orders WHERE assignee @> '{"id": "assignee_id-uuid"}'::jsonb

        # STATUS FILTERING
        if order_status:
            query = query.filter(DBOrder.status == order_status)
            # eg: SELECT * FROM orders WHERE assignee @> '{"id": "their-uuid"}'::jsonb AND status = 'Paid'

        # EXECUTE WITH PAGINATION & SORTING
        # orders = query.order_by(DBOrder.created_at.desc()).offset(skip).limit(limit).all()
        # or
        orders = query.order_by(DBOrder.id.desc()).offset(skip).limit(limit).all()  # using uuid7
        # eg:
        # SELECT *
        # FROM orders
        # WHERE assignee @> '{"id": "their-uuid"}'::jsonb AND status = 'Paid'
        # ORDER BY id DESC
        # LIMIT 10
        # OFFSET 20;


        return orders

    except Exception as e:
        logger.error(f"Failed to fetch orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while fetching orders."
        )


# stats summary cards
@router.get("/stats/summary", status_code=status.HTTP_200_OK, response_model=OrderStatsSummary)
async def get_orders_stats_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve aggregated order statistics (counts and total values).
    Technicians see stats for their assigned tasks; Admins see company-wide stats.
    """

    logger.info(f"GET req in `/orders/stats/summary` by {current_user.email}")

    try:
        # BUILD THE AGGREGATION QUERY
        # We ask Postgres to group by status, count the IDs, and sum the total_amount.
        # func.coalesce ensures that if there are 0 orders, it returns 0.0 instead of NULL.
        query = db.query(
            DBOrder.status,
            func.count(DBOrder.id).label("count"),
            func.coalesce(func.sum(DBOrder.total_amount), 0).label("total_value")
        )
        # This translates to: SELECT status, COUNT(id), SUM(total_amount) FROM orders

        # IMPLICIT RBAC FILTERING
        # If a Technician views the dashboard, they only see stats for their own orders
        if current_user.__tablename__ == "technicians":
            query = query.filter(DBOrder.assignee.contains({"id": str(current_user.id)}))
            # This translates to: SELECT status, COUNT(id), SUM(total_amount) FROM orders WHERE assignee @> '{"id": "their-uuid"}'::jsonb


        # EXECUTE THE GROUP BY
        # This translates to: SELECT status, COUNT(id), SUM(total_amount) FROM orders GROUP BY status;
        raw_stats = query.group_by(DBOrder.status).all()
        # eg:
        # raw_stats =
        # [
        #     ("Pending", 100, 100000),
        #     ("Paid", 100, 100000),
        #     ("Cancelled", 100, 100000)
        # ]

        # INITIALIZE THE RESPONSE DICTIONARY
        stats_map = {
            OrderStatus.PENDING: OrderStatDetail(),
            OrderStatus.PAID: OrderStatDetail(),
            OrderStatus.CANCELLED: OrderStatDetail()
        }
        # eg:
        # stats_map =
        # {
        #     "Pending": { "count": 100, "total_value": 100000 },
        #     "Paid": { "count": 100, "total_value": 100000 },
        #     "Cancelled": { "count": 100, "total_value": 100000 }
        # }


        # POPULATE THE DICTIONARY FROM SQL RESULTS
        for status_enum, count, total_value in raw_stats:
            stats_map[status_enum] = OrderStatDetail(count=count, total_value=float(total_value))

        # CALCULATE THE GRAND TOTALS
        total_count = sum(detail.count for detail in stats_map.values())
        total_value = sum(detail.total_value for detail in stats_map.values())

        # ASSEMBLE AND RETURN THE FINAL PAYLOAD
        return OrderStatsSummary(
            total_orders=OrderStatDetail(count=total_count, total_value=total_value),
            pending_orders=stats_map[OrderStatus.PENDING],
            paid_orders=stats_map[OrderStatus.PAID],
            cancelled_orders=stats_map[OrderStatus.CANCELLED]
        )

    except Exception as e:
        logger.error(f"Failed to fetch order stats summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while calculating order statistics."
        )


# for main dashboard monthly revenue bar graph
@router.get("/revenue/monthly", status_code=status.HTTP_200_OK, response_model=list[MonthlyRevenueOut])
async def get_monthly_revenue(
    year: int = Query(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).year,
        description="The year to fetch revenue for (defaults to current year)"
    ),
    db: Session = Depends(get_db)
):
    """
    Retrieve monthly revenue totals for a specific year to power the dashboard bar chart.
    Only counts orders that are successfully PAID.
    """
    try:
        query_result = db.query(
            extract('month', DBOrder.created_at).label("month_num"),
            func.coalesce(func.sum(DBOrder.total_amount), 0).label("revenue")
        ).filter(
            extract('year', DBOrder.created_at) == year,
            DBOrder.status == OrderStatus.PAID
        ).group_by(
            extract('month', DBOrder.created_at)
        ).all()

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_revenue_map = {month: 0.0 for month in months}

        for row in query_result:
            month_index = int(row.month_num) - 1
            month_name = months[month_index]
            monthly_revenue_map[month_name] = float(row.revenue)

        response = [
            MonthlyRevenueOut(month=month_name, revenue=month_revenue_total)
            for month_name, month_revenue_total in monthly_revenue_map.items()
        ]

        return response

    except Exception as e:
        logger.error(f"Failed to fetch monthly revenue for {year}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while calculating monthly revenue."
        )


# get order by order's id
@router.get("/{order_id}", status_code=status.HTTP_200_OK, response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve a specific order by its ID.
    Admins can view any order. Technicians can only view their assigned orders.
    """

    logger.info(f"GET req in `/orders/{order_id}` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # STRICT AUTHORIZATION CHECK (RBAC)
        if current_user.__tablename__ == "technicians":
            order_assignee_id_str = order.assignee["id"]
            if str(current_user.id) != str(order_assignee_id_str):
                logger.warning(f"Unauthorized view attempt by Tech {current_user.id} on Order {order_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view an order assigned to someone else."
                )

        return order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to fetch order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while fetching the order."
        )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=OrderOut)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Accessible by both Admin & Technicians
):
    """Create a new order and automatically adjust inventory levels."""

    logger.info(f"POST req in `/orders/` by {current_user.email} ({current_user.__tablename__})")

    try:
        # PRE-FLIGHT INVENTORY CHECK
        for item in order_in.items:
            asset = db.query(DBAsset).filter(DBAsset.id == item.id).first()

            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Asset '{item.name}' (ID: {item.id}) not found in database."
                )

            if item.quantity < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Order quantity for '{item.name}' must be at least 1."
                )

            if asset.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{item.name}'. Requested: {item.quantity}, Available: {asset.stock}"
                )

        # INVENTORY DEDUCTION & ANALYTICS UPDATE
        for item in order_in.items:
            asset = db.query(DBAsset).filter(DBAsset.id == item.id).first()

            # Deduct Stock
            asset.stock -= item.quantity

            # Recalculate automatic StockStatus
            if asset.stock == 0:
                asset.stock_status = StockStatus.OUT_OF_STOCK
            elif asset.stock <= asset.min_stock:
                asset.stock_status = StockStatus.LOW_STOCK
            else:
                asset.stock_status = StockStatus.IN_STOCK

            # Update Analytics Widget Data
            # units_sold and revenue are logged at checkout/creation
            asset.units_sold += item.quantity
            asset.total_revenue += item.total_price

        # CREATE THE ORDER RECORD
        new_order = DBOrder(
            assignee=jsonable_encoder(order_in.assignee),
            customer=jsonable_encoder(order_in.customer),
            items=jsonable_encoder(order_in.items),
            notes=order_in.notes,
            total_amount=order_in.total_amount,
            status=order_in.status
        )

        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        return new_order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to create order: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while processing the order."
        )


@router.patch("/{order_id}", status_code=status.HTTP_200_OK, response_model=OrderOut)
async def update_order(
    order_id: uuid.UUID,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update order details and carefully reconcile inventory delta if items change."""

    logger.info(f"PATCH req in `/orders/{order_id}` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # AUTHORIZATION CHECK
        # TODO: Try using role here
        if current_user.__tablename__ == "technicians":
            order_assignee_id_str = order.assignee["id"]  # order assignee JSONB field will be brought from DB in the form of python dict by SQLAlchemy, thus [] notation

            if str(current_user.id) != str(order_assignee_id_str):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to edit an order handled by someone else."
                )

        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot edit a cancelled order. Please create a new one."
            )

        # INVENTORY RECONCILIATION (Only if 'items' are being modified)
        if order_in.items is not None:

            # Completely Rollback the Old Items (Using Bracket Notation)
            for old_item in order.items:
                asset_id = uuid.UUID(old_item["id"])
                asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()

                if asset:
                    asset.stock += old_item["quantity"]

                    if asset.stock == 0:
                        asset.stock_status = StockStatus.OUT_OF_STOCK
                    elif asset.stock <= asset.min_stock:
                        asset.stock_status = StockStatus.LOW_STOCK
                    else:
                        asset.stock_status = StockStatus.IN_STOCK

                    asset.units_sold -= old_item["quantity"]
                    asset.total_revenue -= Decimal(str(old_item["total_price"]))

            # Pre-flight Check the New Items
            for new_item in order_in.items:
                asset = db.query(DBAsset).filter(DBAsset.id == new_item.id).first()
                if not asset:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Asset '{new_item.name}' not found."
                    )
                if asset.stock < new_item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for '{new_item.name}'. Available: {asset.stock}"
                    )

            # Apply the New Items & Update Statuses
            for new_item in order_in.items:
                asset = db.query(DBAsset).filter(DBAsset.id == new_item.id).first()

                asset.stock -= new_item.quantity

                if asset.stock == 0:
                    asset.stock_status = StockStatus.OUT_OF_STOCK
                elif asset.stock <= asset.min_stock:
                    asset.stock_status = StockStatus.LOW_STOCK
                else:
                    asset.stock_status = StockStatus.IN_STOCK

                asset.units_sold += new_item.quantity
                asset.total_revenue += Decimal(str(new_item.total_price))

            # Overwrite the JSONB Array
            order.items = jsonable_encoder(order_in.items)

        # UPDATE REMAINING OPTIONAL FIELDS
        if order_in.assignee is not None:
            order.assignee = jsonable_encoder(order_in.assignee)
        if order_in.customer is not None:
            order.customer = jsonable_encoder(order_in.customer)
        if order_in.notes is not None:
            order.notes = order_in.notes
        if order_in.total_amount is not None:
            order.total_amount = order_in.total_amount

        db.commit()
        db.refresh(order)

        return order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update order {order_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating the order."
        )


@router.patch("/{order_id}/metadata", status_code=status.HTTP_200_OK, response_model=OrderOut)
async def update_order_metadata(
    order_id: uuid.UUID,
    metadata_in: OrderMetadataUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Safely update order metadata (customer details and notes) without touching inventory."""

    logger.info(f"PATCH req in `/orders/{order_id}/metadata` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # AUTHORIZATION CHECK (Admin OR Specific Technician)
        if current_user.__tablename__ == "technicians":
            order_assignee_id_str = order.assignee["id"] # order assignee JSONB field will be brought from DB in the form of python dict by SQLAlchemy, thus [] notation
            if str(current_user.id) != str(order_assignee_id_str):
                logger.warning(f"Unauthorized metadata edit attempt by Technician {current_user.id} on Order {order_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to edit metadata for an order handled by someone else."
                )

        # STATUS LOCK CHECK
        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot edit metadata of a cancelled order."
            )

        # UPDATE Optional Metadata fields only
        if metadata_in.customer is not None:
            order.customer = jsonable_encoder(metadata_in.customer)

        if metadata_in.notes is not None:
            order.notes = metadata_in.notes

        db.commit()
        db.refresh(order)

        return order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update order metadata {order_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating order metadata."
        )


@router.patch("/{order_id}/cancel", status_code=status.HTTP_200_OK, response_model=OrderOut)
async def cancel_order(
    order_id: uuid.UUID,
    cancel_in: OrderCancel,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cancel an order, rollback inventory stock, and revert revenue analytics."""

    logger.info(f"PATCH req in `/orders/{order_id}/cancel` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # AUTHORIZATION CHECK (Admin OR Specific Technician)
        if current_user.__tablename__ == "technicians":
            order_assignee_id_str = order.assignee["id"]  # order assignee JSONB field will be brought from DB in the form of python dict by SQLAlchemy, thus [] notation
            if str(current_user.id) != str(order_assignee_id_str):
                logger.warning(f"Unauthorized cancel attempt by Technician {current_user.id} on Order {order_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to cancel an order handled by someone else."
                )

        # IDEMPOTENCY CHECK (Prevent Double-Rollback)
        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This order has already been canceled."
            )

        # INVENTORY ROLLBACK (Math & Status)
        for item in order.items:
            asset_id = uuid.UUID(item["id"])
            asset = db.query(DBAsset).filter(DBAsset.id == asset_id).first()

            # Revert Stock & Analytics and Recalculate Automatic Stock Status
            if asset:
                asset.stock += item["quantity"]

                if asset.stock == 0:
                    asset.stock_status = StockStatus.OUT_OF_STOCK
                elif asset.stock <= asset.min_stock:
                    asset.stock_status = StockStatus.LOW_STOCK
                else:
                    asset.stock_status = StockStatus.IN_STOCK

                asset.units_sold -= item["quantity"]
                # FIX: Convert to string first, then to Decimal to prevent float precision loss!
                asset.total_revenue -= Decimal(str(item["total_price"]))

        # UPDATE ORDER STATUS
        order.status = cancel_in.status

        # SAVE ALL CHANGES
        db.commit()
        db.refresh(order)

        return order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to cancel order {order_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while canceling the order."
        )


@router.patch("/{order_id}/paid", status_code=status.HTTP_200_OK, response_model=OrderOut)
async def mark_order_as_paid(
    order_id: uuid.UUID,
    paid_in: OrderMarkAsPaid,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark an order as Paid. Accessible by Admins and the specific handling Technician."""

    logger.info(f"PATCH req in `/orders/{order_id}/paid` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # AUTHORIZATION CHECK (Admin OR Specific Technician)
        if current_user.__tablename__ == "technicians":
            order_assignee_id_str = order.assignee["id"]  # order assignee JSONB field will be brought from DB in the form of python dict by SQLAlchemy, thus [] notation
            if str(current_user.id) != str(order_assignee_id_str):
                logger.warning(f"Unauthorized payment mark attempt by Tech {current_user.id} on Order {order_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to mark an order as paid if it is handled by someone else."
                )

        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot mark a cancelled order as paid."
            )

        if order.status == OrderStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This order has already been marked as paid."
            )

        order.status = paid_in.status

        db.commit()
        db.refresh(order)

        return order

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to mark order {order_id} as paid: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error while updating order payment status."
        )


# // API to make payment of appointment using razorpay
@router.post("/{order_id}/razorpay/create", status_code=status.HTTP_200_OK, response_model=dict)
async def create_razorpay_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """API to create a Razorpay order for an existing CelerityForge order."""
    logger.info(f"POST req in `/orders/{order_id}/razorpay/create` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()

        if not order:
            return {"success": False, "message": "Order not found."}
        if order.status == OrderStatus.CANCELLED:
            return {"success": False, "message": "Cannot pay for a cancelled order."}
        if order.status == OrderStatus.PAID:
            return {"success": False, "message": "Order is already paid."}

        # USE THE SERVICE HERE
        rzp_order = rzp_payment_service.create_order(
            amount=float(order.total_amount),
            receipt_id=str(order.id)
        )

        return {"success": True, "order": rzp_order}

    except Exception as e:
        logger.error(f"Razorpay Order Creation Failed: {str(e)}")
        return {"success": False, "message": str(e)}


# // API to verify payment of razorpay and mark `payment` field `true` in appointment document
@router.post("/{order_id}/razorpay/verify", status_code=status.HTTP_200_OK, response_model=dict)
async def verify_razorpay_payment(
    order_id: uuid.UUID,
    rzp_verify_in: RazorpayVerify,  # { razorpay_payment_id: '', razorpay_order_id: '', razorpay_signature: '' }
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """API to cryptographically verify a Razorpay payment and mark the order as PAID."""
    logger.info(f"POST req in `/orders/{order_id}/razorpay/verify` by {current_user.email}")

    try:
        order = db.query(DBOrder).filter(DBOrder.id == order_id).first()

        if not order:
            return {"success": False, "message": "Order not found."}

        # USE THE SERVICE HERE
        is_valid = rzp_payment_service.verify_payment(
            razorpay_order_id=rzp_verify_in.razorpay_order_id,
            razorpay_payment_id=rzp_verify_in.razorpay_payment_id,
            razorpay_signature=rzp_verify_in.razorpay_signature
        )

        if not is_valid:
            logger.warning(f"Signature mismatch for Order {order_id}. Possible tampering.")
            return {"success": False, "message": "Payment verification failed. Invalid signature."}


        order.status = OrderStatus.PAID

        db.commit()
        db.refresh(order)

        return {"success": True, "message": "Payment Successful"}

    except Exception as e:
        logger.error(f"Razorpay Verification Failed: {str(e)}")
        return {"success": False, "message": str(e)}
