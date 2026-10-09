export type ProductId =
  | 'chat'
  | 'api'
  | 'code'
  | 'enterprise'
  | 'mobile'
  | 'science'
  | 'robots';

export interface ProductDef {
  id: ProductId;
  name: string;
  iconName: 'MessageSquare' | 'Plug' | 'Code' | 'Building2' | 'Smartphone' | 'Atom' | 'Bot';
  unlockStep: number; // -1 for start, 1 for Claude Instant, 4 for Haiku, etc.
  unlockModelName: string;
  baseCost: number;
  costGrowth: number;
  incomePerLevel: number;
}

export type FundingRoundId = 'seed' | 'series-a' | 'series-b' | 'series-c' | 'series-d';

export interface FundingDef {
  id: FundingRoundId;
  name: string;
  requiredStep: number;
  requiredModelName: string;
  multiplier: number;
  minLumpSum: number;
  requirementText: string;
}

export interface BuildingDef {
  index: number;
  id: string;
  name: string;
  cost: number;
  multiplier: number;
  description: string;
}

export interface RivalState {
  id: string;
  name: string;
  shortCode: string;
  strength: number;
  step: number;
  timer: number;
}

export interface TrainingJob {
  step: number;
  progress: number;
  total: number;
}

export interface EventLogEntry {
  id: string;
  title: string;
  outcomeText: string;
  timestamp: number;
}

export type BuyAmount = '1' | '10' | 'max';

export interface ManagerDef {
  id: string;
  name: string;
  role: string;
  cost: number;
  productId?: ProductId;
  type: 'product' | 'training_lead' | 'launch_lead';
  description: string;
  multiplier?: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  category: 'product' | 'global' | 'training';
  productId?: ProductId;
  multiplier: number;
  description: string;
}

export interface GameState {
  version: 2;
  savedAt: number;
  labName: string;
  cash: number;
  lifetimeEarned: number;
  modelStep: number; // -1 at start
  training: TrainingJob | null;
  readyStep: number | null;
  products: Record<ProductId, number>;
  rivals: RivalState[];
  stocks: Record<string, number>;
  fundingTaken: Record<string, boolean>;
  people: {
    engineers: number;
    sales: number;
    researchers: number;
  };
  gpuClusters: number;
  buildings: number;
  lastTickTime: number;
  soundEnabled: boolean;
  reduceMotion: boolean;
  showFreshStartSheet?: boolean;
  achievements?: Partial<Record<string, boolean>>;
  tutorialDone?: boolean;
  eventLogs?: EventLogEntry[];
  // v0.4.0 additions
  managers?: Record<string, boolean>;
  managerAutoBuy?: Record<string, boolean>;
  upgrades?: Record<string, boolean>;
  buyAmount?: BuyAmount;
  autoBuyAccumulator?: number;
  // v0.5.0 additions
  vibrationEnabled?: boolean;
  lastDoubleAt?: number;
  dailyStreak?: number;
  lastDailyClaimDate?: string;
  day7BonusTimer?: number;
  viralLaunchTimer?: number;
  goldenGpuBuffTimer?: number;
  hypeWaveTimer?: number;
  dataDealActive?: boolean;
  outageTimer?: number;
  lawsuitPenaltyTimer?: number;
  nextEventRollTime?: number;
}

export interface FloaterItem {
  id: number;
  x: number;
  y: number;
  amount: string;
  color?: string; // 'var(--money)' or 'var(--gold)'
}

export type EventChoiceModalData =
  | {
      type: 'lawsuit';
      title: string;
      desc: string;
      settleCost: number;
    }
  | {
      type: 'talent_poach';
      title: string;
      desc: string;
      counterCost: number;
    }
  | null;

export type AchievementId =
  | 'first_model'
  | 'chat_10'
  | 'chat_50'
  | 'hire_engineer'
  | 'claude_2'
  | 'claude_3_opus'
  | 'seed_funding'
  | 'first_million'
  | 'market_leader'
  | 'server_room';

