import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculateTrainingTime,
  getTinyTrainingTime,
  getUsableGpus,
  getModelUnlockStatus,
  getIncomePerSec,
} from './logic';
import { MODEL_SIZES } from './balance';
import { createInitialState } from './save';
import type { TrainedModel } from './types';

describe('Phase 3: Core logic & formulas', () => {
  it('score at known inputs with a fixed roll', () => {
    // Medium baseScore = 70, dataQuality = 20, researchers = 1
    // quality = 0.65 + 0.35 * 0.20 = 0.72
    // talent = 1 + 0.03 = 1.03
    // base product = 70 * 0.72 * 1.03 = 51.912
    // With roll 1.0 -> round(51.912) = 52
    const score1 = calculateScore(70, 20, 1, 1, 0, 1, 1.0);
    expect(score1).toBe(52);

    // With roll 0.92 -> round(51.912 * 0.92) = round(47.75904) = 48
    const scoreMin = calculateScore(70, 20, 1, 1, 0, 1, 0.92);
    expect(scoreMin).toBe(48);

    // With roll 1.08 -> round(51.912 * 1.08) = round(56.06496) = 56
    const scoreMax = calculateScore(70, 20, 1, 1, 0, 1, 1.08);
    expect(scoreMax).toBe(56);
  });

  it('the 20% GPU time floor', () => {
    // Tiny base seconds is 30. Floor is 30 * 0.20 = 6s.
    const tinyFloored = calculateTrainingTime(MODEL_SIZES.tiny.baseSeconds, 100);
    expect(tinyFloored).toBe(6);

    // Large base seconds is 1500. Floor is 1500 * 0.20 = 300s.
    const largeFloored = calculateTrainingTime(MODEL_SIZES.large.baseSeconds, 500);
    expect(largeFloored).toBe(300);

    // Normal time with starting usable GPUs (2) is not floored
    const normalTiny = getTinyTrainingTime(getUsableGpus(2, 4));
    expect(normalTiny).toBeCloseTo(30 / 1.08, 4);
    expect(normalTiny).toBeGreaterThan(6);
  });

  it('Medium locked before any launch', () => {
    const state = createInitialState('Test Lab', true);
    expect(state.launchedModels).toHaveLength(0);

    // Medium is locked before any launch
    const beforeLaunch = getModelUnlockStatus('medium', state);
    expect(beforeLaunch.unlocked).toBe(false);
    expect(beforeLaunch.reason).toMatch(/launch/i);

    // Launch one Tiny model
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

    // Medium is now unlocked
    const afterLaunch = getModelUnlockStatus('medium', stateWithLaunch);
    expect(afterLaunch.unlocked).toBe(true);
  });

  it('preview income equals score * 0.15', () => {
    const state = createInitialState('Test Lab', true);

    // Without a launched model, income is the temporary stipend of $1/sec
    const noModelIncome = getIncomePerSec(state);
    expect(noModelIncome.income).toBe(1);
    expect(noModelIncome.label).toBe('Stipend (temporary)');

    // With a launched model with score 60, income is 60 * 0.15 = 9.0
    const launchedModel: TrainedModel = {
      id: 'm-1',
      name: 'Amber Harbor',
      sizeId: 'small',
      score: 60,
      trainedAt: Date.now(),
      launched: true,
      launchedAt: Date.now(),
    };
    const stateWithModel = {
      ...state,
      launchedModels: [launchedModel],
      bestLaunchedModel: launchedModel,
    };

    const modelIncome = getIncomePerSec(stateWithModel);
    expect(modelIncome.income).toBe(60 * 0.15);
    expect(modelIncome.income).toBe(9);
    expect(modelIncome.label).toBe('Preview income');
  });
});
