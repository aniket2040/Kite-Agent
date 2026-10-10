export type PersonaId = 'kite-core' | 'kite-architect' | 'kite-mentor' | 'kite-minimalist';

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  tagline: string;
  avatar: string;
  tone: string;
  badge: string;
  description: string;
  systemPromptAddendum: string;
  sampleQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  thought?: string;
  isStreaming?: boolean;
  isError?: boolean;
  errorMessage?: string;
  suggestedActions?: string[];
  pinned?: boolean;
}

export interface AwsServiceTier {
  id: string;
  name: string;
  category: 'compute' | 'api' | 'storage' | 'database' | 'cdn' | 'security';
  freeLimit: string;
  freeType: 'Always Free' | '12 Months Free' | 'Trials';
  unit: string;
  currentEstimatedUsage: number;
  maxLimit: number;
  keyRule: string;
  costRisk: 'Zero' | 'Low' | 'Medium';
}

export type IacFormat = 'cdk' | 'sam' | 'terraform' | 'lambda' | 'bash';
