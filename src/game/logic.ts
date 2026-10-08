import {
  MODEL_SIZES,
  NAME_ADJECTIVES,
  NAME_NOUNS,
  TEMP_STIPEND_PER_SEC,
  getGpuPrice,
  getResearcherPrice,
  getDataUpgradePrice,
  getCoolingPrice,
} from './balance';
import type { GameState, ModelSizeId, TrainedModel, TrainingJob } from './types';

export { getGpuPrice, getResearcherPrice, getDataUpgradePrice, getCoolingPrice };

/**
 * Usable GPUs is the smaller of GPUs owned and power cap.
 */
export function getUsableGpus(gpusOwned: number, powerCap: number): number {
  return Math.max(1, Math.min(gpusOwned, powerCap));
}

/**
 * Training time calculation according to GAME_DESIGN.md:
 * usable = min(gpusOwned, powerCap)
 * speed = 1 + (usable - 1) * 0.08
 * seconds = baseSeconds / speed
 * seconds = max(seconds, baseSeconds * 0.20)
 * Then apply research and achievement time multipliers.
 */
export function calculateTrainingTime(
  baseSeconds: number,
  usableGpus: number,
  researchTimeMultiplier: number = 1,
  achievementTimeMultiplier: number = 1
): number {
  const effectiveGpus = Math.max(1, usableGpus);
  const speed = 1 + (effectiveGpus - 1) * 0.08;
  const rawSeconds = baseSeconds / speed;
  const floored = Math.max(rawSeconds, baseSeconds * 0.20);
  return floored * researchTimeMultiplier * achievementTimeMultiplier;
}

/**
 * Helper specifically for Tiny model training time.
 */
export function getTinyTrainingTime(usableGpus: number): number {
  return calculateTrainingTime(MODEL_SIZES.tiny.baseSeconds, usableGpus);
}

/**
 * Score formula from GAME_DESIGN.md:
 * quality = 0.65 + 0.35 * (dataQuality / 100)
 * talent = 1 + min(0.50, researchers * 0.03)
 * arch = researchScoreMultiplier (starts at 1)
 * eraBonus = 1 + eraPoints * 0.02
 * achievementScoreBonus (starts at 1)
 * roll = random from 0.92 to 1.08 inclusive
 * score = max(1, round(baseScore * quality * talent * arch * eraBonus * achievementScoreBonus * roll))
 */
export function calculateScore(
  baseScore: number,
  dataQuality: number,
  researchers: number,
  archMultiplier: number = 1,
  eraPoints: number = 0,
  achievementScoreBonus: number = 1,
  roll?: number
): number {
  const quality = 0.65 + 0.35 * (dataQuality / 100);
  const talent = 1 + Math.min(0.50, researchers * 0.03);
  const arch = archMultiplier;
  const eraBonus = 1 + eraPoints * 0.02;
  const rollVal = roll !== undefined ? roll : 0.92 + Math.random() * (1.08 - 0.92);
  const calculated = baseScore * quality * talent * arch * eraBonus * achievementScoreBonus * rollVal;
  return Math.max(1, Math.round(calculated));
}

/**
 * Score range expected before confirmation (roll between 0.92 and 1.08).
 */
export function getExpectedScoreRange(
  baseScore: number,
  dataQuality: number,
  researchers: number,
  archMultiplier: number = 1,
  eraPoints: number = 0,
  achievementScoreBonus: number = 1
): { min: number; max: number } {
  return {
    min: calculateScore(baseScore, dataQuality, researchers, archMultiplier, eraPoints, achievementScoreBonus, 0.92),
    max: calculateScore(baseScore, dataQuality, researchers, archMultiplier, eraPoints, achievementScoreBonus, 1.08),
  };
}

/**
 * Pick adjective + noun from design lists. Do not repeat a name used this era.
 * If exhausted, append a number suffix ("Quiet Lantern 2").
 */
