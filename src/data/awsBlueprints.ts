import { AwsServiceTier } from '../types';

export const AWS_FREE_TIER_SERVICES: AwsServiceTier[] = [
  {
    id: 'lambda',
    name: 'AWS Lambda (Compute)',
    category: 'compute',
    freeLimit: '1,000,000 requests / mo + 3.2M compute sec',
    freeType: 'Always Free',
    unit: 'Requests',
    currentEstimatedUsage: 25000,
    maxLimit: 1000000,
    keyRule: 'Configure 256MB ARM64 Graviton2 for 20% lower cost per compute-second and fast cold-starts.',
    costRisk: 'Zero',
  },
  {
    id: 'apigateway',
    name: 'Amazon API Gateway HTTP API',
    category: 'api',
    freeLimit: '1,000,000 API calls / mo',
    freeType: '12 Months Free',
    unit: 'API Invocations',
    currentEstimatedUsage: 25000,
    maxLimit: 1000000,
    keyRule: 'Select HTTP API (not REST API). HTTP APIs cost $1.00/M vs $3.50/M for REST after free tier and have native CORS.',
    costRisk: 'Zero',
  },
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront (CDN)',
    category: 'cdn',
    freeLimit: '1 TB Data Transfer Out + 10M HTTPS requests / mo',
    freeType: 'Always Free',
    unit: 'GB Transfer',
    currentEstimatedUsage: 2.4,
    maxLimit: 1024,
    keyRule: 'Always Free tier includes 1TB data transfer and 10,000,000 HTTPS requests forever. Cache frontend assets.',
    costRisk: 'Zero',
  },
  {
    id: 's3',
    name: 'Amazon S3 (Web & Storage)',
    category: 'storage',
    freeLimit: '5 GB Standard Storage + 20,000 GET + 2,000 PUT',
    freeType: '12 Months Free',
    unit: 'GB Storage',
    currentEstimatedUsage: 0.15,
    maxLimit: 5,
    keyRule: 'Keep frontend bundle < 15MB. S3 acts as the CloudFront origin behind Origin Access Control (OAC).',
    costRisk: 'Zero',
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB (Memory/State)',
    category: 'database',
    freeLimit: '25 GB Storage + 25 RCU + 25 WCU',
    freeType: 'Always Free',
    unit: 'GB Storage',
    currentEstimatedUsage: 0.05,
    maxLimit: 25,
    keyRule: 'Provisioned 25 RCU / 25 WCU or On-Demand with low traffic is 100% free forever.',
    costRisk: 'Zero',
  },
  {
    id: 'ssm',
    name: 'AWS SSM Parameter Store (Secrets)',
    category: 'security',
    freeLimit: 'Standard parameters: 10,000 params, Unlimited API calls',
    freeType: 'Always Free',
    unit: 'Parameters',
    currentEstimatedUsage: 1,
    maxLimit: 10000,
    keyRule: 'CRITICAL: Never use AWS Secrets Manager ($0.40/secret/month). Standard SSM Parameter Store is 100% free.',
    costRisk: 'Zero',
  },
];

export const COST_TRAPS_TO_AVOID = [
  {
    trap: 'AWS NAT Gateway',
    cost: '~$32.40 / month flat + data transfer',
    prevention: 'Do not place your Lambda in a custom private VPC unless strictly necessary. Lambda in standard serverless mode connects directly to external APIs without a NAT Gateway.',
  },
  {
    trap: 'AWS Secrets Manager',
    cost: '$0.40 per secret / month + $0.05 per 10k API calls',
    prevention: 'Store GEMINI_API_KEY as an SSM Parameter (Type: SecureString). Standard SSM parameters have zero monthly fee and zero API call charges within standard throughput.',
  },
  {
    trap: 'Provisioned Concurrency for Lambda',
    cost: 'Billed continuously per memory/hour even when idle',
    prevention: 'Keep Provisioned Concurrency OFF. Node.js 22 + ARM64 has sub-200ms cold starts, making cold-start pre-warming unnecessary for web agents.',
  },
  {
    trap: 'Unbudgeted CloudWatch Metrics & Logs',
    cost: '$0.50/GB log ingestion after 5GB free',
    prevention: 'Set Lambda log retention to 7 days or 14 days instead of "Never Expire". CloudWatch free tier gives you 5GB ingestion and 10 metric alarms free.',
  },
];

