import {
  MODEL_SIZES,
  NAME_ADJECTIVES,
  NAME_NOUNS,
  BASE_DEMAND,
  DEMAND_GROWTH_PER_ERA,
  SUBSCRIPTION_SHARE,
  API_SHARE,
  FRESHNESS_DECAY_PER_MIN,
  FRESHNESS_FLOOR,
  REPUTATION_DECAY_PER_MIN,
  COOLING_UPGRADE_POWER_CAP,
  COOLING_MAX_PURCHASES,
  DATA_UPGRADE_AMOUNT,
  DATA_CENTERS,
  DATA_CENTER_UPKEEP_PER_SEC,
  BASE_SALARY_PER_RESEARCHER_PER_SEC,
  OFFICE_SNACKS_COST,
  OFFICE_SNACKS_SALARY_MULT,
  MARKETING_CAMPAIGN_COST,
  MARKETING_CAMPAIGN_DURATION,
  MARKETING_CAMPAIGN_COOLDOWN,
  MARKETING_HYPE_BOOST,
  STOCK_MAX_SHARES,
  STOCK_SELL_FEE,
  FUNDING_ROUNDS,
  getGpuPrice,
  getResearcherPrice,
  getDataUpgradePrice,
  getCoolingPrice,
} from './balance';
import type {
  GameState,
  ModelSizeId,
  RivalState,
  TrainedModel,
  TrainingJob,
} from './types';

export {
  getGpuPrice,
  getResearcherPrice,
  getDataUpgradePrice,
  getCoolingPrice,
  DATA_CENTERS,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  STOCK_SELL_FEE,
};

/**
 * NPC training base durations from GAME_DESIGN.md:
 * Tiny 20s, Small 45s, Medium 90s, Large 180s, Huge 300s, Frontier 600s
 */
export const NPC_BASE_SECONDS: Record<ModelSizeId, number> = {
  tiny: 20,
  small: 45,
  medium: 90,
  large: 180,
  huge: 300,
  frontier: 600,
};

/**
 * Usable GPUs is the smaller of GPUs owned and power cap.
 */
export function getUsableGpus(gpusOwned: number, powerCap: number): number {
  return Math.max(1, Math.min(gpusOwned, powerCap));
}

/**
 * Data center score multiplier (+0.02 each).
 */
