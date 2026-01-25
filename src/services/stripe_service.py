import os
import stripe
from utils.secrets_manager import get_secret

_stripe_initialized = False

def init_stripe():
    global _stripe_initialized

    if not _stripe_initialized:
        stripe_secret_arn = os.environ["STRIPE_SECRET_ARN"]
        stripe.api_key = get_secret(stripe_secret_arn)
        _stripe_initialized = True

    return stripe

def create_payment_intent(payment_id: str, amount_cents: int, currency: str = "usd"):
    stripe_client = init_stripe()
    intent = stripe_client.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        idempotency_key=payment_id
    )
    return intent

def refund_payment_intent(payment_intent_id: str):
    stripe_client = init_stripe()
    refund = stripe_client.Refund.create(
        payment_intent=payment_intent_id
    )
    return refund
