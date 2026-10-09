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

  it('save and load preserves model list and training state', () => {
    const storage = new MemoryStorage();
    const state = createInitialState('Model Test Lab', true);

    state.launchedModels = [
      {
        id: 'm-1',
        name: 'Quiet Sparrow',
        sizeId: 'tiny',
        score: 14,
        trainedAt: 1000,
        launched: true,
        launchedAt: 1050,
      },
      {
        id: 'm-2',
        name: 'Copper Harbor',
        sizeId: 'small',
        score: 32,
        trainedAt: 2000,
        launched: true,
        launchedAt: 2100,
      },
    ];
    state.bestLaunchedModel = state.launchedModels[1];
    state.readyModel = {
      id: 'm-3',
      name: 'Brisk Anvil',
      sizeId: 'medium',
      score: 75,
      trainedAt: 3000,
      launched: false,
    };
    state.currentTraining = {
      id: 'job-1',
      sizeId: 'large',
      progressSeconds: 50,
      totalSeconds: 300,
      rolledScore: 165,
      proposedName: 'Velvet Orbit',
    };

    saveGameState(state, storage);

    const loaded = loadGameState(storage);
    expect(loaded.state.launchedModels).toHaveLength(2);
    expect(loaded.state.launchedModels[0].name).toBe('Quiet Sparrow');
    expect(loaded.state.launchedModels[1].name).toBe('Copper Harbor');
    expect(loaded.state.bestLaunchedModel?.name).toBe('Copper Harbor');
    expect(loaded.state.bestLaunchedModel?.score).toBe(32);
    expect(loaded.state.readyModel?.name).toBe('Brisk Anvil');
    expect(loaded.state.readyModel?.score).toBe(75);
    expect(loaded.state.currentTraining?.proposedName).toBe('Velvet Orbit');
    expect(loaded.state.currentTraining?.progressSeconds).toBe(50);
  });

  it('migrates old save by renaming rivals and updating default lab name to Claude', () => {
    const storage = new MemoryStorage();
    const oldSave = {
      version: 1,
      cash: 50000,
      labName: 'Little Lamp Lab',
      labNameConfirmed: false,
      rivals: [
        { id: 'helix', name: 'Helix Atelier', shortCode: 'HA', bestScore: 18 },
        { id: 'pebble', name: 'Pebble Mind', shortCode: 'PM', bestScore: 9 },
        { id: 'northglass', name: 'Northglass', shortCode: 'NG', bestScore: 14 },
        { id: 'vesper', name: 'Vesper Workshop', shortCode: 'VW', bestScore: 11 },
      ],
    };
    storage.setItem(SAVE_KEY, JSON.stringify(oldSave));

    const loaded = loadGameState(storage);
    expect(loaded.state.labName).toBe('Claude');
    expect(loaded.state.labNameConfirmed).toBe(true);
    expect(loaded.state.rivals[0].name).toBe('ChatGPT');
    expect(loaded.state.rivals[0].shortCode).toBe('GP');
    expect(loaded.state.rivals[1].name).toBe('DeepSeek');
    expect(loaded.state.rivals[1].shortCode).toBe('DS');
    expect(loaded.state.rivals[2].name).toBe('Gemini');
    expect(loaded.state.rivals[2].shortCode).toBe('GE');
    expect(loaded.state.rivals[3].name).toBe('Grok');
    expect(loaded.state.rivals[3].shortCode).toBe('GR');
  });
});
