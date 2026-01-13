import json
import os

def get_mock_claims(event):
    auth = event.get("requestContext", {}).get("authorizer", {})
    claims = auth.get("jwt", {}).get("claims", {})

    if not claims:
        # Offline or missing JWT
        claims = {"mock_user": "local", "scope": "payments.*"}
    return claims

def create_payment(event, context):
    claims = get_mock_claims(event)
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
