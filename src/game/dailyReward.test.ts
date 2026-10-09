import { describe, it, expect } from 'vitest';
import {
  checkDailyRewardStatus,
  calculateDailyRewardAmount,
  getLocalDateString,
  getYesterdayDateString,
} from './dailyReward';

describe('Daily Reward & Streak Logic (v0.5.0)', () => {
  it('starts at Day 1 when never claimed before', () => {
    const today = new Date('2026-10-09T10:00:00');
    const status = checkDailyRewardStatus(null, 0, today);
    expect(status.canClaim).toBe(true);
    expect(status.streakDay).toBe(1);
    expect(status.rewardSeconds).toBe(60);
    expect(status.isDay7).toBe(false);
  });

  it('cannot claim if already claimed on the same day', () => {
    const today = new Date('2026-10-09T14:30:00');
    const todayStr = getLocalDateString(today);

    const status = checkDailyRewardStatus(todayStr, 3, today);
    expect(status.canClaim).toBe(false);
    expect(status.streakDay).toBe(3);
    expect(status.rewardSeconds).toBe(180);
    expect(status.isDay7).toBe(false);
  });

  it('advances streak by 1 when claimed on the next day', () => {
    const today = new Date('2026-10-10T09:00:00');
    const yesterdayStr = getYesterdayDateString(today); // '2026-10-09'

    // From Day 1 to Day 2
    const status2 = checkDailyRewardStatus(yesterdayStr, 1, today);
    expect(status2.canClaim).toBe(true);
    expect(status2.streakDay).toBe(2);
    expect(status2.rewardSeconds).toBe(120);
    expect(status2.isDay7).toBe(false);

    // From Day 6 to Day 7
    const status7 = checkDailyRewardStatus(yesterdayStr, 6, today);
    expect(status7.canClaim).toBe(true);
    expect(status7.streakDay).toBe(7);
    expect(status7.rewardSeconds).toBe(900);
    expect(status7.isDay7).toBe(true);

    // After Day 7, wraps back to Day 1
    const statusWrap = checkDailyRewardStatus(yesterdayStr, 7, today);
    expect(statusWrap.canClaim).toBe(true);
    expect(statusWrap.streakDay).toBe(1);
    expect(statusWrap.rewardSeconds).toBe(60);
    expect(statusWrap.isDay7).toBe(false);
  });

  it('resets streak to Day 1 when a day is skipped', () => {
    const today = new Date('2026-10-15T10:00:00');
    const oldDateStr = '2026-10-10'; // 5 days ago

    const status = checkDailyRewardStatus(oldDateStr, 5, today);
    expect(status.canClaim).toBe(true);
    expect(status.streakDay).toBe(1);
    expect(status.rewardSeconds).toBe(60);
    expect(status.isDay7).toBe(false);
  });

  it('calculates reward amount correctly with a $50 minimum floor', () => {
    // When income is $0/s, gives minimum $50
    expect(calculateDailyRewardAmount(0, 1)).toBe(50);
    expect(calculateDailyRewardAmount(0, 7)).toBe(50);

    // When income is $0.20/s on Day 1 (60s): 0.2 * 60 = 12 < 50 -> 50
    expect(calculateDailyRewardAmount(0.20, 1)).toBe(50);

    // When income is $10/s on Day 1 (60s): 10 * 60 = 600
    expect(calculateDailyRewardAmount(10, 1)).toBe(600);

    // When income is $100/s on Day 7 (900s): 100 * 900 = 90,000
    expect(calculateDailyRewardAmount(100, 7)).toBe(90000);
  });
});
