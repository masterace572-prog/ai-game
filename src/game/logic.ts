import {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  BUILDINGS,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  MILESTONES,
  MANAGERS,
  MANAGER_ORDER,
  UPGRADES,
  ALL_UPGRADE_IDS,
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
  getProductManagerMultiplier,
  getProductUpgradesMultiplier,
  getGlobalUpgradesMultiplier,
  getTrainingUpgradesMultiplier,
  RIVAL_DEFINITIONS,
} from './balance';
import type { GameState, ProductId, RivalState, TrainingJob, BuyAmount } from './types';

export {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  BUILDINGS,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  MILESTONES,
  MANAGERS,
  MANAGER_ORDER,
  UPGRADES,
  ALL_UPGRADE_IDS,
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
  getProductManagerMultiplier,
  getProductUpgradesMultiplier,
  getGlobalUpgradesMultiplier,
  getTrainingUpgradesMultiplier,
};

/**
 * Geometric cost calculations for bulk buying
 */
export function calculateGeometricCost(
  baseCost: number,
  growth: number,
  currentLevel: number,
  count: number
): number {
  if (count <= 0) return 0;
  if (Math.abs(growth - 1) < 1e-9) {
    return Math.round(count * baseCost * 100) / 100;
  }
  const firstTerm = baseCost * Math.pow(growth, currentLevel);
  const sum = (firstTerm * (Math.pow(growth, count) - 1)) / (growth - 1);
  return Math.round(sum * 100) / 100;
}

export function calculateMaxAffordableCount(
  baseCost: number,
  growth: number,
  currentLevel: number,
  cash: number
): { count: number; cost: number } {
  if (cash <= 0) return { count: 0, cost: 0 };
  const firstCost = baseCost * Math.pow(growth, currentLevel);
  if (cash < firstCost) return { count: 0, cost: 0 };

  if (Math.abs(growth - 1) < 1e-9) {
    const count = Math.floor(cash / baseCost);
    return { count, cost: count * baseCost };
  }

  const ratio = 1 + (cash * (growth - 1)) / firstCost;
  let count = Math.floor(Math.log(ratio) / Math.log(growth) + 1e-11);
  if (count < 1) count = 1;

  let cost = calculateGeometricCost(baseCost, growth, currentLevel, count);
  while (cost > cash && count > 0) {
    count--;
    cost = calculateGeometricCost(baseCost, growth, currentLevel, count);
  }
  while (true) {
    const nextCost = calculateGeometricCost(baseCost, growth, currentLevel, count + 1);
    if (nextCost <= cash) {
      count++;
      cost = nextCost;
    } else {
      break;
    }
  }

  return { count, cost };
}

export function getEffectiveBuyPlan(
  baseCost: number,
  growth: number,
  currentLevel: number,
  cash: number,
  buyAmount: BuyAmount = '1'
): { count: number; cost: number; canAfford: boolean } {
  if (buyAmount === '1') {
    const cost = calculateGeometricCost(baseCost, growth, currentLevel, 1);
    return { count: 1, cost, canAfford: cash >= cost };
  }

  const maxAffordable = calculateMaxAffordableCount(baseCost, growth, currentLevel, cash);

  if (buyAmount === '10') {
    if (maxAffordable.count >= 10) {
      const cost = calculateGeometricCost(baseCost, growth, currentLevel, 10);
      return { count: 10, cost, canAfford: true };
    }
    if (maxAffordable.count >= 1) {
      return { count: maxAffordable.count, cost: maxAffordable.cost, canAfford: true };
    }
    const cost = calculateGeometricCost(baseCost, growth, currentLevel, 10);
    return { count: 10, cost, canAfford: false };
  }

  // 'max'
  if (maxAffordable.count >= 1) {
    return { count: maxAffordable.count, cost: maxAffordable.cost, canAfford: true };
  }
  const cost = calculateGeometricCost(baseCost, growth, currentLevel, 1);
  return { count: 1, cost, canAfford: false };
}

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
 * sum(product income * mgrMult * upgMult) * modelMult * shareMult * (1 + 0.03 * sales) * buildingMult * fundingMult * globalUpgMult
 */