export const AWS_CDK_BLUEPRINT = `// ============================================================================
// Kite Agent — AWS Free Tier Serverless Infrastructure (AWS CDK v2 in TypeScript)
// 100% Free Tier Eligible: Lambda (ARM64) + HTTP API + S3 + CloudFront + DynamoDB + SSM
// ============================================================================

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class KiteAgentFreeTierStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Secret Configuration (SSM Parameter Store — 100% FREE, no $0.40 Secrets Manager fee)
    const geminiKeyParam = ssm.StringParameter.fromStringParameterName(
      this,
      'GeminiKeyParam',
      '/kite-agent/gemini-api-key'
    );

    // 2. DynamoDB Conversation State (Always Free Tier: 25GB, 25 RCU / 25 WCU free forever)
    const stateTable = new dynamodb.Table(this, 'KiteAgentStateTable', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Zero cost when idle
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // 3. AWS Lambda Function (Always Free: 1M invocations + 3.2M compute-seconds)
    const agentLambda = new lambda.Function(this, 'KiteAgentHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend-dist'),
      architecture: lambda.Architecture.ARM_64, // Graviton2: 20% cheaper & faster
      memorySize: 256, // Optimal memory for Node.js 22 within free compute budget
      timeout: cdk.Duration.seconds(30),
      environment: {
        GEMINI_API_KEY_SSM: geminiKeyParam.parameterName,
        STATE_TABLE_NAME: stateTable.tableName,
        NODE_ENV: 'production',
      },
    });

    // Grant permissions
    geminiKeyParam.grantRead(agentLambda);
    stateTable.grantReadWriteData(agentLambda);

    // 4. Amazon API Gateway HTTP API (12 Months Free: 1,000,000 calls / month)
    const httpApi = new apigwv2.HttpApi(this, 'KiteAgentHttpApi', {
      apiName: 'KiteAgentApi',
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

    // 5. Static Web App Hosting (S3 + CloudFront — 1TB data transfer free forever)
    const webBucket = new s3.Bucket(this, 'KiteAgentWebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution with Origin Access Control (OAC)
    const distribution = new cloudfront.Distribution(this, 'KiteAgentDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(\`\${httpApi.httpApiId}.execute-api.\${this.region}.amazonaws.com\`),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: 'index.html',
    });

    // 6. Free Tier Safety Alarm (Zero-cost CloudWatch monitoring)
    new cloudwatch.Alarm(this, 'FreeTierSafetyAlarm', {
      metric: agentLambda.metricInvocations({
        period: cdk.Duration.days(1),
      }),
      threshold: 30000, // Warn if daily invocations pace exceeds 1M/mo
      evaluationPeriods: 1,
      alarmDescription: 'Alerts if Lambda invocations pace threatens the 1M Free Tier limit',
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'AppUrl', {
      value: \`https://\${distribution.distributionDomainName}\`,
      description: 'Public URL of your Kite Agent on CloudFront (HTTPS, 100% Free Tier)',
    });
    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: httpApi.url || '',
      description: 'Direct API Gateway endpoint',
    });
  }
}
`;

export const AWS_SAM_BLUEPRINT = `# ============================================================================
# Kite Agent — AWS SAM Template (Serverless Application Model)
# 100% AWS Free Tier Compliant
# ============================================================================
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Kite Agent Serverless Backend on AWS Free Tier (ARM64 Lambda + HTTP API + DynamoDB)

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: nodejs22.x
    Architectures:
      - arm64 # Graviton2 Free Tier
    Environment:
      Variables:
        TABLE_NAME: !Ref AgentStateTable
        GEMINI_API_KEY_SSM: /kite-agent/gemini-api-key

Resources:
  # 1. State Table (DynamoDB Free Tier: 25GB, 25 WCU/RCU)
  AgentStateTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: kite-agent-state
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: sessionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: sessionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE

  # 2. Agent Lambda Function (1M requests/mo free forever)
  AgentFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./backend-dist
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref AgentStateTable
        - SSMParameterReadPolicy:
            ParameterName: kite-agent/gemini-api-key
      Events:
        ChatApi:
          Type: HttpApi
          Properties:
            Path: /api/{proxy+}
            Method: ANY

  # 3. HTTP API with built-in CORS
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      CorsConfiguration:
        AllowMethods:
          - GET
          - POST
          - OPTIONS
        AllowHeaders:
          - '*'
        AllowOrigins:
          - '*'

Outputs:
  ApiUrl:
    Description: HTTP API Gateway URL
    Value: !Sub 'https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com'
`;

