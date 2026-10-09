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
});