export function calculateTotalIncomePerSec(state: GameState): number {
  let productIncomeSum = 0;
  for (const pid of PRODUCT_ORDER) {
    const lvl = state.products[pid] ?? 0;
    if (lvl > 0) {
      const baseInc = getProductIncomePerSec(pid, lvl);
      const mgrMult = getProductManagerMultiplier(pid, state.managers);
      const upgMult = getProductUpgradesMultiplier(pid, state.upgrades);
      productIncomeSum += baseInc * mgrMult * upgMult;
    }
  }

  const modelMult = getModelIncomeMultiplier(state.modelStep);
  let share = calculateMarketShare(state);
  if ((state.lawsuitPenaltyTimer ?? 0) > 0) {
    share = share * 0.8;
  }
  const shareMult = calculateMarketShareMultiplier(share);
  const salesMult = 1 + 0.03 * (state.people?.sales ?? 0);
  const buildingMult = getBuildingMultiplier(state.buildings ?? 0);
  const fundingMult = getFundingMultiplier(state.fundingTaken ?? {});
  const globalUpgMult = getGlobalUpgradesMultiplier(state.upgrades);

  // Temporary event buffs / debuffs
  let eventIncomeMult = 1.0;
  if ((state.viralLaunchTimer ?? 0) > 0) {
    eventIncomeMult *= 3.0;
  }
  if ((state.goldenGpuBuffTimer ?? 0) > 0) {
    eventIncomeMult *= 7.0;
  }
  if ((state.day7BonusTimer ?? 0) > 0) {
    eventIncomeMult *= 2.0;
  }
  if ((state.outageTimer ?? 0) > 0) {
    eventIncomeMult *= 0.5;
  }

  return (
    productIncomeSum *
    modelMult *
    shareMult *
    salesMult *
    buildingMult *
    fundingMult *
    globalUpgMult *
    eventIncomeMult
  );
}

/**
 * Advances the simulation by deltaSeconds.
 */