export function getDataCenterScoreMultiplier(dataCentersOwned: number): number {
  return Math.pow(1.02, dataCentersOwned);
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
 * arch = researchScoreMultiplier * dataCenterMultiplier
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
 * Model unlock rules according to GAME_DESIGN.md:
 * - Tiny: nothing
 * - Small: nothing
 * - Medium: at least 1 model launched
 * - Large: at least 1 Medium launched
 * - Huge: Series A funding taken
 * - Frontier: Series B taken AND research node agent-harness owned
 */
export function getModelUnlockStatus(
  sizeId: ModelSizeId,
  state: GameState
): { unlocked: boolean; reason?: string } {
  switch (sizeId) {
    case 'tiny':
    case 'small':
      return { unlocked: true };
    case 'medium': {
      const hasLaunchedAny = state.launchedModels.length > 0;
      if (!hasLaunchedAny) {
        return { unlocked: false, reason: 'Requires at least 1 model launched' };
      }
      return { unlocked: true };
    }
    case 'large': {
      const hasLaunchedMedium = state.launchedModels.some((m) => m.sizeId === 'medium');
      if (!hasLaunchedMedium) {
        return { unlocked: false, reason: 'Requires at least 1 Medium launched' };
      }
      return { unlocked: true };
    }
    case 'huge':
      if (!state.fundingTaken?.['series-a']) {
        return { unlocked: false, reason: 'Requires Series A funding' };
      }
      return { unlocked: true };
    case 'frontier':
      return { unlocked: false, reason: 'Requires Series B and agent-harness research' };
    default:
      return { unlocked: false, reason: 'Locked' };
  }
}

/**
 * Check whether a model can be trained right now (unlocked, can afford, not busy).
 */
export function canTrainModel(
  sizeId: ModelSizeId,
  state: GameState
): { canTrain: boolean; reason?: string } {
  const unlockStatus = getModelUnlockStatus(sizeId, state);
  if (!unlockStatus.unlocked) {
    return { canTrain: false, reason: unlockStatus.reason };
  }

  const modelDef = MODEL_SIZES[sizeId];
  if (!modelDef) {
    return { canTrain: false, reason: 'Invalid model size' };
  }

  if (state.currentTraining !== null || state.readyModel !== null) {
    return { canTrain: false, reason: 'Training already in progress' };
  }

  const usableGpus = getUsableGpus(state.gpus, state.powerCap);
  if (usableGpus < modelDef.minUsableGpus) {
    return {
      canTrain: false,
      reason: `Requires ${modelDef.minUsableGpus} usable GPUs (you have ${usableGpus})`,
    };
  }

  if (state.researchers < modelDef.minResearchers) {
    return {
      canTrain: false,
      reason: `Requires ${modelDef.minResearchers} researchers (you have ${state.researchers})`,
    };
  }

  if (state.cash < modelDef.cashCost) {
    return {
      canTrain: false,
      reason: `Need $${modelDef.cashCost.toLocaleString()} (you have $${Math.floor(state.cash).toLocaleString()})`,
    };
  }

  return { canTrain: true };
}

/**
 * Appeal formula from GAME_DESIGN.md:
 * appeal = score * freshness * (1 + reputation / 250) * hypeMultiplier
 */
export function calculateAppeal(
  score: number,
  freshness: number,
  reputation: number = 0,
  hypeMultiplier: number = 1.0
): number {
  return score * freshness * (1 + reputation / 250) * hypeMultiplier;
}

/**
 * Player appeal is derived from their best launched model.
 * Unlaunched models have no appeal (0).
 */
export function getPlayerAppeal(state: GameState): number {
  if (!state.bestLaunchedModel) return 0;
  const hype = state.marketingActiveSeconds > 0 ? MARKETING_HYPE_BOOST : 1.0;
  return calculateAppeal(
    state.bestLaunchedModel.score,
    state.playerFreshness ?? 1.0,
    state.reputation ?? 0,
    hype
  );
}

/**
 * Rival appeal: score * freshness * (1 + 0/250) * hypeMultiplier.
 */
export function getRivalAppeal(rival: RivalState): number {
  return calculateAppeal(
    rival.bestScore,
    rival.freshness,
    0,
    rival.hypeMultiplier
  );
}

export interface MarketBreakdown {
  playerAppeal: number;
  rivalAppeals: Record<string, number>;
  totalAppeal: number;
  playerShare: number; // 0 to 1
  demand: number;
  revenuePerSec: number;
  subscriptionRevenue: number;
  apiRevenue: number;
}

/**
 * Market revenue formula from GAME_DESIGN.md:
 * yourAppeal = appeal of best launched model, or 0 if none
 * totalAppeal = yourAppeal + sum of rivals
 * share = yourAppeal / totalAppeal
 * demand = 6 * (1.55 ^ (era - 1))
 * revenuePerSec = demand * share * marketingRevenueMultiplier * achievementRevenueBonus
 * Split: 65% subscriptions, 35% API
 */
export function calculateMarket(state: GameState): MarketBreakdown {
  const playerAppeal = getPlayerAppeal(state);
  const rivalAppeals: Record<string, number> = {};
  let totalAppeal = playerAppeal;

  for (const rival of state.rivals ?? []) {
    const appeal = getRivalAppeal(rival);
    rivalAppeals[rival.id] = appeal;
    totalAppeal += appeal;
  }

  const playerShare = totalAppeal > 0 ? playerAppeal / totalAppeal : 0;
  const demand = BASE_DEMAND * Math.pow(DEMAND_GROWTH_PER_ERA, (state.era || 1) - 1);
  const revenuePerSec = demand * playerShare;
  const subscriptionRevenue = revenuePerSec * SUBSCRIPTION_SHARE;
  const apiRevenue = revenuePerSec * API_SHARE;

  return {
    playerAppeal,
    rivalAppeals,
    totalAppeal,
    playerShare,
    demand,
    revenuePerSec,
    subscriptionRevenue,
    apiRevenue,
  };
}

/**
 * Salaries and upkeep calculations:
 * salaries = 0.15 * researchers * salaryMultiplier
 * dataCenterUpkeep = 0.20 * dataCentersOwned
 */
export function getSalariesPerSec(researchers: number, salaryMultiplier: number): number {
  return BASE_SALARY_PER_RESEARCHER_PER_SEC * researchers * salaryMultiplier;
}

export function getDataCenterUpkeepPerSec(dataCentersOwned: number): number {
  return DATA_CENTER_UPKEEP_PER_SEC * dataCentersOwned;
}

export function getTotalOutflowPerSec(state: GameState): number {
  const salaries = getSalariesPerSec(state.researchers, state.salaryMultiplier ?? 1.0);
  const upkeep = getDataCenterUpkeepPerSec(state.dataCentersOwned ?? 0);
  return salaries + upkeep;
}

/**
 * Real net cash rate per second for TopBar and Lab screen.
 */
export function getIncomePerSec(state: GameState): {
  income: number;
  grossRevenue: number;
  salaries: number;
  upkeep: number;
  label: string;
} {
  const { revenuePerSec } = calculateMarket(state);
  const salaries = getSalariesPerSec(state.researchers, state.salaryMultiplier ?? 1.0);
  const upkeep = getDataCenterUpkeepPerSec(state.dataCentersOwned ?? 0);
  const net = revenuePerSec - (salaries + upkeep);

  return {
    income: net,
    grossRevenue: revenuePerSec,
    salaries,
    upkeep,
    label: 'Net cash flow',
  };
}

/**
 * Stock price calculation:
 * price = max(10, round(rivalBestScore * 3 + 20))
 */
export function calculateStockPrice(rivalBestScore: number): number {
  return Math.max(10, Math.round(rivalBestScore * 3 + 20));
}

/**
 * Stock sell proceeds:
 * 2% fee -> pays 98%
 */
export function getStockSellProceeds(price: number, shares: number = 1): number {
  return price * (1 - STOCK_SELL_FEE) * shares;
}

// --- Player Economy Actions ---

export function buyGpu(state: GameState): GameState {
  const cost = getGpuPrice(state.gpus);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    gpus: state.gpus + 1,
  };
}

