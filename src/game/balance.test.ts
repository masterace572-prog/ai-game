import { describe, it, expect } from 'vitest';
import {
  STARTING_CASH,
  MODEL_SIZES,
  OFFLINE_CAP_HOURS,
  getGpuPrice,
} from './balance';

describe('Balance constants and formulas', () => {
  it('starting cash is 25000', () => {
    expect(STARTING_CASH).toBe(25000);
  });

  it('Tiny base score is 12', () => {
    expect(MODEL_SIZES.tiny.baseScore).toBe(12);
  });

  it('Tiny base time is 30 seconds', () => {
    expect(MODEL_SIZES.tiny.baseSeconds).toBe(30);
  });

  it('offline cap is 8 hours', () => {
    expect(OFFLINE_CAP_HOURS).toBe(8);
  });

  it('next GPU price with 2 GPUs owned is round(3500 * (1.12 ** 2))', () => {
    const expected = Math.round(3500 * (1.12 ** 2));
    expect(getGpuPrice(2)).toBe(expected);
    expect(expected).toBe(4390); // 3500 * 1.2544 = 4390.4 -> 4390
  });
});
