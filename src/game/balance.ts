// Balance constants from GAME_DESIGN.md
// This file is the single source of truth for gameplay numbers.

export const SAVE_KEY = 'modelfoundry.save.v1';
export const BACKUP_SAVE_KEY = 'modelfoundry.save.backup';

export const APP_VERSION = '0.2.0';
export const DEFAULT_LAB_NAME = 'Claude';

// Starting resources
export const STARTING_CASH = 25000;
export const STARTING_GPUS = 2;
export const STARTING_POWER_CAP = 4;
export const STARTING_RESEARCHERS = 1;
export const STARTING_DATA_QUALITY = 20;
export const STARTING_REPUTATION = 0;
export const STARTING_ERA = 1;
export const STARTING_ERA_POINTS = 0;

// Market & Appeal constants from GAME_DESIGN.md
export const BASE_DEMAND = 6;
export const DEMAND_GROWTH_PER_ERA = 1.55;
export const SUBSCRIPTION_SHARE = 0.65;
export const API_SHARE = 0.35;
export const FRESHNESS_DECAY_PER_MIN = 0.015;
export const FRESHNESS_FLOOR = 0.40;
export const REPUTATION_DECAY_PER_MIN = 0.2;

// Offline cap
export const OFFLINE_CAP_HOURS = 8;
export const OFFLINE_CAP_SECONDS = OFFLINE_CAP_HOURS * 3600;
export const OFFLINE_CAP_MS = OFFLINE_CAP_SECONDS * 1000;

// GPU Price formula inputs
// cost = round(3500 * (1.12 ^ gpusOwned))
export const GPU_BASE_PRICE = 3500;
export const GPU_PRICE_GROWTH = 1.12;

export function getGpuPrice(gpusOwned: number): number {
  return Math.round(GPU_BASE_PRICE * Math.pow(GPU_PRICE_GROWTH, gpusOwned));
}

// Researcher Price formula inputs
// cost = round(8000 * (1.18 ^ researchers))
export const RESEARCHER_BASE_COST = 8000;
export const RESEARCHER_COST_GROWTH = 1.18;

export function getResearcherPrice(researchersOwned: number, hasRecruiter: boolean = false): number {
  const base = Math.round(RESEARCHER_BASE_COST * Math.pow(RESEARCHER_COST_GROWTH, researchersOwned));
  return hasRecruiter ? Math.round(base * 0.85) : base;
}

// Data upgrade formula inputs
// cost = round(400 * (1.09 ^ dataQuality))
export const DATA_UPGRADE_BASE_COST = 400;
export const DATA_UPGRADE_COST_GROWTH = 1.09;
export const DATA_UPGRADE_AMOUNT = 2;

export function getDataUpgradePrice(dataQuality: number): number {
  return Math.round(DATA_UPGRADE_BASE_COST * Math.pow(DATA_UPGRADE_COST_GROWTH, dataQuality));
}

// Cooling upgrade formula inputs
// cost = 7000 * (1 + coolingPurchases), max 5 purchases
export const COOLING_UPGRADE_BASE_COST = 7000;
export const COOLING_UPGRADE_POWER_CAP = 2;
export const COOLING_MAX_PURCHASES = 5;

export function getCoolingPrice(coolingPurchases: number): number {
  return COOLING_UPGRADE_BASE_COST * (1 + coolingPurchases);
}

// Data Centers from GAME_DESIGN.md
export interface DataCenterDef {
  tier: number;
  name: string;
  cost: number;
  powerCapAdded: number;
  scoreMultiplierAdded: number;
}

export const DATA_CENTERS: DataCenterDef[] = [
  { tier: 1, name: 'Colocation Rack', cost: 20000, powerCapAdded: 6, scoreMultiplierAdded: 0.02 },
  { tier: 2, name: 'Dedicated Pod', cost: 50000, powerCapAdded: 10, scoreMultiplierAdded: 0.02 },
  { tier: 3, name: 'Regional Facility', cost: 120000, powerCapAdded: 16, scoreMultiplierAdded: 0.02 },
  { tier: 4, name: 'Hyperscale Campus', cost: 300000, powerCapAdded: 24, scoreMultiplierAdded: 0.02 },
];

export const DATA_CENTER_UPKEEP_PER_SEC = 0.20;
export const BASE_SALARY_PER_RESEARCHER_PER_SEC = 0.15;
export const OFFICE_SNACKS_COST = 5000;
export const OFFICE_SNACKS_SALARY_MULT = 0.95;
export const MARKETING_CAMPAIGN_COST = 2000;
export const MARKETING_CAMPAIGN_DURATION = 180;
export const MARKETING_CAMPAIGN_COOLDOWN = 180;
export const MARKETING_HYPE_BOOST = 1.25;
export const STOCK_MAX_SHARES = 200;
export const STOCK_SELL_FEE = 0.02; // pays 0.98

