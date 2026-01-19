import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as path from 'path';

export class ShopfastApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    const stage = 'dev';
    super(scope, id, props);

    //#region Lambda Functions
    const createPaymentLambda = new lambda.Function(
      this,
      "CreatePaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.create_payment",
        code: lambda.Code.fromAsset(path.join(__dirname, '../../src')),
      },
    );

    const refundPaymentLambda = new lambda.Function(
      this,
      "RefundPaymentLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "handler.refund_payment",
        code: lambda.Code.fromAsset(path.join(__dirname, '../../src')),
      },
    );
    //#endregion


    //#region HTTP API Gateway
    const httpApi = new apigwv2.HttpApi(this, "ShopfastHttpApi", {
      apiName: 'shopfast-api',
    });


    const apiStage = new apigwv2.HttpStage(this, 'DevStage', {
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
    //#endregion

    //#region CustomDomain
    const certificateArn = cdk.Fn.importValue('ShopFast-ApiCertificateArn');
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      'ApiCertificate',
      certificateArn
    );

    const apiDomainName = new apigwv2.DomainName(this, 'CustomDomain', {
      domainName: 'api-dev.denilparmar.work',
      certificate: certificate,
    });

    new apigwv2.ApiMapping(this, 'ApiMapping', {
      api: httpApi,
      domainName: apiDomainName,
      stage: apiStage,
    });
  }
  //#endregion
}
