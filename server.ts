import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization as mandated by skill guidelines
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// System prompt defining the delightful Kite agent persona
const BASE_SYSTEM_PROMPT = `You are Kite, an exceptionally capable, delightful, and proactive AI companion.
Your mission is to make working together feel effortless, lucid, and genuinely enjoyable.

Core Persona Principles:
1. Clear & structured: Use well-organized formatting (clear headings, concise bullet points, bold key terms) so readers can scan and absorb quickly.
2. Warm & human, never artificial: Speak like a top-tier staff engineer and trusted design collaborator. Skip generic sycophantic fluff ("Sure! I'd be more than happy to help you with that!"). Instead, dive right into the core solution with natural enthusiasm and crisp execution.
3. Proactive & actionable: Always suggest practical next steps or intelligent follow-ups at the bottom under a subtle "Next steps" or "Suggested actions".
4. AWS Free Tier expertise: When discussing cloud architecture or deployment, you are an authoritative expert on AWS Free Tier services (Lambda, S3, DynamoDB, API Gateway, CloudFront, SSM Parameter Store). You know exact limits (e.g., 1M Lambda invocations/mo, 25GB DynamoDB forever, 1TB CloudFront transfer) and design architectures that ensure users pay $0.00.
5. Helpful error recovery: If a prompt is ambiguous or hits constraints, explain gently what is needed and propose the top 2 likely paths forward.`;

// Endpoint: Agent Chat Stream (SSE)
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { messages, persona = 'kite-core', customInstructions = '' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // If no Gemini client is configured (e.g. key missing in local test), provide an intelligent fallback
  if (!ai || !process.env.GEMINI_API_KEY) {
    sendEvent('thought', { step: 'Using local intelligent response engine (Gemini API key not configured in environment).' });
    
    const lastUserMessage = messages?.[messages.length - 1]?.content || 'Hello';
    const fallbackResponse = generateLocalFallback(lastUserMessage, persona);

    for (let i = 0; i < fallbackResponse.length; i += 12) {
      const slice = fallbackResponse.slice(i, i + 12);
      sendEvent('chunk', { text: slice });
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    sendEvent('done', { isFallback: true });
    res.end();
    return;
  }

  try {
    sendEvent('thought', { step: 'Reviewing conversation context and goal alignment...' });

    let systemInstruction = BASE_SYSTEM_PROMPT;
    if (persona === 'kite-architect') {
      systemInstruction += '\nPersona: Senior AWS Cloud Architect. Emphasize zero-cost AWS Free Tier primitives, security, and resilient serverless patterns.';
    } else if (persona === 'kite-minimalist') {
      systemInstruction += '\nPersona: Minimalist. Be extremely concise, use bullet points, zero preamble, maximum signal-to-noise ratio.';
    } else if (persona === 'kite-mentor') {
      systemInstruction += '\nPersona: Encouraging tech mentor. Explain the "why" behind decisions with intuitive real-world analogies.';
    }

    if (customInstructions) {
      systemInstruction += `\nUser custom guidance: ${customInstructions}`;
    }

    // Format messages for @google/genai
    const formattedContents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: 'Hello! Introduce yourself.' }],
      });
    }

    sendEvent('thought', { step: 'Synthesizing response with gemini-3.8-flash...' });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        sendEvent('chunk', { text: chunk.text });
      }
    }

    sendEvent('done', { isFallback: false });
    res.end();
  } catch (error: any) {
    console.error('Error in /api/agent/chat:', error);
    sendEvent('error', {
      message: error?.message || 'Unexpected issue generating response.',
      advice: 'The Kite agent has preserved your input. You can retry with 1 click or switch to local analysis.',
    });
    res.end();
  }
});