export const TERRAFORM_BLUEPRINT = `# ============================================================================
# Kite Agent — Terraform Configuration for AWS Free Tier
# Zero-cost infrastructure setup: S3 + CloudFront + Lambda + API Gateway
# ============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# 1. SSM Parameter for Gemini API Key (100% Free Tier, zero cost)
resource "aws_ssm_parameter" "gemini_key" {
  name        = "/kite-agent/gemini-api-key"
  description = "Gemini API Key for Kite Agent"
  type        = "SecureString"
  value       = "CHANGE_ME"
  lifecycle {
    ignore_changes = [value]
  }
}

# 2. DynamoDB Table (Pay-per-request, 25GB free tier forever)
resource "aws_dynamodb_table" "agent_state" {
  name         = "kite-agent-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"
  range_key    = "timestamp"

  attribute {
    name = "sessionId"
    type = "S"
  }
  attribute {
    name = "timestamp"
    type = "N"
  }
}

# 3. IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "kite-agent-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 4. Lambda Function (ARM64 Graviton2, 256MB memory)
resource "aws_lambda_function" "kite_agent" {
  function_name = "kite-agent-handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 256
  timeout       = 30
  role          = aws_iam_role.lambda_exec.arn
  filename      = "lambda_payload.zip"

  environment {
    variables = {
      GEMINI_API_KEY_SSM = aws_ssm_parameter.gemini_key.name
      TABLE_NAME         = aws_dynamodb_table.agent_state.name
    }
  }
}

# 5. API Gateway HTTP API
resource "aws_apigatewayv2_api" "http_api" {
  name          = "kite-agent-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}
`;

export const LAMBDA_HANDLER_BLUEPRINT = `// ============================================================================
// Kite Agent — AWS Lambda Node.js 22 Handler (ARM64 Graviton2)
// Designed for response streaming and minimal memory footprint
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

let cachedApiKey: string | null = null;
const ssmClient = new SSMClient({});

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const paramName = process.env.GEMINI_API_KEY_SSM || '/kite-agent/gemini-api-key';
  const command = new GetParameterCommand({ Name: paramName, WithDecryption: true });
  const result = await ssmClient.send(command);
  cachedApiKey = result.Parameter?.Value || process.env.GEMINI_API_KEY || '';
  return cachedApiKey;
}

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };

  // Handle preflight CORS
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { messages = [], persona = 'kite-core' } = body;
    const apiKey = await getApiKey();

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          text: "Hello! I'm Kite. Configure /kite-agent/gemini-api-key in SSM Parameter Store to enable full AI responses.",
        }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: "You are Kite, an agile, delightful AI partner running on AWS Free Tier.",
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: response.text,
        metrics: {
          runtime: 'AWS Lambda (Node.js 22 ARM64)',
          freeTierCost: '$0.00',
        },
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || 'Internal Lambda Error',
        recovery: 'Check CloudWatch Logs and SSM Parameter permissions.',
      }),
    };
  }
};
`;

export const BASH_DEPLOY_SCRIPT = `#!/usr/bin/env bash
# ============================================================================
# Kite Agent — 1-Click AWS Free Tier Deployment Script
# Provisions zero-cost resources: SSM, S3, CloudFront, Lambda, API Gateway
# ============================================================================

set -euo pipefail

echo "========================================================"
echo "🪁 Kite Agent — AWS Free Tier Deployment Assistant"
echo "========================================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed."
    echo "👉 Install with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Verify AWS credentials
echo "🔍 Validating AWS credentials..."
CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null || true)
if [ -z "$CALLER_IDENTITY" ]; then
    echo "❌ AWS credentials not detected. Run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
REGION=\${AWS_REGION:-us-east-1}
echo "✅ Authenticated as Account: $ACCOUNT_ID (Region: $REGION)"

# 1. Ensure SSM Parameter Store (100% Free Tier)
PARAM_NAME="/kite-agent/gemini-api-key"
echo "🔐 Checking SSM Parameter for Gemini API Key ($PARAM_NAME)..."
if ! aws ssm get-parameter --name "$PARAM_NAME" --region "$REGION" &>/dev/null; then
    read -rsp "Enter your GEMINI_API_KEY to store safely in AWS SSM (Free Tier): " GEMINI_KEY
    echo ""
    aws ssm put-parameter \\
      --name "$PARAM_NAME" \\
      --type "SecureString" \\
      --value "$GEMINI_KEY" \\
      --description "Kite Agent Gemini Key (Zero-cost SSM)" \\
      --region "$REGION"
    echo "✅ SSM Parameter created successfully."
else
    echo "✅ SSM Parameter already exists."
fi

# 2. Build Frontend and Lambda
echo "📦 Building client and server assets..."
npm run build

# 3. Deploy via AWS CDK
echo "🚀 Deploying stack to AWS Free Tier..."
npx cdk bootstrap "aws://$ACCOUNT_ID/$REGION" || true
npx cdk deploy --require-approval never

echo ""
echo "🎉 Congratulations! Your Kite Agent is live on AWS Free Tier."
echo "💡 Expected monthly cost: $0.00 (within 1M Lambda reqs, 1TB CloudFront, 25GB DynamoDB)."
`;
