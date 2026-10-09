import {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  BUILDINGS,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  getProductMilestoneMultiplier,
  getNextProductMilestone,
  getProductNextCost,
  getProductIncomePerSec,
  getModelCost,
  getModelBaseSeconds,
  getTrainingSpeed,
  getModelScore,
  getModelIncomeMultiplier,
  getBoostSecondsRemoved,
  getRivalScore,
  getRivalNextTimer,
  getEngineerCost,
  getSalesCost,
  getResearcherCost,
  getGpuClusterCost,
  getBuildingMultiplier,
  getFundingMultiplier,
  getStockPrice,
  getStockSellProceeds,
  getTapEarnAmount,
  RIVAL_DEFINITIONS,
} from './balance';
import type { GameState, ProductId, RivalState, TrainingJob } from './types';

export {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  BUILDINGS,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  getProductMilestoneMultiplier,
  getNextProductMilestone,
  getProductNextCost,
  getProductIncomePerSec,
  getModelCost,
  getModelBaseSeconds,
  getTrainingSpeed,
  getModelScore,
  getModelIncomeMultiplier,
  getBoostSecondsRemoved,
  getRivalScore,
  getRivalNextTimer,
  getEngineerCost,
  getSalesCost,
  getResearcherCost,
  getGpuClusterCost,
  getBuildingMultiplier,
  getFundingMultiplier,
  getStockPrice,
  getStockSellProceeds,
  getTapEarnAmount,
};

/**
 * Market share calculation:
 * playerScore = round(10 * 1.32^step * (1 + 0.02 * researchers)) (0 if modelStep < 0)
 * share = playerScore^2 / sum(allScores^2)
 */
export function calculatePlayerScore(state: GameState): number {
  if (state.modelStep < 0) return 0;
  return getModelScore(state.modelStep, state.people.researchers);
}

export function calculateMarketShare(state: GameState): number {
  const playerScore = calculatePlayerScore(state);
  const playerScoreSq = playerScore * playerScore;

  let totalScoresSq = playerScoreSq;
  for (const rival of state.rivals ?? []) {
    const s = getRivalScore(rival.step, rival.strength);
    totalScoresSq += s * s;
  }

  if (totalScoresSq <= 0) return 0;
  return playerScoreSq / totalScoresSq;
}

export function calculateMarketShareMultiplier(share: number): number {
  return 0.5 + 1.5 * share;
}

/**
 * Total income per second:
 * sum(product income) * modelMult * shareMult * (1 + 0.03 * sales) * buildingMult * fundingMult
 */
export function calculateTotalIncomePerSec(state: GameState): number {
  let productIncomeSum = 0;
  for (const pid of PRODUCT_ORDER) {
    const lvl = state.products[pid] ?? 0;
    if (lvl > 0) {
      productIncomeSum += getProductIncomePerSec(pid, lvl);
    }
  }

  const modelMult = getModelIncomeMultiplier(state.modelStep);
  const share = calculateMarketShare(state);
  const shareMult = calculateMarketShareMultiplier(share);
  const salesMult = 1 + 0.03 * (state.people?.sales ?? 0);
  const buildingMult = getBuildingMultiplier(state.buildings ?? 0);
  const fundingMult = getFundingMultiplier(state.fundingTaken ?? {});

  return productIncomeSum * modelMult * shareMult * salesMult * buildingMult * fundingMult;
}

/**
 * Advances the simulation by deltaSeconds.
 */
export function stepGame(
  state: GameState,
  deltaSeconds: number
): {
  state: GameState;
  events?: Array<{ type: 'ready' | 'rival_step'; rivalId?: string; step?: number }>;
} {
  if (deltaSeconds <= 0) return { state };

  const incomePerSec = calculateTotalIncomePerSec(state);
  const earned = incomePerSec * deltaSeconds;
  let cash = state.cash + earned;
  let lifetimeEarned = state.lifetimeEarned + earned;

  let training: TrainingJob | null = state.training;
  let readyStep: number | null = state.readyStep;

  // Progress training
  if (training) {
    const speed = getTrainingSpeed(state.people.engineers, state.gpuClusters);
    const newProgress = training.progress + deltaSeconds * speed;
    if (newProgress >= training.total) {
      readyStep = training.step;
      training = null;
    } else {
      training = { ...training, progress: newProgress };
    }
  }

  // Progress rivals
  const rivals: RivalState[] = (state.rivals ?? []).map((rival) => {
    // Rubber band
    const diff = rival.step - state.modelStep;
    let speed = 1.0;
    if (diff > 2) {
      speed = 0.5; // half speed if ahead
    } else if (diff < -2) {
      speed = 2.0; // double speed if behind
    }

    let timer = rival.timer - deltaSeconds * speed;
    let step = rival.step;

    const def = RIVAL_DEFINITIONS.find((r) => r.id === rival.id);
    const maxStep = (def?.ladder.length ?? 20) - 1;

    if (timer <= 0) {
      if (step < maxStep) {
        step += 1;
      }
      timer = getRivalNextTimer(step);
    }

    return {
      ...rival,
      step,
      timer,
    };
  });

  const nextState: GameState = {
    ...state,
    cash,
    lifetimeEarned,
    training,
    readyStep,
    rivals,
    lastTickTime: Date.now(),
  };

  return { state: nextState };
}

