import { describe, it, expect } from 'vitest';
import {
  formatShort,
  formatCost,
  formatMoney,
  formatInteger,
  formatRate,
  formatSellPrice,
} from './format';

describe('format helper (en-US locale, tabular compliance)', () => {
  it('formats numbers under 1000 verbatim without suffix', () => {
    expect(formatShort(0)).toBe('0');
    expect(formatShort(999)).toBe('999');
  });

  it('formats thousands with 1.2K style', () => {
    expect(formatShort(1000)).toBe('1K');
    expect(formatShort(1200)).toBe('1.2K');
    expect(formatShort(25400)).toBe('25.4K');
    expect(formatShort(999900)).toBe('999.9K');
  });

  it('formats millions and billions with M and B suffix', () => {
    expect(formatShort(3400000)).toBe('3.4M');
    expect(formatShort(2100000000)).toBe('2.1B');
  });

  it('formats exact costs under 100,000 using commas and $', () => {
    expect(formatCost(500)).toBe('$500');
    expect(formatCost(3000)).toBe('$3,000');
    expect(formatCost(25000)).toBe('$25,000');
    expect(formatCost(80000)).toBe('$80,000');
    expect(formatCost(99999)).toBe('$99,999');
  });

  it('formats costs >= 100,000 using short notation', () => {
    expect(formatCost(100000)).toBe('$100K');
    expect(formatCost(200000)).toBe('$200K');
    expect(formatCost(1000000)).toBe('$1M');
  });

  it('always enforces en-US groupings (never 2,50,000)', () => {
    expect(formatInteger(250000)).toBe('250,000');
  });

  it('formatMoney handles exact vs short correctly', () => {
    expect(formatMoney(25000, true)).toBe('$25,000');
    expect(formatMoney(25000, false)).toBe('$25K');
  });

  it('formats float sell price with at most 2 decimals', () => {
    expect(formatSellPrice(96.03999999999)).toBe('$96.04');
    expect(formatMoney(96.03999999999)).toBe('$96.04');
    expect(formatMoney(96.03999999999, true)).toBe('$96.04');
    expect(formatSellPrice(40)).toBe('$40');
  });

  it('formats rates with sign, dollar, at most 2 decimals and K/M/B suffixes', () => {
    expect(formatRate(1.5)).toBe('+$1.50/s');
    expect(formatRate(-0.35)).toBe('-$0.35/s');
    expect(formatRate(0)).toBe('+$0.00/s');
    expect(formatRate(1200)).toBe('+$1.2K/s');
    expect(formatRate(1250)).toBe('+$1.25K/s');
    expect(formatRate(-3400000)).toBe('-$3.4M/s');
  });
});
