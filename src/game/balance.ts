// Balance constants and definitions for Model Foundry
// Single source of truth for all idle tycoon mechanics.

import type { ProductDef, ProductId, BuildingDef, FundingDef, AchievementId } from './types';

export const SAVE_KEY = 'modelfoundry.save.v2';
export const BACKUP_SAVE_KEY = 'modelfoundry.save.v2.backup';
export const SAVE_V1_KEY = 'modelfoundry.save.v1';
export const BACKUP_V1_KEY = 'modelfoundry.save.v1.backup';

export const APP_VERSION = '0.3.0';
export const DEFAULT_LAB_NAME = 'Claude';
export const STARTING_CASH = 10;

// Model ladders
export const CLAUDE_LADDER = [
  'Claude 1', 'Claude Instant', 'Claude 2', 'Claude 2.1', 'Claude 3 Haiku',
  'Claude 3 Sonnet', 'Claude 3 Opus', 'Claude 3.5 Haiku', 'Claude 3.5 Sonnet',
  'Claude 3.7 Sonnet', 'Claude Sonnet 4', 'Claude Opus 4', 'Claude Opus 4.1',
  'Claude Haiku 4.5', 'Claude Sonnet 4.5', 'Claude Opus 4.5', 'Claude Sonnet 4.6',
  'Claude Opus 4.6', 'Claude Opus 4.7', 'Claude Opus 4.8', 'Claude Sonnet 5',
  'Claude Opus 5', 'Claude Sonnet 5.5', 'Claude Opus 5.5', 'Claude 6 Sonnet',
  'Claude 6 Opus', 'Claude 7', 'Claude 8', 'Claude 9', 'Claude Omega',
] as const;

export const OPENAI_LADDER = [
  'GPT-1', 'GPT-2', 'GPT-3', 'GPT-3.5', 'GPT-4', 'GPT-4 Turbo', 'GPT-4o',
  'o1', 'o3', 'GPT-4.5', 'GPT-5', 'GPT-5.1', 'GPT-5.2', 'GPT-5.4', 'GPT-5.5',
  'GPT-5.6 Sol', 'GPT-6', 'GPT-6.5', 'GPT-7', 'GPT-8', 'GPT-9', 'GPT-Omega',
] as const;

export const GEMINI_LADDER = [
  'Bard', 'Gemini 1.0 Pro', 'Gemini 1.0 Ultra', 'Gemini 1.5 Pro', 'Gemini 2.0 Flash',
  'Gemini 2.5 Pro', 'Gemini 3 Pro', 'Gemini 3.1 Pro', 'Gemini 3.5 Flash',
  'Gemini 3.7 Flash', 'Gemini 3.8 Flash', 'Gemini 4', 'Gemini 4.5', 'Gemini 5',
  'Gemini 6', 'Gemini Omega',
] as const;

export const GROK_LADDER = [
  'Grok-1', 'Grok-1.5', 'Grok-2', 'Grok-3', 'Grok 4', 'Grok 4.1', 'Grok 4.5',
  'Grok 4.6', 'Grok 4.7', 'Grok 5', 'Grok 6', 'Grok 7', 'Grok Omega',
] as const;

export const DEEPSEEK_LADDER = [
  'DeepSeek Coder', 'DeepSeek LLM', 'DeepSeek-V2', 'DeepSeek-V2.5', 'DeepSeek-V3',
  'DeepSeek-R1', 'DeepSeek-V3.2', 'DeepSeek-V4', 'DeepSeek-V4.1 Flash', 'DeepSeek-V5',
  'DeepSeek-R2', 'DeepSeek-V6', 'DeepSeek Omega',
] as const;

export const LLAMA_LADDER = [
  'Llama 1', 'Llama 2', 'Llama 3', 'Llama 3.1 405B', 'Llama 4 Maverick',
  'Llama 5', 'Llama 6', 'Llama Omega',
] as const;

export const MISTRAL_LADDER = [
  'Mistral 7B', 'Mixtral 8x7B', 'Mistral Large', 'Mistral Large 2',
  'Mistral Medium 3', 'Mistral 4', 'Mistral Omega',
] as const;

