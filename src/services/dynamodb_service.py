import os
import time
import boto3

table_name = os.environ["PAYMENTS_TABLE_NAME"]
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)


def save_payment(payment_id: str, stripe_payment_intent_id: str, amount: int, currency: str, status: str):
    table.put_item(
        Item={
            "paymentId": payment_id,
            "stripePaymentIntentId": stripe_payment_intent_id,
            "amount": amount,
            "currency": currency,
            "status": status,
            "createdAt": int(time.time()),
            "updatedAt": int(time.time()),
        }
    )

def update_payment_status(payment_id: str, status: str):
    table.update_item(
        Key={"paymentId": payment_id},
        UpdateExpression="SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": status,
            ":u": int(time.time())
        }
    )

def get_payment(payment_id: str):
    response = table.get_item(Key={"paymentId": payment_id})
    return response.get("Item")
