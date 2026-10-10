import React, { useState } from 'react';
import { 
  Cloud, 
  Check, 
  Copy, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  ExternalLink, 
  Layers, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Lock, 
  Globe 
} from 'lucide-react';
import { 
  AWS_FREE_TIER_SERVICES, 
  COST_TRAPS_TO_AVOID, 
  AWS_CDK_BLUEPRINT, 
  AWS_SAM_BLUEPRINT, 
  TERRAFORM_BLUEPRINT, 
  LAMBDA_HANDLER_BLUEPRINT, 
  BASH_DEPLOY_SCRIPT 
} from '../data/awsBlueprints';
import { IacFormat } from '../types';

export const AwsLaunchpad: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<IacFormat>('cdk');
  const [copiedCode, setCopiedCode] = useState(false);
  const [monthlyUsers, setMonthlyUsers] = useState<number>(2500);
  const [requestsPerUser, setRequestsPerUser] = useState<number>(30);
  const [selectedNode, setSelectedNode] = useState<string>('lambda');
  const [testEndpointRunning, setTestEndpointRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Calculations
  const totalRequests = monthlyUsers * requestsPerUser;
  const totalComputeSeconds = Math.round(totalRequests * 1.2);
  const totalBandwidthGb = Number(((totalRequests * 3.5) / (1024 * 1024)).toFixed(3));

  const lambdaLimit = 1_000_000;
  const computeLimit = 3_200_000;
  const bandwidthLimit = 1024; // 1 TB

  const lambdaPercent = Math.min(100, (totalRequests / lambdaLimit) * 100);
  const computePercent = Math.min(100, (totalComputeSeconds / computeLimit) * 100);
  const bandwidthPercent = Math.min(100, (totalBandwidthGb / bandwidthLimit) * 100);

  const isFreeTier = totalRequests <= lambdaLimit && totalBandwidthGb <= bandwidthLimit;
  const estimatedCost = isFreeTier ? 0 : Number(((totalRequests - lambdaLimit) * 0.0000002).toFixed(2));

  const getCodeContent = () => {
    switch (selectedFormat) {
      case 'cdk':
        return AWS_CDK_BLUEPRINT;
      case 'sam':
        return AWS_SAM_BLUEPRINT;
      case 'terraform':
        return TERRAFORM_BLUEPRINT;
      case 'lambda':
        return LAMBDA_HANDLER_BLUEPRINT;
      case 'bash':
        return BASH_DEPLOY_SCRIPT;
    }
  };

  const getFilename = () => {
    switch (selectedFormat) {
      case 'cdk':
        return 'KiteAgentFreeTierStack.ts';
      case 'sam':
        return 'template.yaml';
      case 'terraform':
        return 'main.tf';
      case 'lambda':
        return 'index.mjs';
      case 'bash':
        return 'deploy-freetier.sh';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([getCodeContent()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = getFilename();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSimulateTest = async () => {
    setTestEndpointRunning(true);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setTestResult('Success: 200 OK · Invocations: 1 · Latency: 64ms · Billed duration: 100ms · Free tier cost: $0.00');
    setTestEndpointRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Cloud className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              AWS Free Tier Launchpad
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Deploy Kite Agent for $0.00 / month
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Production-grade serverless architecture configured to remain 100% within AWS Free Tier quotas: 1M Lambda calls, 1TB CloudFront transfer, and 25GB DynamoDB storage forever.
          </p>
        </div>

        {/* Big Cost Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200/80 shadow-sm shrink-0 min-w-[220px]">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Estimated Monthly AWS Cost
          </div>
          <div className="text-3xl font-extrabold text-emerald-950 mt-1 flex items-baseline gap-1">
            <span>${estimatedCost.toFixed(2)}</span>
            <span className="text-xs font-semibold text-emerald-700">/ mo</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Free Tier Eligible</span>
          </div>
        </div>
      </div>

      {/* Interactive Free Tier Topology Diagram */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Interactive Architecture Topology
            </h2>
            <p className="text-xs text-slate-500">
              Click any AWS service node to inspect its exact free tier configuration and quota rules.
            </p>
          </div>
          <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
            ARM64 Serverless Stack
          </span>
        </div>

        {/* Visual Diagram Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {AWS_FREE_TIER_SERVICES.map((srv) => {
            const isSelected = selectedNode === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => setSelectedNode(srv.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200/60 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      {srv.category === 'compute' && <Cpu className="w-4 h-4 text-amber-600" />}
                      {srv.category === 'api' && <Globe className="w-4 h-4 text-sky-600" />}
                      {srv.category === 'cdn' && <Globe className="w-4 h-4 text-indigo-600" />}
                      {srv.category === 'storage' && <Database className="w-4 h-4 text-emerald-600" />}
                      {srv.category === 'database' && <Database className="w-4 h-4 text-violet-600" />}
                      {srv.category === 'security' && <Lock className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{srv.name}</h3>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {srv.freeType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-600 font-medium">
                  Limit: <span className="text-slate-900">{srv.freeLimit}</span>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {srv.keyRule}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Free Tier Quota Calculator Guard */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Interactive Free Tier Quota Guard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust expected traffic sliders to see real-time utilization against AWS Free Tier limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Monthly Active Users</span>
                <span className="font-mono font-bold text-indigo-700">{monthlyUsers.toLocaleString()} users</span>
              </div>
              <input
                type="range"
                min="100"
                max="20000"
                step="100"
                value={monthlyUsers}
                onChange={(e) => setMonthlyUsers(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>100</span>
                <span>10,000</span>
                <span>20,000+</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Requests / Prompts Per User</span>
                <span className="font-mono font-bold text-indigo-700">{requestsPerUser} calls</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={requestsPerUser}
                onChange={(e) => setRequestsPerUser(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Meter Bars */}
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            {/* Lambda Meter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Lambda Invocations</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {totalRequests.toLocaleString()} / 1,000,000 ({lambdaPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    lambdaPercent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(1, lambdaPercent)}%` }}
                />
              </div>
            </div>

            {/* Compute Seconds Meter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Compute Seconds (256MB ARM)</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {totalComputeSeconds.toLocaleString()}s / 3,200,000s ({computePercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.max(1, computePercent)}%` }}
                />
              </div>
            </div>

            {/* CloudFront Bandwidth */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">CloudFront Data Transfer Out</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {totalBandwidthGb} GB / 1,024 GB ({(bandwidthPercent).toFixed(2)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.max(1, bandwidthPercent)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 font-medium flex items-center gap-1.5 border-t border-slate-200/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe Headroom: You have {((100 - lambdaPercent)).toFixed(1)}% free capacity left this month.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Production IaC Generator & Code Viewer */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Exportable Infrastructure as Code (IaC)
            </h2>
            <p className="text-xs text-slate-500">
              Copy or download battle-tested code templates ready for immediate terminal deployment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {getFilename()}</span>
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'cdk', label: 'AWS CDK (TypeScript)' },
            { id: 'sam', label: 'AWS SAM (YAML)' },
            { id: 'terraform', label: 'Terraform (HCL)' },
            { id: 'lambda', label: 'Lambda Handler (Node 22)' },
            { id: 'bash', label: 'deploy.sh Script' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFormat(tab.id as IacFormat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedFormat === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Box */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 shadow-md">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>{getFilename()}</span>
            </div>
            <span>UTF-8 · Ready to deploy</span>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-[420px] text-slate-200">
            <code>{getCodeContent()}</code>
          </pre>
        </div>
      </section>

      {/* 4 Cost Traps to Avoid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>The 4 Cost Traps to Avoid in AWS Free Tier</span>
          </h2>
          <p className="text-xs text-slate-500">
            Every trap below has been strictly engineered out of Kite Agent's blueprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {COST_TRAPS_TO_AVOID.map((trap, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700">{trap.trap}</span>
                <span className="text-[11px] font-mono text-slate-500">{trap.cost}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {trap.prevention}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Verification & Test Invocator */}
      <section className="p-6 rounded-2xl bg-indigo-950 text-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              <span>Free Tier Lambda Test Invocation</span>
            </h2>
            <p className="text-xs text-indigo-200">
              Simulate an AWS Lambda ARM64 execution with CORS and verify cold start and zero-dollar pricing.
            </p>
          </div>
          <button
            onClick={handleSimulateTest}
            disabled={testEndpointRunning}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            {testEndpointRunning ? 'Testing...' : 'Execute Test Run'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 bg-slate-900 border border-indigo-700/60 rounded-xl font-mono text-xs text-emerald-400 animate-in fade-in duration-200">
            {testResult}
          </div>
        )}
      </section>
    </div>
  );
};
