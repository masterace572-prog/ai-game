import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculateTrainingTime,
  getTinyTrainingTime,
  getUsableGpus,
  getModelUnlockStatus,
  getIncomePerSec,
  calculateMarket,
  calculateAppeal,
  stepGame,
  getGpuPrice,
  getResearcherPrice,
  getCoolingPrice,
  getStockSellProceeds,
  canTakeFunding,
  buyGpu,
  buyCooling,
  hireResearcher,
  buyOfficeSnacks,
  buyStock,
  sellStock,
  buyDataCenter,
  startMarketingCampaign,
  canBuyResearchNode,
  buyResearchNode,
  getResearchScoreMultiplier,
  canRollEvent,
  rollEvent,
  resolveEvent,
  checkAchievements,
  getAchievementRevenueMultiplier,
} from './logic';
import { MODEL_SIZES, FRESHNESS_FLOOR } from './balance';
import * as balanceModule from './balance';
import { createInitialState } from './save';
import type { TrainedModel } from './types';

describe('Phase 5: Economy, Shop, Salaries, Stocks & Funding', () => {
  it('GPU price formula', () => {
    // cost = round(3500 * (1.12 ^ gpusOwned))
    expect(getGpuPrice(0)).toBe(3500);
    expect(getGpuPrice(1)).toBe(Math.round(3500 * 1.12)); // 3920
    expect(getGpuPrice(2)).toBe(Math.round(3500 * 1.12 * 1.12)); // 4390
    expect(getGpuPrice(5)).toBe(Math.round(3500 * Math.pow(1.12, 5))); // 6168
  });

  it('hire price formula', () => {
    // cost = round(8000 * (1.18 ^ researchers))
    expect(getResearcherPrice(0)).toBe(8000);
    expect(getResearcherPrice(1)).toBe(Math.round(8000 * 1.18)); // 9440
    expect(getResearcherPrice(2)).toBe(Math.round(8000 * Math.pow(1.18, 2))); // 11139
    expect(getResearcherPrice(5)).toBe(Math.round(8000 * Math.pow(1.18, 5))); // 18302
  });

  it('salary drain for 10 seconds', () => {
    // 1 researcher, salary multiplier 1.0 -> salaries = 0.15/sec
    // Upkeep = 0 (no data centers)
    // No launched models -> revenue = 0
    // Net cash change for 10 seconds = -1.50
    const state = createInitialState('Drain Lab', true);
    state.cash = 25000;
    state.researchers = 1;
    state.salaryMultiplier = 1.0;
    state.dataCentersOwned = 0;
    state.bestLaunchedModel = null;

    let current = state;
    for (let i = 0; i < 10; i++) {
      current = stepGame(current, 1.0).state;
    }

    expect(current.cash).toBeCloseTo(25000 - 10 * 0.15, 4);
    expect(current.cash).toBeCloseTo(24998.5, 4);
  });

  it('stock sell fee (pays 98%)', () => {
    // 2% fee
    expect(getStockSellProceeds(100, 1)).toBe(98);
    expect(getStockSellProceeds(50, 10)).toBe(490);
    expect(getStockSellProceeds(200, 2)).toBe(392);
  });

  it('Series A locked at score 79 and open at 80', () => {
    const state79 = createInitialState('Series A Lab 79', true);
    state79.bestLaunchedModel = {
      id: 'm-79',
      name: 'Nearly There',
      sizeId: 'medium',
      score: 79,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };
    const check79 = canTakeFunding('series-a', state79);
    expect(check79.canTake).toBe(false);
    expect(check79.reason).toMatch(/80/);

    const state80 = createInitialState('Series A Lab 80', true);
    state80.bestLaunchedModel = {
      id: 'm-80',
      name: 'Series A Qualified',
      sizeId: 'medium',
      score: 80,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };
    const check80 = canTakeFunding('series-a', state80);
    expect(check80.canTake).toBe(true);
  });

  it('buys GPUs, cooling, researchers, and snacks correctly', () => {
    let state = createInitialState('Upgrade Lab', true);
    state.cash = 100000;
    state.gpus = 2;
    state.powerCap = 4;
    state.researchers = 1;
    state.coolingPurchases = 0;
    state.salaryMultiplier = 1.0;

    // Buy GPU
    const gpuCost = getGpuPrice(2);
    state = buyGpu(state);
    expect(state.gpus).toBe(3);
    expect(state.cash).toBe(100000 - gpuCost);

    // Buy Cooling
    const coolingCost = getCoolingPrice(0);
    const cashBeforeCooling = state.cash;
    state = buyCooling(state);
    expect(state.coolingPurchases).toBe(1);
    expect(state.powerCap).toBe(6); // 4 + 2
    expect(state.cash).toBe(cashBeforeCooling - coolingCost);

    // Hire Researcher
    const hireCost = getResearcherPrice(1);
    const cashBeforeHire = state.cash;
    state = hireResearcher(state);
    expect(state.researchers).toBe(2);
    expect(state.cash).toBe(cashBeforeHire - hireCost);

    // Buy Snacks
    state = buyOfficeSnacks(state);
    expect(state.officeSnacks).toBe(true);
    expect(state.salaryMultiplier).toBeCloseTo(0.95, 4);
  });

  it('buys and sells rival stocks respecting cap and 2% fee', () => {
    let state = createInitialState('Stock Lab', true);
    state.cash = 50000;
    const rival = state.rivals[0];
    const initialPrice = rival.stockPrice;

    // Buy 10 shares
    state = buyStock(state, rival.id, 10);
    expect(state.stocksOwned?.[rival.id]).toBe(10);
    expect(state.cash).toBe(50000 - initialPrice * 10);

    // Cap at 200 shares
    state = buyStock(state, rival.id, 300);
    expect(state.stocksOwned?.[rival.id]).toBe(200);

    // Sell 50 shares
    const cashBeforeSell = state.cash;
    const expectedProceeds = Math.floor(50 * initialPrice * 0.98);
    state = sellStock(state, rival.id, 50);
    expect(state.stocksOwned?.[rival.id]).toBe(150);
    expect(state.cash).toBe(cashBeforeSell + expectedProceeds);
  });

  it('manages data center purchase and score multiplier', () => {
    let state = createInitialState('DC Lab', true);
    state.cash = 50000;
    state.dataCentersOwned = 0;
    const initialPowerCap = state.powerCap;

    state = buyDataCenter(state);
    expect(state.dataCentersOwned).toBe(1);
    expect(state.powerCap).toBe(initialPowerCap + 6);
    expect(state.cash).toBe(50000 - 20000);

    // Score calculation includes 1 + 0.02 * dataCentersOwned
    const scoreWithoutDC = calculateScore(70, 20, 1, 1, 0, 0, 1.0);
    const scoreWithDC = calculateScore(70, 20, 1, 1, 0, 1, 1.0);
    expect(scoreWithDC).toBeGreaterThanOrEqual(scoreWithoutDC);
  });

  it('prevents cash dropping below 0 and flags payrollTight', () => {
    let state = createInitialState('Broke Lab', true);
    state.cash = 0.05;
    state.researchers = 5; // salaries = 0.75/s
    state.bestLaunchedModel = null; // no revenue

    const stepped = stepGame(state, 1.0).state;
    expect(stepped.cash).toBe(0);
    expect(stepped.payrollTight).toBe(true);

    // Stepping again does not accumulate debt
    const steppedAgain = stepGame(stepped, 1.0).state;
    expect(steppedAgain.cash).toBe(0);
    expect(steppedAgain.payrollTight).toBe(true);
  });

  it('marketing campaign boosts hype for 180s then enters cooldown', () => {
    let state = createInitialState('Marketing Lab', true);
    state.cash = 5000;
    state = startMarketingCampaign(state);
    expect(state.marketingActiveSeconds).toBe(180);
    expect(state.cash).toBe(3000);

    // Step 10 seconds (1s per tick)
    for (let i = 0; i < 10; i++) {
      state = stepGame(state, 1.0).state;
    }
    expect(state.marketingActiveSeconds).toBe(170);

    // Step 175 seconds more (exceeding active duration)
    for (let i = 0; i < 175; i++) {
      state = stepGame(state, 1.0).state;
    }
    expect(state.marketingActiveSeconds).toBe(0);
    expect(state.marketingCooldownSeconds).toBeGreaterThan(0);
  });

  it('score at known inputs with a fixed roll', () => {
    const score1 = calculateScore(70, 20, 1, 1, 0, 1, 1.0);
    expect(score1).toBe(52);

    const scoreMin = calculateScore(70, 20, 1, 1, 0, 1, 0.92);
    expect(scoreMin).toBe(48);

    const scoreMax = calculateScore(70, 20, 1, 1, 0, 1, 1.08);
    expect(scoreMax).toBe(56);
  });

  it('the 20% GPU time floor', () => {
    const tinyFloored = calculateTrainingTime(MODEL_SIZES.tiny.baseSeconds, 100);
    expect(tinyFloored).toBe(6);

    const largeFloored = calculateTrainingTime(MODEL_SIZES.large.baseSeconds, 500);
    expect(largeFloored).toBe(300);

    const normalTiny = getTinyTrainingTime(getUsableGpus(2, 4));
    expect(normalTiny).toBeCloseTo(30 / 1.08, 4);
    expect(normalTiny).toBeGreaterThan(6);
  });

  it('Medium locked before any launch', () => {
    const state = createInitialState('Test Lab', true);
    expect(state.launchedModels).toHaveLength(0);

    const beforeLaunch = getModelUnlockStatus('medium', state);
    expect(beforeLaunch.unlocked).toBe(false);
    expect(beforeLaunch.reason).toMatch(/launch/i);

    const mockModel: TrainedModel = {
      id: 'mock-1',
      name: 'Quiet Lantern',
      sizeId: 'tiny',
      score: 12,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };
    const stateWithLaunch = {
      ...state,
      launchedModels: [mockModel],
      bestLaunchedModel: mockModel,
    };

    const afterLaunch = getModelUnlockStatus('medium', stateWithLaunch);
    expect(afterLaunch.unlocked).toBe(true);
  });

  it('with fixed appeals, share and revenue match a hand-computed example', () => {
    const state = createInitialState('Hand Calc Lab', true);
    state.era = 1;
    state.reputation = 0;
    state.playerFreshness = 1.0;

    const playerModel: TrainedModel = {
      id: 'p-1',
      name: 'Quiet Anvil',
      sizeId: 'medium',
      score: 40,
      trainedAt: 1000,
      launched: true,
      launchedAt: 1000,
    };
    state.bestLaunchedModel = playerModel;
    state.launchedModels = [playerModel];

    state.rivals = [
      {
        id: 'r1',
        name: 'Helix Atelier',
        shortCode: 'HA',
        style: '',
        bestScore: 20,
        freshness: 1.0,
        stockPrice: 100,
        speedMultiplier: 1.0,
        growthFactor: 1.08,
        hypeMultiplier: 1.0,
        preferredSizes: ['medium'],
        trainingJob: null,
        idleTimer: 10,
      },
      {
        id: 'r2',
        name: 'Pebble Mind',
        shortCode: 'PM',
        style: '',
        bestScore: 10,
        freshness: 1.0,
        stockPrice: 40,
        speedMultiplier: 0.7,
        growthFactor: 1.04,
        hypeMultiplier: 1.0,
        preferredSizes: ['tiny'],
        trainingJob: null,
        idleTimer: 10,
      },
      {
        id: 'r3',
        name: 'Northglass',
        shortCode: 'NG',
        style: '',
        bestScore: 10,
        freshness: 1.0,
        stockPrice: 80,
        speedMultiplier: 1.4,
        growthFactor: 1.12,
        hypeMultiplier: 1.0,
        preferredSizes: ['large'],
        trainingJob: null,
        idleTimer: 10,
      },
      {
        id: 'r4',
        name: 'Vesper Workshop',
        shortCode: 'VW',
        style: '',
        bestScore: 20,
        freshness: 1.0,
        stockPrice: 55,
        speedMultiplier: 1.0,
        growthFactor: 1.05,
        hypeMultiplier: 1.0,
        preferredSizes: ['small'],
        trainingJob: null,
        idleTimer: 10,
      },
    ];

    const market = calculateMarket(state);
    expect(market.playerAppeal).toBe(40);
    expect(market.totalAppeal).toBe(100);
    expect(market.playerShare).toBe(0.40);
    expect(market.demand).toBe(6.0);
    expect(market.revenuePerSec).toBeCloseTo(2.40, 5);
    expect(market.subscriptionRevenue).toBeCloseTo(1.56, 5);
    expect(market.apiRevenue).toBeCloseTo(0.84, 5);
    expect(market.subscriptionRevenue + market.apiRevenue).toBeCloseTo(market.revenuePerSec, 5);
  });

  it('freshness floor is 0.40', () => {
    expect(FRESHNESS_FLOOR).toBe(0.40);

    const state = createInitialState('Freshness Lab', true);
    state.bestLaunchedModel = {
      id: 'p-1',
      name: 'Old Model',
      sizeId: 'tiny',
      score: 20,
      trainedAt: 1000,
      launched: true,
      launchedAt: 1000,
    };
    state.playerFreshness = 0.41;

    const step1 = stepGame(state, 1.0);
    expect(step1.state.playerFreshness).toBeCloseTo(0.40975, 5);

    let curr = state;
    for (let i = 0; i < 200; i++) {
      curr = stepGame(curr, 1.0).state;
    }
    expect(curr.playerFreshness).toBe(0.40);

    for (const rival of curr.rivals) {
      expect(rival.freshness).toBeGreaterThanOrEqual(0.40);
    }
  });

  it('stipend constants are gone: player appeal 0 with positive rival appeal means $0 income', () => {
    expect((balanceModule as Record<string, unknown>).TEMP_STIPEND_PER_SEC).toBeUndefined();

    const state = createInitialState('Zero Appeal Lab', true);
    expect(state.bestLaunchedModel).toBeNull();
    expect(state.rivals.length).toBeGreaterThan(0);

    const income = getIncomePerSec(state);
    expect(income.grossRevenue).toBe(0);
  });

  it('calculates appeal with reputation and hype', () => {
    const appeal = calculateAppeal(50, 0.8, 50, 1.15);
    expect(appeal).toBeCloseTo(55.2, 5);
  });
});

