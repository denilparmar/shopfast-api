import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as path from "path";

export class ShopfastApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    const stage = "dev";
    super(scope, id, props);

    //#region Lambda Functions
    const createPaymentLambda = new lambda.Function(
      this,
      "CreatePaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.create_payment",
        memorySize: 512,
        timeout: cdk.Duration.seconds(15),
        code: lambda.Code.fromAsset(path.join(__dirname, "../../src")),
        environment: {
          PAYMENTS_TABLE_NAME: cdk.Fn.importValue("ShopFast-PaymentsTableName"),
          STRIPE_SECRET_ARN: cdk.Fn.importValue("ShopFast-StripeSecretArn")
        },
      },
    );

    const refundPaymentLambda = new lambda.Function(
      this,
      "RefundPaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.refund_payment",
        memorySize: 512,
        timeout: cdk.Duration.seconds(15),
        code: lambda.Code.fromAsset(path.join(__dirname, "../../src")),
        environment: {
          PAYMENTS_TABLE_NAME: cdk.Fn.importValue("ShopFast-PaymentsTableName"),
          STRIPE_SECRET_ARN: cdk.Fn.importValue("ShopFast-StripeSecretArn")
        },
      },
    );

    const stripeWebhooksLambda = new lambda.Function(
      this,
      "StripeWebhooksLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.stripeWebhooks",
        memorySize: 512,
        timeout: cdk.Duration.seconds(15),
        code: lambda.Code.fromAsset(path.join(__dirname, "../../src")),
        environment: {
          PAYMENTS_TABLE_NAME: cdk.Fn.importValue("ShopFast-PaymentsTableName"),
          STRIPE_SECRET_ARN: cdk.Fn.importValue("ShopFast-StripeSecretArn")
        },
      },
    );

    //#endregion

    //#region API Gateway Cognito Authorizer
    const userPoolId = cdk.Fn.importValue("ShopFast-UserPoolId");
    const userPoolClientId = cdk.Fn.importValue("ShopFast-UserPoolClientIdA");
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      userPoolId,
    );
    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      "ImportedClient",
      userPoolClientId,
    );

    const cognitoAuthorizer = new authorizers.HttpUserPoolAuthorizer(
      "ShopfastAPICognitoAuthorizer",
      userPool,
      {
        userPoolClients: [userPoolClient],
        authorizerName: "ShopfastAPICognitoAuthorizer",
        identitySource: ["$request.header.Authorization"],
      },
    );
    //#endregion

    //#region HTTP API Gateway
    const httpApi = new apigwv2.HttpApi(this, "ShopfastHttpApi", {
      apiName: "shopfast-api",
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'X-Amz-Date', 'X-Api-Key'],
        allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.HEAD, apigwv2.CorsHttpMethod.OPTIONS, apigwv2.CorsHttpMethod.POST],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(10),
      },
    });

    const apiStage = new apigwv2.HttpStage(this, "DevStage", {
      httpApi: httpApi,
      stageName: stage,
      autoDeploy: true,
    });

    httpApi.addRoutes({
      path: "/payments/create",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "CreatePaymentIntegration",
        createPaymentLambda,
      ),
      authorizer: cognitoAuthorizer,
      authorizationScopes: ["payment-service/payments.create"],
    });

    httpApi.addRoutes({
      path: "/payments/refund",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "RefundPaymentIntegration",
        refundPaymentLambda,
      ),
      authorizer: cognitoAuthorizer,
      authorizationScopes: ["payment-service/payments.refund"],
    });

    httpApi.addRoutes({
      path: "/payments/stripe-webhooks",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "StripeWebhooksLambda",
        stripeWebhooksLambda,
      )
    });

    new cdk.aws_wafv2.CfnWebACLAssociation(this, 'MyWebAclAssociation', {
      webAclArn: cdk.Fn.importValue('WebACLArn'),
      resourceArn: `arn:aws:apigateway:${this.region}::/apis/${httpApi.apiId}/stages/${stage}`
    })


    //#endregion

    //#region CustomDomain For API
    const certificateArn = cdk.Fn.importValue("ShopFast-ApiCertificateArn");
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "ApiCertificate",
      certificateArn,
    );

    const apiDomainName = new apigwv2.DomainName(this, "CustomDomain", {
      domainName: "api-dev.denilparmar.work",
      certificate: certificate,
    });

    new apigwv2.ApiMapping(this, "ApiMapping", {
      api: httpApi,
      domainName: apiDomainName,
      stage: apiStage,
    });
    //#endregion

    //#region DynamoDB Permissions
    const paymentsTable = dynamodb.Table.fromTableArn(
      this,
      "ImportedPaymentsTable",
      cdk.Fn.importValue("ShopFast-PaymentsTableArn"),
    );
    paymentsTable.grantReadWriteData(createPaymentLambda);
    paymentsTable.grantReadWriteData(refundPaymentLambda);
    //#endregion

    //#region Stripe Secret Key
    const stripeSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "StripeSecret",
      cdk.Fn.importValue("ShopFast-StripeSecretArn"),
    );

    stripeSecret.grantRead(createPaymentLambda);
    stripeSecret.grantRead(refundPaymentLambda);
    //#endregion
  }
}
