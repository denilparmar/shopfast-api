import json
import uuid
from services import stripe_service, dynamodb_service

def create_payment(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        amount = body.get("amount")
        currency = body.get("currency", "usd")
        payment_id = body.get("paymentId")

        # Create Stripe PaymentIntent
        intent = stripe_service.create_payment_intent(
            payment_id=payment_id,
            amount_cents=amount,
            currency=currency
        )

        # Save to DynamoDB
        dynamodb_service.save_payment(
            payment_id=payment_id,
            stripe_payment_intent_id=intent.id,
            amount=amount,
            currency=currency,
            status="created"
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "paymentId": payment_id,
                "stripePaymentIntentId": intent.id,
                "status": "created"
            }),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
        raise

def refund_payment(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        payment_id = body["paymentId"]

        # Lookup payment in DynamoDB
        payment = dynamodb_service.get_payment(payment_id)
        if not payment:
            return {"statusCode": 404, "body": json.dumps({"error": "Payment not found"})}

        # Refund via Stripe
        stripe_service.refund_payment_intent(payment["stripePaymentIntentId"])

        # Update DynamoDB
        dynamodb_service.update_payment_status(payment_id, "refunded")

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Payment refunded", "paymentId": payment_id}),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }

def payment_status(event, context):
    try:
        payment_id = event["pathParameters"]["paymentId"]
        payment = dynamodb_service.get_payment(payment_id)
        if not payment:
            return {"statusCode": 404, "body": json.dumps({"error": "Payment not found"})}

        return {"statusCode": 200, "body": json.dumps(payment)}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
