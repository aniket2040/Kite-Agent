# Kite Agent — AWS Free Tier Deployment Guide

> **A comprehensive reference guide detailing how Kite Agent is deployed to Amazon Web Services (AWS) using 100% Free Tier serverless primitives.**

---

## 1. Architectural Overview & Request Flow

```
                                  [ User Browser ]
                                         │
                                         ▼ HTTPS
                          ┌──────────────────────────────┐
                          │   Amazon CloudFront (CDN)    │
                          │   (Global Edge Caches)       │
                          └──────────────┬───────────────┘
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  │ Path: /* (Static Assets)                    │ Path: /api/* (API Traffic)
                  ▼                                             ▼
       ┌──────────────────────┐                    ┌───────────────────────────┐
       │   Amazon S3 Bucket   │                    │  API Gateway (HTTP API)   │
       │ (React 19 SPA Build) │                    │ (Low Latency + CORS)      │
       └──────────────────────┘                    └─────────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                   ┌───────────────────────────┐
                                                   │     AWS Lambda (ARM64)    │
                                                   │    (Node.js 22 Runtime)   │
                                                   └──────┬─────────────┬──────┘
                                                          │             │
                                            Get Parameter │             │ Read / Write
                                                          ▼             ▼
                                                ┌─────────────┐   ┌─────────────┐
                                                │   AWS SSM   │   │   Amazon    │
                                                │  ParamStore │   │  DynamoDB   │
                                                │ (API Key)   │   │  (Sessions) │
                                                └─────────────┘   └─────────────┘
                                                          │
                                                          ▼ External HTTPS
                                                ┌───────────────────────┐
                                                │ Google Gemini API     │
                                                │ (gemini-3.8-flash)    │
                                                └───────────────────────┘
```

---

## 2. AWS Services Used & Free Tier Breakdown

| AWS Service | Component Role | Free Tier Quota | Why Cost is $0.00 / month |
|---|---|---|---|
| **AWS Lambda** | Executes agent reasoning, API routing, and AI responses | **1,000,000 requests/month** + **3.2M compute-seconds/month** (Always Free) | Configured with 256MB on ARM64 Graviton2. 25,000 requests use only ~2.5% of the monthly free allowance. |
| **Amazon API Gateway** | HTTP API routing `/api/*` requests to Lambda with CORS | **1,000,000 calls/month** (12 Months Free) | Uses **HTTP API** instead of REST API, saving 70% in data costs and avoiding NAT gateways. |
| **Amazon CloudFront** | CDN providing SSL/HTTPS and global edge caching | **1 TB Data Transfer Out/month** + **10,000,000 HTTPS requests/month** (Always Free) | Caches static assets (HTML/JS/CSS) at edge servers worldwide, offloading traffic from S3. |
| **Amazon S3** | Stores the production React 19 single-page app bundle | **5 GB Standard Storage** + 20,000 GET requests (12 Months Free) | Static frontend files are under 5MB. Protected behind Origin Access Control (OAC) with public access blocked. |
| **Amazon DynamoDB** | Stores conversation state and session history | **25 GB Storage** + **25 RCU + 25 WCU** (Always Free forever) | Set to `PAY_PER_REQUEST` billing with automated TTL attribute for auto-expiring old conversations. |
| **AWS SSM Parameter Store** | Securely stores the `GEMINI_API_KEY` | **10,000 Standard Parameters** + Unlimited API calls (Always Free forever) | **Zero-cost alternative to AWS Secrets Manager** (which charges $0.40/month per secret). |

---

## 3. Step-by-Step Deployment (AWS CloudShell)

### Step 1: Open AWS CloudShell
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Set your region to **US East (N. Virginia) `us-east-1`**.
3. Click the terminal icon **`>_`** (CloudShell) at the top of the console.

### Step 2: Store Your Gemini API Key in SSM (100% Free)
Run this command to save your key securely without using Secrets Manager:
```bash
aws ssm put-parameter \
  --name "/kite-agent/gemini-api-key" \
  --type "SecureString" \
  --value "YOUR_GEMINI_API_KEY" \
  --description "Gemini key for Kite Agent (Zero Cost)" \
  --region us-east-1
```

### Step 3: Clone the Repository & Install Dependencies
```bash
git clone https://github.com/aniket2040/Kite-Agent.git
cd Kite-Agent
npm install
```

### Step 4: Build the Production Frontend
```bash
npm run build
```
*(This bundles the React 19 frontend into the `dist/` directory).*

### Step 5: Bootstrap & Deploy via AWS CDK
1. **Bootstrap CDK** (only required once per AWS account/region):
```bash
npx cdk bootstrap
```

2. **Deploy the stack**:
```bash
npx cdk deploy --require-approval never
```

---

## 4. What Happens During Deployment

When you run `npx cdk deploy`, AWS CloudFormation automatically executes the following:
1. **S3 Bucket Creation**: Provisions `KiteAgentWebBucket` with Origin Access Control (OAC).
2. **Asset Upload**: Automatically copies the `dist/` files to the S3 bucket.
3. **Lambda Packaging**: Packages `backend/index.mjs` into an ARM64 Graviton2 Lambda function.
4. **IAM Role Assignment**: Attaches least-privilege IAM policies allowing Lambda to read `/kite-agent/gemini-api-key` from SSM.
5. **API Gateway Provisioning**: Creates an HTTP API with CORS enabled for `/api/*` endpoints.
6. **CloudFront Distribution**: Configures an edge distribution that routes `/` to S3 and `/api/*` to API Gateway over HTTPS.
7. **DynamoDB Table**: Creates `KiteAgentState` with pay-per-request billing and TTL support.

---

## 5. Outputs & Verification

At the end of the deployment, CloudFormation displays your live URLs:
```text
Outputs:
KiteAgentFreeTierStack.AppUrl = https://d111111abcdef8.cloudfront.net
KiteAgentFreeTierStack.HttpApiEndpoint = https://abcdef123.execute-api.us-east-1.amazonaws.com
```

- Navigate to the **`AppUrl`** in any browser to interact with your live Kite Agent.
- Test sending a message to verify that Lambda and Gemini are responding properly.

---

## 6. The 4 Cost Traps to Avoid

1. **No NAT Gateways**: Do not place the Lambda in a custom private VPC. In serverless mode, Lambda connects directly to external APIs with $0 infrastructure charges.
2. **SSM over Secrets Manager**: Always use SSM Parameter Store. Secrets Manager costs $0.40/month per secret.
3. **No Provisioned Concurrency**: ARM64 Graviton2 cold starts are under 200ms, making expensive provisioned instances unnecessary.
4. **Log Retention**: CloudWatch logs auto-expire after 7 days, preventing log ingestion from exceeding the 5 GB free tier.

---

## 7. Teardown / Cleanup

If you ever wish to delete all AWS resources created by the project with a single command:
```bash
npx cdk destroy
```
*(This cleanly removes CloudFront, S3, Lambda, API Gateway, and DynamoDB).*
