import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Plug,
  Code,
  Building2,
  Smartphone,
  Atom,
  Bot,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Lock,
  TrendingUp,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { TopBar } from './ui/TopBar';
import { BottomNav, type NavTabId } from './ui/BottomNav';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { OfflineModal } from './ui/OfflineModal';
import { DailyRewardModal } from './ui/DailyRewardModal';
import { LaunchModal } from './ui/LaunchModal';
import { GoldenGpuTile } from './ui/GoldenGpuTile';
import { ChoiceModal } from './ui/ChoiceModal';
import { ActiveEffectsChips } from './ui/ActiveEffectsChips';
import { ModelsScreen } from './ui/ModelsScreen';
import { ShopScreen } from './ui/ShopScreen';
import { InvestScreen } from './ui/InvestScreen';
import { EventsLogScreen } from './ui/EventsLogScreen';
import { AchievementsScreen } from './ui/AchievementsScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { NewEraScreen } from './ui/NewEraScreen';
import { MoreScreen } from './ui/MoreScreen';
import { Toast } from './ui/Toast';
import { Segmented } from './ui/Segmented';
import { loadGameState, saveGameState, createInitialState } from './game/save';
import {
  playTap,
  playLaunch,
  playEvent,
  playMilestone,
  playPurchase,
  playGoldenGpu,
} from './ui/audio';
import { tapLight, impactMedium, success } from './ui/haptics';
import {
  checkDailyRewardStatus,
  calculateDailyRewardAmount,
  getLocalDateString,
} from './game/dailyReward';
import { formatMoney, formatCost, formatRate } from './ui/format';
import {
  stepGame,
  tapEarn,
  startTraining,
  boostTraining,
  launchModel,
  buyProductBulk,
  hireEngineerBulk,
  hireSalesBulk,
  hireResearcherBulk,
  buyGpuClusterBulk,
  buyBuilding,
  hireManager,
  toggleManagerAutoBuy,
  buyUpgrade,
  takeFunding,
  buyStock,
  sellStock,
  calculateTotalIncomePerSec,
  getCheapestNextGoal,
  getEffectiveBuyPlan,
  getBestBuyRecommendation,
  executeBestBuy,
  simulateOfflineCatchUp,
  type OfflineReport,
  type BestBuySuggestion,
} from './game/logic';
import {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  MILESTONES,
  MANAGERS,
  UPGRADES,
  ALL_UPGRADE_IDS,
  getModelCost,
  getModelBaseSeconds,
  getModelScore,
  getModelIncomeMultiplier,
  getProductIncomePerSec,
  getNextProductMilestone,
  getTrainingSpeed,
} from './game/balance';
import type { GameState, ProductId, BuyAmount, EventChoiceModalData } from './game/types';
import './styles.css';

interface TapFloater {
  id: number;
  x: number;
  y: number;
  amount: string;
  color?: string;
}