// Research tree nodes from GAME_DESIGN.md
export type ResearchNodeId =
  | 'clean-data'
  | 'optimizers'
  | 'cheap-flops'
  | 'recruiter'
  | 'brand'
  | 'mixture'
  | 'reasoning'
  | 'agent-harness';

export interface ResearchNodeDef {
  id: ResearchNodeId;
  name: string;
  cost: number;
  effect: string;
  requiresNodeId?: ResearchNodeId;
  scoreMultiplier?: number;
}

export const RESEARCH_NODES: Record<ResearchNodeId, ResearchNodeDef> = {
  'clean-data': {
    id: 'clean-data',
    name: 'Clean data pipeline',
    cost: 2100,
    effect: 'Data quality +5, once',
  },
  'optimizers': {
    id: 'optimizers',
    name: 'Better optimizers',
    cost: 5600,
    effect: 'Model score ×1.08',
    scoreMultiplier: 1.08,
  },
  'cheap-flops': {
    id: 'cheap-flops',
    name: 'Cheap flops',
    cost: 7000,
    effect: 'Training time ×0.90',
  },
  'recruiter': {
    id: 'recruiter',
    name: 'Recruiter',
    cost: 12000,
    effect: 'Hire researcher cost ×0.85',
  },
  'brand': {
    id: 'brand',
    name: 'Brand studio',
    cost: 15000,
    effect: 'Market revenue ×1.10',
  },
  'mixture': {
    id: 'mixture',
    name: 'Mixture kernels',
    cost: 25000,
    effect: 'Model score ×1.12',
    requiresNodeId: 'optimizers',
    scoreMultiplier: 1.12,
  },
  'reasoning': {
    id: 'reasoning',
    name: 'Reasoning traces',
    cost: 80000,
    effect: 'Model score ×1.15',
    requiresNodeId: 'mixture',
    scoreMultiplier: 1.15,
  },
  'agent-harness': {
    id: 'agent-harness',
    name: 'Agent harness',
    cost: 200000,
    effect: 'Model score ×1.15, required for Frontier',
    requiresNodeId: 'reasoning',
    scoreMultiplier: 1.15,
  },
};

export const RESEARCH_NODE_ORDER: ResearchNodeId[] = [
  'clean-data',
  'optimizers',
  'cheap-flops',
  'recruiter',
  'brand',
  'mixture',
  'reasoning',
  'agent-harness',
];

// Events system constants and definitions from GAME_DESIGN.md
export const EVENT_CHECK_INTERVAL = 60; // 60s real time
export const EVENT_CHANCE = 0.25; // 25% chance
export const EVENT_COOLDOWN = 90; // 90s cooldown after any event
export const EVENT_TIMED_DURATION = 180; // 180s duration for timed events

export type EventId =
  | 'hype'
  | 'outage'
  | 'rules'
  | 'viral'
  | 'leak'
  | 'poach'
  | 'brownout'
  | 'surprise'
  | 'investor'
  | 'stumble'
  | 'dataset'
  | 'quiet';

export interface EventDefinition {
  id: EventId;
  title: string;
  description: string;
  isChoice?: boolean;
}

export const EVENTS: Record<EventId, EventDefinition> = {
  hype: {
    id: 'hype',
    title: 'Hype wave',
    description: 'An influential tech newsletter features your lab. For 180s, hype is at least 1.25 and reputation gains +8.',
  },
  outage: {
    id: 'outage',
    title: 'Chip outage',
    description: 'Cloud provider hardware supply chain disruption. For 180s, usable GPUs count as half (min 1).',
  },
  rules: {
    id: 'rules',
    title: 'Draft rules',
    description: 'Regulatory compliance review launched. For 180s, revenue is reduced by 20% and venture funding is paused.',
  },
  viral: {
    id: 'viral',
    title: 'Viral demo',
    description: 'An interactive demo built on your model spreads across social networks, generating immediate revenue and reputation.',
  },
  leak: {
    id: 'leak',
    title: 'Data leak',
    description: 'A configuration error exposed an internal training bucket. Data quality drops by 5 and reputation drops by 8.',
  },
  poach: {
    id: 'poach',
    title: 'Recruiter calls',
    description: 'A well-funded rival is courting your talent with inflated equity offers.',
    isChoice: true,
  },
  brownout: {
    id: 'brownout',
    title: 'Brownout',
    description: 'Substation maintenance forces local power reduction. Power cap is reduced by 2 for 180s (min 1).',
  },
  surprise: {
    id: 'surprise',
    title: 'Surprise benchmark',
    description: 'A newly released independent benchmark reassesses your public model with updated evaluation criteria.',
  },
  investor: {
    id: 'investor',
    title: 'Investor visit',
    description: 'A venture capitalist stops by the laboratory looking to make an off-cycle investment.',
    isChoice: true,
  },
  stumble: {
    id: 'stumble',
    title: 'Rival stumble',
    description: 'A rival lab releases a model with catastrophic regressions, cutting their market appeal in half for 180s.',
  },
  dataset: {
    id: 'dataset',
    title: 'Community dataset',
    description: 'An open collective publishes a meticulously cleaned multimodal benchmark dataset (+4 data quality).',
  },
  quiet: {
    id: 'quiet',
    title: 'Quiet week',
    description: 'Routine maintenance and quiet markets give your engineers room to optimize cache efficiency (+$500).',
  },
};

