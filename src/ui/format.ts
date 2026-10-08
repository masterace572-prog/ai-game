/**
 * Formatting utilities for Model Foundry.
 *
 * Rules from GAME_DESIGN.md & AGENT_RULES.md:
 * - All number formatting uses the "en-US" locale, so it never follows the phone's locale
 *   (show 250,000, never 2,50,000).
 * - Short number format (1.2K, 3.4M, 2.1B) except exact costs under 100,000.
 * - All money and stats use tabular nums.
 */

const EN_US = 'en-US';

export function formatInteger(val: number): string {
  return Math.floor(val).toLocaleString(EN_US);
}

export function formatShort(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${Math.floor(abs).toLocaleString(EN_US)}`;
  }
  if (abs < 1000000) {
    const formatted = (abs / 1000).toFixed(1);
    return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  if (abs < 1000000000) {
    const formatted = (abs / 1000000).toFixed(1);
    return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  const formatted = (abs / 1000000000).toFixed(1);
  return `${sign}${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
}

export function formatMoney(val: number, isCost: boolean = false): string {
  if (isCost && val < 100000) {
    return `$${formatInteger(val)}`;
  }
  return `$${formatShort(val)}`;
}

export function formatCost(val: number): string {
  const rounded = Math.round(val);
  if (rounded < 100000) {
    return `$${formatInteger(rounded)}`;
  }
  return `$${formatShort(rounded)}`;
}

export function formatRate(val: number): string {
  const sign = val >= 0 ? '+' : '-';
  const abs = Math.abs(val);
  return `${sign}$${abs.toFixed(2)}/s`;
}
