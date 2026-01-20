import os
import boto3

def get_secret(secret_arn) -> str:
    """
    Docstring for get_secret
    Read a secret from AWS Secrets Manager.
    """

    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_arn)
    return response["SecretString"]