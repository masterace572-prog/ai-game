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
import type { GameState, RivalState } from './types';

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

export function createDefaultRivals(): RivalState[] {
  return [
    {
      id: 'helix',
      name: 'Helix Atelier',
      shortCode: 'HA',
      style: 'Balanced, slightly ahead',
      bestScore: 18,
      freshness: 1.0,
      stockPrice: 120,
      speedMultiplier: 1.0,
      growthFactor: 1.08,
      hypeMultiplier: 1.0,
      preferredSizes: ['medium', 'large'],
      trainingJob: null,
      idleTimer: 5,
    },
    {
      id: 'pebble',
      name: 'Pebble Mind',
      shortCode: 'PM',
      style: 'Many small models',
      bestScore: 9,
      freshness: 1.0,
      stockPrice: 40,
      speedMultiplier: 0.7,
      growthFactor: 1.04,
      hypeMultiplier: 1.0,
      preferredSizes: ['tiny', 'small'],
      trainingJob: null,
      idleTimer: 3,
    },
    {
      id: 'northglass',
      name: 'Northglass',
      shortCode: 'NG',
      style: 'Slow, larger models',
      bestScore: 14,
      freshness: 1.0,
      stockPrice: 80,
      speedMultiplier: 1.4,
      growthFactor: 1.12,
      hypeMultiplier: 1.0,
      preferredSizes: ['medium', 'large'],
      trainingJob: null,
      idleTimer: 8,
    },
    {
      id: 'vesper',
      name: 'Vesper Workshop',
      shortCode: 'VW',
      style: 'Hype, average models',
      bestScore: 11,
      freshness: 1.0,
      stockPrice: 55,
      speedMultiplier: 1.0,
      growthFactor: 1.05,
      hypeMultiplier: 1.15,
      preferredSizes: ['small', 'medium'],
      trainingJob: null,
      idleTimer: 4,
    },
  ];
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
    playerFreshness: 1.0,
    rivals: createDefaultRivals(),

    // Economy state
    coolingPurchases: 0,
    officeSnacks: false,
    salaryMultiplier: 1.0,
    dataCentersOwned: 0,
    stocksOwned: { helix: 0, pebble: 0, northglass: 0, vesper: 0 },
    stockPriceTimer: 30,
    fundingTaken: {},
    marketingActiveSeconds: 0,
    marketingCooldownSeconds: 0,
    payrollTight: false,

    // Research state
    researchOwned: {},
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
      return {
        ...parsed,
        playerFreshness: parsed.playerFreshness ?? 1.0,
        rivals: Array.isArray(parsed.rivals) && parsed.rivals.length > 0 ? parsed.rivals : createDefaultRivals(),
        coolingPurchases: parsed.coolingPurchases ?? 0,
        officeSnacks: parsed.officeSnacks ?? false,
        salaryMultiplier: parsed.salaryMultiplier ?? 1.0,
        dataCentersOwned: parsed.dataCentersOwned ?? 0,
        stocksOwned: parsed.stocksOwned ?? { helix: 0, pebble: 0, northglass: 0, vesper: 0 },
        stockPriceTimer: parsed.stockPriceTimer ?? 30,
        fundingTaken: parsed.fundingTaken ?? {},
        marketingActiveSeconds: parsed.marketingActiveSeconds ?? 0,
        marketingCooldownSeconds: parsed.marketingCooldownSeconds ?? 0,
        payrollTight: parsed.payrollTight ?? false,
        researchOwned: parsed.researchOwned ?? {},
      } as GameState;
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
        corrupted: rawMain !== null,
      };
    }
  }

  return {
    state: createInitialState(),
    loadedFromBackup: false,
    corrupted: rawMain !== null,
  };
}
