import { describe, it, expect } from 'vitest';
import {
  APP_VERSION,
  DEFAULT_LAB_NAME,
  STARTING_CASH,
  PRODUCTS,
  getProductMilestoneMultiplier,
  getProductNextCost,
  getProductIncomePerSec,
  getModelCost,
  getModelBaseSeconds,
  getModelScore,
  getModelIncomeMultiplier,
  getBoostSecondsRemoved,
  getEngineerCost,
  getSalesCost,
  getResearcherCost,
  getGpuClusterCost,
  getBuildingMultiplier,
} from './balance';

describe('Balance constants and formulas (v2)', () => {
  it('app version is 0.5.0 and default lab name is Claude', () => {
    expect(APP_VERSION).toBe('0.5.0');
    expect(DEFAULT_LAB_NAME).toBe('Claude');
  });

  it('starting cash is 10', () => {
    expect(STARTING_CASH).toBe(10);
  });

  it('Chat App costs $5 at level 0 and earns income at level 1', () => {
    expect(PRODUCTS.chat.baseCost).toBe(5);
    expect(getProductNextCost('chat', 0)).toBe(5);
    expect(getProductIncomePerSec('chat', 1)).toBe(0.38);
  });

  it('milestones multiply product income correctly', () => {
    expect(getProductMilestoneMultiplier(9)).toBe(1);
    expect(getProductMilestoneMultiplier(10)).toBe(2);
    expect(getProductMilestoneMultiplier(25)).toBe(4);
    expect(getProductMilestoneMultiplier(50)).toBe(8);
    expect(getProductMilestoneMultiplier(75)).toBe(16);
    expect(getProductMilestoneMultiplier(100)).toBe(32);
    expect(getProductMilestoneMultiplier(150)).toBe(96);
  });

  it('model cost, base time, and score match specifications', () => {
    expect(getModelCost(0)).toBe(10);
    expect(getModelBaseSeconds(0)).toBe(6);
    expect(getModelCost(1)).toBe(30);
    expect(getModelBaseSeconds(1)).toBe(10);
    expect(getModelScore(0, 0)).toBe(10);
    expect(getModelIncomeMultiplier(-1)).toBe(1);
    expect(getModelIncomeMultiplier(0)).toBeCloseTo(1.08, 2);
  });

  it('boost removes max(0.25, 0.015 * total)', () => {
    expect(getBoostSecondsRemoved(6)).toBe(0.25);
    expect(getBoostSecondsRemoved(100)).toBe(1.5);
  });

  it('team and cluster costs match formula', () => {
    expect(getEngineerCost(0)).toBe(30);
    expect(getSalesCost(0)).toBe(40);
    expect(getResearcherCost(0)).toBe(60);
    expect(getGpuClusterCost(0)).toBe(50);
  });

  it('building multiplier doubles with each building owned', () => {
    expect(getBuildingMultiplier(0)).toBe(1);
    expect(getBuildingMultiplier(1)).toBe(2);
    expect(getBuildingMultiplier(2)).toBe(4);
  });
});