export const ALL_EVENT_IDS: EventId[] = [
  'hype',
  'outage',
  'rules',
  'viral',
  'leak',
  'poach',
  'brownout',
  'surprise',
  'investor',
  'stumble',
  'dataset',
  'quiet',
];

// Achievements definitions from GAME_DESIGN.md
export type AchievementId =
  | 'first-spark'
  | 'on-the-board'
  | 'pocket-lab'
  | 'full-house'
  | 'data-hoarder'
  | 'upset'
  | 'market-leader'
  | 'millionaire'
  | 'public-company'
  | 'night-shift'
  | 'new-era'
  | 'frontier';

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  rule: string;
  bonusText: string;
  scoreMultiplier?: number;
  revenueMultiplier?: number;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  'first-spark': {
    id: 'first-spark',
    name: 'First spark',
    rule: 'Finish training 1 model',
    bonusText: 'Score ×1.01',
    scoreMultiplier: 1.01,
  },
  'on-the-board': {
    id: 'on-the-board',
    name: 'On the board',
    rule: 'Launch 1 model',
    bonusText: 'Revenue ×1.01',
    revenueMultiplier: 1.01,
  },
  'pocket-lab': {
    id: 'pocket-lab',
    name: 'Pocket lab',
    rule: 'Own 5 GPUs',
    bonusText: 'Badge',
  },
  'full-house': {
    id: 'full-house',
    name: 'Full house',
    rule: 'Have 5 researchers',
    bonusText: 'Badge',
  },
  'data-hoarder': {
    id: 'data-hoarder',
    name: 'Data hoarder',
    rule: 'Data quality ≥ 60',
    bonusText: 'Badge',
  },
  'upset': {
    id: 'upset',
    name: 'Upset',
    rule: 'Your best score > Helix Atelier\'s best score',
    bonusText: 'Revenue ×1.01',
    revenueMultiplier: 1.01,
  },
  'market-leader': {
    id: 'market-leader',
    name: 'Market leader',
    rule: 'Market share ≥ 40% at any moment',
    bonusText: 'Revenue ×1.02',
    revenueMultiplier: 1.02,
  },
  'millionaire': {
    id: 'millionaire',
    name: 'Millionaire',
    rule: 'Cash on hand ≥ $1,000,000',
    bonusText: 'Badge',
  },
  'public-company': {
    id: 'public-company',
    name: 'Funded',
    rule: 'Take Series A funding',
    bonusText: 'Badge',
  },
  'night-shift': {
    id: 'night-shift',
    name: 'Night shift',
    rule: 'Return from at least 1 hour offline',
    bonusText: 'Badge',
  },
  'new-era': {
    id: 'new-era',
    name: 'New era',
    rule: 'Prestige once',
    bonusText: 'Score ×1.01',
    scoreMultiplier: 1.01,
  },
  'frontier': {
    id: 'frontier',
    name: 'Frontier light',
    rule: 'Launch a Frontier model',
    bonusText: 'Revenue ×1.02',
    revenueMultiplier: 1.02,
  },
};

export const ALL_ACHIEVEMENT_IDS: AchievementId[] = [
  'first-spark',
  'on-the-board',
  'pocket-lab',
  'full-house',
  'data-hoarder',
  'upset',
  'market-leader',
  'millionaire',
  'public-company',
  'night-shift',
  'new-era',
  'frontier',
];

export interface FundingDef {
  id: 'seed' | 'series-a' | 'series-b';
  name: string;
  cashAmount: number;
  salaryMultiplier: number;
  requiredBestScore: number;
}

export const FUNDING_ROUNDS: Record<string, FundingDef> = {
  seed: {
    id: 'seed',
    name: 'Seed',
    cashAmount: 40000,
    salaryMultiplier: 1.10,
    requiredBestScore: 0,
  },
  'series-a': {
    id: 'series-a',
    name: 'Series A',
    cashAmount: 180000,
    salaryMultiplier: 1.15,
    requiredBestScore: 80,
  },
  'series-b': {
    id: 'series-b',
    name: 'Series B',
    cashAmount: 750000,
    salaryMultiplier: 1.20,
    requiredBestScore: 220,
  },
};

