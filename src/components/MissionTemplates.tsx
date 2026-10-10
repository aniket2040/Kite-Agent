import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Cloud, 
  ShieldCheck, 
  Zap, 
  Database, 
  Code2, 
  Cpu 
} from 'lucide-react';

interface MissionTemplatesProps {
  onSelectPrompt: (prompt: string) => void;
  onNavigateToAws: () => void;
}

export const MissionTemplates: React.FC<MissionTemplatesProps> = ({
  onSelectPrompt,
  onNavigateToAws,
}) => {
  const missions = [
    {
      category: 'AWS Free Tier Deployment',
      icon: <Cloud className="w-5 h-5 text-emerald-600" />,
      badge: '$0.00 / mo',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Architect & Deploy Zero-Cost Serverless Agent',
      description: 'Step-by-step guidance on provisioning Lambda (ARM64), API Gateway HTTP API, and CloudFront while guaranteeing zero AWS billing surprises.',
      prompt: 'Please guide me through deploying Kite Agent on AWS Free Tier. Include the exact CDK TypeScript stack and verify that our SSM parameter setup avoids the Secrets Manager cost trap.',
      actionText: 'Launch AWS Mission',
    },
    {
      category: 'Performance Optimization',
      icon: <Cpu className="w-5 h-5 text-amber-600" />,
      badge: 'Latency & Cost',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Lambda Memory Tuning & Cold-Start Minimization',
      description: 'Learn how right-sizing Lambda memory to 256MB on ARM64 Graviton2 speeds execution time while minimizing billable compute seconds.',
      prompt: 'How does Lambda memory allocation affect compute-seconds in the AWS Free Tier? Show me a calculation comparing 128MB vs 256MB vs 512MB for Node.js 22.',
      actionText: 'Optimize Memory',
    },
    {
      category: 'State & Memory Persistence',
      icon: <Database className="w-5 h-5 text-indigo-600" />,
      badge: '25 GB Free Forever',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Conversation History in DynamoDB with TTL',
      description: 'Configure Amazon DynamoDB with single-table design, Pay-Per-Request billing, and automatic TTL expiration to retain conversation state indefinitely without costs.',
      prompt: 'Write the DynamoDB schema and Node.js 22 document client code to save conversation history for Kite Agent, including TTL for auto-cleanup.',
      actionText: 'Implement State',
    },
    {
      category: 'Production Security',
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      badge: 'Least Privilege',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'IAM Least-Privilege & SSM Parameter Store Security',
      description: 'Audit IAM policies to ensure the Lambda execution role can only read its designated SSM parameter and write to its specific DynamoDB partition.',
      prompt: 'Create the tightest IAM least-privilege policy for our Kite Agent Lambda function so it can only access /kite-agent/gemini-api-key in SSM and its state table.',
      actionText: 'Audit Security',
    },
    {
      category: 'Real-Time Streaming',
      icon: <Zap className="w-5 h-5 text-sky-600" />,
      badge: 'Sub-100ms UX',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      title: 'Server-Sent Events (SSE) via API Gateway & Lambda',
      description: 'Explore response streaming in AWS Lambda using Lambda Response Streaming or AWS Lambda Web Adapter for buttery-smooth typing feedback.',
      prompt: 'How does Lambda response streaming work with API Gateway? Show me how to enable chunked transfer encoding so user UI updates token-by-token in real time.',
      actionText: 'Enable Streaming',
    },
    {
      category: 'Developer Experience',
      icon: <Code2 className="w-5 h-5 text-violet-600" />,
      badge: 'Productivity',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      title: 'Code Review & Automated Edge-Case Scrutiny',
      description: 'Paste any backend or frontend code to have Kite analyze error boundaries, memory leaks, and concurrency bottlenecks with cheerful rigor.',
      prompt: 'Can you act as a senior staff engineer and review my application code for potential edge-case failures, unhandled promises, and UX friction?',
      actionText: 'Review Code',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
            Agent Playbooks & Missions
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Curated Engineering Missions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
          Pre-packaged, high-value workflows designed to get tangible results in minutes. Click any mission to launch it immediately in chat or inspect the blueprints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missions.map((mission, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                  {mission.icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${mission.badgeColor}`}>
                  {mission.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-indigo-600 transition-colors">
                {mission.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {mission.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-medium">{mission.category}</span>
              <button
                onClick={() => onSelectPrompt(mission.prompt)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 group-hover:translate-x-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                <span>{mission.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
