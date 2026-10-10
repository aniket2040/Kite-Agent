# Kite Agent — Comprehensive System Architecture & Documentation

> **A delightful, responsive AI agent architecture built for sub-second user interactions and turnkey deployment on AWS Free Tier services ($0.00/month).**

---

## 1. Executive Summary & Vision

### What Was Built
**Kite** is a full-stack, production-grade conversational AI agent application engineered around two core pillars:
1. **Delightful Human-Agent Interaction**: Eliminating conversational friction through warm onboarding, real-time reasoning transparency, instant optimistic feedback, customizable personas, speech synthesis, and proactive error recovery.
2. **Turnkey AWS Free Tier Deployment ($0.00 / month)**: A complete cloud deployment blueprint that packages the agent using AWS serverless primitives (Lambda, API Gateway HTTP API, S3, CloudFront, DynamoDB, SSM Parameter Store) strictly within AWS Free Tier allowances with zero billing surprises.

---

## 2. Who It Is For

| Target Audience | Primary Value & Use Case |
|---|---|
| **Full-Stack & Cloud Developers** | Jumpstart an AI agent project with production-ready Infrastructure as Code (AWS CDK TypeScript, SAM, Terraform, Lambda handlers) without setting up complex Kubernetes clusters or paying for idle servers. |
| **Startup Founders & Prototypers** | Ship an interactive AI assistant for users with verified **$0.00/month AWS hosting costs**, while providing enterprise-grade latency and high availability. |
| **Solutions Architects & DevOps** | Learn and reference best practices for avoiding common AWS billing traps (e.g., avoiding NAT Gateways, using SSM Parameter Store over Secrets Manager, ARM64 Graviton2 memory tuning). |
| **Students & AI Enthusiasts** | Explore how modern AI SDKs (`@google/genai` with `gemini-3.8-flash`) interact with server-sent events (SSE) and cloud serverless architectures. |

---

## 3. Key Capabilities & Features

### 3.1. The Delightful User Experience Suite
- **First-Run Onboarding Without Blank Pages**:
  - Immediately greets the user with 4 one-tap **Instant Mission Starters** (e.g., "Architect & Deploy to AWS Free Tier", "Break Down Complex Problem", "Lambda Memory Tuning", "Security Audit").
- **Live Streaming & Thought Stream Transparency**:
  - Employs Server-Sent Events (SSE) from the Express backend.
  - Features an expandable **Thought Process Accordion** showing the agent's step-by-step reasoning (e.g., "Checking AWS Free Tier constraints... Reviewing IAM policies... Synthesizing answer").
- **Proactive Error Recovery**:
  - If a network glitch or token limit occurs, Kite does not show cryptic `500 Internal Error` codes.
  - A friendly recovery box explains the situation in plain English, preserves the user's prompt, and offers a **1-click retry** and offline diagnostic fallback.
- **Dynamic Contextual Follow-Up Suggestions**:
  - Automatically parses the generated response to generate 3 intelligent follow-up prompt chips (e.g., "Open AWS Free Tier Launchpad", "Show CDK TypeScript Blueprint", "Audit Cost Traps").
- **Customizable Personas**:
  - **Kite Core**: Balanced, crisp, warm, proactive partner.
  - **Kite Architect**: Senior AWS cloud architect obsessed with zero-cost guardrails and IAM least-privilege.
  - **Kite Mentor**: Encouraging, pedagogical guide using intuitive mental models.
  - **Kite Minimalist**: Laser-focused bullet points with zero preamble.
- **Audio & Haptic Feedback**:
  - Built-in zero-dependency Web Audio synthesizer chime on response completion.
  - Integrated Text-to-Speech (TTS) speaker to read responses aloud.
  - Command Palette (`Cmd+K` / `Ctrl+K`) for keyboard navigation.

### 3.2. AWS Free Tier Launchpad & Guard
- **Interactive Topology Map**: Clickable diagram of AWS services showing exact configurations and free tier rules.
- **Real-Time Quota Calculator**: Sliders for active monthly users and requests per user that compute utilization against AWS Free Tier limits and project the estimated bill: **$0.00 / month**.
- **Multi-Format IaC Generator**:
  - **AWS CDK v2 (TypeScript)**: `KiteAgentFreeTierStack.ts`
  - **AWS SAM (YAML)**: `template.yaml`
  - **Terraform (HCL)**: `main.tf`
  - **Lambda Handler (Node.js 22 ARM64)**: `index.mjs`
  - **1-Click CLI Script**: `deploy-freetier.sh`
- **Cost Trap Safeguards**: Step-by-step prevention for NAT Gateways ($32.40/mo), Secrets Manager ($0.40/secret/mo), and provisioned concurrency.
- **Simulated Test Invocator**: Interactive terminal inside the UI to test execution latencies and verify zero-cost billing status.

---

## 4. How It Was Built: System Architecture

