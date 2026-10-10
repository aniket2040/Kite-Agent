#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { KiteAgentFreeTierStack } from './KiteAgentFreeTierStack.ts';

const app = new cdk.App();
new KiteAgentFreeTierStack(app, 'KiteAgentFreeTierStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Kite Agent: Delightful AI & AWS Free Tier Serverless Suite ($0.00/month)',
});