export const QWEN_LADDER = [
  'Qwen', 'Qwen1.5', 'Qwen2', 'Qwen2.5', 'Qwen3', 'Qwen4', 'Qwen Omega',
] as const;

// Products
export const PRODUCTS: Record<ProductId, ProductDef> = {
  chat: {
    id: 'chat',
    name: 'Chat App',
    iconName: 'MessageSquare',
    unlockStep: -1,
    unlockModelName: 'Start',
    baseCost: 5,
    costGrowth: 1.12,
    incomePerLevel: 0.38,
  },
  api: {
    id: 'api',
    name: 'API',
    iconName: 'Plug',
    unlockStep: 1,
    unlockModelName: 'Claude Instant',
    baseCost: 75,
    costGrowth: 1.17,
    incomePerLevel: 3.0,
  },
  code: {
    id: 'code',
    name: 'Coding Agent',
    iconName: 'Code',
    unlockStep: 4,
    unlockModelName: 'Claude 3 Haiku',
    baseCost: 1100,
    costGrowth: 1.19,
    incomePerLevel: 24,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    iconName: 'Building2',
    unlockStep: 7,
    unlockModelName: 'Claude 3.5 Haiku',
    baseCost: 16000,
    costGrowth: 1.20,
    incomePerLevel: 190,
  },
  mobile: {
    id: 'mobile',
    name: 'Voice & Mobile',
    iconName: 'Smartphone',
    unlockStep: 10,
    unlockModelName: 'Claude Sonnet 4',
    baseCost: 240000,
    costGrowth: 1.21,
    incomePerLevel: 1600,
  },
  science: {
    id: 'science',
    name: 'Gov & Science',
    iconName: 'Atom',
    unlockStep: 14,
    unlockModelName: 'Claude Sonnet 4.5',
    baseCost: 3600000,
    costGrowth: 1.22,
    incomePerLevel: 13000,
  },
  robots: {
    id: 'robots',
    name: 'Robotics',
    iconName: 'Bot',
    unlockStep: 19,
    unlockModelName: 'Claude Opus 4.8',
    baseCost: 55000000,
    costGrowth: 1.23,
    incomePerLevel: 110000,
  },
};

export const PRODUCT_ORDER: ProductId[] = [
  'chat',
  'api',
  'code',
  'enterprise',
  'mobile',
  'science',
  'robots',
];

// Product milestones
export const MILESTONES: Array<{ level: number; mult: number }> = [
  { level: 10, mult: 2 },
  { level: 25, mult: 2 },
  { level: 50, mult: 2 },
  { level: 75, mult: 2 },
  { level: 100, mult: 2 },
  { level: 150, mult: 3 },
  { level: 200, mult: 3 },
  { level: 300, mult: 3 },
  { level: 400, mult: 3 },
];

export function getProductMilestoneMultiplier(level: number): number {
  let mult = 1;
  for (const m of MILESTONES) {
    if (level >= m.level) {
      mult *= m.mult;
    }
  }
  return mult;
}

export function getNextProductMilestone(level: number): {
  prevLevel: number;
  nextLevel: number;
  multiplier: number;
} | null {
  let prevLevel = 0;
  for (const m of MILESTONES) {
    if (level < m.level) {
      return {
        prevLevel,
        nextLevel: m.level,
        multiplier: m.mult,
      };
    }
    prevLevel = m.level;
  }
  return null;
}