/**
 * Player actions
 */
export function tapEarn(state: GameState): { state: GameState; earned: number } {
  const incomePerSec = calculateTotalIncomePerSec(state);
  const earned = getTapEarnAmount(incomePerSec);
  return {
    state: {
      ...state,
      cash: state.cash + earned,
      lifetimeEarned: state.lifetimeEarned + earned,
    },
    earned,
  };
}

export function startTraining(state: GameState): GameState {
  if (state.training || state.readyStep !== null) return state;

  const k = state.modelStep + 1;
  const cost = getModelCost(k);
  if (state.cash < cost) return state;

  const baseSeconds = getModelBaseSeconds(k);
  return {
    ...state,
    cash: state.cash - cost,
    training: {
      step: k,
      progress: 0,
      total: baseSeconds,
    },
  };
}

export function boostTraining(state: GameState): GameState {
  if (!state.training) return state;

  const removed = getBoostSecondsRemoved(state.training.total);
  const newProgress = state.training.progress + removed;

  if (newProgress >= state.training.total) {
    return {
      ...state,
      readyStep: state.training.step,
      training: null,
    };
  }

  return {
    ...state,
    training: {
      ...state.training,
      progress: newProgress,
    },
  };
}

export function launchModel(state: GameState): { state: GameState; launchedName: string } {
  if (state.readyStep === null) {
    return { state, launchedName: '' };
  }

  const newStep = state.readyStep;
  const launchedName = CLAUDE_LADDER[newStep] ?? `Claude ${newStep}`;

  return {
    state: {
      ...state,
      modelStep: newStep,
      readyStep: null,
    },
    launchedName,
  };
}

export function buyProductLevel(state: GameState, productId: ProductId): GameState {
  const def = PRODUCTS[productId];
  if (state.modelStep < def.unlockStep) return state;

  const currentLevel = state.products[productId] ?? 0;
  const cost = getProductNextCost(productId, currentLevel);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    products: {
      ...state.products,
      [productId]: currentLevel + 1,
    },
  };
}

export function hireEngineer(state: GameState): GameState {
  const current = state.people.engineers;
  const cost = getEngineerCost(current);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    people: {
      ...state.people,
      engineers: current + 1,
    },
  };
}

export function hireSales(state: GameState): GameState {
  const current = state.people.sales;
  const cost = getSalesCost(current);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    people: {
      ...state.people,
      sales: current + 1,
    },
  };
}

export function hireResearcher(state: GameState): GameState {
  const current = state.people.researchers;
  const cost = getResearcherCost(current);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    people: {
      ...state.people,
      researchers: current + 1,
    },
  };
}

export function buyGpuCluster(state: GameState): GameState {
  const current = state.gpuClusters;
  const cost = getGpuClusterCost(current);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: state.cash - cost,
    gpuClusters: current + 1,
  };
}

export function buyBuilding(state: GameState): GameState {
  const current = state.buildings;
  if (current >= BUILDINGS.length) return state;

  const nextBuilding = BUILDINGS[current];
  if (state.cash < nextBuilding.cost) return state;

  return {
    ...state,
    cash: state.cash - nextBuilding.cost,
    buildings: current + 1,
  };
}

export function canTakeFunding(
  fundingId: string,
  state: GameState
): { canTake: boolean; reason?: string } {
  if (state.fundingTaken?.[fundingId]) {
    return { canTake: false, reason: 'Taken' };
  }
  const def = FUNDING_ROUNDS[fundingId];
  if (!def) return { canTake: false, reason: 'Unknown' };

  if (state.modelStep < def.requiredStep) {
    return { canTake: false, reason: `Need ${def.requiredModelName}` };
  }
  return { canTake: true };
}

export function takeFunding(fundingId: string, state: GameState): GameState {
  const check = canTakeFunding(fundingId, state);
  if (!check.canTake) return state;

  const currentIncome = calculateTotalIncomePerSec(state);
  const reward = Math.max(1000, 120 * currentIncome);

  return {
    ...state,
    cash: state.cash + reward,
    lifetimeEarned: state.lifetimeEarned + reward,
    fundingTaken: {
      ...state.fundingTaken,
      [fundingId]: true,
    },
  };
}

