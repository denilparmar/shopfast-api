import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class ShopfastApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ------------------------
    // Python Lambda functions
    // ------------------------
    const createPaymentLambda = new lambda.Function(
      this,
      "CreatePaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.create_payment",
        code: lambda.Code.fromAsset("src"),
      },
    );

    const refundPaymentLambda = new lambda.Function(
      this,
      "RefundPaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.refund_payment",
        code: lambda.Code.fromAsset("src"),
      },
    );

    // ------------------------
    // HTTP API Gateway
    // ------------------------
    const httpApi = new apigwv2.HttpApi(this, "ShopfastHttpApi");

    // ------------------------
    // Routes
    // ------------------------
    httpApi.addRoutes({
      path: "/payments/create",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "CreatePaymentIntegration",
        createPaymentLambda,
      )
    });

    httpApi.addRoutes({
      path: "/payments/refund",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "RefundPaymentIntegration",
        refundPaymentLambda,
      )
    });

    // ------------------------
    // Output API endpoint
    // ------------------------
    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API URL for Shopfast API",
    });
  }
}