// Model sizes
export interface ModelSizeDefinition {
  id: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'frontier';
  name: string;
  baseScore: number;
  baseSeconds: number;
  cashCost: number;
  minUsableGpus: number;
  minResearchers: number;
  requiredDescription: string;
}

export const MODEL_SIZES: Record<string, ModelSizeDefinition> = {
  tiny: {
    id: 'tiny',
    name: 'Tiny',
    baseScore: 12,
    baseSeconds: 30,
    cashCost: 350,
    minUsableGpus: 1,
    minResearchers: 1,
    requiredDescription: 'nothing',
  },
  small: {
    id: 'small',
    name: 'Small',
    baseScore: 36,
    baseSeconds: 84,
    cashCost: 1750,
    minUsableGpus: 2,
    minResearchers: 1,
    requiredDescription: 'nothing',
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    baseScore: 90,
    baseSeconds: 340,
    cashCost: 8400,
    minUsableGpus: 4,
    minResearchers: 2,
    requiredDescription: 'at least 1 model launched',
  },
  large: {
    id: 'large',
    name: 'Large',
    baseScore: 160,
    baseSeconds: 1500,
    cashCost: 60000,
    minUsableGpus: 8,
    minResearchers: 4,
    requiredDescription: 'at least 1 Medium launched',
  },
  huge: {
    id: 'huge',
    name: 'Huge',
    baseScore: 360,
    baseSeconds: 5400,
    cashCost: 250000,
    minUsableGpus: 16,
    minResearchers: 8,
    requiredDescription: 'Series A funding taken',
  },
  frontier: {
    id: 'frontier',
    name: 'Frontier',
    baseScore: 800,
    baseSeconds: 21600,
    cashCost: 1000000,
    minUsableGpus: 32,
    minResearchers: 12,
    requiredDescription: 'Series B taken AND research node agent-harness owned',
  },
};

// Rival start definitions (Era 1)
export interface RivalDefinition {
  id: string;
  name: string;
  style: string;
  startingBestScore: number;
  startingStockPrice: number;
  speedMultiplier: number;
  growthFactor: number;
  hypeMultiplier?: number;
}

export const RIVALS_ERA_1: RivalDefinition[] = [
  {
    id: 'helix',
    name: 'ChatGPT',
    style: 'Balanced, slightly ahead',
    startingBestScore: 18,
    startingStockPrice: 120,
    speedMultiplier: 1.30,
    growthFactor: 1.056,
  },
  {
    id: 'pebble',
    name: 'DeepSeek',
    style: 'Many small models',
    startingBestScore: 9,
    startingStockPrice: 40,
    speedMultiplier: 0.91,
    growthFactor: 1.010,
  },
  {
    id: 'northglass',
    name: 'Gemini',
    style: 'Slow, larger models',
    startingBestScore: 14,
    startingStockPrice: 80,
    speedMultiplier: 1.82,
    growthFactor: 1.084,
  },
  {
    id: 'vesper',
    name: 'Grok',
    style: 'Hype, average models',
    startingBestScore: 11,
    startingStockPrice: 55,
    speedMultiplier: 1.30,
    growthFactor: 1.035,
    hypeMultiplier: 1.15,
  },
];

// Model name ladders
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

export function getRivalModelName(rivalId: string, score: number): string {
  const ladderMap: Record<string, readonly string[]> = {
    helix: OPENAI_LADDER,
    pebble: DEEPSEEK_LADDER,
    northglass: GEMINI_LADDER,
    vesper: GROK_LADDER,
    copperline: LLAMA_LADDER,
    bracket: MISTRAL_LADDER,
  };
  const ladder = ladderMap[rivalId] ?? OPENAI_LADDER;
  const idx = Math.min(ladder.length - 1, Math.max(0, Math.floor(Math.max(0, score - 8) / 10)));
  return ladder[idx];
}

// Product name word lists from GAME_DESIGN.md
export const NAME_ADJECTIVES = [
  'Quiet', 'Amber', 'Brisk', 'Little', 'Copper', 'Velvet', 'Paper', 'North',
  'Kind', 'Rapid', 'Soft', 'Bold', 'Glass', 'Lucky', 'Drift', 'Moss',
  'Bright', 'Plain', 'Silver', 'Warm',
] as const;

export const NAME_NOUNS = [
  'Lantern', 'Sparrow', 'Kettle', 'Harbor', 'Notebook', 'Orbit', 'Meadow',
  'Anvil', 'Comet', 'Basket', 'Lighthouse', 'Marble', 'Willow', 'Pocket',
  'Echo', 'Furnace', 'Sail', 'Pebble', 'Chorus', 'Atlas',
] as const;