export function buyStock(state: GameState, rivalId: string, count: number): GameState {
  const rival = state.rivals.find((r) => r.id === rivalId);
  if (!rival) return state;

  const rivalScore = getRivalScore(rival.step, rival.strength);
  const price = getStockPrice(rivalScore);

  const currentShares = state.stocks[rivalId] ?? 0;
  const maxCanBuy = Math.min(
    STOCK_MAX_SHARES - currentShares,
    Math.floor(state.cash / price),
    count
  );
  if (maxCanBuy <= 0) return state;

  const totalCost = maxCanBuy * price;
  return {
    ...state,
    cash: state.cash - totalCost,
    stocks: {
      ...state.stocks,
      [rivalId]: currentShares + maxCanBuy,
    },
  };
}

export function sellStock(state: GameState, rivalId: string, count: number): GameState {
  const rival = state.rivals.find((r) => r.id === rivalId);
  if (!rival) return state;

  const currentShares = state.stocks[rivalId] ?? 0;
  const toSell = Math.min(currentShares, count);
  if (toSell <= 0) return state;

  const rivalScore = getRivalScore(rival.step, rival.strength);
  const price = getStockPrice(rivalScore);
  const proceeds = getStockSellProceeds(price, toSell);

  return {
    ...state,
    cash: state.cash + proceeds,
    stocks: {
      ...state.stocks,
      [rivalId]: currentShares - toSell,
    },
  };
}

/**
 * Pick the cheapest meaningful next goal:
 * - Next model training/launch
 * - Next product milestone (or unlocking next product)
 */
export function getCheapestNextGoal(state: GameState): string {
  if (state.readyStep !== null) {
    const name = CLAUDE_LADDER[state.readyStep] ?? `Claude ${state.readyStep}`;
    return `Next: Launch ${name}`;
  }

  if (state.training) {
    const name = CLAUDE_LADDER[state.training.step] ?? `Claude ${state.training.step}`;
    return `Training ${name}`;
  }

  // Check product milestones
  const candidateGoals: Array<{ desc: string; cost: number }> = [];

  // Model goal
  const nextStep = state.modelStep + 1;
  if (nextStep < CLAUDE_LADDER.length) {
    const nextModelName = CLAUDE_LADDER[nextStep];
    const modelCost = getModelCost(nextStep);
    candidateGoals.push({
      desc: `Launch ${nextModelName}`,
      cost: modelCost,
    });
  }

  // Check products owned
  for (const pid of PRODUCT_ORDER) {
    const def = PRODUCTS[pid];
    if (state.modelStep >= def.unlockStep) {
      const lvl = state.products[pid] ?? 0;
      const nextM = getNextProductMilestone(lvl);
      if (nextM) {
        // Cost to reach next milestone
        const needed = nextM.nextLevel - lvl;
        let milestoneCost = 0;
        for (let l = lvl; l < nextM.nextLevel; l++) {
          milestoneCost += getProductNextCost(pid, l);
        }
        candidateGoals.push({
          desc: `${def.name} lv ${nextM.nextLevel} (x${nextM.multiplier})`,
          cost: needed === 1 ? getProductNextCost(pid, lvl) : milestoneCost,
        });
      }
    }
  }

  // Buildings goal
  if (state.buildings < BUILDINGS.length) {
    const b = BUILDINGS[state.buildings];
    candidateGoals.push({
      desc: b.name,
      cost: b.cost,
    });
  }

  if (candidateGoals.length === 0) return 'Maxed out!';

  // Pick cheapest
  candidateGoals.sort((a, b) => a.cost - b.cost);
  return `Next: ${candidateGoals[0].desc}`;
}

export interface OfflineReport {
  elapsedSeconds: number;
  cashEarned: number;
}

export function simulateOfflineCatchUp(
  state: GameState,
  now: number = Date.now()
): { nextState: GameState; report: OfflineReport | null } {
  const lastTick = state.lastTickTime || now;
  const elapsedSeconds = Math.max(0, Math.floor((now - lastTick) / 1000));

  // Cap at 24 hours (86,400s)
  const cappedElapsed = Math.min(elapsedSeconds, 86400);

  if (cappedElapsed < 5) {
    return { nextState: { ...state, lastTickTime: now }, report: null };
  }

  const prevCash = state.cash;
  const { state: updatedState } = stepGame(state, cappedElapsed);
  const finalState = { ...updatedState, lastTickTime: now };
  const cashEarned = Math.max(0, finalState.cash - prevCash);

  return {
    nextState: finalState,
    report: {
      elapsedSeconds: cappedElapsed,
      cashEarned,
    },
  };
}
