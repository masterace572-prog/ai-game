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
  RESEARCH_NODES,
  RESEARCH_NODE_ORDER,
  EVENT_CHECK_INTERVAL,
  EVENT_CHANCE,
  EVENT_COOLDOWN,
  EVENT_TIMED_DURATION,
  EVENTS,
  ALL_EVENT_IDS,
  ACHIEVEMENTS,
  ALL_ACHIEVEMENT_IDS,
  OFFLINE_CAP_SECONDS,
  STARTING_CASH,
  STARTING_GPUS,
  STARTING_POWER_CAP,
  STARTING_RESEARCHERS,
  STARTING_DATA_QUALITY,
  STARTING_REPUTATION,
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
  ResearchNodeId,
  EventId,
  AchievementId,
  ActiveTimedEvent,
  EventLogEntry,
  PendingEvent,
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
  RESEARCH_NODES,
  RESEARCH_NODE_ORDER,
  EVENTS,
  ACHIEVEMENTS,
  ALL_EVENT_IDS,
  ALL_ACHIEVEMENT_IDS,
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
 * If chip outage event is active, count as half, rounded down, minimum 1.
 */
export function getUsableGpus(gpusOwned: number, powerCap: number, hasOutage: boolean = false): number {
  const baseUsable = Math.max(1, Math.min(gpusOwned, powerCap));
  return hasOutage ? Math.max(1, Math.floor(baseUsable / 2)) : baseUsable;
}

export function getEffectivePowerCap(state: GameState): number {
  const hasBrownout = (state.activeTimedEvents ?? []).some((e) => e.id === 'brownout');
  return hasBrownout ? Math.max(1, state.powerCap - 2) : state.powerCap;
}