export function hireResearcher(state: GameState): GameState {
  const cost = getResearcherPrice(state.researchers);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    researchers: state.researchers + 1,
  };
}

export function buyCooling(state: GameState): GameState {
  if ((state.coolingPurchases ?? 0) >= COOLING_MAX_PURCHASES) return state;
  const cost = getCoolingPrice(state.coolingPurchases ?? 0);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    coolingPurchases: (state.coolingPurchases ?? 0) + 1,
    powerCap: state.powerCap + COOLING_UPGRADE_POWER_CAP,
  };
}

export function buyOfficeSnacks(state: GameState): GameState {
  if (state.officeSnacks) return state;
  if (state.cash < OFFICE_SNACKS_COST) return state;

  return {
    ...state,
    cash: state.cash - OFFICE_SNACKS_COST,
    officeSnacks: true,
    salaryMultiplier: (state.salaryMultiplier ?? 1.0) * OFFICE_SNACKS_SALARY_MULT,
  };
}

export function upgradeDataQuality(state: GameState): GameState {
  if (state.dataQuality >= 100) return state;
  const cost = getDataUpgradePrice(state.dataQuality);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    dataQuality: Math.min(100, state.dataQuality + DATA_UPGRADE_AMOUNT),
  };
}

export function buyDataCenter(state: GameState): GameState {
  const nextTier = state.dataCentersOwned ?? 0;
  if (nextTier >= DATA_CENTERS.length) return state;
  const def = DATA_CENTERS[nextTier];
  if (state.cash < def.cost) return state;

  return {
    ...state,
    cash: state.cash - def.cost,
    dataCentersOwned: nextTier + 1,
    powerCap: state.powerCap + def.powerCapAdded,
  };
}

export function buyStock(state: GameState, rivalId: string, sharesCount: number = 1): GameState {
  const rival = state.rivals.find((r) => r.id === rivalId);
  if (!rival) return state;

  const currentShares = state.stocksOwned?.[rivalId] ?? 0;
  const availableToBuy = Math.min(sharesCount, STOCK_MAX_SHARES - currentShares);
  if (availableToBuy <= 0) return state;

  const cost = rival.stockPrice * availableToBuy;
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    stocksOwned: {
      ...state.stocksOwned,
      [rivalId]: currentShares + availableToBuy,
    },
  };
}

export function sellStock(state: GameState, rivalId: string, sharesCount: number = 1): GameState {
  const rival = state.rivals.find((r) => r.id === rivalId);
  if (!rival) return state;

  const currentShares = state.stocksOwned?.[rivalId] ?? 0;
  const availableToSell = Math.min(sharesCount, currentShares);
  if (availableToSell <= 0) return state;

  const proceeds = getStockSellProceeds(rival.stockPrice, availableToSell);

  return {
    ...state,
    cash: state.cash + proceeds,
    stocksOwned: {
      ...state.stocksOwned,
      [rivalId]: currentShares - availableToSell,
    },
  };
}

