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
} from './logic';
import { MODEL_SIZES, FRESHNESS_FLOOR } from './balance';
import * as balanceModule from './balance';
import { createInitialState } from './save';
import type { TrainedModel } from './types';

describe('Phase 4: Rivals, Market Share & Real Revenue', () => {
  it('score at known inputs with a fixed roll', () => {
    // Medium baseScore = 70, dataQuality = 20, researchers = 1
    // quality = 0.65 + 0.35 * 0.20 = 0.72
    // talent = 1 + 0.03 = 1.03
    // base product = 70 * 0.72 * 1.03 = 51.912
    // With roll 1.0 -> round(51.912) = 52
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
    // Hand-computed scenario:
    // Player appeal = 40 (e.g. score 40, freshness 1.0, reputation 0, hype 1.0)
    // Rival 1 (HA): score 20, freshness 1.0, hype 1.0 -> appeal = 20
    // Rival 2 (PM): score 10, freshness 1.0, hype 1.0 -> appeal = 10
    // Rival 3 (NG): score 10, freshness 1.0, hype 1.0 -> appeal = 10
    // Rival 4 (VW): score 20, freshness 1.0, hype 1.0 -> appeal = 20
    // Sum of rivals = 60
    // Total appeal = 40 + 60 = 100
    // Player share = 40 / 100 = 0.40 (40.0%)
    // Era 1 demand = 6 * (1.55 ^ 0) = 6.0
    // Revenue per sec = 6.0 * 0.40 = 2.40
    // Subscriptions (65%) = 2.40 * 0.65 = 1.56
    // API (35%) = 2.40 * 0.35 = 0.84
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

    // Simulate 1 second step: decays by 0.015/60 = 0.00025 -> 0.40975
    const step1 = stepGame(state, 1.0);
    expect(step1.state.playerFreshness).toBeCloseTo(0.40975, 5);

    // Simulate huge time lapse: should hit floor 0.40 and not go below
    let curr = state;
    for (let i = 0; i < 200; i++) {
      curr = stepGame(curr, 1.0).state;
    }
    expect(curr.playerFreshness).toBe(0.40);

    // Also check rivals freshness floor
    for (const rival of curr.rivals) {
      expect(rival.freshness).toBeGreaterThanOrEqual(0.40);
    }
  });

  it('stipend constants are gone: player appeal 0 with positive rival appeal means $0 income', () => {
    // Check that TEMP_STIPEND_PER_SEC constant does not exist on balance module
    expect((balanceModule as Record<string, unknown>).TEMP_STIPEND_PER_SEC).toBeUndefined();

    // With a fresh state (no launched models, so player appeal is 0)
    const state = createInitialState('Zero Appeal Lab', true);
    expect(state.bestLaunchedModel).toBeNull();
    expect(state.rivals.length).toBeGreaterThan(0);

    // Income per second must be exactly 0
    const income = getIncomePerSec(state);
    expect(income.income).toBe(0);

    // Stepping the game does not increase cash
    const initialCash = state.cash;
    const stepped = stepGame(state, 1.0);
    expect(stepped.state.cash).toBe(initialCash);
  });

  it('calculates appeal with reputation and hype', () => {
    // score 50, freshness 0.8, reputation 50, hype 1.15
    // reputation multiplier = 1 + 50/250 = 1.20
    // appeal = 50 * 0.8 * 1.20 * 1.15 = 55.2
    const appeal = calculateAppeal(50, 0.8, 50, 1.15);
    expect(appeal).toBeCloseTo(55.2, 5);
  });
});