describe('Phase 6: Research Tree and Frontier Unlocks', () => {
  it('optimizers then mixture apply 1.08 * 1.12', () => {
    let state = createInitialState('Research Lab', true);
    state.cash = 100000;

    expect(getResearchScoreMultiplier(state)).toBe(1.0);

    // Buy optimizers
    state = buyResearchNode(state, 'optimizers');
    expect(state.researchOwned['optimizers']).toBe(true);
    expect(getResearchScoreMultiplier(state)).toBeCloseTo(1.08, 5);

    // Buy mixture
    state = buyResearchNode(state, 'mixture');
    expect(state.researchOwned['mixture']).toBe(true);
    expect(getResearchScoreMultiplier(state)).toBeCloseTo(1.08 * 1.12, 5);
  });

  it('mixture cannot be bought first', () => {
    const state = createInitialState('Prereq Lab', true);
    state.cash = 100000;

    const check = canBuyResearchNode('mixture', state);
    expect(check.canBuy).toBe(false);
    expect(check.reason).toMatch(/Better optimizers/i);

    // Buying should return unchanged state
    const afterAttempt = buyResearchNode(state, 'mixture');
    expect(afterAttempt.researchOwned['mixture']).toBeUndefined();
    expect(afterAttempt.cash).toBe(100000);
  });

  it('brand studio multiplies revenue by 1.10', () => {
    const state = createInitialState('Brand Lab', true);
    state.bestLaunchedModel = {
      id: 'brand-model',
      name: 'Flagship Alpha',
      sizeId: 'medium',
      score: 50,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };

    const marketBefore = calculateMarket(state);
    expect(marketBefore.revenuePerSec).toBeGreaterThan(0);

    const stateWithBrand = {
      ...state,
      researchOwned: { brand: true },
    };

    const marketAfter = calculateMarket(stateWithBrand);
    expect(marketAfter.revenuePerSec).toBeCloseTo(marketBefore.revenuePerSec * 1.10, 5);
    expect(marketAfter.subscriptionRevenue).toBeCloseTo(marketBefore.subscriptionRevenue * 1.10, 5);
    expect(marketAfter.apiRevenue).toBeCloseTo(marketBefore.apiRevenue * 1.10, 5);
  });

  it('Frontier stays locked with Series B but no agent-harness', () => {
    const state = createInitialState('Frontier Lab', true);
    state.gpus = 64;
    state.powerCap = 64;
    state.researchers = 20;
    state.fundingTaken = { 'series-b': true };
    state.researchOwned = {}; // No agent-harness

    const statusWithoutHarness = getModelUnlockStatus('frontier', state);
    expect(statusWithoutHarness.unlocked).toBe(false);
    expect(statusWithoutHarness.reason).toMatch(/agent harness/i);

    // Give agent harness
    const stateWithHarness = {
      ...state,
      researchOwned: { 'agent-harness': true },
    };

    const statusWithHarness = getModelUnlockStatus('frontier', stateWithHarness);
    expect(statusWithHarness.unlocked).toBe(true);
  });

  it('Clean data adds +5 data quality once', () => {
    let state = createInitialState('Data Lab', true);
    state.cash = 10000;
    state.dataQuality = 30;

    state = buyResearchNode(state, 'clean-data');
    expect(state.dataQuality).toBe(35);
    expect(state.researchOwned['clean-data']).toBe(true);
  });

  it('Cheap flops multiplies training time by 0.90', () => {
    const normalTime = calculateTrainingTime(100, 4, 1.0);
    const discountedTime = calculateTrainingTime(100, 4, 0.90);
    expect(discountedTime).toBeCloseTo(normalTime * 0.90, 5);
  });

  it('Recruiter multiplies hire cost by 0.85', () => {
    const baseCost = getResearcherPrice(2, false);
    const recruiterCost = getResearcherPrice(2, true);
    expect(recruiterCost).toBe(Math.round(baseCost * 0.85));
  });
});

