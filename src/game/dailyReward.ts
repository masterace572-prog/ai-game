/**
 * Daily Reward and Streak logic for Model Foundry (v0.5.0)
 * Offline-only, based on the phone's local date.
 */

export const DAILY_REWARD_SECONDS = [60, 120, 180, 300, 450, 600, 900];

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(d: Date = new Date()): string {
  const yesterday = new Date(d);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

export interface DailyRewardStatus {
  canClaim: boolean;
  streakDay: number; // 1 to 7
  rewardSeconds: number;
  isDay7: boolean;
}

/**
 * Checks if the daily reward can be claimed, and what day of the streak it is.
 * - If claimed today: canClaim is false.
 * - If claimed yesterday: continues streak (advances by 1; wraps back to 1 if previously day 7).
 * - If claimed earlier (skipped day) or never claimed: resets streak to Day 1.
 */
export function checkDailyRewardStatus(
  lastClaimDate: string | undefined | null,
  currentStreak: number | undefined | null,
  currentDate: Date = new Date()
): DailyRewardStatus {
  const todayStr = getLocalDateString(currentDate);

  if (lastClaimDate === todayStr) {
    const day = Math.min(7, Math.max(1, currentStreak ?? 1));
    return {
      canClaim: false,
      streakDay: day,
      rewardSeconds: DAILY_REWARD_SECONDS[day - 1],
      isDay7: day === 7,
    };
  }

  const yesterdayStr = getYesterdayDateString(currentDate);

  let newStreak = 1;
  if (lastClaimDate === yesterdayStr) {
    const prev = currentStreak ?? 0;
    newStreak = prev >= 7 ? 1 : prev + 1;
  } else {
    newStreak = 1;
  }

  const streakIdx = Math.max(0, Math.min(6, newStreak - 1));
  return {
    canClaim: true,
    streakDay: newStreak,
    rewardSeconds: DAILY_REWARD_SECONDS[streakIdx],
    isDay7: newStreak === 7,
  };
}

/**
 * Reward amount = incomePerSec * [60, 120, 180, 300, 450, 600, 900][day - 1], minimum $50.
 */
export function calculateDailyRewardAmount(
  incomePerSec: number,
  streakDay: number
): number {
  const streakIdx = Math.max(0, Math.min(6, streakDay - 1));
  const seconds = DAILY_REWARD_SECONDS[streakIdx];
  const cash = incomePerSec * seconds;
  return Math.max(50, Math.round(cash * 100) / 100);
}