export function generateModelName(usedNames: string[]): string {
  const usedSet = new Set(usedNames);
  const allCombos: string[] = [];

  for (const adj of NAME_ADJECTIVES) {
    for (const noun of NAME_NOUNS) {
      allCombos.push(`${adj} ${noun}`);
    }
  }

  const unused = allCombos.filter((name) => !usedSet.has(name));
  if (unused.length > 0) {
    const pick = unused[Math.floor(Math.random() * unused.length)];
    return pick;
  }

  let suffix = 2;
  while (true) {
    const candidates = allCombos
      .map((c) => `${c} ${suffix}`)
      .filter((name) => !usedSet.has(name));
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    suffix++;
  }
}

/**
 * Start training a model (Phase 2 focuses on Tiny).
 */
export function startTraining(state: GameState, sizeId: ModelSizeId = 'tiny'): GameState {
  const modelDef = MODEL_SIZES[sizeId];
  if (!modelDef) return state;
  if (state.cash < modelDef.cashCost) return state;
  if (state.currentTraining !== null || state.readyModel !== null) return state;

  const usable = getUsableGpus(state.gpus, state.powerCap);
  const totalSeconds = calculateTrainingTime(modelDef.baseSeconds, usable);
  const rolledScore = calculateScore(modelDef.baseScore, state.dataQuality, state.researchers);
  const proposedName = generateModelName(state.usedModelNames);

  const job: TrainingJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sizeId,
    progressSeconds: 0,
    totalSeconds,
    rolledScore,
    proposedName,
  };

  return {
    ...state,
    cash: state.cash - modelDef.cashCost,
    currentTraining: job,
  };
}

/**
 * Advance the simulation by deltaSeconds.
 * Capped at 1.0 second per tick to prevent hitches granting minutes.
 */
export function stepGame(
  state: GameState,
  deltaSeconds: number
): { state: GameState; modelFinished: boolean } {
  const cappedDelta = Math.min(Math.max(deltaSeconds, 0), 1.0);
  if (cappedDelta <= 0) {
    return { state, modelFinished: false };
  }

  // Temporary stipend of $1/sec
  const incomeEarned = TEMP_STIPEND_PER_SEC * cappedDelta;
  const newCash = state.cash + incomeEarned;
  const newLifetime = state.lifetimeCashEarned + incomeEarned;

  let currentTraining = state.currentTraining;
  let readyModel = state.readyModel;
  let modelFinished = false;
  let usedModelNames = state.usedModelNames;

  if (currentTraining) {
    const newProgress = currentTraining.progressSeconds + cappedDelta;
    if (newProgress >= currentTraining.totalSeconds) {
      // Training complete: create ready-to-launch model
      modelFinished = true;
      readyModel = {
        id: currentTraining.id,
        name: currentTraining.proposedName,
        sizeId: currentTraining.sizeId,
        score: currentTraining.rolledScore,
        trainedAt: Date.now(),
        launched: false,
      };
      usedModelNames = [...usedModelNames, currentTraining.proposedName];
      currentTraining = null;
    } else {
      currentTraining = {
        ...currentTraining,
        progressSeconds: newProgress,
      };
    }
  }

  return {
    state: {
      ...state,
      cash: newCash,
      lifetimeCashEarned: newLifetime,
      currentTraining,
      readyModel,
      usedModelNames,
      lastTickTime: Date.now(),
    },
    modelFinished,
  };
}

/**
 * Launch the ready model.
 */
export function launchModel(state: GameState): GameState {
  if (!state.readyModel) return state;

  const launched: TrainedModel = {
    ...state.readyModel,
    launched: true,
    launchedAt: Date.now(),
  };

  const isNewBest = !state.bestLaunchedModel || launched.score > state.bestLaunchedModel.score;
  const bestLaunchedModel = isNewBest ? launched : state.bestLaunchedModel;

  return {
    ...state,
    readyModel: null,
    launchedModels: [launched, ...state.launchedModels],
    bestLaunchedModel,
  };
}
