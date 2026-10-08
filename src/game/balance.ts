// Balance constants from GAME_DESIGN.md
// This file is the single source of truth for gameplay numbers.

export const SAVE_KEY = 'modelfoundry.save.v1';
export const BACKUP_SAVE_KEY = 'modelfoundry.save.backup';

export const APP_VERSION = '0.1.1';
export const DEFAULT_LAB_NAME = 'Little Lamp Lab';

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
    cost: 3000,
    effect: 'Data quality +5, once',
  },
  'optimizers': {
    id: 'optimizers',
    name: 'Better optimizers',
    cost: 8000,
    effect: 'Model score ×1.08',
    scoreMultiplier: 1.08,
  },
  'cheap-flops': {
    id: 'cheap-flops',
    name: 'Cheap flops',
    cost: 10000,
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
    cashCost: 500,
    minUsableGpus: 1,
    minResearchers: 1,
    requiredDescription: 'nothing',
  },
  small: {
    id: 'small',
    name: 'Small',
    baseScore: 28,
    baseSeconds: 120,
    cashCost: 2500,
    minUsableGpus: 2,
    minResearchers: 1,
    requiredDescription: 'nothing',
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    baseScore: 70,
    baseSeconds: 480,
    cashCost: 12000,
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
    name: 'Helix Atelier',
    style: 'Balanced, slightly ahead',
    startingBestScore: 18,
    startingStockPrice: 120,
    speedMultiplier: 1.0,
    growthFactor: 1.08,
  },
  {
    id: 'pebble',
    name: 'Pebble Mind',
    style: 'Many small models',
    startingBestScore: 9,
    startingStockPrice: 40,
    speedMultiplier: 0.7,
    growthFactor: 1.04,
  },
  {
    id: 'northglass',
    name: 'Northglass',
    style: 'Slow, larger models',
    startingBestScore: 14,
    startingStockPrice: 80,
    speedMultiplier: 1.4,
    growthFactor: 1.12,
  },
  {
    id: 'vesper',
    name: 'Vesper Workshop',
    style: 'Hype, average models',
    startingBestScore: 11,
    startingStockPrice: 55,
    speedMultiplier: 1.0,
    growthFactor: 1.05,
    hypeMultiplier: 1.15,
  },
];

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
