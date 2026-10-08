export type ModelSizeId = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'frontier';

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
}
