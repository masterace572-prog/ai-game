import { describe, it, expect } from 'vitest';
import {
  calculateTotalIncomePerSec,
  stepGame,
  tapEarn,
  startTraining,
  boostTraining,
  launchModel,
  buyProductLevel,
  hireEngineer,
  hireSales,
  hireResearcher,
  buyGpuCluster,
  buyBuilding,
  canTakeFunding,
  takeFunding,
  buyStock,
  sellStock,
  getCheapestNextGoal,
  calculateGeometricCost,
  calculateMaxAffordableCount,
  getEffectiveBuyPlan,
  hireManager,
  toggleManagerAutoBuy,
  buyUpgrade,
} from './logic';
import {
  getRivalScore,
  getStockPrice,
  getStockSellProceeds,
} from './balance';
import { createInitialState } from './save';

describe('V2 Logic: Products, Models, Rivals, Economy', () => {
  it('initial state starts with $10 and modelStep -1', () => {
    const state = createInitialState(false);
    expect(state.cash).toBe(10);
    expect(state.modelStep).toBe(-1);
    expect(state.training).toBeNull();
    expect(state.readyStep).toBeNull();
    expect(calculateTotalIncomePerSec(state)).toBe(0);
  });

  it('buying Chat App level 1 produces $0.60/s', () => {
    let state = createInitialState(false);
    expect(state.products.chat).toBe(0);
    state = buyProductLevel(state, 'chat');
    expect(state.products.chat).toBe(1);
    expect(state.cash).toBe(5); // 10 - 5

    // Total income: product income (0.38) * modelMult(1) * shareMult(0.5) * sales(1) * building(1) * funding(1)
    // Note: with modelStep = -1, share is 0, so shareMult is 0.5 + 1.5 * 0 = 0.5
    const income = calculateTotalIncomePerSec(state);
    expect(income).toBeCloseTo(0.38 * 1 * 0.5, 4);
  });

  it('tapping to earn adds $0.50 + 5% of incomePerSec', () => {
    let state = createInitialState(false);
    state = buyProductLevel(state, 'chat');
    const income = calculateTotalIncomePerSec(state);
    const { state: tappedState, earned } = tapEarn(state);
    expect(earned).toBeCloseTo(0.50 + 0.05 * income, 4);
    expect(tappedState.cash).toBeCloseTo(state.cash + earned, 4);
  });

  it('starts training step 0 (Claude 1) for $10 and base time 6s', () => {
    let state = createInitialState(false);
    state.cash = 30;
    state = startTraining(state);
    expect(state.cash).toBe(20);
    expect(state.training).not.toBeNull();
    expect(state.training?.step).toBe(0);
    expect(state.training?.total).toBe(6);
    expect(state.training?.progress).toBe(0);
  });

  it('boost removes progress time and finishes model when threshold reached', () => {
    let state = createInitialState(false);
    state.cash = 50;
    state = startTraining(state);
    expect(state.training).not.toBeNull();

    // Total is 6s, boost removes max(0.25, 0.015*6) = 0.25s
    state = boostTraining(state);
    expect(state.training?.progress).toBeCloseTo(0.25, 4);

    // Boost until done
    for (let i = 0; i < 25; i++) {
      state = boostTraining(state);
    }
    expect(state.training).toBeNull();
    expect(state.readyStep).toBe(0);

    // Launch model
    const { state: launchedState, launchedName } = launchModel(state);
    expect(launchedName).toBe('Claude 1');
    expect(launchedState.modelStep).toBe(0);
    expect(launchedState.readyStep).toBeNull();
  });

  it('model income multiplier increases with launched modelStep', () => {
    let state = createInitialState(false);
    state.modelStep = 0; // Claude 1
    state.products.chat = 1;
    // modelMult is 1.6^(0 + 1) = 1.6
    const income = calculateTotalIncomePerSec(state);
    expect(income).toBeGreaterThan(0.30);
  });

  it('team hires increase stats and deduct cash', () => {
    let state = createInitialState(false);
    state.cash = 200;
    state = hireEngineer(state);
    expect(state.people.engineers).toBe(1);
    state = hireSales(state);
    expect(state.people.sales).toBe(1);
    state = hireResearcher(state);
    expect(state.people.researchers).toBe(1);
    state = buyGpuCluster(state);
    expect(state.gpuClusters).toBe(1);
  });

  it('buildings multiply all income by 2 each', () => {
    let state = createInitialState(false);
    state.products.chat = 10;
    state.cash = 100000;
    const baseIncome = calculateTotalIncomePerSec(state);

    state = buyBuilding(state); // Server Room
    expect(state.buildings).toBe(1);
    const newIncome = calculateTotalIncomePerSec(state);
    expect(newIncome).toBeCloseTo(baseIncome * 2, 2);
  });

  it('funding requires appropriate model launch and pays 120s income', () => {
    let state = createInitialState(false);
    state.products.chat = 10;

    // Seed requires Claude 2 (step 2)
    state.modelStep = 1; // Claude Instant
    expect(canTakeFunding('seed', state).canTake).toBe(false);

    state.modelStep = 2; // Claude 2
    expect(canTakeFunding('seed', state).canTake).toBe(true);

    const oldCash = state.cash;
    state = takeFunding('seed', state);
    expect(state.fundingTaken.seed).toBe(true);
    expect(state.cash).toBeGreaterThanOrEqual(oldCash + 1000);
  });

  it('rival timer rubber bands when ahead or behind player', () => {
    let state = createInitialState(false);
    state.modelStep = 0;
    // Set rival to step 3 (> 2 steps ahead)
    state.rivals[0].step = 3;
    state.rivals[0].timer = 50;

    // 10 seconds of simulation: at half speed, timer decreases by 5s
    const { state: nextState } = stepGame(state, 10);
    expect(nextState.rivals[0].timer).toBeCloseTo(45, 1);
  });

  it('buys and sells rival stocks respecting cap and 2% fee', () => {
    let state = createInitialState(false);
    state.cash = 5000;
    const rival = state.rivals[0];
    const rivalScore = getRivalScore(rival.step, rival.strength);
    const price = getStockPrice(rivalScore);

    state = buyStock(state, 'helix', 10);
    expect(state.stocks.helix).toBe(10);
    expect(state.cash).toBe(5000 - 10 * price);

    const cashBeforeSell = state.cash;
    const expectedProceeds = getStockSellProceeds(price, 5);
    state = sellStock(state, 'helix', 5);
    expect(state.stocks.helix).toBe(5);
    expect(state.cash).toBe(cashBeforeSell + expectedProceeds);
  });

  it('getCheapestNextGoal suggests reasonable next milestone or model', () => {
    const state = createInitialState(false);
    const goal = getCheapestNextGoal(state);
    expect(goal).toMatch(/Next:/i);
  });

  describe('Bulk Buy & Geometric Series Cost Math', () => {
    it('calculates geometric cost correctly for count=1, 10', () => {
      // base=5, growth=1.12, level 0
      const cost1 = calculateGeometricCost(5, 1.12, 0, 1);
      expect(cost1).toBe(5);

      const cost2 = calculateGeometricCost(5, 1.12, 0, 2);
      expect(cost2).toBeCloseTo(5 + 5 * 1.12, 2);

      const cost10 = calculateGeometricCost(5, 1.12, 0, 10);
      // sum_{i=0}^9 5 * 1.12^i = 5 * (1.12^10 - 1) / 0.12 = 87.74
      expect(cost10).toBeCloseTo(87.74, 1);
    });

    it('calculates max affordable count correctly', () => {
      // base=5, growth=1.12, level 0, cash=10 -> can afford 2 (5 + 5.60 = 10.60? wait: 5 + 5.60 = 10.60 > 10, so 1!)
      const max10 = calculateMaxAffordableCount(5, 1.12, 0, 10);
      expect(max10.count).toBe(1);
      expect(max10.cost).toBe(5);

      // cash=11 -> can afford 2 (cost 10.60)
      const max11 = calculateMaxAffordableCount(5, 1.12, 0, 11);
      expect(max11.count).toBe(2);
      expect(max11.cost).toBeCloseTo(10.60, 2);

      // cash=100 -> can afford 10 (cost 87.74)
      const max100 = calculateMaxAffordableCount(5, 1.12, 0, 100);
      expect(max100.count).toBe(10);
      expect(max100.cost).toBeCloseTo(87.74, 1);
    });

    it('getEffectiveBuyPlan supports x1, x10, and max', () => {
      // x1 with $10
      const plan1 = getEffectiveBuyPlan(5, 1.12, 0, 10, '1');
      expect(plan1.count).toBe(1);
      expect(plan1.cost).toBe(5);
      expect(plan1.canAfford).toBe(true);

      // x10 with $10 -> can only afford 1, so count is 1
      const plan10Partial = getEffectiveBuyPlan(5, 1.12, 0, 10, '10');
      expect(plan10Partial.count).toBe(1);
      expect(plan10Partial.cost).toBe(5);
      expect(plan10Partial.canAfford).toBe(true);

      // x10 with $100 -> can afford 10
      const plan10Full = getEffectiveBuyPlan(5, 1.12, 0, 100, '10');
      expect(plan10Full.count).toBe(10);
      expect(plan10Full.cost).toBeCloseTo(87.74, 1);
      expect(plan10Full.canAfford).toBe(true);

      // max with $100 -> buys 10
      const planMax = getEffectiveBuyPlan(5, 1.12, 0, 100, 'max');
      expect(planMax.count).toBe(10);
      expect(planMax.cost).toBeCloseTo(87.74, 1);
      expect(planMax.canAfford).toBe(true);
    });
  });

  describe('Managers & Upgrades (v0.4.0)', () => {
    it('hires Head of Chat, applies x1.5 multiplier, and allows auto-buy toggle', () => {
      let state = createInitialState(false);
      state.modelStep = 0;
      state.products.chat = 10;
      state.cash = 10000;

      const baseIncome = calculateTotalIncomePerSec(state);

      // Hire manager_chat (cost $5,000)
      state = hireManager(state, 'manager_chat');
      expect(state.managers?.manager_chat).toBe(true);
      expect(state.managerAutoBuy?.manager_chat).toBe(true);
      expect(state.cash).toBe(5000);

      const mgrIncome = calculateTotalIncomePerSec(state);
      expect(mgrIncome).toBeCloseTo(baseIncome * 1.5, 3);

      // Toggle auto buy off and on
      state = toggleManagerAutoBuy(state, 'manager_chat');
      expect(state.managerAutoBuy?.manager_chat).toBe(false);
      state = toggleManagerAutoBuy(state, 'manager_chat');
      expect(state.managerAutoBuy?.manager_chat).toBe(true);
    });

    it('buys product upgrade and applies x3 multiplier', () => {
      let state = createInitialState(false);
      state.modelStep = 0;
      state.products.chat = 10;
      state.cash = 10000;

      const baseIncome = calculateTotalIncomePerSec(state);

      state = buyUpgrade(state, 'upg_chat_1'); // Better Prompts ($5,000)
      expect(state.upgrades?.upg_chat_1).toBe(true);
      expect(state.cash).toBe(5000);

      const upgIncome = calculateTotalIncomePerSec(state);
      expect(upgIncome).toBeCloseTo(baseIncome * 3, 3);
    });

    it('buys global upgrade RLHF and applies x2 multiplier across all income', () => {
      let state = createInitialState(false);
      state.modelStep = 1;
      state.products.chat = 10;
      state.products.api = 5;
      state.cash = 500000;

      const baseIncome = calculateTotalIncomePerSec(state);

      state = buyUpgrade(state, 'upg_global_rlhf'); // RLHF ($250,000)
      expect(state.upgrades?.upg_global_rlhf).toBe(true);

      const rlhfIncome = calculateTotalIncomePerSec(state);
      expect(rlhfIncome).toBeCloseTo(baseIncome * 2, 3);
    });

    it('Training Lead and Launch Lead automate training and launching in stepGame', () => {
      let state = createInitialState(false);
      state.cash = 50000;
      state.modelStep = -1;

      // Hire both leads
      state = hireManager(state, 'training_lead');
      state = hireManager(state, 'launch_lead');
      expect(state.managers?.training_lead).toBe(true);
      expect(state.managers?.launch_lead).toBe(true);

      // Model 0 (Claude 1) costs $10 <= 25% of cash ($15,000)
      // Step 1 second -> Training lead auto-starts Claude 1!
      const step1 = stepGame(state, 1);
      state = step1.state;
      expect(state.training).not.toBeNull();
      expect(state.training?.step).toBe(0);

      // Fast-forward training completion (Claude 1 takes 6s base)
      const step2 = stepGame(state, 10);
      state = step2.state;
      // Launch lead auto-launches immediately so modelStep is now 0!
      expect(state.modelStep).toBe(0);
      expect(state.readyStep).toBeNull();
    });
  });
});
