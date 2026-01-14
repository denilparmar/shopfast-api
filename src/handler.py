import json
import os

def get_claims(event):
    authorizer = event.get("requestContext", {}).get("authorizer", {})

    # REST API (Cognito User Pool authorizer)
    claims = authorizer.get("claims")

    # HTTP API (JWT authorizer)
    if not claims:
        claims = authorizer.get("jwt", {}).get("claims")

    # Offline fallback
    if not claims:
        claims = {
            "mock_user": "local",
            "scope": "payment-service/payments.*"
        }

    return claims


def create_payment(event, context):
    claims = get_claims(event)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Payment created",
            "claims": claims
        })
    }

def refund_payment(event, context):
    claims = get_mock_claims(event)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Payment refunded",
            "claims": claims
        })
    }
