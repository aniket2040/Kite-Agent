import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class KiteAgentFreeTierStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table (Always Free: 25GB Storage + 25 RCU/WCU)
    const stateTable = new dynamodb.Table(this, 'KiteAgentState', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Zero cost when idle
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // 2. AWS Lambda Function (Always Free: 1M invocations/mo + 3.2M compute-seconds)
    const backendDir = path.resolve(__dirname, '../backend');
    const agentLambda = new lambda.Function(this, 'KiteAgentHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(backendDir),
      architecture: lambda.Architecture.ARM_64, // Graviton2: 20% cheaper & faster
      memorySize: 256, // Optimal memory within free-tier budget
      timeout: cdk.Duration.seconds(30),
      environment: {
        GEMINI_API_KEY_SSM: '/kite-agent/gemini-api-key',
        STATE_TABLE_NAME: stateTable.tableName,
        NODE_ENV: 'production',
      },
    });

    // Grant SSM parameter and DynamoDB read permissions
    agentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/kite-agent/gemini-api-key`,
        ],
      })
    );
    stateTable.grantReadWriteData(agentLambda);

    // 3. Amazon API Gateway HTTP API (12 Months Free: 1M calls/mo)
    const httpApi = new apigwv2.HttpApi(this, 'KiteAgentHttpApi', {
      apiName: 'KiteAgentHttpApi',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'AgentIntegration',
      agentLambda
    );

    httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // 4. Static Hosting: S3 + CloudFront (Always Free: 1TB transfer out + 10M HTTPS requests)
    const websiteBucket = new s3.Bucket(this, 'KiteAgentWebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution with Origin Access Control (OAC)
    const distribution = new cloudfront.Distribution(this, 'KiteAgentDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(
            `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy dist files to S3 if dist/ exists
    const distDir = path.resolve(__dirname, '../dist');
    if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
      new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset(distDir)],
        destinationBucket: websiteBucket,
        distribution,
        distributionPaths: ['/*'],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'AppUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Your Kite Agent CloudFront URL (HTTPS, 100% Free Tier)',
    });

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: httpApi.url || '',
      description: 'Direct API Gateway endpoint',
    });
  }
}
