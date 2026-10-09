import { describe, it, expect } from 'vitest';
import {
  saveGameState,
  loadGameState,
  createInitialState,
  type StorageLike,
} from './save';
import { SAVE_KEY, SAVE_V1_KEY, BACKUP_V1_KEY } from './balance';

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

describe('Save / Load helpers (v2)', () => {
  it('fresh state round-trips through save and load cleanly', () => {
    const storage = new MemoryStorage();
    const initial = createInitialState(false);
    initial.cash = 425;
    initial.products.chat = 12;
    initial.modelStep = 2;

    const saved = saveGameState(initial, storage);
    expect(saved).toBe(true);

    const loaded = loadGameState(storage);
    expect(loaded.corrupted).toBe(false);
    expect(loaded.loadedFromBackup).toBe(false);
    expect(loaded.state.version).toBe(2);
    expect(loaded.state.cash).toBe(425);
    expect(loaded.state.products.chat).toBe(12);
    expect(loaded.state.modelStep).toBe(2);
    expect(loaded.state.labName).toBe('Claude');
  });

  it('migrates v1 save by backing it up to v1.backup and starting fresh v2 game', () => {
    const storage = new MemoryStorage();
    const oldV1Data = JSON.stringify({
      version: 1,
      cash: 50000,
      labName: 'Little Lamp Lab',
    });
    storage.setItem(SAVE_V1_KEY, oldV1Data);

    const loaded = loadGameState(storage);
    expect(loaded.migratedFromV1).toBe(true);
    expect(loaded.state.version).toBe(2);
    expect(loaded.state.cash).toBe(10);
    expect(loaded.state.showFreshStartSheet).toBe(true);

    // Verify v1 was backed up untouched
    expect(storage.getItem(BACKUP_V1_KEY)).toBe(oldV1Data);
    // Verify v2 was saved
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('handles corrupt JSON gracefully without crashing', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, 'invalid-json{{{');

    const loaded = loadGameState(storage);
    expect(loaded.corrupted).toBe(true);
    expect(loaded.state.version).toBe(2);
    expect(loaded.state.cash).toBe(10);
  });
});