export function getEffectiveUsableGpus(state: GameState): number {
  const effectiveCap = getEffectivePowerCap(state);
  const hasOutage = (state.activeTimedEvents ?? []).some((e) => e.id === 'outage');
  return getUsableGpus(state.gpus, effectiveCap, hasOutage);
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
export function getTinyTrainingTime(usableGpus: number, researchTimeMultiplier: number = 1): number {
  return calculateTrainingTime(MODEL_SIZES.tiny.baseSeconds, usableGpus, researchTimeMultiplier);
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
    case 'huge': {
      const usableGpus = getUsableGpus(state.gpus, state.powerCap);
      if (!state.fundingTaken?.['series-a']) {
        return { unlocked: false, reason: 'Requires Series A funding' };
      }
      if (usableGpus < 16) {
        return { unlocked: false, reason: `Requires 16 usable GPUs (${usableGpus} online)` };
      }
      if (state.researchers < 8) {
        return { unlocked: false, reason: `Requires 8 researchers (${state.researchers} on staff)` };
      }
      return { unlocked: true };
    }
    case 'frontier': {
      const usableGpus = getUsableGpus(state.gpus, state.powerCap);
      const hasSeriesB = Boolean(state.fundingTaken?.['series-b']);
      const hasAgentHarness = Boolean(state.researchOwned?.['agent-harness']);

      if (!hasSeriesB && !hasAgentHarness) {
        return { unlocked: false, reason: 'Requires Series B and Agent harness' };
      }
      if (!hasSeriesB) {
        return { unlocked: false, reason: 'Requires Series B funding' };
      }
      if (!hasAgentHarness) {
        return { unlocked: false, reason: 'Requires Agent harness research' };
      }
      if (usableGpus < 32) {
        return { unlocked: false, reason: `Requires 32 usable GPUs (${usableGpus} online)` };
      }
      if (state.researchers < 12) {
        return { unlocked: false, reason: `Requires 12 researchers (${state.researchers} on staff)` };
      }
      return { unlocked: true };
    }
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
  const eventHype = (state.activeTimedEvents ?? []).some((e) => e.id === 'hype') ? 1.25 : 1.0;
  const marketingHype = state.marketingActiveSeconds > 0 ? MARKETING_HYPE_BOOST : 1.0;
  const hype = Math.max(marketingHype, eventHype);
  return calculateAppeal(
    state.bestLaunchedModel.score,
    state.playerFreshness ?? 1.0,
    state.reputation ?? 0,
    hype
  );
}

/**
 * Rival appeal: score * freshness * (1 + 0/250) * hypeMultiplier.
 * If stumble event is active for this rival, appeal is multiplied by 0.50.
 */
export function getRivalAppeal(rival: RivalState, state?: GameState): number {
  const stumble = state?.activeTimedEvents?.find(
    (e) => e.id === 'stumble' && e.targetRivalId === rival.id
  );
  const stumbleMult = stumble ? 0.50 : 1.0;
  return calculateAppeal(
    rival.bestScore,
    rival.freshness,
    0,
    rival.hypeMultiplier * stumbleMult
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
 * revenuePerSec = demand * share * brandMultiplier * achievementRevenueBonus * rulesMultiplier
 * Split: 65% subscriptions, 35% API
 */
export function calculateMarket(state: GameState): MarketBreakdown {
  const playerAppeal = getPlayerAppeal(state);
  const rivalAppeals: Record<string, number> = {};
  let totalAppeal = playerAppeal;

  for (const rival of state.rivals ?? []) {
    const appeal = getRivalAppeal(rival, state);
    rivalAppeals[rival.id] = appeal;
    totalAppeal += appeal;
  }

  const playerShare = totalAppeal > 0 ? playerAppeal / totalAppeal : 0;
  const demand = BASE_DEMAND * Math.pow(DEMAND_GROWTH_PER_ERA, (state.era || 1) - 1);
  const brandMultiplier = state.researchOwned?.['brand'] ? 1.10 : 1.0;
  const achRevenueMultiplier = getAchievementRevenueMultiplier(state);
  const rulesMultiplier = (state.activeTimedEvents ?? []).some((e) => e.id === 'rules') ? 0.80 : 1.0;
  const revenuePerSec = demand * playerShare * brandMultiplier * achRevenueMultiplier * rulesMultiplier;
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
  const hasRecruiter = Boolean(state.researchOwned?.['recruiter']);
  const cost = getResearcherPrice(state.researchers, hasRecruiter);
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
  if ((state.activeTimedEvents ?? []).some((e) => e.id === 'rules')) {
    return { canTake: false, reason: 'Funding paused by draft rules' };
  }

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

// --- Research Tree (Phase 6) ---

export function getResearchScoreMultiplier(state: GameState): number {
  let mult = 1.0;
  if (state.researchOwned?.['optimizers']) mult *= 1.08;
  if (state.researchOwned?.['mixture']) mult *= 1.12;
  if (state.researchOwned?.['reasoning']) mult *= 1.15;
  if (state.researchOwned?.['agent-harness']) mult *= 1.15;
  return mult;
}

export function getAchievementScoreMultiplier(state: GameState): number {
  let mult = 1.0;
  if (state.achievements?.['first-spark']) mult *= 1.01;
  if (state.achievements?.['new-era']) mult *= 1.01;
  return mult;
}

export function getAchievementRevenueMultiplier(state: GameState): number {
  let mult = 1.0;
  if (state.achievements?.['on-the-board']) mult *= 1.01;
  if (state.achievements?.['upset']) mult *= 1.01;
  if (state.achievements?.['market-leader']) mult *= 1.02;
  if (state.achievements?.['frontier']) mult *= 1.02;
  return mult;
}

export function getTotalScoreMultiplier(state: GameState): number {
  return (
    getResearchScoreMultiplier(state) *
    getDataCenterScoreMultiplier(state.dataCentersOwned ?? 0) *
    getAchievementScoreMultiplier(state)
  );
}

export function hasActiveEvent(state: GameState, eventId: EventId): boolean {
  return (state.activeTimedEvents ?? []).some((e) => e.id === eventId);
}

export function checkAchievements(state: GameState): {
  nextState: GameState;
  newlyUnlocked: AchievementId[];
} {
  const current = state.achievements ?? {};
  const newlyUnlocked: AchievementId[] = [];
  const nextAchievements = { ...current };

  const helix = state.rivals?.find((r) => r.id === 'helix');
  const market = calculateMarket(state);

  const checks: Record<AchievementId, boolean> = {
    'first-spark': state.launchedModels.length > 0 || state.readyModel !== null || (state.usedModelNames?.length ?? 0) > 0,
    'on-the-board': state.launchedModels.length > 0,
    'pocket-lab': state.gpus >= 5,
    'full-house': state.researchers >= 5,
    'data-hoarder': state.dataQuality >= 60,
    'upset': (state.bestLaunchedModel?.score ?? 0) > (helix?.bestScore ?? 18),
    'market-leader': market.playerShare >= 0.40,
    'millionaire': state.cash >= 1000000,
    'public-company': Boolean(state.fundingTaken?.['series-a']),
    'night-shift': Boolean(current['night-shift']),
    'new-era': (state.timesPrestiged ?? 0) >= 1,
    'frontier': state.launchedModels.some((m) => m.sizeId === 'frontier'),
  };

  for (const [idStr, condition] of Object.entries(checks)) {
    const id = idStr as AchievementId;
    if (condition && !current[id]) {
      nextAchievements[id] = true;
      newlyUnlocked.push(id);
    }
  }

  if (newlyUnlocked.length === 0) {
    return { nextState: state, newlyUnlocked: [] };
  }

  return {
    nextState: {
      ...state,
      achievements: nextAchievements,
    },
    newlyUnlocked,
  };
}

// --- Events System (Phase 7) ---

export function canRollEvent(state: GameState): boolean {
  if (!state.tutorialDone) return false;
  if (state.pendingEvent !== null) return false;
  if ((state.eventCooldownTimer ?? 0) > 0) return false;
  return true;
}

export function rollEvent(
  state: GameState,
  forcedRoll?: number,
  forcedEventId?: EventId
): { nextState: GameState; eventFired: boolean; eventId?: EventId } {
  if (!canRollEvent(state)) {
    return { nextState: state, eventFired: false };
  }

  const roll = forcedRoll !== undefined ? forcedRoll : Math.random();
  if (roll >= EVENT_CHANCE) {
    return { nextState: state, eventFired: false };
  }

  const eventId =
    forcedEventId ??
    ALL_EVENT_IDS[Math.floor(Math.random() * ALL_EVENT_IDS.length)];

  const def = EVENTS[eventId];
  let title = def.title;
  let description = def.description;
  let isChoice = Boolean(def.isChoice);
  let choice1Label: string | undefined;
  let choice2Label: string | undefined;
  let rivalId: string | undefined;

  switch (eventId) {
    case 'poach':
      choice1Label = 'Counteroffer ($5,000)';
      choice2Label = 'Let them walk';
      break;
    case 'investor':
      if ((state.reputation ?? 0) >= 20) {
        choice1Label = 'Accept ($15,000)';
        choice2Label = 'Decline';
      } else {
        isChoice = false;
        description =
          'An investor scout stopped by, but passed on your early-stage lab. Build reputation ≥ 20 to attract venture capital.';
      }
      break;
    case 'stumble':
      if (state.rivals && state.rivals.length > 0) {
        const target = state.rivals[Math.floor(Math.random() * state.rivals.length)];
        rivalId = target.id;
        description = `${target.name} suffered a public model hallucination incident. Their market appeal is halved for 180s.`;
      }
      break;
    default:
      break;
  }

  const pending: PendingEvent = {
    id: eventId,
    title,
    description,
    isChoice,
    choice1Label,
    choice2Label,
    rivalId,
  };

  return {
    nextState: {
      ...state,
      pendingEvent: pending,
      eventRollTimer: EVENT_CHECK_INTERVAL,
    },
    eventFired: true,
    eventId,
  };
}

export function resolveEvent(
  state: GameState,
  choiceIndex: 0 | 1 = 0
): GameState {
  const pending = state.pendingEvent;
  if (!pending) return state;

  const eventId = pending.id;
  let nextCash = state.cash;
  let nextResearchers = state.researchers;
  let nextDataQuality = state.dataQuality;
  let nextReputation = state.reputation ?? 0;
  let nextSalaryMult = state.salaryMultiplier ?? 1.0;
  let nextBestModel = state.bestLaunchedModel ? { ...state.bestLaunchedModel } : null;
  const nextActiveTimedEvents = [...(state.activeTimedEvents ?? [])];
  let outcomeText = '';

  switch (eventId) {
    case 'hype':
      nextReputation = Math.min(100, nextReputation + 8);
      nextActiveTimedEvents.push({
        id: 'hype',
        title: 'Hype wave',
        remainingSeconds: EVENT_TIMED_DURATION,
      });
      outcomeText = 'Hype wave: +8 reputation and hype boost active for 180s.';
      break;

    case 'outage':
      nextActiveTimedEvents.push({
        id: 'outage',
        title: 'Chip outage',
        remainingSeconds: EVENT_TIMED_DURATION,
      });
      outcomeText = 'Chip outage: usable GPUs halved for 180s.';
      break;

    case 'rules':
      nextActiveTimedEvents.push({
        id: 'rules',
        title: 'Draft rules',
        remainingSeconds: EVENT_TIMED_DURATION,
      });
      outcomeText = 'Draft rules: revenue −20% and funding rounds paused for 180s.';
      break;

    case 'viral': {
      const market = calculateMarket(state);
      const currentRev = market.revenuePerSec;
      const cashBonus = 20 * currentRev * 30;
      nextCash += cashBonus;
      nextReputation = Math.min(100, nextReputation + 10);
      outcomeText = `Viral demo: earned $${Math.round(cashBonus).toLocaleString()} cash and +10 reputation.`;
      break;
    }

    case 'leak':
      nextDataQuality = Math.max(0, nextDataQuality - 5);
      nextReputation = Math.max(0, nextReputation - 8);
      outcomeText = 'Data leak: data quality −5 and reputation −8.';
      break;

    case 'poach':
      if (choiceIndex === 0) {
        if (nextCash >= 5000) {
          nextCash -= 5000;
          outcomeText = 'Recruiter calls: paid $5,000 retention bonus to keep research talent.';
        } else {
          if (nextResearchers >= 2) {
            nextResearchers -= 1;
            outcomeText = 'Recruiter calls: unable to pay $5,000; 1 researcher departed.';
          } else {
            outcomeText = 'Recruiter calls: researcher decided to stay despite low cash.';
          }
        }
      } else {
        if (nextResearchers >= 2) {
          nextResearchers -= 1;
          outcomeText = 'Recruiter calls: declined to counteroffer; 1 researcher departed.';
        } else {
          outcomeText = 'Recruiter calls: lead researcher decided to stay despite rival interest.';
        }
      }
      break;

    case 'brownout':
      nextActiveTimedEvents.push({
        id: 'brownout',
        title: 'Brownout',
        remainingSeconds: EVENT_TIMED_DURATION,
      });
      outcomeText = 'Brownout: power cap reduced by 2 for 180s.';
      break;

    case 'surprise':
      if (nextBestModel) {
        const factor = Math.random() < 0.5 ? 1.08 : 0.92;
        const newScore = Math.max(1, Math.round(nextBestModel.score * factor));
        outcomeText = `Surprise benchmark: ${nextBestModel.name} score adjusted from ${nextBestModel.score} to ${newScore} (${factor > 1 ? '+8%' : '−8%'}).`;
        nextBestModel.score = newScore;
      } else {
        outcomeText = 'Surprise benchmark: no public model to test.';
      }
      break;

    case 'investor':
      if ((state.reputation ?? 0) >= 20 && choiceIndex === 0) {
        nextCash += 15000;
        nextSalaryMult *= 1.05;
        outcomeText = 'Investor visit: accepted $15,000 cash; researcher salary expectations ×1.05.';
      } else {
        outcomeText = 'Investor visit: declined investor proposition.';
      }
      break;

    case 'stumble': {
      const targetId = pending.rivalId || state.rivals?.[0]?.id;
      const targetRival = state.rivals?.find((r) => r.id === targetId);
      if (targetId) {
        nextActiveTimedEvents.push({
          id: 'stumble',
          title: 'Rival stumble',
          remainingSeconds: EVENT_TIMED_DURATION,
          targetRivalId: targetId,
        });
      }
      outcomeText = `Rival stumble: ${targetRival?.name ?? 'Rival'} appeal cut by 50% for 180s.`;
      break;
    }

    case 'dataset':
      nextDataQuality = Math.min(100, nextDataQuality + 4);
      outcomeText = 'Community dataset: data quality increased by +4.';
      break;

    case 'quiet':
      nextCash += 500;
      outcomeText = 'Quiet week: collected +$500 in cloud optimization savings.';
      break;
  }

  const logEntry: EventLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventId,
    title: pending.title,
    outcomeText,
    timestamp: Date.now(),
  };

  const nextLogs = [logEntry, ...(state.eventLogs ?? [])].slice(0, 30);

  return {
    ...state,
    cash: nextCash,
    researchers: nextResearchers,
    dataQuality: nextDataQuality,
    reputation: nextReputation,
    salaryMultiplier: nextSalaryMult,
    bestLaunchedModel: nextBestModel,
    activeTimedEvents: nextActiveTimedEvents,
    pendingEvent: null,
    eventCooldownTimer: EVENT_COOLDOWN,
    eventLogs: nextLogs,
  };
}

export function canBuyResearchNode(
  nodeId: ResearchNodeId,
  state: GameState
): { canBuy: boolean; reason?: string } {
  if (state.researchOwned?.[nodeId]) {
    return { canBuy: false, reason: 'Researched' };
  }

  const def = RESEARCH_NODES[nodeId];
  if (!def) {
    return { canBuy: false, reason: 'Unknown node' };
  }

  if (def.requiresNodeId && !state.researchOwned?.[def.requiresNodeId]) {
    const parentDef = RESEARCH_NODES[def.requiresNodeId];
    return { canBuy: false, reason: `Requires ${parentDef?.name ?? def.requiresNodeId}` };
  }

  if (state.cash < def.cost) {
    return { canBuy: false, reason: `Need $${def.cost.toLocaleString()}` };
  }

  return { canBuy: true };
}

export function buyResearchNode(
  state: GameState,
  nodeId: ResearchNodeId
): GameState {
  const check = canBuyResearchNode(nodeId, state);
  if (!check.canBuy) return state;

  const def = RESEARCH_NODES[nodeId];
  const nextResearchOwned = {
    ...state.researchOwned,
    [nodeId]: true,
  };

  let nextDataQuality = state.dataQuality;
  if (nodeId === 'clean-data') {
    nextDataQuality = Math.min(100, state.dataQuality + 5);
  }

  return {
    ...state,
    cash: state.cash - def.cost,
    dataQuality: nextDataQuality,
    researchOwned: nextResearchOwned,
  };
}

/**
 * Start training a model for any of the six sizes.
 */
export function startTraining(state: GameState, sizeId: ModelSizeId): GameState {
  const check = canTrainModel(sizeId, state);
  if (!check.canTrain) return state;

  const modelDef = MODEL_SIZES[sizeId];
  const usable = getEffectiveUsableGpus(state);
  const timeMult = state.researchOwned?.['cheap-flops'] ? 0.90 : 1.0;
  const totalSeconds = calculateTrainingTime(modelDef.baseSeconds, usable, timeMult);
  const archMult = getTotalScoreMultiplier(state);
  const achScoreBonus = getAchievementScoreMultiplier(state);
  const rolledScore = calculateScore(
    modelDef.baseScore,
    state.dataQuality,
    state.researchers,
    archMult,
    state.eraPoints ?? 0,
    achScoreBonus
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
): {
  state: GameState;
  modelFinished: boolean;
  newlyUnlockedAchievements?: AchievementId[];
} {
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

  // Step active timed events (decrement remainingSeconds)
  const updatedTimedEvents: ActiveTimedEvent[] = (state.activeTimedEvents ?? [])
    .map((ev) => ({ ...ev, remainingSeconds: ev.remainingSeconds - cappedDelta }))
    .filter((ev) => ev.remainingSeconds > 0);

  // Step event cooldown and roll timer
  const eventCooldownTimer = Math.max(0, (state.eventCooldownTimer ?? 0) - cappedDelta);
  let eventRollTimer = (state.eventRollTimer ?? EVENT_CHECK_INTERVAL) - cappedDelta;
  let pendingEvent = state.pendingEvent;

  if (eventRollTimer <= 0) {
    eventRollTimer = EVENT_CHECK_INTERVAL;
    const testState = {
      ...state,
      activeTimedEvents: updatedTimedEvents,
      eventCooldownTimer,
      pendingEvent: null,
    };
    if (canRollEvent(testState)) {
      const rolled = rollEvent(testState);
      if (rolled.eventFired && rolled.nextState.pendingEvent) {
        pendingEvent = rolled.nextState.pendingEvent;
      }
    }
  }

  // Interim state for market calculation
  const interimState: GameState = {
    ...state,
    playerFreshness,
    reputation,
    marketingActiveSeconds,
    marketingCooldownSeconds,
    rivals: updatedRivals,
    activeTimedEvents: updatedTimedEvents,
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

  const rawNextState: GameState = {
    ...interimState,
    cash: newCash,
    lifetimeCashEarned: newLifetime,
    currentTraining,
    readyModel,
    usedModelNames,
    stockPriceTimer,
    payrollTight,
    activeTimedEvents: updatedTimedEvents,
    eventCooldownTimer,
    eventRollTimer,
    pendingEvent,
    lastTickTime: Date.now(),
  };

  const { nextState: finalizedState, newlyUnlocked } = checkAchievements(rawNextState);

  return {
    state: finalizedState,
    modelFinished,
    newlyUnlockedAchievements: newlyUnlocked,
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

  const updated: GameState = {
    ...state,
    readyModel: null,
    launchedModels: [launched, ...state.launchedModels],
    bestLaunchedModel,
    playerFreshness: 1.0,
    reputation: newReputation,
  };

  return checkAchievements(updated).nextState;
}

export interface OfflineReport {
  awaySeconds: number;
  simulatedSeconds: number;
  capped: boolean;
  netCash: number;
  modelsFinished: string[];
  rivalsLaunched: string[];
  eventsResolved: string[];
}

/**
 * Simulate catch-up when player returns after being away.
 * - Caps simulation at 8 hours (OFFLINE_CAP_SECONDS).
 * - Steps in 30-second increments to avoid locking thread.
 * - Auto-resolves at most 3 events (choice 0).
 * - Awards night-shift achievement if away >= 1 hour.
 * - Skips modal if away < 5 seconds.
 */
export function simulateOfflineCatchUp(
  state: GameState,
  nowMs: number
): { nextState: GameState; report: OfflineReport | null } {
  const lastTime = state.savedAt ?? state.lastTickTime ?? nowMs;
  const awaySeconds = Math.max(0, (nowMs - lastTime) / 1000);

  if (awaySeconds < 5) {
    return {
      nextState: { ...state, lastTickTime: nowMs, savedAt: nowMs },
      report: null,
    };
  }

  const simulatedSeconds = Math.min(awaySeconds, OFFLINE_CAP_SECONDS);
  const isCapped = awaySeconds > OFFLINE_CAP_SECONDS;

  let current = { ...state };
  const initialCash = current.cash;
  const modelsFinished: string[] = [];
  const rivalsLaunchedSet = new Set<string>();
  const eventsResolved: string[] = [];

  let eventsFiredCount = 0;
  const stepDuration = 30; // 30-second steps
  const totalSteps = Math.floor(simulatedSeconds / stepDuration);
  const remainderSeconds = simulatedSeconds % stepDuration;

  const advanceStep = (stepSec: number) => {
    // 1. Decay freshness & reputation
    const freshnessDecay = (FRESHNESS_DECAY_PER_MIN / 60) * stepSec;
    if (current.bestLaunchedModel) {
      current.playerFreshness = Math.max(FRESHNESS_FLOOR, (current.playerFreshness ?? 1.0) - freshnessDecay);
    }
    const reputationDecay = (REPUTATION_DECAY_PER_MIN / 60) * stepSec;
    current.reputation = Math.max(0, (current.reputation ?? 0) - reputationDecay);

    // 2. Marketing timers
    if ((current.marketingActiveSeconds ?? 0) > 0) {
      current.marketingActiveSeconds = Math.max(0, (current.marketingActiveSeconds ?? 0) - stepSec);
      if (current.marketingActiveSeconds === 0) {
        current.marketingCooldownSeconds = MARKETING_CAMPAIGN_COOLDOWN;
      }
    } else if ((current.marketingCooldownSeconds ?? 0) > 0) {
      current.marketingCooldownSeconds = Math.max(0, (current.marketingCooldownSeconds ?? 0) - stepSec);
    }

    // 3. Stock recalculation
    current.stockPriceTimer = (current.stockPriceTimer ?? 30) - stepSec;
    let recalcStock = false;
    if (current.stockPriceTimer <= 0) {
      current.stockPriceTimer = 30;
      recalcStock = true;
    }

    // 4. Advance rivals
    current.rivals = (current.rivals ?? []).map((rival) => {
      let rivalFreshness = Math.max(FRESHNESS_FLOOR, rival.freshness - freshnessDecay);
      let bestScore = rival.bestScore;
      let trainingJob = rival.trainingJob;
      let idleTimer = rival.idleTimer;
      let stockPrice = recalcStock ? calculateStockPrice(bestScore) : rival.stockPrice;

      if (trainingJob) {
        const progress = trainingJob.progressSeconds + stepSec;
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
          rivalsLaunchedSet.add(rival.name);
        } else {
          trainingJob = { ...trainingJob, progressSeconds: progress };
        }
      } else {
        idleTimer -= stepSec;
        if (idleTimer <= 0) {
          const sizes = rival.preferredSizes;
          const pickedSize = sizes[Math.floor(Math.random() * sizes.length)] ?? 'tiny';
          const baseSec = NPC_BASE_SECONDS[pickedSize] ?? 30;
          trainingJob = {
            sizeId: pickedSize,
            progressSeconds: 0,
            totalSeconds: baseSec * rival.speedMultiplier,
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

    // 5. Active timed events
    current.activeTimedEvents = (current.activeTimedEvents ?? [])
      .map((ev) => ({ ...ev, remainingSeconds: ev.remainingSeconds - stepSec }))
      .filter((ev) => ev.remainingSeconds > 0);

    // 6. Check events (at most 3 for the entire offline period)
    current.eventCooldownTimer = Math.max(0, (current.eventCooldownTimer ?? 0) - stepSec);
    current.eventRollTimer = (current.eventRollTimer ?? EVENT_CHECK_INTERVAL) - stepSec;
    if (eventsFiredCount < 3 && current.eventRollTimer <= 0) {
      current.eventRollTimer = EVENT_CHECK_INTERVAL;
      const roll = rollEvent(current);
      if (roll.eventFired && roll.nextState.pendingEvent) {
        eventsFiredCount += 1;
        eventsResolved.push(roll.nextState.pendingEvent.title);
        current = resolveEvent(roll.nextState, 0);
      }
    }

    // 7. Market revenue and salaries/upkeep drain
    const { revenuePerSec } = calculateMarket(current);
    const totalOutflowPerSec = getTotalOutflowPerSec(current);
    const netRate = revenuePerSec - totalOutflowPerSec;
    const netDelta = netRate * stepSec;

    current.cash += netDelta;
    if (current.cash <= 0) {
      current.cash = 0;
      if (netRate < 0) current.payrollTight = true;
    } else {
      current.payrollTight = false;
    }
    current.lifetimeCashEarned += Math.max(0, revenuePerSec * stepSec);

    // 8. Player training progress
    if (current.currentTraining) {
      const newProgress = current.currentTraining.progressSeconds + stepSec;
      if (newProgress >= current.currentTraining.totalSeconds) {
        modelsFinished.push(current.currentTraining.proposedName);
        current.readyModel = {
          id: current.currentTraining.id,
          name: current.currentTraining.proposedName,
          sizeId: current.currentTraining.sizeId,
          score: current.currentTraining.rolledScore,
          trainedAt: nowMs,
          launched: false,
        };
        current.usedModelNames = [...current.usedModelNames, current.currentTraining.proposedName];
        current.currentTraining = null;
      } else {
        current.currentTraining = {
          ...current.currentTraining,
          progressSeconds: newProgress,
        };
      }
    }
  };

  for (let i = 0; i < totalSteps; i++) {
    advanceStep(stepDuration);
  }
  if (remainderSeconds > 0) {
    advanceStep(remainderSeconds);
  }

  // Check night-shift achievement if away >= 1 hour (3600s)
  if (awaySeconds >= 3600) {
    current.achievements = {
      ...(current.achievements ?? {}),
      'night-shift': true,
    };
  }

  current.lastTickTime = nowMs;
  current.savedAt = nowMs;

  const { nextState: finalizedState } = checkAchievements(current);
  const netCash = finalizedState.cash - initialCash;

  const report: OfflineReport = {
    awaySeconds: Math.round(awaySeconds),
    simulatedSeconds: Math.round(simulatedSeconds),
    capped: isCapped,
    netCash,
    modelsFinished,
    rivalsLaunched: Array.from(rivalsLaunchedSet),
    eventsResolved,
  };

  return { nextState: finalizedState, report };
}

/**
 * Seed rivals for a given Era.
 * - Era 1: Helix Atelier (18), Pebble Mind (9), Northglass (14), Vesper Workshop (11).
 * - Era 2+: Scales older rivals' starting scores by 1 + 0.15 * (era - 1).
 *   Adds Copperline (30 * era, stock 100) and Bracket Research (36 * era, stock 110).
 */
export function createRivalsForEra(era: number = 1): RivalState[] {
  const safeEra = Math.max(1, era);
  const scale = 1 + 0.15 * (safeEra - 1);

  const helixScore = Math.round(18 * scale);
  const pebbleScore = Math.round(9 * scale);
  const northglassScore = Math.round(14 * scale);
  const vesperScore = Math.round(11 * scale);

  const rivals: RivalState[] = [
    {
      id: 'helix',
      name: 'Helix Atelier',
      shortCode: 'HA',
      style: 'Balanced, slightly ahead',
      bestScore: helixScore,
      freshness: 1.0,
      stockPrice: safeEra === 1 ? 120 : calculateStockPrice(helixScore),
      speedMultiplier: 1.0,
      growthFactor: 1.08,
      hypeMultiplier: 1.0,
      preferredSizes: ['medium', 'large'],
      trainingJob: null,
      idleTimer: 5,
    },
    {
      id: 'pebble',
      name: 'Pebble Mind',
      shortCode: 'PM',
      style: 'Many small models',
      bestScore: pebbleScore,
      freshness: 1.0,
      stockPrice: safeEra === 1 ? 40 : calculateStockPrice(pebbleScore),
      speedMultiplier: 0.7,
      growthFactor: 1.04,
      hypeMultiplier: 1.0,
      preferredSizes: ['tiny', 'small'],
      trainingJob: null,
      idleTimer: 3,
    },
    {
      id: 'northglass',
      name: 'Northglass',
      shortCode: 'NG',
      style: 'Slow, larger models',
      bestScore: northglassScore,
      freshness: 1.0,
      stockPrice: safeEra === 1 ? 80 : calculateStockPrice(northglassScore),
      speedMultiplier: 1.4,
      growthFactor: 1.12,
      hypeMultiplier: 1.0,
      preferredSizes: ['medium', 'large'],
      trainingJob: null,
      idleTimer: 8,
    },
    {
      id: 'vesper',
      name: 'Vesper Workshop',
      shortCode: 'VW',
      style: 'Hype, average models',
      bestScore: vesperScore,
      freshness: 1.0,
      stockPrice: safeEra === 1 ? 55 : calculateStockPrice(vesperScore),
      speedMultiplier: 1.0,
      growthFactor: 1.05,
      hypeMultiplier: 1.15,
      preferredSizes: ['small', 'medium'],
      trainingJob: null,
      idleTimer: 4,
    },
  ];

  if (safeEra >= 2) {
    rivals.push(
      {
        id: 'copperline',
        name: 'Copperline',
        shortCode: 'CL',
        style: 'Enterprise compute',
        bestScore: 30 * safeEra,
        freshness: 1.0,
        stockPrice: 100,
        speedMultiplier: 1.1,
        growthFactor: 1.09,
        hypeMultiplier: 1.0,
        preferredSizes: ['medium', 'large', 'huge'],
        trainingJob: null,
        idleTimer: 6,
      },
      {
        id: 'bracket',
        name: 'Bracket Research',
        shortCode: 'BR',
        style: 'Pure architecture',
        bestScore: 36 * safeEra,
        freshness: 1.0,
        stockPrice: 110,
        speedMultiplier: 1.3,
        growthFactor: 1.10,
        hypeMultiplier: 1.0,
        preferredSizes: ['large', 'huge', 'frontier'],
        trainingJob: null,
        idleTimer: 7,
      }
    );
  }

  return rivals;
}

/**
 * Era points formula from GAME_DESIGN.md:
 * gained = max(1, floor(bestLaunchedScore / 80) + floor(lifetimeCashEarned / 1000000))
 */
export function calculateEraPointsGained(bestScore: number, lifetimeCash: number): number {
  const scoreGained = Math.floor(bestScore / 80);
  const cashGained = Math.floor(lifetimeCash / 1000000);
  return Math.max(1, scoreGained + cashGained);
}

/**
 * Requirement to prestige: best launched score >= 250 OR lifetime cash earned >= 2,000,000.
 */
export function canPrestigeNewEra(state: GameState): boolean {
  const bestScore = state.bestLaunchedModel?.score ?? 0;
  const lifetimeCash = state.lifetimeCashEarned ?? 0;
  return bestScore >= 250 || lifetimeCash >= 2000000;
}

/**
 * Reset and advance to a new Era.
 * - Adds gained era points, sets era to era + 1.
 * - Resets: cash ($25,000), GPUs (2), powerCap (4), researchers (1), dataQuality (20),
 *   reputation (0), models, training job, rivals (re-seeded), stocks, funding rounds,
 *   research nodes, data centers, cooling, office snacks, marketing state, hype, events.
 * - Keeps: era, era points, achievements + bonuses ('new-era' unlocked), all-time best score,
 *   lab name, settings, timesPrestiged.
 */
export function prestigeNewEra(state: GameState): GameState {
  if (!canPrestigeNewEra(state)) {
    return state;
  }

  const bestScore = state.bestLaunchedModel?.score ?? 0;
  const lifetimeCash = state.lifetimeCashEarned ?? 0;
  const gained = calculateEraPointsGained(bestScore, lifetimeCash);

  const nextEra = state.era + 1;
  const nextEraPoints = (state.eraPoints ?? 0) + gained;
  const nextTimesPrestiged = (state.timesPrestiged ?? 0) + 1;
  const allTimeBestScore = Math.max(state.allTimeBestScore ?? 0, bestScore);

  const nextAchievements = {
    ...(state.achievements ?? {}),
    'new-era': true,
  };

  const nextRivals = createRivalsForEra(nextEra);

  return {
    version: 1,
    savedAt: Date.now(),
    labName: state.labName,
    labNameConfirmed: true,

    // Normal starting resources
    cash: STARTING_CASH,
    gpus: STARTING_GPUS,
    powerCap: STARTING_POWER_CAP,
    researchers: STARTING_RESEARCHERS,
    dataQuality: STARTING_DATA_QUALITY,
    reputation: STARTING_REPUTATION,

    // Kept across eras
    era: nextEra,
    eraPoints: nextEraPoints,
    allTimeBestScore,
    timesPrestiged: nextTimesPrestiged,

    // Reset models & training
    usedModelNames: [],
    currentTraining: null,
    readyModel: null,
    bestLaunchedModel: null,
    launchedModels: [],
    lifetimeCashEarned: 0,
    lastTickTime: Date.now(),
    playerFreshness: 1.0,

    // Re-seed rivals
    rivals: nextRivals,

    // Reset economy
    coolingPurchases: 0,
    officeSnacks: false,
    salaryMultiplier: 1.0,
    dataCentersOwned: 0,
    stocksOwned: { helix: 0, pebble: 0, northglass: 0, vesper: 0 },
    stockPriceTimer: 30,
    fundingTaken: {},
    marketingActiveSeconds: 0,
    marketingCooldownSeconds: 0,
    payrollTight: false,

    // Reset research
    researchOwned: {},

    // Reset events
    eventCooldownTimer: 90,
    eventRollTimer: 60,
    pendingEvent: null,
    activeTimedEvents: [],
    eventLogs: state.eventLogs ?? [],

    // Kept achievements & settings
    achievements: nextAchievements,
    tutorialStep: 6,
    tutorialDone: true,
    soundEnabled: state.soundEnabled ?? true,
    reduceMotion: state.reduceMotion ?? false,
  };
}
