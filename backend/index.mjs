// AWS Lambda Node.js 22 Handler (ARM64 Graviton2)
import { GoogleGenAI } from '@google/genai';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

let cachedApiKey = null;
const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  if (process.env.GEMINI_API_KEY) {
    cachedApiKey = process.env.GEMINI_API_KEY;
    return cachedApiKey;
  }
  try {
    const paramName = process.env.GEMINI_API_KEY_SSM || '/kite-agent/gemini-api-key';
    const command = new GetParameterCommand({ Name: paramName, WithDecryption: true });
    const result = await ssmClient.send(command);
    cachedApiKey = result.Parameter?.Value || '';
  } catch (err) {
    console.warn('Could not retrieve SSM parameter for GEMINI_API_KEY:', err.message);
  }
  return cachedApiKey;
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  // HTTP API preflight
  const httpMethod = event.requestContext?.http?.method || event.httpMethod;
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const rawPath = event.rawPath || event.path || '';

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    // Route: /api/aws/calculate-limits
    if (rawPath.endsWith('/calculate-limits')) {
      const { monthlyUsers = 1000, requestsPerUser = 50, avgPayloadKb = 4 } = body;
      const totalRequests = monthlyUsers * requestsPerUser;
      const totalComputeSeconds = totalRequests * 1.2;
      const totalBandwidthGb = (totalRequests * avgPayloadKb) / (1024 * 1024);

      const lambdaPercent = Math.min(100, Math.round((totalRequests / 1000000) * 100));
      const computePercent = Math.min(100, Math.round(((totalComputeSeconds * 0.25) / 3200000) * 100));
      const bandwidthPercent = Math.min(100, Math.round((totalBandwidthGb / 1024) * 100));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          metrics: {
            totalRequests,
            totalComputeSeconds: Math.round(totalComputeSeconds),
            totalBandwidthGb: Number(totalBandwidthGb.toFixed(3)),
          },
          limits: { lambdaPercent, computePercent, bandwidthPercent, apiGwPercent: lambdaPercent },
          isFreeTierEligible: totalRequests <= 1000000 && totalBandwidthGb <= 1024,
          estimatedCost: 0,
        }),
      };
    }

    // Route: /api/agent/chat
    const { messages = [], persona = 'kite-core', customInstructions = '' } = body;
    const apiKey = await getApiKey();

    if (!apiKey) {
      // Graceful local fallback if key not yet populated
      const lastMsg = messages[messages.length - 1]?.content || 'Hello';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          text: `Hello! I'm Kite running live on AWS Lambda (ARM64 Graviton2). To enable full AI reasoning with gemini-3.8-flash, ensure '/kite-agent/gemini-api-key' is populated in SSM Parameter Store.\n\nYour message was: "${lastMsg}"`,
        }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let systemInstruction = `You are Kite, an exceptionally capable, delightful, and proactive AI companion running on AWS Free Tier.\nBe clear, structured, and helpful.`;
    if (persona === 'kite-architect') systemInstruction += '\nFocus on AWS Cloud Architecture and cost minimization.';
    if (persona === 'kite-minimalist') systemInstruction += '\nBe extremely concise with bullet points.';
    if (customInstructions) systemInstruction += `\nUser directives: ${customInstructions}`;

    const formattedContents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents.length > 0 ? formattedContents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
      config: { systemInstruction },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: response.text,
        metrics: { runtime: 'AWS Lambda (Node.js 22 ARM64 Graviton2)', freeTierCost: '$0.00' },
      }),
    };
  } catch (err) {
    console.error('Lambda Handler Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || 'Internal Lambda Error',
        advice: 'Check CloudWatch logs for /kite-agent/gemini-api-key SSM permissions.',
      }),
    };
  }
};
