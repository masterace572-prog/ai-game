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
  RIVALS_ERA_1,
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
  const shortCodeMap: Record<string, string> = {
    helix: 'HA',
    pebble: 'PM',
    northglass: 'NG',
    vesper: 'VW',
  };
  const preferredMap: Record<string, RivalState['preferredSizes']> = {
    helix: ['medium', 'large'],
    pebble: ['tiny', 'small'],
    northglass: ['medium', 'large'],
    vesper: ['small', 'medium'],
  };
  const idleMap: Record<string, number> = {
    helix: 5,
    pebble: 3,
    northglass: 8,
    vesper: 4,
  };

  return RIVALS_ERA_1.map((def) => ({
    id: def.id,
    name: def.name,
    shortCode: shortCodeMap[def.id] ?? def.id.slice(0, 2).toUpperCase(),
    style: def.style,
    bestScore: def.startingBestScore,
    freshness: 1.0,
    stockPrice: def.startingStockPrice,
    speedMultiplier: def.speedMultiplier,
    growthFactor: def.growthFactor,
    hypeMultiplier: def.hypeMultiplier ?? 1.0,
    preferredSizes: preferredMap[def.id] ?? ['small'],
    trainingJob: null,
    idleTimer: idleMap[def.id] ?? 5,
  }));
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
    allTimeBestScore: 0,
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

    // Events state (Phase 7)
    eventCooldownTimer: 90,
    eventRollTimer: 60,
    pendingEvent: null,
    activeTimedEvents: [],
    eventLogs: [],

    // Achievements state (Phase 7)
    achievements: {},
    timesPrestiged: 0,

    // Tutorial state (Phase 7)
    tutorialStep: 1,
    tutorialDone: false,

    // Settings (Phase 8)
    soundEnabled: true,
    reduceMotion: false,
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

        // Events
        eventCooldownTimer: parsed.eventCooldownTimer ?? 90,
        eventRollTimer: parsed.eventRollTimer ?? 60,
        pendingEvent: parsed.pendingEvent ?? null,
        activeTimedEvents: Array.isArray(parsed.activeTimedEvents) ? parsed.activeTimedEvents : [],
        eventLogs: Array.isArray(parsed.eventLogs) ? parsed.eventLogs : [],

        // Achievements
        achievements: parsed.achievements ?? {},
        timesPrestiged: parsed.timesPrestiged ?? 0,
        allTimeBestScore: parsed.allTimeBestScore ?? 0,

        // Tutorial: existing saves not forced back into tutorial
        tutorialStep: parsed.tutorialStep ?? 6,
        tutorialDone: parsed.tutorialDone !== undefined ? parsed.tutorialDone : true,

        // Settings (Phase 8)
        soundEnabled: parsed.soundEnabled ?? true,
        reduceMotion: parsed.reduceMotion ?? false,
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