export function canTakeFunding(
  fundingId: 'seed' | 'series-a' | 'series-b',
  state: GameState
): { canTake: boolean; reason?: string } {
  if (state.fundingTaken?.[fundingId]) {
    return { canTake: false, reason: 'Already taken this era' };
  }

  const def = FUNDING_ROUNDS[fundingId];
  const bestScore = state.bestLaunchedModel?.score ?? 0;
  if (bestScore < def.requiredBestScore) {
    return {
      canTake: false,
      reason: `Requires best launched score ≥ ${def.requiredBestScore}`,
    };
  }

  return { canTake: true };
}

export function takeFunding(
  fundingId: 'seed' | 'series-a' | 'series-b',
  state: GameState
): GameState {
  const check = canTakeFunding(fundingId, state);
  if (!check.canTake) return state;

  const def = FUNDING_ROUNDS[fundingId];
  return {
    ...state,
    cash: state.cash + def.cashAmount,
    salaryMultiplier: (state.salaryMultiplier ?? 1.0) * def.salaryMultiplier,
    fundingTaken: {
      ...state.fundingTaken,
      [fundingId]: true,
    },
  };
}

export function startMarketingCampaign(state: GameState): GameState {
  if (
    (state.marketingActiveSeconds ?? 0) > 0 ||
    (state.marketingCooldownSeconds ?? 0) > 0
  ) {
    return state;
  }
  if (state.cash < MARKETING_CAMPAIGN_COST) return state;

  return {
    ...state,
    cash: state.cash - MARKETING_CAMPAIGN_COST,
    marketingActiveSeconds: MARKETING_CAMPAIGN_DURATION,
    marketingCooldownSeconds: 0,
  };
}

/**
 * Start training a model for any of the six sizes.
 */
