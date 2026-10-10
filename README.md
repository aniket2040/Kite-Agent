# 🪁 Kite Agent — Delightful AI & AWS Free Tier Suite

> An intuitive, responsive AI agent crafted for delight, with real-time streaming, warm persona guidance, and turnkey AWS Free Tier deployment blueprints ($0.00 / month).

---

## ✨ Features

- **Delightful Conversational Experience**:
  - Real-time token streaming with expandable reasoning process (SSE)
  - Friendly first-run onboarding with 4 instant mission starters
  - Proactive error recovery with plain-English diagnostics and 1-click retry
  - 4 customizable personas: **Kite Core**, **Kite Architect**, **Kite Mentor**, and **Kite Minimalist**
  - Zero-dependency Web Audio synthesizer completion chimes and text-to-speech reader
  - Keyboard command palette (`Cmd+K` / `Ctrl+K`)
- **AWS Free Tier Launchpad ($0.00 / month)**:
  - Interactive topology map (CloudFront, S3, API Gateway HTTP API, Lambda ARM64, DynamoDB, SSM)
  - Real-time Quota Guard calculator with traffic sliders and safety headroom indicators
  - Multi-format Infrastructure as Code (IaC) templates:
    - **AWS CDK v2 (TypeScript)**
    - **AWS SAM (YAML)**
    - **Terraform (HCL)**
    - **Node.js 22 ARM64 Lambda Handler**
    - **One-click Bash deploy script** (`deploy-freetier.sh`)
  - Clear breakdown and safeguards against the 4 hidden AWS billing traps (NAT Gateways, Secrets Manager, Provisioned Concurrency, indefinite logs)
  - Live in-browser Lambda test invocation simulator

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/aniket2040/Kite-Agent.git
cd Kite-Agent
npm install
```

### 2. Environment Configuration

Copy the example environment file and add your Gemini API Key:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY="your-gemini-api-key"` in `.env`.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploy to AWS Free Tier ($0.00 / month)

### Step 1: Store your API Key in SSM Parameter Store (100% Free Tier)
```bash
aws ssm put-parameter \
  --name "/kite-agent/gemini-api-key" \
  --type "SecureString" \
  --value "YOUR_GEMINI_API_KEY" \
  --region us-east-1
```

### Step 2: Build & Deploy via AWS CDK
```bash
npm run build
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1
npx cdk deploy --require-approval never
```

For full architecture details, service quotas, and cost breakdowns, see [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## 📄 License

Apache-2.0
