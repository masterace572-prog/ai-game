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

export type ResearchNodeId =
  | 'clean-data'
  | 'optimizers'
  | 'cheap-flops'
  | 'recruiter'
  | 'brand'
  | 'mixture'
  | 'reasoning'
  | 'agent-harness';

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

export interface ActiveTimedEvent {
  id: EventId;
  title: string;
  remainingSeconds: number;
  targetRivalId?: string;
  scoreDeltaMultiplier?: number;
}

export interface EventLogEntry {
  id: string;
  eventId: EventId;
  title: string;
  outcomeText: string;
  timestamp: number;
}

export interface PendingEvent {
  id: EventId;
  title: string;
  description: string;
  isChoice?: boolean;
  choice1Label?: string;
  choice2Label?: string;
  cost?: number;
  rivalId?: string;
  reputationChange?: number;
}

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
  allTimeBestScore?: number;
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

  // Research tree state (Phase 6)
  researchOwned: Partial<Record<ResearchNodeId, boolean>>;

  // Events system state (Phase 7)
  eventCooldownTimer: number; // cooldown in seconds before next event can roll (90s default)
  eventRollTimer: number; // 60s timer between roll checks
  pendingEvent: PendingEvent | null;
  activeTimedEvents: ActiveTimedEvent[];
  eventLogs: EventLogEntry[]; // last 30 events

  // Achievements state (Phase 7)
  achievements: Partial<Record<AchievementId, boolean>>;
  timesPrestiged: number;

  // Tutorial state (Phase 7)
  tutorialStep: number;
  tutorialDone: boolean;

  // Settings & Accessibility (Phase 8)
  soundEnabled: boolean;
  reduceMotion: boolean;
}
