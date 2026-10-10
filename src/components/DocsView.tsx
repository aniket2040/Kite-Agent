import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Cloud, 
  Cpu, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Layers, 
  Terminal, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AWS_FREE_TIER_SERVICES, COST_TRAPS_TO_AVOID } from '../data/awsBlueprints';

export const DocsView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
            <BookOpen className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
            System Documentation & Architecture
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Kite Agent: Technical Specification & AWS Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
          Comprehensive blueprint explaining what was built, who it is for, system architecture, and how AWS Free Tier services guarantee $0.00/month operation.
        </p>
      </div>

      {/* 1. What It Is & What It Does */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>1. What Was Built & What It Does</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Core Architecture</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong>Kite Agent</strong> is a full-stack, conversational AI agent engineered for maximum user delight and production deployment. It combines:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <h4 className="font-bold text-slate-900">Delightful Conversational Interface</h4>
            <p className="text-slate-600 leading-relaxed">
              Provides streaming responses with real-time reasoning transparency, warm first-run onboarding, 4 distinct personas, Web Audio completion chimes, and instant follow-up prompts.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <h4 className="font-bold text-slate-900">AWS Free Tier Launchpad ($0/mo)</h4>
            <p className="text-slate-600 leading-relaxed">
              Interactive topology map, real-time quota guard, cost trap prevention, and production-ready IaC generators in AWS CDK, SAM, Terraform, and Bash.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Who It Is For */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>2. Who It Is For</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">Full-Stack Engineers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Developers seeking a battle-tested serverless agent template without dealing with expensive NAT gateways or Kubernetes clusters.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">Founders & Startups</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Teams needing to deploy a customer-facing or internal AI assistant with verified <strong>$0.00/month hosting</strong> during the MVP phase.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">DevOps & Cloud Architects</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Engineers looking for strict IAM least-privilege policies, SSM Parameter Store secrets retrieval, and ARM64 Graviton2 tuning.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How It Was Built & Tech Stack */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-600" />
          <span>3. How It Was Built (Technology Stack)</span>
        </h2>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-slate-900">Frontend Layer:</span>
              <p className="text-slate-600 mt-0.5">
                React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion animations + Lucide icons. Pure Web Audio API synthesizers for micro-interaction sounds with zero external audio assets.
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-slate-900">Server & API Layer:</span>
              <p className="text-slate-600 mt-0.5">
                Node.js Express backend with Vite middlewares mounted in dev mode (`"dev": "tsx server.ts"`). Streams real-time tokens via Server-Sent Events (SSE) and includes a local fallback engine for uninterrupted development.
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-slate-900">AI Reasoning Engine:</span>
              <p className="text-slate-600 mt-0.5">
                Powered by `@google/genai` TypeScript SDK using `gemini-3.8-flash`. All API keys are securely accessed server-side via `process.env.GEMINI_API_KEY` with `User-Agent: aistudio-build`.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AWS Services & Free Tier Breakdown */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>4. AWS Free Tier Services Breakdown</span>
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            100% Free Tier Compliant
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 font-semibold text-slate-700">AWS Service</th>
                <th className="py-2.5 font-semibold text-slate-700">Role in Kite</th>
                <th className="py-2.5 font-semibold text-slate-700">Free Tier Allowance</th>
                <th className="py-2.5 font-semibold text-slate-700">Cost Safety Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {AWS_FREE_TIER_SERVICES.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 whitespace-nowrap">{srv.name}</td>
                  <td className="py-3 capitalize text-slate-600">{srv.category}</td>
                  <td className="py-3 font-mono text-emerald-700 text-[11px]">{srv.freeLimit}</td>
                  <td className="py-3 text-slate-500 max-w-xs">{srv.keyRule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. The 4 Cost Traps to Avoid */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>5. The 4 Hidden AWS Billing Traps (And How We Avoided Them)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {COST_TRAPS_TO_AVOID.map((trap, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900">{trap.trap}</span>
                <span className="font-mono text-[10px] text-rose-700">{trap.cost}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{trap.prevention}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Quick Deploy Instructions */}
      <section className="p-6 rounded-2xl bg-slate-950 text-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>6. Quick CLI Deployment Command</span>
          </h2>
          <button
            onClick={() => handleCopy('chmod +x deploy-freetier.sh && ./deploy-freetier.sh', 'cli')}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
          >
            {copiedSection === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'cli' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed border border-slate-800">
          <code># 1. Store your GEMINI_API_KEY in SSM Parameter Store (100% Free Tier)<br/>
aws ssm put-parameter --name "/kite-agent/gemini-api-key" --type "SecureString" --value "YOUR_API_KEY" --region us-east-1<br/><br/>
# 2. Deploy the stack with AWS CDK<br/>
npx cdk deploy --require-approval never</code>
        </div>
      </section>
    </div>
  );
};
