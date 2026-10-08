import { describe, it, expect } from 'vitest';
import {
  saveGameState,
  loadGameState,
  createInitialState,
  type StorageLike,
} from './save';
import { SAVE_KEY, BACKUP_SAVE_KEY } from './balance';

class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('Save / Load helpers', () => {
  it('round-trips game state keeping cash and lab name intact', () => {
    const storage = new MemoryStorage();
    const initial = createInitialState('Custom Test Lab', true);
    initial.cash = 42500;

    const saved = saveGameState(initial, storage);
    expect(saved).toBe(true);

    const loaded = loadGameState(storage);
    expect(loaded.corrupted).toBe(false);
    expect(loaded.loadedFromBackup).toBe(false);
    expect(loaded.state.cash).toBe(42500);
    expect(loaded.state.labName).toBe('Custom Test Lab');
    expect(loaded.state.labNameConfirmed).toBe(true);
  });

  it('preserves existing save in backup key when saving again', () => {
    const storage = new MemoryStorage();
    const state1 = createInitialState('Lab 1', true);
    state1.cash = 25000;
    saveGameState(state1, storage);

    const state2 = { ...state1, cash: 26000, labName: 'Lab 2' };
    saveGameState(state2, storage);

    // Main key has state2, backup key has state1
    const backupRaw = storage.getItem(BACKUP_SAVE_KEY);
    expect(backupRaw).not.toBeNull();
    const backupParsed = JSON.parse(backupRaw!);
    expect(backupParsed.cash).toBe(25000);
    expect(backupParsed.labName).toBe('Lab 1');

    const mainRaw = storage.getItem(SAVE_KEY);
    const mainParsed = JSON.parse(mainRaw!);
    expect(mainParsed.cash).toBe(26000);
    expect(mainParsed.labName).toBe('Lab 2');
  });

  it('recovers from corrupt main save using backup save', () => {
    const storage = new MemoryStorage();
    const valid = createInitialState('Backup Lab', true);
    valid.cash = 18000;

    // Save twice so backup exists
    saveGameState(valid, storage);
    valid.cash = 19000;
    saveGameState(valid, storage);

    // Corrupt the main save
    storage.setItem(SAVE_KEY, '{ invalid json garbage');

    const loaded = loadGameState(storage);
    expect(loaded.corrupted).toBe(true);
    expect(loaded.loadedFromBackup).toBe(true);
    expect(loaded.state.cash).toBe(18000);
    expect(loaded.state.labName).toBe('Backup Lab');
  });
});
