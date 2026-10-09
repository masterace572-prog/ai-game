import {
  SAVE_KEY,
  BACKUP_SAVE_KEY,
  SAVE_V1_KEY,
  BACKUP_V1_KEY,
  DEFAULT_LAB_NAME,
  STARTING_CASH,
  RIVAL_DEFINITIONS,
  getRivalNextTimer,
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

export function createInitialRivals(): RivalState[] {
  return RIVAL_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    shortCode: def.shortCode,
    strength: def.strength,
    step: 0,
    timer: getRivalNextTimer(0),
  }));
}

export function createInitialState(showFreshStartSheet: boolean = true): GameState {
  return {
    version: 2,
    savedAt: Date.now(),
    labName: DEFAULT_LAB_NAME,
    cash: STARTING_CASH,
    lifetimeEarned: STARTING_CASH,
    modelStep: -1,
    training: null,
    readyStep: null,
    products: {
      chat: 0,
      api: 0,
      code: 0,
      enterprise: 0,
      mobile: 0,
      science: 0,
      robots: 0,
    },
    rivals: createInitialRivals(),
    stocks: {
      helix: 0,
      northglass: 0,
      vesper: 0,
      pebble: 0,
    },
    fundingTaken: {},
    people: {
      engineers: 0,
      sales: 0,
      researchers: 0,
    },
    gpuClusters: 0,
    buildings: 0,
    lastTickTime: Date.now(),
    soundEnabled: true,
    reduceMotion: false,
    showFreshStartSheet,
    achievements: {},
    tutorialDone: true,
    eventLogs: [],
    managers: {},
    managerAutoBuy: {},
    upgrades: {},
    buyAmount: '1',
    autoBuyAccumulator: 0,
    vibrationEnabled: true,
    lastDoubleAt: 0,
    dailyStreak: 1,
    lastDailyClaimDate: '',
    day7BonusTimer: 0,
    viralLaunchTimer: 0,
    goldenGpuBuffTimer: 0,
    hypeWaveTimer: 0,
    dataDealActive: false,
    outageTimer: 0,
    lawsuitPenaltyTimer: 0,
  };
}

export function saveGameState(state: GameState, storage?: StorageLike | null): boolean {
  const store = storage !== undefined ? storage : getDefaultStorage();
  if (!store) return false;

  try {
    const serialized = JSON.stringify({
      ...state,
      version: 2,
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
  migratedFromV1?: boolean;
}

function parseV2State(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 2 && typeof parsed.cash === 'number') {
      return {
        ...parsed,
        labName: parsed.labName || DEFAULT_LAB_NAME,
        products: parsed.products ?? {
          chat: 0,
          api: 0,
          code: 0,
          enterprise: 0,
          mobile: 0,
          science: 0,
          robots: 0,
        },
        rivals: Array.isArray(parsed.rivals) && parsed.rivals.length > 0 ? parsed.rivals : createInitialRivals(),
        stocks: parsed.stocks ?? { helix: 0, northglass: 0, vesper: 0, pebble: 0 },
        fundingTaken: parsed.fundingTaken ?? {},
        people: parsed.people ?? { engineers: 0, sales: 0, researchers: 0 },
        gpuClusters: parsed.gpuClusters ?? 0,
        buildings: parsed.buildings ?? 0,
        lastTickTime: Date.now(),
        soundEnabled: parsed.soundEnabled ?? true,
        reduceMotion: parsed.reduceMotion ?? false,
        achievements: parsed.achievements ?? {},
        tutorialDone: parsed.tutorialDone !== undefined ? parsed.tutorialDone : true,
        eventLogs: Array.isArray(parsed.eventLogs) ? parsed.eventLogs : [],
        managers: parsed.managers ?? {},
        managerAutoBuy: parsed.managerAutoBuy ?? {},
        upgrades: parsed.upgrades ?? {},
        buyAmount: parsed.buyAmount ?? '1',
        autoBuyAccumulator: parsed.autoBuyAccumulator ?? 0,
        vibrationEnabled: parsed.vibrationEnabled ?? true,
        lastDoubleAt: parsed.lastDoubleAt ?? 0,
        dailyStreak: parsed.dailyStreak ?? 1,
        lastDailyClaimDate: parsed.lastDailyClaimDate ?? '',
        day7BonusTimer: parsed.day7BonusTimer ?? 0,
        viralLaunchTimer: parsed.viralLaunchTimer ?? 0,
        goldenGpuBuffTimer: parsed.goldenGpuBuffTimer ?? 0,
        hypeWaveTimer: parsed.hypeWaveTimer ?? 0,
        dataDealActive: parsed.dataDealActive ?? false,
        outageTimer: parsed.outageTimer ?? 0,
        lawsuitPenaltyTimer: parsed.lawsuitPenaltyTimer ?? 0,
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
      state: createInitialState(true),
      loadedFromBackup: false,
      corrupted: false,
    };
  }

  // 1. Check v2 main key
  const rawMain = store.getItem(SAVE_KEY);
  if (rawMain) {
    const mainParsed = parseV2State(rawMain);
    if (mainParsed) {
      return {
        state: mainParsed,
        loadedFromBackup: false,
        corrupted: false,
      };
    }
  }

  // 2. Check v2 backup key
  const rawBackup = store.getItem(BACKUP_SAVE_KEY);
  if (rawBackup) {
    const backupParsed = parseV2State(rawBackup);
    if (backupParsed) {
      return {
        state: backupParsed,
        loadedFromBackup: true,
        corrupted: rawMain !== null,
      };
    }
  }

  // 3. Check if v1 save exists -> copy untouched to modelfoundry.save.v1.backup and start fresh v2 game
  const rawV1 = store.getItem(SAVE_V1_KEY);
  if (rawV1) {
    try {
      store.setItem(BACKUP_V1_KEY, rawV1);
    } catch {
      // ignore backup error
    }
    const freshState = createInitialState(true);
    saveGameState(freshState, store);
    return {
      state: freshState,
      loadedFromBackup: false,
      corrupted: false,
      migratedFromV1: true,
    };
  }

  // 4. Default fresh start
  const fresh = createInitialState(true);
  saveGameState(fresh, store);
  return {
    state: fresh,
    loadedFromBackup: false,
    corrupted: rawMain !== null,
  };
}