export function stepGame(
  state: GameState,
  deltaSeconds: number
): {
  state: GameState;
  events?: Array<{
    type: 'ready' | 'rival_step' | 'milestone';
    rivalId?: string;
    step?: number;
    productId?: ProductId;
    level?: number;
  }>;
} {
  if (deltaSeconds <= 0) return { state };

  const incomePerSec = calculateTotalIncomePerSec(state);
  const earned = incomePerSec * deltaSeconds;
  let cash = state.cash + earned;
  let lifetimeEarned = state.lifetimeEarned + earned;

  let training: TrainingJob | null = state.training;
  let readyStep: number | null = state.readyStep;
  let modelStep = state.modelStep;
  let dataDealActive = state.dataDealActive ?? false;
  const events: Array<{
    type: 'ready' | 'rival_step' | 'milestone';
    rivalId?: string;
    step?: number;
    productId?: ProductId;
    level?: number;
  }> = [];

  // Progress training
  if (training) {
    let speed = getTrainingSpeed(state.people.engineers, state.gpuClusters, state.upgrades);
    if ((state.hypeWaveTimer ?? 0) > 0) {
      speed *= 2.0;
    }
    const newProgress = training.progress + deltaSeconds * speed;
    if (newProgress >= training.total) {
      readyStep = training.step;
      training = null;
    } else {
      training = { ...training, progress: newProgress };
    }
  }

  // Launch lead automation: auto-launch ready model immediately
  if (state.managers?.['launch_lead'] && readyStep !== null) {
    modelStep = readyStep;
    events.push({ type: 'ready', step: modelStep });
    readyStep = null;
  }

  // Manager auto-buy accumulator: runs 1 cycle per second
  let autoBuyAccumulator = (state.autoBuyAccumulator ?? 0) + deltaSeconds;
  const products = { ...state.products };
  const ticks = Math.min(Math.floor(autoBuyAccumulator), 3600);

  if (ticks > 0) {
    autoBuyAccumulator -= ticks;
    for (let t = 0; t < ticks; t++) {
      // 1. Product managers auto-buy 1 lvl/s when cost <= 10% of cash
      for (const pid of PRODUCT_ORDER) {
        if (modelStep >= PRODUCTS[pid].unlockStep) {
          const mgrId = 'manager_' + pid;
          if (state.managers?.[mgrId] && state.managerAutoBuy?.[mgrId] !== false) {
            const lvl = products[pid] ?? 0;
            const cost = getProductNextCost(pid, lvl);
            if (cost <= cash * 0.10) {
              cash -= cost;
              products[pid] = lvl + 1;
              for (const m of MILESTONES) {
                if (lvl < m.level && lvl + 1 >= m.level) {
                  events.push({ type: 'milestone', productId: pid, level: m.level });
                }
              }
            }
          }
        }
      }

      // 2. Training Lead auto-starts next model when cost <= 25% of cash
      if (state.managers?.['training_lead']) {
        if (!training && readyStep === null) {
          const nextK = modelStep + 1;
          if (nextK < CLAUDE_LADDER.length) {
            const cost = getModelCost(nextK);
            if (cost <= cash * 0.25) {
              cash -= cost;
              let baseSec = getModelBaseSeconds(nextK);
              if (dataDealActive) {
                baseSec = Math.round(baseSec * 0.70 * 100) / 100;
                dataDealActive = false;
              }
              training = { step: nextK, progress: 0, total: baseSec };
            }
          }
        }
      }
    }
  }

  // Progress rivals
  const rivals: RivalState[] = (state.rivals ?? []).map((rival) => {
    const diff = rival.step - modelStep;
    let speed = 1.0;
    if (diff > 2) {
      speed = 0.5;
    } else if (diff < -2) {
      speed = 2.0;
    }

    let timer = rival.timer - deltaSeconds * speed;
    let step = rival.step;

    const def = RIVAL_DEFINITIONS.find((r) => r.id === rival.id);
    const maxStep = (def?.ladder.length ?? 20) - 1;

    if (timer <= 0) {
      if (step < maxStep) {
        step += 1;
        events.push({ type: 'rival_step', rivalId: rival.id, step });
      }
      timer = getRivalNextTimer(step);
    }

    return {
      ...rival,
      step,
      timer,
    };
  });

  // Event timer countdowns
  const viralLaunchTimer = Math.max(0, (state.viralLaunchTimer ?? 0) - deltaSeconds);
  const goldenGpuBuffTimer = Math.max(0, (state.goldenGpuBuffTimer ?? 0) - deltaSeconds);
  const hypeWaveTimer = Math.max(0, (state.hypeWaveTimer ?? 0) - deltaSeconds);
  const outageTimer = Math.max(0, (state.outageTimer ?? 0) - deltaSeconds);
  const lawsuitPenaltyTimer = Math.max(0, (state.lawsuitPenaltyTimer ?? 0) - deltaSeconds);
  const day7BonusTimer = Math.max(0, (state.day7BonusTimer ?? 0) - deltaSeconds);

  const nextState: GameState = {
    ...state,
    cash,
    lifetimeEarned,
    modelStep,
    training,
    readyStep,
    products,
    rivals,
    autoBuyAccumulator,
    dataDealActive,
    viralLaunchTimer,
    goldenGpuBuffTimer,
    hypeWaveTimer,
    outageTimer,
    lawsuitPenaltyTimer,
    day7BonusTimer,
    lastTickTime: Date.now(),
  };

  return { state: nextState, events: events.length > 0 ? events : undefined };
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

  let baseSeconds = getModelBaseSeconds(k);
  let dataDealActive = state.dataDealActive ?? false;
  if (dataDealActive) {
    baseSeconds = Math.round(baseSeconds * 0.70 * 100) / 100;
    dataDealActive = false;
  }

  return {
    ...state,
    cash: state.cash - cost,
    dataDealActive,
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

export function setBuyAmount(state: GameState, buyAmount: BuyAmount): GameState {
  return {
    ...state,
    buyAmount,
  };
}

export function buyProductBulk(
  state: GameState,
  productId: ProductId,
  mode: BuyAmount = state.buyAmount ?? '1'
): { state: GameState; count: number; cost: number; milestonesPassed: number[] } {
  const def = PRODUCTS[productId];
  if (state.modelStep < def.unlockStep) {
    return { state, count: 0, cost: 0, milestonesPassed: [] };
  }

  const currentLevel = state.products[productId] ?? 0;
  const plan = getEffectiveBuyPlan(def.baseCost, def.costGrowth, currentLevel, state.cash, mode);

  if (!plan.canAfford || plan.count <= 0) {
    return { state, count: 0, cost: 0, milestonesPassed: [] };
  }

  const newLevel = currentLevel + plan.count;
  const milestonesPassed: number[] = [];
  for (const m of MILESTONES) {
    if (currentLevel < m.level && newLevel >= m.level) {
      milestonesPassed.push(m.level);
    }
  }

  return {
    state: {
      ...state,
      cash: state.cash - plan.cost,
      products: {
        ...state.products,
        [productId]: newLevel,
      },
    },
    count: plan.count,
    cost: plan.cost,
    milestonesPassed,
  };
}

export function buyProductLevel(state: GameState, productId: ProductId): GameState {
  return buyProductBulk(state, productId, '1').state;
}

export function hireEngineerBulk(
  state: GameState,
  mode: BuyAmount = state.buyAmount ?? '1'
): { state: GameState; count: number; cost: number } {
  const current = state.people.engineers;
  const plan = getEffectiveBuyPlan(30, 1.16, current, state.cash, mode);
  if (!plan.canAfford || plan.count <= 0) {
    return { state, count: 0, cost: 0 };
  }
  return {
    state: {
      ...state,
      cash: state.cash - plan.cost,
      people: {
        ...state.people,
        engineers: current + plan.count,
      },
    },
    count: plan.count,
    cost: plan.cost,
  };
}

export function hireEngineer(state: GameState): GameState {
  return hireEngineerBulk(state, '1').state;
}

export function hireSalesBulk(
  state: GameState,
  mode: BuyAmount = state.buyAmount ?? '1'
): { state: GameState; count: number; cost: number } {
  const current = state.people.sales;
  const plan = getEffectiveBuyPlan(40, 1.17, current, state.cash, mode);
  if (!plan.canAfford || plan.count <= 0) {
    return { state, count: 0, cost: 0 };
  }
  return {
    state: {
      ...state,
      cash: state.cash - plan.cost,
      people: {
        ...state.people,
        sales: current + plan.count,
      },
    },
    count: plan.count,
    cost: plan.cost,
  };
}

export function hireSales(state: GameState): GameState {
  return hireSalesBulk(state, '1').state;
}

export function hireResearcherBulk(
  state: GameState,
  mode: BuyAmount = state.buyAmount ?? '1'
): { state: GameState; count: number; cost: number } {
  const current = state.people.researchers;
  const plan = getEffectiveBuyPlan(60, 1.18, current, state.cash, mode);
  if (!plan.canAfford || plan.count <= 0) {
    return { state, count: 0, cost: 0 };
  }
  return {
    state: {
      ...state,
      cash: state.cash - plan.cost,
      people: {
        ...state.people,
        researchers: current + plan.count,
      },
    },
    count: plan.count,
    cost: plan.cost,
  };
}

export function hireResearcher(state: GameState): GameState {
  return hireResearcherBulk(state, '1').state;
}

export function buyGpuClusterBulk(
  state: GameState,
  mode: BuyAmount = state.buyAmount ?? '1'
): { state: GameState; count: number; cost: number } {
  const current = state.gpuClusters;
  const plan = getEffectiveBuyPlan(50, 1.18, current, state.cash, mode);
  if (!plan.canAfford || plan.count <= 0) {
    return { state, count: 0, cost: 0 };
  }
  return {
    state: {
      ...state,
      cash: state.cash - plan.cost,
      gpuClusters: current + plan.count,
    },
    count: plan.count,
    cost: plan.cost,
  };
}

export function buyGpuCluster(state: GameState): GameState {
  return buyGpuClusterBulk(state, '1').state;
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

export function hireManager(state: GameState, managerId: string): GameState {
  if (state.managers?.[managerId]) return state;
  const def = MANAGERS[managerId];
  if (!def) return state;
  if (state.cash < def.cost) return state;

  return {
    ...state,
    cash: state.cash - def.cost,
    managers: {
      ...state.managers,
      [managerId]: true,
    },
    managerAutoBuy: {
      ...state.managerAutoBuy,
      [managerId]: true,
    },
  };
}

export function toggleManagerAutoBuy(state: GameState, managerId: string): GameState {
  if (!state.managers?.[managerId]) return state;
  const current = state.managerAutoBuy?.[managerId] !== false;
  return {
    ...state,
    managerAutoBuy: {
      ...state.managerAutoBuy,
      [managerId]: !current,
    },
  };
}

export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  if (state.upgrades?.[upgradeId]) return state;
  const def = UPGRADES[upgradeId];
  if (!def) return state;
  if (state.cash < def.cost) return state;

  return {
    ...state,
    cash: state.cash - def.cost,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: true,
    },
  };
}

export interface BestBuySuggestion {
  id: string;
  type: 'product' | 'upgrade' | 'manager' | 'team' | 'building' | 'training';
  name: string;
  cost: number;
  gainPerSec: number;
  gainPerDollar: number;
  label: string;
}

export function getBestBuyRecommendation(state: GameState): BestBuySuggestion | null {
  const currentIncome = calculateTotalIncomePerSec(state);
  let best: BestBuySuggestion | null = null;

  function evaluateCandidate(
    cand: BestBuySuggestion,
    cost: number,
    nextIncome: number
  ) {
    if (cost > state.cash || cost <= 0) return;
    const gainPerSec = Math.max(0, nextIncome - currentIncome);
    const gainPerDollar = gainPerSec / cost;
    if (!best || gainPerDollar > best.gainPerDollar) {
      best = {
        ...cand,
        gainPerSec,
        gainPerDollar,
      };
    }
  }

  // 1. Unlocked Products
  for (const pid of PRODUCT_ORDER) {
    const def = PRODUCTS[pid];
    if (state.modelStep >= def.unlockStep) {
      const currentLevel = state.products[pid] ?? 0;
      const cost = getProductNextCost(pid, currentLevel);
      if (cost <= state.cash) {
        const testState = {
          ...state,
          products: { ...state.products, [pid]: currentLevel + 1 },
        };
        const nextIncome = calculateTotalIncomePerSec(testState);
        evaluateCandidate(
          {
            id: pid,
            type: 'product',
            name: def.name,
            cost,
            gainPerSec: 0,
            gainPerDollar: 0,
            label: `Level ${currentLevel + 1} ${def.name}`,
          },
          cost,
          nextIncome
        );
      }
    }
  }

  // 2. Affordable Upgrades
  for (const upgId of ALL_UPGRADE_IDS) {
    if (!state.upgrades?.[upgId]) {
      const def = UPGRADES[upgId];
      if (def && def.cost <= state.cash) {
        const testState = {
          ...state,
          upgrades: { ...state.upgrades, [upgId]: true },
        };
        const nextIncome = calculateTotalIncomePerSec(testState);
        evaluateCandidate(
          {
            id: upgId,
            type: 'upgrade',
            name: def.name,
            cost: def.cost,
            gainPerSec: 0,
            gainPerDollar: 0,
            label: `${def.name} (${def.description})`,
          },
          def.cost,
          nextIncome
        );
      }
    }
  }

  // 3. Affordable Managers
  for (const mgrId of MANAGER_ORDER) {
    if (!state.managers?.[mgrId]) {
      const def = MANAGERS[mgrId];
      if (def && def.cost <= state.cash) {
        const testState = {
          ...state,
          managers: { ...state.managers, [mgrId]: true },
        };
        const nextIncome = calculateTotalIncomePerSec(testState);
        evaluateCandidate(
          {
            id: mgrId,
            type: 'manager',
            name: def.name,
            cost: def.cost,
            gainPerSec: 0,
            gainPerDollar: 0,
            label: `Hire ${def.name}`,
          },
          def.cost,
          nextIncome
        );
      }
    }
  }

  // 4. Sales hires
  const salesCost = getSalesCost(state.people?.sales ?? 0);
  if (salesCost <= state.cash) {
    const testState = {
      ...state,
      people: { ...state.people, sales: (state.people?.sales ?? 0) + 1 },
    };
    const nextIncome = calculateTotalIncomePerSec(testState);
    evaluateCandidate(
      {
        id: 'hire_sales',
        type: 'team',
        name: 'Sales Rep',
        cost: salesCost,
        gainPerSec: 0,
        gainPerDollar: 0,
        label: 'Hire Sales Rep',
      },
      salesCost,
      nextIncome
    );
  }

  // 5. Buildings
  if (state.buildings < BUILDINGS.length) {
    const bldg = BUILDINGS[state.buildings];
    if (bldg.cost <= state.cash) {
      const testState = {
        ...state,
        buildings: state.buildings + 1,
      };
      const nextIncome = calculateTotalIncomePerSec(testState);
      evaluateCandidate(
        {
          id: 'buy_building',
          type: 'building',
          name: bldg.name,
          cost: bldg.cost,
          gainPerSec: 0,
          gainPerDollar: 0,
          label: `Upgrade to ${bldg.name}`,
        },
        bldg.cost,
        nextIncome
      );
    }
  }

  // Fallback if no candidate gives instant positive income
  if (!best) {
    if (!state.training && state.readyStep === null) {
      const nextK = state.modelStep + 1;
      if (nextK < CLAUDE_LADDER.length) {
        const cost = getModelCost(nextK);
        if (cost <= state.cash) {
          return {
            id: `train_${nextK}`,
            type: 'training',
            name: CLAUDE_LADDER[nextK],
            cost,
            gainPerSec: 0,
            gainPerDollar: 0.0001,
            label: `Train ${CLAUDE_LADDER[nextK]}`,
          };
        }
      }
    }

    if (state.modelStep >= PRODUCTS.chat.unlockStep) {
      const cost = getProductNextCost('chat', state.products.chat ?? 0);
      if (cost <= state.cash) {
        return {
          id: 'chat',
          type: 'product',
          name: PRODUCTS.chat.name,
          cost,
          gainPerSec: 0,
          gainPerDollar: 0.0001,
          label: `Level ${(state.products.chat ?? 0) + 1} Chat App`,
        };
      }
    }

    const engCost = getEngineerCost(state.people?.engineers ?? 0);
    if (engCost <= state.cash) {
      return {
        id: 'hire_engineer',
        type: 'team',
        name: 'Engineer',
        cost: engCost,
        gainPerSec: 0,
        gainPerDollar: 0.0001,
        label: 'Hire Engineer',
      };
    }
  }

  return best;
}

export function executeBestBuy(
  state: GameState,
  suggestion: BestBuySuggestion
): { state: GameState; milestonesPassed?: number[] } {
  if (suggestion.type === 'product') {
    const res = buyProductBulk(state, suggestion.id as ProductId, '1');
    return { state: res.state, milestonesPassed: res.milestonesPassed };
  }
  if (suggestion.type === 'upgrade') {
    return { state: buyUpgrade(state, suggestion.id) };
  }
  if (suggestion.type === 'manager') {
    return { state: hireManager(state, suggestion.id) };
  }
  if (suggestion.type === 'team') {
    if (suggestion.id === 'hire_sales') {
      return { state: hireSales(state) };
    }
    if (suggestion.id === 'hire_engineer') {
      return { state: hireEngineer(state) };
    }
  }
  if (suggestion.type === 'building') {
    return { state: buyBuilding(state) };
  }
  if (suggestion.type === 'training') {
    return { state: startTraining(state) };
  }
  return { state };
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

export const DOUBLE_AWAY_COOLDOWN_MS = 4 * 3600 * 1000; // 4 hours

export function canDoubleAwayEarnings(
  lastDoubleAt: number | undefined | null,
  now: number = Date.now()
): { canDouble: boolean; cooldownRemainingMs: number; cooldownText: string } {
  if (!lastDoubleAt) {
    return { canDouble: true, cooldownRemainingMs: 0, cooldownText: '' };
  }
  const diff = now - lastDoubleAt;
  if (diff >= DOUBLE_AWAY_COOLDOWN_MS) {
    return { canDouble: true, cooldownRemainingMs: 0, cooldownText: '' };
  }
  const remaining = DOUBLE_AWAY_COOLDOWN_MS - diff;
  const hours = Math.floor(remaining / (3600 * 1000));
  const mins = Math.ceil((remaining % (3600 * 1000)) / (60 * 1000));
  const cooldownText = hours > 0 ? `x2 in ${hours}h ${mins}m` : `x2 in ${mins}m`;
  return { canDouble: false, cooldownRemainingMs: remaining, cooldownText };
}

export function simulateOfflineCatchUp(
  state: GameState,
  now: number = Date.now()
): { nextState: GameState; report: OfflineReport | null } {
  const lastTick = state.lastTickTime || now;
  const elapsedSeconds = Math.max(0, Math.floor((now - lastTick) / 1000));

  // Cap at 8 hours (28,800s)
  const cappedElapsed = Math.min(elapsedSeconds, 8 * 3600);

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