export function getProductNextCost(productId: ProductId, level: number): number {
  const def = PRODUCTS[productId];
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

export function getProductIncomePerSec(productId: ProductId, level: number): number {
  if (level <= 0) return 0;
  const def = PRODUCTS[productId];
  const milestone = getProductMilestoneMultiplier(level);
  return level * def.incomePerLevel * milestone;
}

// Model formulas
export function getModelCost(step: number): number {
  return Math.round(10 * Math.pow(3.0, step));
}

export function getModelBaseSeconds(step: number): number {
  return 6 + 4.0 * Math.pow(step, 1.4);
}

export function getTrainingSpeed(engineers: number, gpuClusters: number): number {
  return (1 + 0.05 * engineers) * (1 + 0.06 * gpuClusters);
}

export function getModelScore(step: number, researchers: number = 0): number {
  if (step < 0) return 0;
  return Math.round(10 * Math.pow(1.32, step) * (1 + 0.02 * researchers));
}

export function getModelIncomeMultiplier(modelStep: number): number {
  if (modelStep < 0) return 1;
  return Math.pow(1.08, modelStep + 1);
}

// Boost tap calculation
export function getBoostSecondsRemoved(totalSeconds: number): number {
  return Math.max(0.25, 0.015 * totalSeconds);
}

// Rivals definitions & scores
export interface RivalDefinition {
  id: string;
  name: string;
  shortCode: string;
  strength: number;
  ladder: readonly string[];
}

export const RIVAL_DEFINITIONS: RivalDefinition[] = [
  {
    id: 'helix',
    name: 'ChatGPT',
    shortCode: 'GP',
    strength: 1.05,
    ladder: OPENAI_LADDER,
  },
  {
    id: 'northglass',
    name: 'Gemini',
    shortCode: 'GE',
    strength: 1.0,
    ladder: GEMINI_LADDER,
  },
  {
    id: 'vesper',
    name: 'Grok',
    shortCode: 'GR',
    strength: 0.95,
    ladder: GROK_LADDER,
  },
  {
    id: 'pebble',
    name: 'DeepSeek',
    shortCode: 'DS',
    strength: 0.92,
    ladder: DEEPSEEK_LADDER,
  },
];

export function getRivalScore(step: number, strength: number): number {
  return Math.round(10 * Math.pow(1.32, step) * strength);
}

export function getRivalModelName(rivalId: string, step: number): string {
  const def = RIVAL_DEFINITIONS.find((r) => r.id === rivalId);
  const ladder = def?.ladder ?? OPENAI_LADDER;
  const idx = Math.min(ladder.length - 1, Math.max(0, step));
  return ladder[idx];
}

export function getRivalNextTimer(step: number): number {
  const base = 40 + Math.random() * 40; // 40 to 80
  return base * Math.pow(1.18, step);
}

// Team costs
export function getEngineerCost(engineersOwned: number): number {
  return Math.round(30 * Math.pow(1.16, engineersOwned));
}

export function getSalesCost(salesOwned: number): number {
  return Math.round(40 * Math.pow(1.17, salesOwned));
}

export function getResearcherCost(researchersOwned: number): number {
  return Math.round(60 * Math.pow(1.18, researchersOwned));
}

export function getGpuClusterCost(clustersOwned: number): number {
  return Math.round(50 * Math.pow(1.18, clustersOwned));
}

// Buildings
export const BUILDINGS: BuildingDef[] = [
  { index: 0, id: 'server-room', name: 'Server Room', cost: 10000, multiplier: 2, description: 'Double overall revenue (x2)' },
  { index: 1, id: 'data-center', name: 'Data Center', cost: 500000, multiplier: 2, description: 'Double overall revenue (x2)' },
  { index: 2, id: 'mega-campus', name: 'Mega Campus', cost: 25000000, multiplier: 2, description: 'Double overall revenue (x2)' },
  { index: 3, id: 'gigawatt-site', name: 'Gigawatt Site', cost: 1250000000, multiplier: 2, description: 'Double overall revenue (x2)' },
  { index: 4, id: 'orbital-compute', name: 'Orbital Compute', cost: 60000000000, multiplier: 2, description: 'Double overall revenue (x2)' },
];

export function getBuildingMultiplier(buildingsCount: number): number {
  return Math.pow(2, Math.max(0, buildingsCount));
}

// Funding rounds
export const FUNDING_ROUNDS: Record<string, FundingDef> = {
  seed: {
    id: 'seed',
    name: 'Seed',
    requiredStep: 2, // Claude 2
    requiredModelName: 'Claude 2',
    multiplier: 1.10,
    minLumpSum: 1000,
    requirementText: 'Claude 2',
  },
  'series-a': {
    id: 'series-a',
    name: 'Series A',
    requiredStep: 6, // Claude 3 Opus
    requiredModelName: 'Claude 3 Opus',
    multiplier: 1.15,
    minLumpSum: 10000,
    requirementText: 'Claude 3 Opus',
  },
  'series-b': {
    id: 'series-b',
    name: 'Series B',
    requiredStep: 9, // Claude 3.7 Sonnet
    requiredModelName: 'Claude 3.7 Sonnet',
    multiplier: 1.20,
    minLumpSum: 100000,
    requirementText: 'Claude 3.7 Sonnet',
  },
  'series-c': {
    id: 'series-c',
    name: 'Series C',
    requiredStep: 15, // Claude Opus 4.5
    requiredModelName: 'Claude Opus 4.5',
    multiplier: 1.25,
    minLumpSum: 1000000,
    requirementText: 'Claude Opus 4.5',
  },
  'series-d': {
    id: 'series-d',
    name: 'Series D',
    requiredStep: 21, // Claude Opus 5
    requiredModelName: 'Claude Opus 5',
    multiplier: 1.30,
    minLumpSum: 10000000,
    requirementText: 'Claude Opus 5',
  },
};

export const FUNDING_ROUND_ORDER: Array<keyof typeof FUNDING_ROUNDS> = [
  'seed',
  'series-a',
  'series-b',
  'series-c',
  'series-d',
];
export const FUNDING_ORDER = FUNDING_ROUND_ORDER;

export function getFundingMultiplier(fundingTaken: Record<string, boolean> = {}): number {
  let mult = 1.0;
  for (const [id, def] of Object.entries(FUNDING_ROUNDS)) {
    if (fundingTaken[id]) {
      mult *= def.multiplier;
    }
  }
  return mult;
}

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  bonusText: string;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  first_model: {
    id: 'first_model',
    name: 'First Frontier',
    description: 'Launch your first model: Claude 1',
    bonusText: 'Unlocks ladder progression',
  },
  chat_10: {
    id: 'chat_10',
    name: 'Hello World',
    description: 'Reach Chat App Level 10',
    bonusText: 'x2 Chat income milestone',
  },
  chat_50: {
    id: 'chat_50',
    name: 'Viral Scale',
    description: 'Reach Chat App Level 50',
    bonusText: 'x8 cumulative milestone',
  },
  hire_engineer: {
    id: 'hire_engineer',
    name: 'Talent Magnet',
    description: 'Hire your first engineer',
    bonusText: '+5% training speed',
  },
  claude_2: {
    id: 'claude_2',
    name: 'Next Horizon',
    description: 'Launch Claude 2',
    bonusText: 'Unlocks Seed funding',
  },
  claude_3_opus: {
    id: 'claude_3_opus',
    name: 'State of the Art',
    description: 'Launch Claude 3 Opus',
    bonusText: 'Industry benchmark leader',
  },
  seed_funding: {
    id: 'seed_funding',
    name: 'Investor Confidence',
    description: 'Secure Seed funding round',
    bonusText: '+10% permanent income',
  },
  first_million: {
    id: 'first_million',
    name: 'Unicorn Status',
    description: 'Accumulate $1,000,000 in cash',
    bonusText: 'High liquidity unlocked',
  },
  market_leader: {
    id: 'market_leader',
    name: 'Market Leader',
    description: 'Capture over 50% of the industry market share',
    bonusText: 'Premium revenue multiplier',
  },
  server_room: {
    id: 'server_room',
    name: 'Dedicated Iron',
    description: 'Deploy your first Server Room',
    bonusText: 'x2 permanent revenue',
  },
};

export const ALL_ACHIEVEMENT_IDS: AchievementId[] = [
  'first_model',
  'chat_10',
  'chat_50',
  'hire_engineer',
  'claude_2',
  'claude_3_opus',
  'seed_funding',
  'first_million',
  'market_leader',
  'server_room',
];

// Stocks
export const STOCK_MAX_SHARES = 200;
export const STOCK_SELL_FEE = 0.02;

export function getStockPrice(rivalScore: number): number {
  return Math.max(10, Math.round(rivalScore * 3 + 20));
}

export function getStockSellProceeds(price: number, shares: number): number {
  return Math.floor(shares * price * (1 - STOCK_SELL_FEE));
}

// Tap to earn
export function getTapEarnAmount(incomePerSec: number): number {
  return 0.50 + 0.05 * incomePerSec;
}