### 4.1. Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE (/api/agent/chat)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express Backend Layer                    │
│  Vite Middlewares + tsx + @google/genai SDK (gemini-3.8-flash)│
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  Gemini AI Reasoning Engine  │   │   AWS Free Tier Cloud Target │
│  (gemini-3.8-flash model)    │   │  Lambda + S3 + CloudFront +  │
│  Server-side API key access  │   │  DynamoDB + SSM Param Store  │
└──────────────────────────────┘   └──────────────────────────────┘
```

### 4.2. Frontend Architecture
- **Framework**: React 19 (SPA) with Vite.
- **Styling**: Tailwind CSS v4 using the modern `@import "tailwindcss";` engine.
- **Audio Synthesis**: Pure Web Audio API oscillators for pleasant micro-chimes (no external audio files required).
- **Text-to-Speech**: Browser `window.speechSynthesis` with Markdown cleanup.
- **State Management**: React state with `localStorage` persistence for conversation history, active persona, sound preferences, and custom directives.
- **Markdown & Code Rendering**: Custom `MarkdownRenderer` with code block syntax labeling and 1-click clipboard copying.

### 4.3. Backend Architecture
- **Entry Point**: `server.ts` running Express.
- **Development Server**: Mounts `vite.middlewares` in development mode for instantaneous HMR and asset serving on port 3000.
- **AI Integration**: Implements `@google/genai` TypeScript SDK with model `gemini-3.8-flash`:
  - `User-Agent: aistudio-build` telemetry header configured.
  - Streaming SSE endpoint (`/api/agent/chat`) with chunked responses.
  - Resilient local fallback engine if `GEMINI_API_KEY` is not populated or network is interrupted.
- **Quota Calculation API**: `/api/aws/calculate-limits` for calculating utilization against AWS service limits.

---

## 5. AWS Services & Free Tier Breakdown

The application is engineered to map 1:1 with AWS Always Free and 12-Month Free Tier limits:

| AWS Service | Architectural Role | Free Tier Quota | Why It Incurs $0.00 |
|---|---|---|---|
| **AWS Lambda** | Serverless compute running agent execution and AI streaming | **1,000,000 requests / month** + **3,200,000 compute-seconds / month** (Always Free) | Configured with 256MB memory on ARM64 Graviton2. 25,000 monthly requests consume only 2.5% of the free quota. |
| **Amazon API Gateway** | HTTP API routing `/api/*` to Lambda with CORS | **1,000,000 API calls / month** (12 Months Free) | Uses **HTTP API** instead of REST API (saves 70% cost after free tier and includes built-in CORS). |
| **Amazon CloudFront** | Global Content Delivery Network (CDN) with HTTPS | **1 TB Data Transfer Out / month** + **10,000,000 HTTPS requests / month** (Always Free) | Caches static assets (HTML/JS/CSS) at the edge, reducing S3 and API Gateway hits. |
| **Amazon S3** | Static web asset storage behind CloudFront | **5 GB Standard Storage** + 20,000 GET + 2,000 PUT requests / month (12 Months Free) | Web build is under 5MB. Protected via Origin Access Control (OAC) with public access blocked. |
| **Amazon DynamoDB** | Conversation history & session memory store | **25 GB Storage** + **25 RCU + 25 WCU** (Always Free forever) | Configured with `PAY_PER_REQUEST` billing or provisioned 5 RCU/WCU, with TTL enabled for auto-cleanup. |
| **AWS SSM Parameter Store** | Secret storage for `GEMINI_API_KEY` | **10,000 Standard Parameters** + Unlimited API calls (Always Free forever) | **Zero cost alternative to AWS Secrets Manager** (which charges $0.40/secret/month). |
| **Amazon CloudWatch** | Operational alarms & execution logging | **10 Metric Alarms** + **5 GB Log Ingestion** (Always Free) | Zero-cost billing alarm set to alert before approaching 1M Lambda invocations. Log retention set to 7 days. |

---

## 6. The 4 Cost Traps to Avoid in AWS Free Tier

1. **The AWS NAT Gateway Trap ($32.40/month flat fee)**:
   - *The Danger*: Placing Lambda inside a private VPC requires a NAT Gateway to reach external APIs (like Gemini), incurring ~$32/month even with zero traffic.
   - *The Fix*: Keep the agent Lambda in default AWS serverless mode without a custom VPC. Lambda securely calls external APIs directly over HTTPS with zero infrastructure charges.
2. **The AWS Secrets Manager Trap ($0.40/secret/month)**:
   - *The Danger*: AWS Secrets Manager charges $0.40 per secret per month plus API call fees.
   - *The Fix*: Use **AWS Systems Manager (SSM) Parameter Store** (Type: `SecureString`). Standard SSM parameters are **100% free** with zero monthly maintenance fee.
3. **Provisioned Concurrency Trap**:
   - *The Danger*: Pre-warming Lambda instances charges continuously 24/7.
   - *The Fix*: Rely on Node.js 22 + ARM64 Graviton2, which achieves cold-start latencies under 200ms without paying for provisioned instances.
4. **Indefinite CloudWatch Logs**:
   - *The Danger*: Default CloudWatch log groups never expire, eventually exceeding the 5GB free tier.
   - *The Fix*: Set `retentionInDays: 7` in the CDK/SAM templates.

---

## 7. Step-by-Step Deployment Instructions

### Prerequisites
- AWS CLI configured (`aws configure` with an active AWS account)
- Node.js 20+ and npm installed

### Quick Deploy via Bash Script (Recommended)
```bash
# Make the deployment script executable and run
chmod +x deploy-freetier.sh
./deploy-freetier.sh
```

### Manual Deployment via AWS CDK (TypeScript)
```bash
# 1. Store your Gemini API Key in SSM Parameter Store (100% Free)
aws ssm put-parameter \
  --name "/kite-agent/gemini-api-key" \
  --type "SecureString" \
  --value "YOUR_GEMINI_API_KEY" \
  --region us-east-1

# 2. Install dependencies & build
npm install
npm run build

# 3. Bootstrap CDK (first time only)
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1

# 4. Deploy the Free Tier Stack
npx cdk deploy --require-approval never
```

---

## 8. Summary
Kite demonstrates that building an AI agent people love does not require complex infrastructure or recurring cloud bills. By pairing human-centered UX design with carefully selected AWS Free Tier primitives, developers can launch responsive, resilient AI applications at **$0.00/month**.