describe('Phase 7: Events, Achievements, and Tutorial', () => {
  it('poach does nothing harmful with 1 researcher', () => {
    let state = createInitialState('Solo Lab', true);
    state.tutorialDone = true;
    state.eventCooldownTimer = 0;
    state.researchers = 1;
    state.cash = 25000;

    // Trigger poach event
    const rolled = rollEvent(state, 0.05, 'poach');
    expect(rolled.eventFired).toBe(true);
    expect(rolled.nextState.pendingEvent?.id).toBe('poach');

    // Choice 1: "Let them walk"
    const resolved = resolveEvent(rolled.nextState, 1);
    expect(resolved.researchers).toBe(1);
    expect(resolved.cash).toBe(25000);
    expect(resolved.pendingEvent).toBeNull();
    expect(resolved.eventCooldownTimer).toBe(90);
  });

  it('viral cash uses the formula', () => {
    let state = createInitialState('Viral Lab', true);
    state.tutorialDone = true;
    state.eventCooldownTimer = 0;
    state.cash = 10000;
    state.reputation = 5;
    state.bestLaunchedModel = {
      id: 'viral-model',
      name: 'Viral Spark',
      sizeId: 'medium',
      score: 50,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };

    const market = calculateMarket(state);
    const expectedRevenue = market.revenuePerSec;
    expect(expectedRevenue).toBeGreaterThan(0);

    const expectedCashBonus = 20 * expectedRevenue * 30;

    const rolled = rollEvent(state, 0.05, 'viral');
    expect(rolled.eventFired).toBe(true);
    const resolved = resolveEvent(rolled.nextState, 0);

    expect(resolved.cash).toBeCloseTo(10000 + expectedCashBonus, 4);
    expect(resolved.reputation).toBe(15); // 5 + 10
  });

  it('market-leader bonus is 1.02 only after the rule is met', () => {
    let state = createInitialState('Share Lab', true);
    state.tutorialDone = true;
    // Mark previous milestones as already known
    state.achievements = {
      'on-the-board': true,
      'upset': true,
    };
    const multBefore = getAchievementRevenueMultiplier(state);
    expect(state.achievements['market-leader']).toBeUndefined();

    // Player share under 40%
    const check1 = checkAchievements(state);
    expect(check1.nextState.achievements?.['market-leader']).toBeUndefined();
    expect(getAchievementRevenueMultiplier(check1.nextState)).toBe(multBefore);

    // Launch a powerhouse model that secures > 40% market share
    const beastModel: TrainedModel = {
      id: 'beast-model',
      name: 'Beast 1',
      sizeId: 'huge',
      score: 500,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };
    state.bestLaunchedModel = beastModel;
    state.launchedModels = [beastModel];

    const market = calculateMarket(state);
    expect(market.playerShare).toBeGreaterThanOrEqual(0.40);

    const check2 = checkAchievements(state);
    expect(check2.nextState.achievements?.['market-leader']).toBe(true);
    // Market leader provides a 1.02 multiplier on top of baseline
    const multAfter = getAchievementRevenueMultiplier(check2.nextState);
    expect(multAfter).toBeCloseTo(multBefore * 1.02, 5);
  });

  it('an event does not fire when the cooldown is active (pure function is fine)', () => {
    let state = createInitialState('Cooldown Lab', true);
    state.tutorialDone = true;
    state.eventCooldownTimer = 45; // 45 seconds remaining on cooldown

    expect(canRollEvent(state)).toBe(false);

    const rolled = rollEvent(state, 0.01, 'hype');
    expect(rolled.eventFired).toBe(false);
    expect(rolled.nextState.pendingEvent).toBeNull();
  });
});
