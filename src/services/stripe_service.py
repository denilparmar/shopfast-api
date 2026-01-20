import os
import stripe
from utils.secrets_manager import get_secret

def init_stripe():
    stripe_secret_arn = os.environ["STRIPE_SECRET_ARN"]
    stripe.api_key = get_secret(stripe_secret_arn)
    return stripe

def create_payment_intent(amount_cents: int, currency: str = "usd", metadata: dict = None):
    stripe_client = init_stripe()
    intent = stripe_client.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        metadata=metadata
    )
    return intent

def refund_payment_intent(payment_intent_id: str):
    stripe_client = init_stripe()
    refund = stripe_client.Refund.create(
        payment_intent=payment_intent_id
    )
    return refund