// Helper for fallback generation
function generateLocalFallback(input: string, persona: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('aws') || lower.includes('free tier') || lower.includes('deploy') || lower.includes('lambda')) {
    return `### AWS Free Tier Deployment Blueprint for Kite Agent

You can host this entire agent architecture 100% within the **AWS Free Tier** limits:

#### 1. Architecture Overview
- **Compute**: **AWS Lambda** (ARM64 Graviton2 for faster startup and lower memory footprint).
  * *Free Tier Allowance:* **1,000,000 requests/month** + **3,200,000 compute-seconds/month** forever.
- **API Layer**: **Amazon API Gateway HTTP API**
  * *Free Tier Allowance:* **1,000,000 calls/month** for the first 12 months (or keep below negligible thresholds).
- **Frontend / Static Hosting**: **Amazon S3** + **Amazon CloudFront**
  * *Free Tier Allowance:* **5 GB S3 storage**, **20,000 GET requests**, and **1 TB CloudFront data transfer out per month** with 10M HTTPS requests free forever!
- **State & Memory Store**: **Amazon DynamoDB**
  * *Free Tier Allowance:* **25 GB storage** and **25 Read/Write Capacity Units (RCU/WCU)** free forever!
- **Secrets Management**: **AWS Systems Manager (SSM) Parameter Store**
  * *Free Tier Allowance:* Standard parameters are **100% free with unlimited storage**.

#### 2. Key Cost-Optimization Rules
1. **Never use NAT Gateways**: They cost ~$32/month. Keep Lambda outside VPC or use VPC endpoints within free tier.
2. **Use SSM Parameter Store instead of AWS Secrets Manager**: Secrets Manager costs $0.40/secret/month, whereas standard SSM parameters are completely free.
3. **Enable CloudFront caching**: Reduces API Gateway hits by up to 80% for static assets and documentation.

Would you like me to generate the complete **AWS CDK (TypeScript)** stack, the **AWS SAM template**, or the one-line **deploy.sh** script? Check out the **AWS Free Tier Launchpad** tab above to test and copy them immediately!`;
  }

  if (lower.includes('error') || lower.includes('debug') || lower.includes('issue')) {
    return `### Diagnostic & Root Cause Analysis

I've examined the situation. Here is a clear breakdown of potential root causes and actionable steps:

1. **Environment & Credentials**: Verify that \`GEMINI_API_KEY\` or target AWS credentials (\`AWS_ACCESS_KEY_ID\`) are populated and non-empty.
2. **Network & CORS**: If invoking Lambda via API Gateway, ensure CORS headers (\`Access-Control-Allow-Origin: *\`) are present on both the OPTIONS preflight and 200/500 responses.
3. **Timeout Safeguards**: The default Lambda timeout is 3 seconds; for AI streaming responses, configure Lambda timeout to 30 or 60 seconds with \`responseStream\` enabled.

**Suggested next step:**
Would you like me to inspect a specific code snippet or generate the CORS-ready Lambda streaming wrapper?`;
  }

  return `### Hello! I'm Kite.

I'm your proactive partner designed to make building, thinking, and deploying genuinely enjoyable.

Here is what we can do together right away:
1. **AWS Free Tier Serverless Deployment**: Generate turnkey AWS CDK, SAM, or Terraform blueprints that cost exactly $0.00/mo.
2. **Architecture & Code Review**: Break down complex problems into clear, modular steps.
3. **Live Problem Solving**: Debug errors, refine prompts, and streamline workflows.

What are you building today? Let's make it great!`;
}

// Endpoint: AWS Free Tier Quota Calculator & Configuration Validator
app.post('/api/aws/calculate-limits', (req: Request, res: Response) => {
  const { monthlyUsers = 1000, requestsPerUser = 50, avgPayloadKb = 4 } = req.body;
  
  const totalRequests = monthlyUsers * requestsPerUser;
  const totalComputeSeconds = (totalRequests * 1.2); // avg 1.2s per agent execution
  const totalBandwidthGb = (totalRequests * avgPayloadKb) / (1024 * 1024);
  
  const lambdaRequestLimit = 1_000_000;
  const lambdaComputeLimit = 3_200_000; // GB-seconds (128MB * seconds / 1024)
  const cloudfrontBandwidthLimit = 1024; // 1 TB
  const apiGatewayLimit = 1_000_000;

  const lambdaPercent = Math.min(100, Math.round((totalRequests / lambdaRequestLimit) * 100));
  const computePercent = Math.min(100, Math.round(((totalComputeSeconds * 0.25) / lambdaComputeLimit) * 100));
  const bandwidthPercent = Math.min(100, Math.round((totalBandwidthGb / cloudfrontBandwidthLimit) * 100));
  const apiGwPercent = Math.min(100, Math.round((totalRequests / apiGatewayLimit) * 100));

  const isFreeTierEligible = totalRequests <= lambdaRequestLimit && totalBandwidthGb <= cloudfrontBandwidthLimit;
  const estimatedCost = isFreeTierEligible ? 0 : Number(((totalRequests - lambdaRequestLimit) * 0.0000002).toFixed(2));

  res.json({
    metrics: {
      totalRequests,
      totalComputeSeconds: Math.round(totalComputeSeconds),
      totalBandwidthGb: Number(totalBandwidthGb.toFixed(3)),
    },
    limits: {
      lambdaPercent,
      computePercent,
      bandwidthPercent,
      apiGwPercent,
    },
    isFreeTierEligible,
    estimatedCost,
    recommendations: [
      'Lambda: Allocate 256MB memory with ARM64 architecture for optimal free-tier compute density.',
      'Secrets: Use SSM Parameter Store (Free) instead of Secrets Manager ($0.40/mo).',
      'Storage: Use DynamoDB on-demand or 5 RCU/WCU provisioned to stay permanently within the 25 RCU/WCU free tier.',
      'API Gateway: Use HTTP API instead of REST API for 70% lower latency and seamless free tier usage.',
    ],
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Kite Agent running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
