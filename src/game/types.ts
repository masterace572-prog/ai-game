export type ModelSizeId = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'frontier';

export const MODEL_SIZE_ORDER: ModelSizeId[] = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'frontier',
];

export interface TrainedModel {
  id: string;
  name: string;
  sizeId: ModelSizeId;
  score: number;
  trainedAt: number;
  launched: boolean;
  launchedAt?: number;
}

export interface TrainingJob {
  id: string;
  sizeId: ModelSizeId;
  progressSeconds: number;
  totalSeconds: number;
  rolledScore: number;
  proposedName: string;
}

export interface RivalTrainingJob {
  sizeId: ModelSizeId;
  progressSeconds: number;
  totalSeconds: number;
}

export interface RivalState {
  id: string;
  name: string;
  shortCode: string; // Monogram: HA, PM, NG, VW
  style: string;
  bestScore: number;
  freshness: number;
  stockPrice: number;
  speedMultiplier: number;
  growthFactor: number;
  hypeMultiplier: number;
  preferredSizes: ModelSizeId[];
  trainingJob: RivalTrainingJob | null;
  idleTimer: number;
}

export type FundingRoundId = 'seed' | 'series-a' | 'series-b';

export interface GameState {
  version: 1;
  savedAt: number;
  labName: string;
  labNameConfirmed: boolean;
  cash: number;
  gpus: number;
  powerCap: number;
  researchers: number;
  dataQuality: number;
  reputation: number;
  era: number;
  eraPoints: number;
  usedModelNames: string[];
  currentTraining: TrainingJob | null;
  readyModel: TrainedModel | null;
  bestLaunchedModel: TrainedModel | null;
  launchedModels: TrainedModel[];
  lifetimeCashEarned: number;
  lastTickTime: number;
  playerFreshness: number;
  rivals: RivalState[];

  // Economy state (Phase 5)
  coolingPurchases: number; // 0 to 5
  officeSnacks: boolean;
  salaryMultiplier: number;
  dataCentersOwned: number; // 0 to 4
  stocksOwned: Record<string, number>; // rivalId -> shares (max 200)
  stockPriceTimer: number; // ticks every 30s
  fundingTaken: Record<string, boolean>; // seed, series-a, series-b
  marketingActiveSeconds: number; // remaining duration of hype
  marketingCooldownSeconds: number; // cooldown before next campaign
  payrollTight: boolean;
}
