import json
import os

def create_payment(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Payment created successfully",
        }),
    }

def refund_payment(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Payment refunded successfully",
        }),
    }
