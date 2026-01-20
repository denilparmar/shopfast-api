# Shopfast API (AWS CDK)

AWS CDK stack that deploys a payment API using Lambda, API Gateway HTTP API, Cognito authentication, and a custom domain.

## Resources
- **Lambda**
  - Create payment
  - Refund payment
- **API Gateway (HTTP API)**
- **Cognito User Pool Authorizer**
- **Custom Domain + ACM Certificate**

## Endpoints
- `POST /payments/create`  
  Scope: `payment-service/payments.create`
- `POST /payments/refund`  
  Scope: `payment-service/payments.refund`

## Authentication
- Cognito User Pool authorizer
- Access token via `Authorization` header
- Imported values:
  - `ShopFast-UserPoolId`
  - `ShopFast-UserPoolClientIdA`

## Domain
- `https://api-dev.denilparmar.work`
- Certificate imported via `ShopFast-ApiCertificateArn`

## Deployment
```bash
npm install
cdk bootstrap
cdk deploy
