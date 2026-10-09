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
  const rounded = Math.round(val * 100) / 100;
  if (isCost && rounded < 100000) {
    if (rounded % 1 !== 0) {
      return `$${rounded.toFixed(2)}`;
    }
    return `$${formatInteger(rounded)}`;
  }
  if (rounded < 1000 && rounded % 1 !== 0) {
    return `$${rounded.toFixed(2)}`;
  }
  return `$${formatShort(rounded)}`;
}

export function formatCost(val: number): string {
  const rounded = Math.round(val);
  if (rounded < 100000) {
    return `$${formatInteger(rounded)}`;
  }
  return `$${formatShort(rounded)}`;
}

export function formatSellPrice(val: number): string {
  const rounded = Math.round(val * 100) / 100;
  if (rounded < 1000) {
    const s = rounded.toFixed(2);
    return `$${s.endsWith('.00') ? s.slice(0, -3) : s}`;
  }
  return `$${formatShort(rounded)}`;
}

function formatAtMostTwoDecimals(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const s = rounded.toFixed(2);
  if (s.endsWith('.00')) return s.slice(0, -3);
  if (s.endsWith('0')) return s.slice(0, -1);
  return s;
}

export function formatRate(val: number): string {
  const sign = val >= 0 ? '+' : '-';
  const abs = Math.abs(val);

  if (abs < 1000) {
    return `${sign}$${abs.toFixed(2)}/s`;
  }
  if (abs < 1000000) {
    const k = abs / 1000;
    return `${sign}$${formatAtMostTwoDecimals(k)}K/s`;
  }
  if (abs < 1000000000) {
    const m = abs / 1000000;
    return `${sign}$${formatAtMostTwoDecimals(m)}M/s`;
  }
  const b = abs / 1000000000;
  return `${sign}$${formatAtMostTwoDecimals(b)}B/s`;
}
