import {
  SAVE_KEY,
  BACKUP_SAVE_KEY,
  STARTING_CASH,
  STARTING_GPUS,
  STARTING_POWER_CAP,
  STARTING_RESEARCHERS,
  STARTING_DATA_QUALITY,
  STARTING_REPUTATION,
  STARTING_ERA,
  STARTING_ERA_POINTS,
  DEFAULT_LAB_NAME,
} from './balance';
import type { GameState } from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function getDefaultStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function createInitialState(
  labName: string = DEFAULT_LAB_NAME,
  labNameConfirmed: boolean = false
): GameState {
  return {
    version: 1,
    savedAt: Date.now(),
    labName,
    labNameConfirmed,
    cash: STARTING_CASH,
    gpus: STARTING_GPUS,
    powerCap: STARTING_POWER_CAP,
    researchers: STARTING_RESEARCHERS,
    dataQuality: STARTING_DATA_QUALITY,
    reputation: STARTING_REPUTATION,
    era: STARTING_ERA,
    eraPoints: STARTING_ERA_POINTS,
    usedModelNames: [],
    currentTraining: null,
    readyModel: null,
    bestLaunchedModel: null,
    launchedModels: [],
    lifetimeCashEarned: 0,
    lastTickTime: Date.now(),
  };
}

export function saveGameState(state: GameState, storage?: StorageLike | null): boolean {
  const store = storage !== undefined ? storage : getDefaultStorage();
  if (!store) return false;

  try {
    const serialized = JSON.stringify({
      ...state,
      version: 1,
      savedAt: Date.now(),
    });

    // Copy previous main key value to backup key before overwriting
    const existingMain = store.getItem(SAVE_KEY);
    if (existingMain) {
      try {
        store.setItem(BACKUP_SAVE_KEY, existingMain);
      } catch {
        // Continue even if backup write fails
      }
    }

    store.setItem(SAVE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save game state', err);
    return false;
  }
}

export interface LoadResult {
  state: GameState;
  loadedFromBackup: boolean;
  corrupted: boolean;
}

function parseState(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && typeof parsed.cash === 'number') {
      return parsed as GameState;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadGameState(storage?: StorageLike | null): LoadResult {
  const store = storage !== undefined ? storage : getDefaultStorage();
  if (!store) {
    return {
      state: createInitialState(),
      loadedFromBackup: false,
      corrupted: false,
    };
  }

  const rawMain = store.getItem(SAVE_KEY);
  if (rawMain) {
    const mainParsed = parseState(rawMain);
    if (mainParsed) {
      return {
        state: {
          ...mainParsed,
          lastTickTime: Date.now(),
        },
        loadedFromBackup: false,
        corrupted: false,
      };
    }
  }

  // Main save was missing or corrupt. Try backup key.
  const rawBackup = store.getItem(BACKUP_SAVE_KEY);
  if (rawBackup) {
    const backupParsed = parseState(rawBackup);
    if (backupParsed) {
      return {
        state: {
          ...backupParsed,
          lastTickTime: Date.now(),
        },
        loadedFromBackup: true,
        corrupted: rawMain !== null, // True if main was corrupt
      };
    }
  }

  // Both missing or corrupt: return fresh initial state
  return {
    state: createInitialState(),
    loadedFromBackup: false,
    corrupted: rawMain !== null,
  };
}
