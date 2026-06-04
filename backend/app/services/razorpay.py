import razorpay
from app.core.config import settings

class RazorpayService:
    """Service to handle interactions with the Razorpay API."""

    def __init__(self):
        # Initialize Razorpay Client
        self.rzp_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


    def create_order(self, amount: float, receipt_id: str) -> dict:
        """Creates a new order on Razorpay servers."""

        # # Creating options for Razorpay
        # Razorpay expects the amount in the smallest currency sub-unit (e.g., paise for INR).
        # We multiply by 100 and cast to an integer to strip decimals.
        options = {
            "amount": int(amount * 100),
            "currency": settings.CURRENCY,
            "receipt": receipt_id
        }

        return self.rzp_client.order.create(data=options)


    def verify_payment(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """Cryptographically verifies the Razorpay payment signature."""

        verification_payload = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            self.rzp_client.utility.verify_payment_signature(verification_payload)

            return True

        except razorpay.errors.SignatureVerificationError:

            return False


# Initialize a singleton instance to be imported elsewhere
rzp_payment_service = RazorpayService()
