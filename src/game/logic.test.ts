import { describe, it, expect } from 'vitest';
import { calculateTrainingTime, getTinyTrainingTime, getUsableGpus } from './logic';
import { MODEL_SIZES } from './balance';

describe('Training time logic', () => {
  it('calculates Tiny training time with 1 usable GPU as exactly base seconds (30s)', () => {
    const time = getTinyTrainingTime(1);
    expect(time).toBe(30);
  });

  it('calculates Tiny training time with 2 usable GPUs (starting state)', () => {
    // 2 GPUs owned, 4 power cap -> usable is 2
    const usable = getUsableGpus(2, 4);
    expect(usable).toBe(2);

    // speed = 1 + (2 - 1) * 0.08 = 1.08
    // time = 30 / 1.08
    const time = getTinyTrainingTime(usable);
    expect(time).toBeCloseTo(30 / 1.08, 5);
    expect(time).toBeCloseTo(27.77778, 4);
  });

  it('enforces the 20% floor on GPU speed reduction', () => {
    // 100 usable GPUs would be super fast, but cannot go below baseSeconds * 0.20
    const time = calculateTrainingTime(MODEL_SIZES.tiny.baseSeconds, 100);
    expect(time).toBe(MODEL_SIZES.tiny.baseSeconds * 0.20);
    expect(time).toBe(6);
  });
});