export function startTraining(state: GameState, sizeId: ModelSizeId): GameState {
  const check = canTrainModel(sizeId, state);
  if (!check.canTrain) return state;

  const modelDef = MODEL_SIZES[sizeId];
  const usable = getUsableGpus(state.gpus, state.powerCap);
  const totalSeconds = calculateTrainingTime(modelDef.baseSeconds, usable);
  const archMult = getDataCenterScoreMultiplier(state.dataCentersOwned ?? 0);
  const rolledScore = calculateScore(
    modelDef.baseScore,
    state.dataQuality,
    state.researchers,
    archMult
  );
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
 * Ticks player training, player freshness/reputation decay, market revenue,
 * salaries/upkeep drain, stock prices timer, marketing campaign timer,
 * and rival training/launch timers.
 */
export function stepGame(
  state: GameState,
  deltaSeconds: number
): { state: GameState; modelFinished: boolean } {
  const cappedDelta = Math.min(Math.max(deltaSeconds, 0), 1.0);
  if (cappedDelta <= 0) {
    return { state, modelFinished: false };
  }

  // 1. Decay player freshness (0.015 / 60 per sec, floor 0.40)
  const freshnessDecayPerSec = FRESHNESS_DECAY_PER_MIN / 60;
  let playerFreshness = state.playerFreshness ?? 1.0;
  if (state.bestLaunchedModel) {
    playerFreshness = Math.max(FRESHNESS_FLOOR, playerFreshness - freshnessDecayPerSec * cappedDelta);
  }

  // 2. Decay player reputation (0.2 / 60 per sec, floor 0, max 100)
  const reputationDecayPerSec = REPUTATION_DECAY_PER_MIN / 60;
  const reputation = Math.max(0, (state.reputation ?? 0) - reputationDecayPerSec * cappedDelta);

  // 3. Marketing Campaign timers
  let marketingActiveSeconds = state.marketingActiveSeconds ?? 0;
  let marketingCooldownSeconds = state.marketingCooldownSeconds ?? 0;
  if (marketingActiveSeconds > 0) {
    marketingActiveSeconds = Math.max(0, marketingActiveSeconds - cappedDelta);
    if (marketingActiveSeconds === 0) {
      marketingCooldownSeconds = MARKETING_CAMPAIGN_COOLDOWN;
    }
  } else if (marketingCooldownSeconds > 0) {
    marketingCooldownSeconds = Math.max(0, marketingCooldownSeconds - cappedDelta);
  }

  // 4. Stock Price Timer (recalculates every 30 seconds)
  let stockPriceTimer = (state.stockPriceTimer ?? 30) - cappedDelta;
  const recalculateStockPrices = stockPriceTimer <= 0;
  if (recalculateStockPrices) {
    stockPriceTimer = 30;
  }

  // 5. Step rivals
  const updatedRivals: RivalState[] = (state.rivals ?? []).map((rival) => {
    let rivalFreshness = Math.max(
      FRESHNESS_FLOOR,
      rival.freshness - freshnessDecayPerSec * cappedDelta
    );
    let bestScore = rival.bestScore;
    let trainingJob = rival.trainingJob;
    let idleTimer = rival.idleTimer;
    let stockPrice = recalculateStockPrices ? calculateStockPrice(bestScore) : rival.stockPrice;

    if (trainingJob) {
      const progress = trainingJob.progressSeconds + cappedDelta;
      if (progress >= trainingJob.totalSeconds) {
        rivalFreshness = 1.0;
        const flatBonus = 1;
        const randomFactor = 0.95 + Math.random() * 0.10;
        const calculatedJump = Math.round(bestScore * rival.growthFactor * randomFactor + flatBonus);
        const maxScore = Math.round(bestScore * 1.40);
        const newScore = Math.min(maxScore, calculatedJump);
        if (newScore > bestScore) {
          bestScore = newScore;
          stockPrice = calculateStockPrice(bestScore);
        }
        trainingJob = null;
        idleTimer = 5 + Math.random() * 10;
      } else {
        trainingJob = {
          ...trainingJob,
          progressSeconds: progress,
        };
      }
    } else {
      idleTimer -= cappedDelta;
      if (idleTimer <= 0) {
        const sizes = rival.preferredSizes;
        const pickedSize = sizes[Math.floor(Math.random() * sizes.length)] ?? 'tiny';
        const baseSec = NPC_BASE_SECONDS[pickedSize] ?? 30;
        const totalSeconds = baseSec * rival.speedMultiplier;
        trainingJob = {
          sizeId: pickedSize,
          progressSeconds: 0,
          totalSeconds,
        };
      }
    }

    return {
      ...rival,
      bestScore,
      freshness: rivalFreshness,
      stockPrice,
      trainingJob,
      idleTimer,
    };
  });

  // Interim state for market calculation
  const interimState: GameState = {
    ...state,
    playerFreshness,
    reputation,
    marketingActiveSeconds,
    marketingCooldownSeconds,
    rivals: updatedRivals,
  };

  // 6. Revenue and salaries/upkeep drain
  const { revenuePerSec } = calculateMarket(interimState);
  const totalOutflowPerSec = getTotalOutflowPerSec(interimState);
  const netRate = revenuePerSec - totalOutflowPerSec;
  const netDelta = netRate * cappedDelta;

  let newCash = state.cash + netDelta;
  let payrollTight = false;

  if (newCash <= 0) {
    newCash = 0;
    if (netRate < 0) {
      payrollTight = true;
    }
  }

  const grossEarned = revenuePerSec * cappedDelta;
  const newLifetime = state.lifetimeCashEarned + Math.max(0, grossEarned);

  // 7. Step player training
  let currentTraining = state.currentTraining;
  let readyModel = state.readyModel;
  let modelFinished = false;
  let usedModelNames = state.usedModelNames;

  if (currentTraining) {
    const newProgress = currentTraining.progressSeconds + cappedDelta;
    if (newProgress >= currentTraining.totalSeconds) {
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
      ...interimState,
      cash: newCash,
      lifetimeCashEarned: newLifetime,
      currentTraining,
      readyModel,
      usedModelNames,
      stockPriceTimer,
      payrollTight,
      lastTickTime: Date.now(),
    },
    modelFinished,
  };
}

/**
 * Launch the ready model.
 * Resets player freshness to 1.0, awards reputation (+2 + score/50, cap 100).
 */
export function launchModel(state: GameState): GameState {
  if (!state.readyModel) return state;

  const score = state.readyModel.score;
  const launched: TrainedModel = {
    ...state.readyModel,
    launched: true,
    launchedAt: Date.now(),
  };

  const isNewBest = !state.bestLaunchedModel || score > state.bestLaunchedModel.score;
  const bestLaunchedModel = isNewBest ? launched : state.bestLaunchedModel;

  const reputationGain = 2 + score / 50;
  const newReputation = Math.min(100, (state.reputation ?? 0) + reputationGain);

  return {
    ...state,
    readyModel: null,
    launchedModels: [launched, ...state.launchedModels],
    bestLaunchedModel,
    playerFreshness: 1.0,
    reputation: newReputation,
  };
}