export const App: React.FC = () => {
  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => {
    const loaded = loadGameState();
    const { nextState, report } = simulateOfflineCatchUp(loaded.state, Date.now());
    if (report) {
      setTimeout(() => setOfflineReport(report), 50);
    }
    return nextState;
  });

  const [activeTab, setActiveTab] = useState<
    NavTabId | 'events' | 'achievements' | 'settings' | 'new-era'
  >('lab');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lockedProductsOpen, setLockedProductsOpen] = useState(false);
  const [floaters, setFloaters] = useState<TapFloater[]>([]);
  const [buyAmount, setBuyAmountState] = useState<BuyAmount>(gameState.buyAmount ?? '1');
  const [flashingProduct, setFlashingProduct] = useState<ProductId | null>(null);
  const [poppingProductLevel, setPoppingProductLevel] = useState<ProductId | null>(null);

  // New v0.5.0 modal and event states
  const [dailyRewardOpen, setDailyRewardOpen] = useState(false);
  const [launchModalData, setLaunchModalData] = useState<{
    modelName: string;
    score: number;
    multiplier: number;
  } | null>(null);
  const [choiceModalData, setChoiceModalData] = useState<EventChoiceModalData>(null);
  const [goldenGpuTile, setGoldenGpuTile] = useState<{
    xPercent: number;
    yPercent: number;
    expiresAt: number;
  } | null>(null);
  const [isCashPopping, setIsCashPopping] = useState(false);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Rate limiting refs
  const lastHeroTapRef = useRef<number>(0);
  const lastBoostTapRef = useRef<number>(0);

  // Random event timer ref (45 to 90s)
  const eventCountdownRef = useRef<number>(45 + Math.random() * 45);

  // Sync reduce-motion attribute to document body
  useEffect(() => {
    document.body.setAttribute('data-reduce-motion', String(Boolean(gameState.reduceMotion)));
  }, [gameState.reduceMotion]);

  // Cash jump scale pop detection (>5% jump)
  const prevCashRef = useRef<number>(gameState.cash);
  useEffect(() => {
    const prev = prevCashRef.current;
    const current = gameState.cash;
    prevCashRef.current = current;
    if (prev > 0 && current > prev && (current - prev) / prev > 0.05) {
      if (!gameState.reduceMotion) {
        setIsCashPopping(true);
        const timer = setTimeout(() => setIsCashPopping(false), 180);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.cash, gameState.reduceMotion]);

  // Check daily reward on mount
  useEffect(() => {
    const status = checkDailyRewardStatus(
      gameStateRef.current.lastDailyClaimDate,
      gameStateRef.current.dailyStreak
    );
    if (status.canClaim) {
      setDailyRewardOpen(true);
    }
  }, []);

  const lastTickTimeRef = useRef<number>(Date.now());
  const lastSaveTimeRef = useRef<number>(Date.now());

  // Floater helper
  const addFloater = useCallback(
    (
      amount: string,
      color: string = 'var(--money)',
      x?: number,
      y?: number
    ) => {
      const id = Date.now() + Math.random();
      const floaterX = x ?? 140 + (Math.random() * 40 - 20);
      const floaterY = y ?? 70;
      setFloaters((prev) => [
        ...prev.slice(-5), // max 6 alive at once (5 previous + 1 new)
        { id, x: floaterX, y: floaterY, amount, color },
      ]);
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 700);
    },
    []
  );

  // Save helper
  const triggerSave = useCallback((stateToSave: GameState) => {
    saveGameState(stateToSave);
    lastSaveTimeRef.current = Date.now();
  }, []);

  // Trigger random refreshed Tycoon events
  const triggerRandomTycoonEvent = useCallback(
    (currentState: GameState) => {
      const isGood = Math.random() < 0.7;
      const currentIncome = calculateTotalIncomePerSec(currentState);

      if (isGood) {
        const roll = Math.floor(Math.random() * 5);
        if (roll === 0) {
          // 1. Viral Launch: x3 income 30s
          const nextState: GameState = {
            ...currentState,
            viralLaunchTimer: 30,
            eventLogs: [
              ...(currentState.eventLogs ?? []),
              {
                id: String(Date.now()),
                title: 'Viral Launch',
                outcomeText:
                  'Global social media explosion! All product income x3 for 30 seconds.',
                timestamp: Date.now(),
              },
            ],
          };
          setGameState(nextState);
          gameStateRef.current = nextState;
          setToastMessage('Viral Launch! x3 Income for 30s!');
          playEvent(nextState.soundEnabled ?? true);
          addFloater('x3 Income!', 'var(--hype)');
        } else if (roll === 1) {
          // 2. Golden GPU: 56px gold Cpu tile on Lab for 8s
          setGoldenGpuTile({
            xPercent: 15 + Math.random() * 65,
            yPercent: 25 + Math.random() * 45,
            expiresAt: Date.now() + 8000,
          });
          setToastMessage('Golden GPU appeared in the Lab! Tap it quick!');
          playEvent(currentState.soundEnabled ?? true);
        } else if (roll === 2) {
          // 3. Investor Visit: instant 90s income
          const bonus = Math.max(100, Math.round(currentIncome * 90));
          const nextState: GameState = {
            ...currentState,
            cash: currentState.cash + bonus,
            lifetimeEarned: currentState.lifetimeEarned + bonus,
            eventLogs: [
              ...(currentState.eventLogs ?? []),
              {
                id: String(Date.now()),
                title: 'Investor Visit',
                outcomeText: `An angel syndicate visited and provided a grant of ${formatMoney(bonus)}.`,
                timestamp: Date.now(),
              },
            ],
          };
          setGameState(nextState);
          gameStateRef.current = nextState;
          setToastMessage(`Investor Visit! Granted +${formatMoney(bonus)}`);
          playEvent(nextState.soundEnabled ?? true);
          addFloater(`+${formatMoney(bonus)}`, 'var(--gold)');
        } else if (roll === 3) {
          // 4. Hype Wave: x2 training speed 45s
          const nextState: GameState = {
            ...currentState,
            hypeWaveTimer: 45,
            eventLogs: [
              ...(currentState.eventLogs ?? []),
              {
                id: String(Date.now()),
                title: 'Hype Wave',
                outcomeText:
                  'Developer excitement surging! Model training speed x2 for 45s.',
                timestamp: Date.now(),
              },
            ],
          };
          setGameState(nextState);
          gameStateRef.current = nextState;
          setToastMessage('Hype Wave! x2 Training Speed for 45s!');
          playEvent(nextState.soundEnabled ?? true);
        } else {
          // 5. Data Deal: next model trains 30% faster
          const nextState: GameState = {
            ...currentState,
            dataDealActive: true,
            eventLogs: [
              ...(currentState.eventLogs ?? []),
              {
                id: String(Date.now()),
                title: 'Data Deal',
                outcomeText:
                  'High-quality curated synthetic dataset acquired. Next model trains 30% faster.',
                timestamp: Date.now(),
              },
            ],
          };
          setGameState(nextState);
          gameStateRef.current = nextState;
          setToastMessage('Data Deal secured! Next model trains 30% faster.');
          playEvent(nextState.soundEnabled ?? true);
        }
      } else {
        // Bad events (30%)
        const roll = Math.floor(Math.random() * 3);
        if (roll === 0) {
          // 6. Outage: x0.5 income 20s
          const nextState: GameState = {
            ...currentState,
            outageTimer: 20,
            eventLogs: [
              ...(currentState.eventLogs ?? []),
              {
                id: String(Date.now()),
                title: 'Cloud Outage',
                outcomeText:
                  'Provider disruption cut API income in half for 20s. Tap Fix to recover immediately.',
                timestamp: Date.now(),
              },
            ],
          };
          setGameState(nextState);
          gameStateRef.current = nextState;
          setToastMessage('Cloud Outage! Income cut by 50% for 20s.');
          playEvent(nextState.soundEnabled ?? true);
        } else if (roll === 1) {
          // 7. Lawsuit
          const settleCost = Math.max(50, Math.round(currentIncome * 120));
          setChoiceModalData({
            type: 'lawsuit',
            title: 'Copyright Lawsuit Filed',
            desc:
              'A rival consortium claims fair-use violations in pre-training data. Settle with a fee or fight in court (-20% market share for 2 minutes).',
            settleCost,
          });
          playEvent(currentState.soundEnabled ?? true);
        } else {
          // 8. Talent Poach
          const counterCost = Math.max(50, Math.round(currentIncome * 60));
          setChoiceModalData({
            type: 'talent_poach',
            title: 'Lead Engineer Poached',
            desc:
              'A well-funded rival startup offered a massive compensation package to one of your senior research engineers.',
            counterCost,
          });
          playEvent(currentState.soundEnabled ?? true);
        }
      }
    },
    [addFloater]
  );

  // Live timer: 4 ticks a second (250ms)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      lastTickTimeRef.current = Date.now();
      if (intervalId !== null) clearInterval(intervalId);

      intervalId = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.min((now - lastTickTimeRef.current) / 1000, 1.0);
        lastTickTimeRef.current = now;

        setGameState((prevState) => {
          const { state: nextState, events } = stepGame(
            prevState,
            deltaSeconds
          );

          const modelFinished = events?.some((e) => e.type === 'ready');
          if (modelFinished) {
            setToastMessage('Training complete! Model is ready to launch.');
            playEvent(nextState.soundEnabled ?? true);
          }

          if (events) {
            for (const ev of events) {
              if (ev.type === 'milestone' && ev.productId) {
                setFlashingProduct(ev.productId);
                setTimeout(() => setFlashingProduct(null), 200);
                const mDef = MILESTONES.find((m) => m.level === ev.level);
                const mult = mDef ? mDef.mult : 2;
                setToastMessage(`${PRODUCTS[ev.productId].name} x${mult}!`);
                playMilestone(nextState.soundEnabled ?? true);
                success(nextState.vibrationEnabled ?? true);
              }
            }
          }

          // Random event countdown (only while open and not during sheets)
          eventCountdownRef.current -= deltaSeconds;
          if (eventCountdownRef.current <= 0) {
            if (
              !offlineReport &&
              !dailyRewardOpen &&
              !launchModalData &&
              !choiceModalData
            ) {
              eventCountdownRef.current = 45 + Math.random() * 45;
              triggerRandomTycoonEvent(nextState);
            } else {
              eventCountdownRef.current = 10;
            }
          }

          // Auto-save every 5 seconds or immediately when model finishes
          const timeSinceSave = now - lastSaveTimeRef.current;
          if (modelFinished || timeSinceSave >= 5000) {
            saveGameState(nextState);
            lastSaveTimeRef.current = now;
          }

          return nextState;
        });

        // Golden GPU expiration check
        setGoldenGpuTile((currentTile) => {
          if (currentTile && Date.now() > currentTile.expiresAt) {
            return null;
          }
          return currentTile;
        });
      }, 250);
    };

    const stopTimer = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
        triggerSave(gameStateRef.current);
      } else {
        const now = Date.now();
        const { nextState, report } = simulateOfflineCatchUp(gameStateRef.current, now);
        setGameState(nextState);
        gameStateRef.current = nextState;
        triggerSave(nextState);
        if (report) {
          setOfflineReport(report);
        }
        startTimer();
      }
    };

    const handleBeforeUnload = () => {
      triggerSave(gameStateRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopTimer();
      triggerSave(gameStateRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    triggerSave,
    triggerRandomTycoonEvent,
    offlineReport,
    dailyRewardOpen,
    launchModalData,
    choiceModalData,
  ]);

  // Tap-to-earn handler (rate limited to max 10 taps/sec = 100ms)
  const handleHeroTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastHeroTapRef.current < 90) return; // 10 taps/sec max
    lastHeroTapRef.current = now;

    const { state: nextState, earned } = tapEarn(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
    tapLight(nextState.vibrationEnabled ?? true);

    // Floating animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addFloater(`+${formatCost(earned)}`, 'var(--money)', x, y);
  };

  // Boost training handler (rate limited to max 8 taps/sec = 125ms)
  const handleBoost = () => {
    const now = Date.now();
    if (now - lastBoostTapRef.current < 115) return; // 8 taps/sec max
    lastBoostTapRef.current = now;

    if (!gameState.training) return;
    const nextState = boostTraining(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
    tapLight(nextState.vibrationEnabled ?? true);
  };

  // Start training
  const handleStartTraining = () => {
    const nextState = startTraining(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playTap(nextState.soundEnabled ?? true);
    tapLight(nextState.vibrationEnabled ?? true);
  };

  // Launch model
  const handleLaunch = () => {
    const { state: nextState, launchedName } = launchModel(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playLaunch(nextState.soundEnabled ?? true);
    success(nextState.vibrationEnabled ?? true);

    const score = getModelScore(nextState.modelStep, nextState.people.researchers);
    const multiplier = getModelIncomeMultiplier(nextState.modelStep);
    setLaunchModalData({
      modelName: launchedName,
      score,
      multiplier,
    });
    addFloater(`+x${multiplier.toFixed(1)} Income`, 'var(--gold)');
  };

  // Buy amount mode
  const handleSetBuyAmount = (mode: BuyAmount) => {
    setBuyAmountState(mode);
    const nextState = { ...gameStateRef.current, buyAmount: mode };
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
    tapLight(nextState.vibrationEnabled ?? true);
  };

  // Buy product bulk
  const handleBuyProduct = (productId: ProductId) => {
    const res = buyProductBulk(gameStateRef.current, productId, buyAmount);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      setPoppingProductLevel(productId);
      setTimeout(() => setPoppingProductLevel(null), 200);

      if (res.milestonesPassed.length > 0) {
        setFlashingProduct(productId);
        setTimeout(() => setFlashingProduct(null), 200);
        const lastMilestone = res.milestonesPassed[res.milestonesPassed.length - 1];
        const mDef = MILESTONES.find((m) => m.level === lastMilestone);
        const mult = mDef ? mDef.mult : 2;
        setToastMessage(`${PRODUCTS[productId].name} x${mult}!`);
        playMilestone(res.state.soundEnabled ?? true);
        success(res.state.vibrationEnabled ?? true);
      } else {
        playPurchase(res.state.soundEnabled ?? true);
        impactMedium(res.state.vibrationEnabled ?? true);
      }
    }
  };

  // Team hires
  const handleHireEngineer = (mode: BuyAmount = buyAmount) => {
    const res = hireEngineerBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playPurchase(res.state.soundEnabled ?? true);
      impactMedium(res.state.vibrationEnabled ?? true);
    }
  };

  const handleHireSales = (mode: BuyAmount = buyAmount) => {
    const res = hireSalesBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playPurchase(res.state.soundEnabled ?? true);
      impactMedium(res.state.vibrationEnabled ?? true);
    }
  };

  const handleHireResearcher = (mode: BuyAmount = buyAmount) => {
    const res = hireResearcherBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playPurchase(res.state.soundEnabled ?? true);
      impactMedium(res.state.vibrationEnabled ?? true);
    }
  };

  const handleBuyGpuCluster = (mode: BuyAmount = buyAmount) => {
    const res = buyGpuClusterBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playPurchase(res.state.soundEnabled ?? true);
      impactMedium(res.state.vibrationEnabled ?? true);
    }
  };

  const handleBuyBuilding = () => {
    const nextState = buyBuilding(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      gameStateRef.current = nextState;
      playPurchase(nextState.soundEnabled ?? true);
      impactMedium(nextState.vibrationEnabled ?? true);
    }
  };

  const handleHireManager = (managerId: string) => {
    const nextState = hireManager(gameStateRef.current, managerId);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      gameStateRef.current = nextState;
      playPurchase(nextState.soundEnabled ?? true);
      impactMedium(nextState.vibrationEnabled ?? true);
      const name = MANAGERS[managerId]?.name || 'Manager';
      setToastMessage(`Hired ${name}!`);
    }
  };

  const handleToggleManagerAutoBuy = (managerId: string) => {
    const nextState = toggleManagerAutoBuy(gameStateRef.current, managerId);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    const nextState = buyUpgrade(gameStateRef.current, upgradeId);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      gameStateRef.current = nextState;
      playPurchase(nextState.soundEnabled ?? true);
      impactMedium(nextState.vibrationEnabled ?? true);
      const name = UPGRADES[upgradeId]?.name || 'Upgrade';
      setToastMessage(`Unlocked ${name}!`);
    }
  };

  const handleExecuteBestBuy = (best: BestBuySuggestion) => {
    const res = executeBestBuy(gameStateRef.current, best);
    setGameState(res.state);
    gameStateRef.current = res.state;
    if (res.milestonesPassed && res.milestonesPassed.length > 0) {
      const pid = best.id as ProductId;
      setFlashingProduct(pid);
      setTimeout(() => setFlashingProduct(null), 200);
      const lastMilestone = res.milestonesPassed[res.milestonesPassed.length - 1];
      const mDef = MILESTONES.find((m) => m.level === lastMilestone);
      const mult = mDef ? mDef.mult : 2;
      setToastMessage(`${PRODUCTS[pid]?.name || 'Product'} x${mult}!`);
      playMilestone(res.state.soundEnabled ?? true);
      success(res.state.vibrationEnabled ?? true);
    } else {
      playPurchase(res.state.soundEnabled ?? true);
      impactMedium(res.state.vibrationEnabled ?? true);
    }
  };

  // Golden GPU Tap
  const handleGoldenGpuTap = () => {
    setGoldenGpuTile(null);
    playGoldenGpu(gameState.soundEnabled ?? true);
    success(gameState.vibrationEnabled ?? true);

    const isOverclock = Math.random() < 0.25;
    const currentIncome = calculateTotalIncomePerSec(gameStateRef.current);

    if (isOverclock) {
      const nextState: GameState = {
        ...gameStateRef.current,
        goldenGpuBuffTimer: 15,
        eventLogs: [
          ...(gameStateRef.current.eventLogs ?? []),
          {
            id: String(Date.now()),
            title: 'Golden GPU Overclock',
            outcomeText: 'Overclocked compute clusters for 7x income burst for 15s.',
            timestamp: Date.now(),
          },
        ],
      };
      setGameState(nextState);
      gameStateRef.current = nextState;
      triggerSave(nextState);
      setToastMessage('Golden GPU Overclock! x7 Income for 15s!');
      addFloater('x7 Income!', 'var(--gold)');
    } else {
      const bonus = Math.max(50, Math.round(currentIncome * 60));
      const nextState: GameState = {
        ...gameStateRef.current,
        cash: gameStateRef.current.cash + bonus,
        lifetimeEarned: gameStateRef.current.lifetimeEarned + bonus,
        eventLogs: [
          ...(gameStateRef.current.eventLogs ?? []),
          {
            id: String(Date.now()),
            title: 'Golden GPU Yield',
            outcomeText: `Overclock yield produced ${formatMoney(bonus)} in instant compute revenue.`,
            timestamp: Date.now(),
          },
        ],
      };
      setGameState(nextState);
      gameStateRef.current = nextState;
      triggerSave(nextState);
      setToastMessage(`Golden GPU bonus! +${formatMoney(bonus)}`);
      addFloater(`+${formatMoney(bonus)}`, 'var(--gold)');
    }
  };

  // Fix outage
  const handleFixOutage = () => {
    const currentIncome = calculateTotalIncomePerSec(gameStateRef.current);
    const cost = Math.max(10, Math.round(currentIncome * 30));
    if (gameStateRef.current.cash >= cost) {
      const nextState: GameState = {
        ...gameStateRef.current,
        cash: gameStateRef.current.cash - cost,
        outageTimer: 0,
      };
      setGameState(nextState);
      gameStateRef.current = nextState;
      triggerSave(nextState);
      playPurchase(nextState.soundEnabled ?? true);
      impactMedium(nextState.vibrationEnabled ?? true);
      setToastMessage('Cloud outage fixed!');
    } else {
      setToastMessage('Not enough cash to fix outage now!');
    }
  };

  // Choice modal handlers
  const handleChoiceModalA = () => {
    if (!choiceModalData) return;
    const nextState = { ...gameStateRef.current };
    if (choiceModalData.type === 'lawsuit') {
      const cost = Math.min(nextState.cash, choiceModalData.settleCost);
      nextState.cash = Math.max(0, nextState.cash - cost);
      setToastMessage('Lawsuit settled.');
    } else if (choiceModalData.type === 'talent_poach') {
      const cost = Math.min(nextState.cash, choiceModalData.counterCost);
      nextState.cash = Math.max(0, nextState.cash - cost);
      setToastMessage('Counter-offer accepted. Engineer retained.');
    }
    setChoiceModalData(null);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playPurchase(nextState.soundEnabled ?? true);
    impactMedium(nextState.vibrationEnabled ?? true);
  };

  const handleChoiceModalB = () => {
    if (!choiceModalData) return;
    const nextState = { ...gameStateRef.current };
    if (choiceModalData.type === 'lawsuit') {
      nextState.lawsuitPenaltyTimer = 120;
      setToastMessage('Fighting lawsuit. Competitors gaining ground for 2m.');
    } else if (choiceModalData.type === 'talent_poach') {
      if (nextState.people.engineers > 0) {
        nextState.people = {
          ...nextState.people,
          engineers: nextState.people.engineers - 1,
        };
        setToastMessage('Engineer departed for a competitor.');
      } else {
        setToastMessage('No engineers to lose.');
      }
    }
    setChoiceModalData(null);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
  };

  // Offline collection handlers
  const handleCollectOffline = () => {
    setOfflineReport(null);
  };

  const handleCollectDoubleOffline = () => {
    if (!offlineReport) return;
    const earned = offlineReport.cashEarned;
    const now = Date.now();
    const nextState: GameState = {
      ...gameStateRef.current,
      cash: gameStateRef.current.cash + earned,
      lifetimeEarned: gameStateRef.current.lifetimeEarned + earned,
      lastDoubleAt: now,
    };
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    setOfflineReport(null);
    addFloater(`+${formatMoney(earned * 2)}`, 'var(--gold)');
    success(nextState.vibrationEnabled ?? true);
  };

  // Daily reward claim handler
  const handleClaimDailyReward = () => {
    const status = checkDailyRewardStatus(
      gameStateRef.current.lastDailyClaimDate,
      gameStateRef.current.dailyStreak
    );
    const currentIncome = calculateTotalIncomePerSec(gameStateRef.current);
    const reward = calculateDailyRewardAmount(currentIncome, status.streakDay);
    const today = getLocalDateString();
    const nextState: GameState = {
      ...gameStateRef.current,
      cash: gameStateRef.current.cash + reward,
      lifetimeEarned: gameStateRef.current.lifetimeEarned + reward,
      dailyStreak: status.streakDay,
      lastDailyClaimDate: today,
      day7BonusTimer: status.isDay7
        ? 600
        : (gameStateRef.current.day7BonusTimer ?? 0),
    };
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    setDailyRewardOpen(false);
    addFloater(`+${formatMoney(reward)}`, 'var(--gold)');
    setToastMessage(
      status.isDay7
        ? 'Day 7 claimed! x2 Income for 10 minutes!'
        : `Day ${status.streakDay} reward claimed!`
    );
    playLaunch(nextState.soundEnabled ?? true);
    success(nextState.vibrationEnabled ?? true);
  };

  // Funding
  const handleTakeFunding = (fundingId: string) => {
    const nextState = takeFunding(fundingId, gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playLaunch(nextState.soundEnabled ?? true);
    setToastMessage(`Funding round secured! Revenue permanently boosted.`);
  };

  // Stocks
  const handleBuyStock = (rivalId: string, count: number) => {
    const nextState = buyStock(gameStateRef.current, rivalId, count);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
  };

  const handleSellStock = (rivalId: string, count: number) => {
    const nextState = sellStock(gameStateRef.current, rivalId, count);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
  };

  // Settings handlers
  const handleToggleSound = () => {
    const nextState: GameState = {
      ...gameStateRef.current,
      soundEnabled: !gameStateRef.current.soundEnabled,
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleToggleReduceMotion = () => {
    const nextState: GameState = {
      ...gameStateRef.current,
      reduceMotion: !gameStateRef.current.reduceMotion,
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleToggleVibration = () => {
    const nextState: GameState = {
      ...gameStateRef.current,
      vibrationEnabled: !(gameStateRef.current.vibrationEnabled ?? true),
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleImportSave = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null) return false;
      const clean = createInitialState(false);
      const nextState: GameState = { ...clean, ...parsed, version: 2 };
      setGameState(nextState);
      triggerSave(nextState);
      return true;
    } catch {
      return false;
    }
  };

  const handleWipeSave = () => {
    const fresh = createInitialState(false);
    setGameState(fresh);
    triggerSave(fresh);
  };

  const handleDismissFreshStartSheet = () => {
    const nextState: GameState = {
      ...gameStateRef.current,
      showFreshStartSheet: false,
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const incomePerSec = calculateTotalIncomePerSec(gameState);
  const trainingSpeed = getTrainingSpeed(gameState.people.engineers, gameState.gpuClusters, gameState.upgrades);
  const nextModelStep = gameState.modelStep + 1;
  const nextModelName = CLAUDE_LADDER[nextModelStep] ?? 'Max Tier Reached';
  const nextModelCost = getModelCost(nextModelStep);
  const nextModelSeconds = Math.round(getModelBaseSeconds(nextModelStep));

  const bestBuy = getBestBuyRecommendation(gameState);
  const unownedUpgradesList = ALL_UPGRADE_IDS.map((id) => UPGRADES[id]).filter(
    (u) => !gameState.upgrades?.[u.id]
  );
  const affordableUnownedUpgrades = unownedUpgradesList
    .filter((u) => u.cost <= gameState.cash)
    .sort((a, b) => a.cost - b.cost);
  const nextLabUpgrade =
    affordableUnownedUpgrades[0] ||
    unownedUpgradesList.sort((a, b) => a.cost - b.cost)[0] ||
    null;

  const unlockedProducts = PRODUCT_ORDER.filter(
    (pid) => gameState.modelStep >= PRODUCTS[pid].unlockStep
  );
  const lockedProducts = PRODUCT_ORDER.filter(
    (pid) => gameState.modelStep < PRODUCTS[pid].unlockStep
  );

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return MessageSquare;
      case 'Plug':
        return Plug;
      case 'Code':
        return Code;
      case 'Building2':
        return Building2;
      case 'Smartphone':
        return Smartphone;
      case 'Atom':
        return Atom;
      case 'Bot':
        return Bot;
      default:
        return Zap;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <TopBar
        cash={gameState.cash}
        ratePerSec={incomePerSec}
        labName={gameState.labName || 'Claude'}
        soundEnabled={gameState.soundEnabled ?? true}
        onToggleSound={handleToggleSound}
      />

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* TAB 1: LAB */}
        {activeTab === 'lab' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)', position: 'relative' }}>
            {/* GOLDEN GPU TILE */}
            {goldenGpuTile && (
              <GoldenGpuTile
                xPercent={goldenGpuTile.xPercent}
                yPercent={goldenGpuTile.yPercent}
                onTap={handleGoldenGpuTap}
              />
            )}

            {/* HERO CARD: Tap-to-earn */}
            <div
              onClick={handleHeroTap}
              style={{
                position: 'relative',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--space-1)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Claude Treasury
              </span>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  margin: '2px 0',
                  transform: isCashPopping && !gameState.reduceMotion ? 'scale(1.06)' : 'scale(1.0)',
                  transition: gameState.reduceMotion ? 'none' : 'transform 180ms ease',
                  display: 'inline-block',
                }}
              >
                {formatMoney(gameState.cash)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>
                <TrendingUp size={16} />
                <span>{formatRate(incomePerSec)}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                Tap card to earn (+{formatCost(0.50 + 0.05 * incomePerSec)})
              </span>

              {/* Floating tap animations */}
              {floaters.map((floater) => (
                <div
                  key={floater.id}
                  style={{
                    position: 'absolute',
                    left: `${floater.x}px`,
                    top: `${floater.y}px`,
                    color: floater.color || 'var(--money)',
                    fontSize: '16px',
                    fontWeight: 800,
                    pointerEvents: 'none',
                    animation: gameState.reduceMotion ? 'none' : 'floatUp24 700ms ease-out forwards',
                    zIndex: 30,
                  }}
                >
                  {floater.amount}
                </div>
              ))}
            </div>

            {/* ACTIVE EFFECTS CHIPS */}
            <ActiveEffectsChips
              gameState={gameState}
              incomePerSec={incomePerSec}
              onFixOutage={handleFixOutage}
            />

            {/* GOAL CARD */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                <Target size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Next Target
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getCheapestNextGoal(gameState)}
                </div>
              </div>
            </div>

            {/* BEST BUY SUGGESTION */}
            {bestBuy && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--gold-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold)',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase' }}>
                      Best Buy
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bestBuy.label}
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExecuteBestBuy(bestBuy)}
                >
                  Buy {formatCost(bestBuy.cost)}
                </Button>
              </div>
            )}

            {/* TRAINING CARD */}
            {gameState.training !== null ? (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                      Training in Progress
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                      {CLAUDE_LADDER[gameState.training.step]}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                      {Math.max(0, Math.ceil((gameState.training.total - gameState.training.progress) / trainingSpeed))}s left
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {trainingSpeed.toFixed(1)}x speed
                    </div>
                  </div>
                </div>

                <ProgressBar
                  value={gameState.training.progress}
                  max={gameState.training.total}
                />

                <Button variant="secondary" fullWidth onClick={handleBoost}>
                  <Zap size={16} style={{ marginRight: '6px' }} />
                  Boost Training (Tap)
                </Button>
              </div>
            ) : gameState.readyStep !== null ? (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--success)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                    Model Training Complete!
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                    {CLAUDE_LADDER[gameState.readyStep]} is Ready!
                  </div>
                </div>

                <Button variant="primary" fullWidth onClick={handleLaunch}>
                  <Sparkles size={16} style={{ marginRight: '6px' }} />
                  Launch {CLAUDE_LADDER[gameState.readyStep]}
                </Button>
              </div>
            ) : nextModelStep < CLAUDE_LADDER.length ? (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    Next Model
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    {nextModelName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatCost(nextModelCost)} • ~{nextModelSeconds}s base
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={gameState.cash < nextModelCost}
                  onClick={handleStartTraining}
                >
                  Start Training
                </Button>
              </div>
            ) : null}

            {/* PRODUCTS HEADER WITH BUY AMOUNT SELECTOR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Products & Services
                </span>
                <div style={{ width: '160px' }}>
                  <Segmented
                    value={buyAmount}
                    onChange={(val) => handleSetBuyAmount(val as BuyAmount)}
                    options={[
                      { id: '1', label: 'x1' },
                      { id: '10', label: 'x10' },
                      { id: 'max', label: 'Max' },
                    ]}
                  />
                </div>
              </div>

              {unlockedProducts.map((pid) => {
                const def = PRODUCTS[pid];
                const level = gameState.products[pid] ?? 0;
                const income = getProductIncomePerSec(pid, level);
                const milestone = getNextProductMilestone(level);
                const plan = getEffectiveBuyPlan(def.baseCost, def.costGrowth, level, gameState.cash, buyAmount);
                const canBuy = plan.canAfford && plan.count > 0;
                const IconComponent = getProductIcon(def.iconName);

                // Progress to next milestone
                let progressValue = 1;
                let milestoneLabel = 'Max';
                if (milestone) {
                  progressValue = Math.min(1, Math.max(0, (level - milestone.prevLevel) / (milestone.nextLevel - milestone.prevLevel)));
                  milestoneLabel = `x${milestone.multiplier} at Lv ${milestone.nextLevel}`;
                }

                return (
                  <div
                    key={pid}
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: flashingProduct === pid ? '2px solid var(--money)' : '1px solid var(--border)',
                      boxShadow: flashingProduct === pid ? '0 0 12px var(--money)' : 'none',
                      transition: 'border 0.2s ease, box-shadow 0.2s ease',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                          }}
                        >
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                              {def.name}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor:
                                  poppingProductLevel === pid
                                    ? 'var(--accent-subtle)'
                                    : 'var(--surface-active)',
                                color:
                                  poppingProductLevel === pid
                                    ? 'var(--accent)'
                                    : 'var(--text-secondary)',
                                transform:
                                  poppingProductLevel === pid &&
                                  !gameState.reduceMotion
                                    ? 'scale(1.25)'
                                    : 'scale(1.0)',
                                transition: gameState.reduceMotion
                                  ? 'none'
                                  : 'transform 200ms ease, background-color 200ms ease',
                                display: 'inline-block',
                              }}
                            >
                              Lv {level}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                            +{formatRate(income)}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!canBuy}
                        onClick={() => handleBuyProduct(pid)}
                      >
                        +{plan.count} • {formatCost(plan.cost)}
                      </Button>
                    </div>

                    {/* Always show next milestone bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={progressValue} max={1} />
                      </div>
                      <span style={{ fontSize: '11px', color: milestone ? 'var(--text-tertiary)' : 'var(--success)', minWidth: '85px', textAlign: 'right' }}>
                        {milestoneLabel}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* NEXT AFFORDABLE UPGRADE ON LAB UNDER PRODUCTS */}
              {nextLabUpgrade && (
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor:
                          nextLabUpgrade.category === 'global'
                            ? 'var(--gold-tint)'
                            : nextLabUpgrade.category === 'training'
                            ? 'var(--compute-tint)'
                            : 'var(--money-tint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color:
                          nextLabUpgrade.category === 'global'
                            ? 'var(--gold)'
                            : nextLabUpgrade.category === 'training'
                            ? 'var(--compute)'
                            : 'var(--money)',
                        flexShrink: 0,
                      }}
                    >
                      {nextLabUpgrade.category === 'global' ? (
                        <TrendingUp size={18} />
                      ) : nextLabUpgrade.category === 'training' ? (
                        <Zap size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                          {nextLabUpgrade.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--surface-active)',
                            color: 'var(--text-secondary)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {nextLabUpgrade.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {nextLabUpgrade.description}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={gameState.cash < nextLabUpgrade.cost}
                    onClick={() => handleBuyUpgrade(nextLabUpgrade.id)}
                  >
                    Buy {formatCost(nextLabUpgrade.cost)}
                  </Button>
                </div>
              )}

              {/* LOCKED PRODUCTS ACCORDION */}
              {lockedProducts.length > 0 && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={() => setLockedProductsOpen(!lockedProductsOpen)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Lock size={14} />
                      <span>Locked Products ({lockedProducts.length})</span>
                    </div>
                    {lockedProductsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {lockedProductsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      {lockedProducts.map((pid) => {
                        const def = PRODUCTS[pid];
                        const IconComponent = getProductIcon(def.iconName);

                        return (
                          <div
                            key={pid}
                            style={{
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--space-3) var(--space-4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              opacity: 0.6,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <IconComponent size={18} color="var(--text-tertiary)" />
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '13px' }}>
                                  {def.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                  Unlocks with {def.unlockModelName}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              Locked
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MODELS */}
        {activeTab === 'models' && (
          <ModelsScreen
            gameState={gameState}
            onStartTraining={handleStartTraining}
            onLaunchModel={handleLaunch}
          />
        )}

        {/* TAB 3: SHOP */}
        {activeTab === 'shop' && (
          <ShopScreen
            gameState={gameState}
            onHireEngineer={handleHireEngineer}
            onHireSales={handleHireSales}
            onHireResearcher={handleHireResearcher}
            onBuyGpuCluster={handleBuyGpuCluster}
            onBuyBuilding={handleBuyBuilding}
            onHireManager={handleHireManager}
            onToggleManagerAutoBuy={handleToggleManagerAutoBuy}
            onBuyUpgrade={handleBuyUpgrade}
            buyAmount={buyAmount}
            onSetBuyAmount={handleSetBuyAmount}
          />
        )}

        {/* TAB 4: INVEST */}
        {activeTab === 'invest' && (
          <InvestScreen
            gameState={gameState}
            onTakeFunding={handleTakeFunding}
            onBuyStock={handleBuyStock}
            onSellStock={handleSellStock}
          />
        )}

        {/* TAB 5: MORE */}
        {activeTab === 'more' && (
          <MoreScreen
            gameState={gameState}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToAchievements={() => setActiveTab('achievements')}
            onNavigateToSettings={() => setActiveTab('settings')}
            onNavigateToNewEra={() => setActiveTab('new-era')}
          />
        )}

        {/* SUB-VIEWS */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 'var(--space-2) 0',
              }}
            >
              <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
              <span>Back to More</span>
            </button>
            <EventsLogScreen gameState={gameState} onBackToMore={() => setActiveTab('more')} />
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementsScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
          />
        )}

        {activeTab === 'new-era' && (
          <NewEraScreen onBackToMore={() => setActiveTab('more')} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
            onToggleSound={handleToggleSound}
            onToggleReduceMotion={handleToggleReduceMotion}
            onToggleVibration={handleToggleVibration}
            onImportSave={handleImportSave}
            onWipeSave={handleWipeSave}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* OFFLINE MODAL */}
      {offlineReport && (
        <OfflineModal
          report={offlineReport}
          lastDoubleAt={gameState.lastDoubleAt}
          onCollect={handleCollectOffline}
          onCollectDouble={handleCollectDoubleOffline}
        />
      )}

      {/* DAILY REWARD MODAL */}
      {dailyRewardOpen && !offlineReport && (
        <DailyRewardModal
          streakDay={checkDailyRewardStatus(gameState.lastDailyClaimDate, gameState.dailyStreak).streakDay}
          rewardCash={calculateDailyRewardAmount(
            incomePerSec,
            checkDailyRewardStatus(gameState.lastDailyClaimDate, gameState.dailyStreak).streakDay
          )}
          isDay7={checkDailyRewardStatus(gameState.lastDailyClaimDate, gameState.dailyStreak).isDay7}
          onClaim={handleClaimDailyReward}
        />
      )}

      {/* LAUNCH MOMENT MODAL */}
      {launchModalData && (
        <LaunchModal
          modelName={launchModalData.modelName}
          score={launchModalData.score}
          multiplier={launchModalData.multiplier}
          reduceMotion={gameState.reduceMotion}
          onClose={() => setLaunchModalData(null)}
        />
      )}

      {/* CHOICE MODAL FOR LAWSUIT / TALENT POACH */}
      {choiceModalData && (
        <ChoiceModal
          data={choiceModalData}
          cash={gameState.cash}
          onChoiceA={handleChoiceModalA}
          onChoiceB={handleChoiceModalB}
        />
      )}

      {/* FRESH START BOTTOM SHEET */}
      {gameState.showFreshStartSheet && (
        <Modal
          isOpen={true}
          title="New Claude HQ"
          onClose={handleDismissFreshStartSheet}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Fresh start for the new game.
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Model Foundry has upgraded to a full idle tycoon! Build your AI empire from scratch:
              train real Claude models, launch products, scale compute clusters, outpace industry rivals, and conquer market share.
            </p>
            <Button variant="primary" fullWidth onClick={handleDismissFreshStartSheet}>
              OK
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default App;
