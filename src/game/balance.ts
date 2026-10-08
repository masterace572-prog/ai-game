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

// Temporary stipend (early phases only, until rival market revenue exists)
export const TEMP_STIPEND_PER_SEC = 1;

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

export function getResearcherPrice(researchersOwned: number): number {
  return Math.round(RESEARCHER_BASE_COST * Math.pow(RESEARCHER_COST_GROWTH, researchersOwned));
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
