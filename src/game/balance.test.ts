import { describe, it, expect } from 'vitest';
import {
  APP_VERSION,
  DEFAULT_LAB_NAME,
  STARTING_CASH,
  MODEL_SIZES,
  OFFLINE_CAP_HOURS,
  getGpuPrice,
  CLAUDE_LADDER,
  OPENAI_LADDER,
  GEMINI_LADDER,
  GROK_LADDER,
  DEEPSEEK_LADDER,
  LLAMA_LADDER,
  MISTRAL_LADDER,
  QWEN_LADDER,
  getRivalModelName,
} from './balance';

describe('Balance constants and formulas', () => {
  it('app version is 0.2.0 and default lab name is Claude', () => {
    expect(APP_VERSION).toBe('0.2.0');
    expect(DEFAULT_LAB_NAME).toBe('Claude');
  });

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

  it('all model ladders are defined and non-empty', () => {
    expect(CLAUDE_LADDER.length).toBeGreaterThanOrEqual(20);
    expect(CLAUDE_LADDER[0]).toBe('Claude 1');
    expect(OPENAI_LADDER[0]).toBe('GPT-1');
    expect(GEMINI_LADDER[0]).toBe('Bard');
    expect(GROK_LADDER[0]).toBe('Grok-1');
    expect(DEEPSEEK_LADDER[0]).toBe('DeepSeek Coder');
    expect(LLAMA_LADDER[0]).toBe('Llama 1');
    expect(MISTRAL_LADDER[0]).toBe('Mistral 7B');
    expect(QWEN_LADDER[0]).toBe('Qwen');
  });

  it('getRivalModelName picks the appropriate ladder model based on score', () => {
    expect(getRivalModelName('helix', 18)).toBe('GPT-2');
    expect(getRivalModelName('pebble', 9)).toBe('DeepSeek Coder');
    expect(getRivalModelName('northglass', 14)).toBe('Bard');
    expect(getRivalModelName('vesper', 11)).toBe('Grok-1');
  });
});
