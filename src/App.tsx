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
import { playTap, playLaunch, playEvent, playMilestone } from './ui/audio';
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
  getProductIncomePerSec,
  getNextProductMilestone,
  getTrainingSpeed,
} from './game/balance';
import type { GameState, ProductId, BuyAmount } from './game/types';
import './styles.css';

interface TapFloater {
  id: number;
  x: number;
  y: number;
  amount: string;
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

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Rate limiting refs
  const lastHeroTapRef = useRef<number>(0);
  const lastBoostTapRef = useRef<number>(0);

  // Sync reduce-motion attribute to document body
  useEffect(() => {
    document.body.setAttribute('data-reduce-motion', String(Boolean(gameState.reduceMotion)));
  }, [gameState.reduceMotion]);

  const lastTickTimeRef = useRef<number>(Date.now());
  const lastSaveTimeRef = useRef<number>(Date.now());

  // Save helper
  const triggerSave = useCallback((stateToSave: GameState) => {
    saveGameState(stateToSave);
    lastSaveTimeRef.current = Date.now();
  }, []);

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
              }
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
  }, [triggerSave]);

  // Tap-to-earn handler (rate limited to max 10 taps/sec = 100ms)
  const handleHeroTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastHeroTapRef.current < 90) return; // 10 taps/sec max
    lastHeroTapRef.current = now;

    const { state: nextState, earned } = tapEarn(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);

    // Floating animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const floaterId = now + Math.random();

    setFloaters((prev) => [
      ...prev,
      { id: floaterId, x, y, amount: `+${formatCost(earned)}` },
    ]);

    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== floaterId));
    }, 750);
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
  };

  // Start training
  const handleStartTraining = () => {
    const nextState = startTraining(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playTap(nextState.soundEnabled ?? true);
  };

  // Launch model
  const handleLaunch = () => {
    const { state: nextState, launchedName } = launchModel(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    triggerSave(nextState);
    playLaunch(nextState.soundEnabled ?? true);
    setToastMessage(`Launched ${launchedName}! Multiplier boosted.`);
  };

  // Buy amount mode
  const handleSetBuyAmount = (mode: BuyAmount) => {
    setBuyAmountState(mode);
    const nextState = { ...gameStateRef.current, buyAmount: mode };
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
  };

  // Buy product bulk
  const handleBuyProduct = (productId: ProductId) => {
    const res = buyProductBulk(gameStateRef.current, productId, buyAmount);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      if (res.milestonesPassed.length > 0) {
        setFlashingProduct(productId);
        setTimeout(() => setFlashingProduct(null), 200);
        const lastMilestone = res.milestonesPassed[res.milestonesPassed.length - 1];
        const mDef = MILESTONES.find((m) => m.level === lastMilestone);
        const mult = mDef ? mDef.mult : 2;
        setToastMessage(`${PRODUCTS[productId].name} x${mult}!`);
        playMilestone(res.state.soundEnabled ?? true);
      } else {
        playTap(res.state.soundEnabled ?? true);
      }
    }
  };

  // Team hires
  const handleHireEngineer = (mode: BuyAmount = buyAmount) => {
    const res = hireEngineerBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playTap(res.state.soundEnabled ?? true);
    }
  };

  const handleHireSales = (mode: BuyAmount = buyAmount) => {
    const res = hireSalesBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playTap(res.state.soundEnabled ?? true);
    }
  };

  const handleHireResearcher = (mode: BuyAmount = buyAmount) => {
    const res = hireResearcherBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playTap(res.state.soundEnabled ?? true);
    }
  };

  const handleBuyGpuCluster = (mode: BuyAmount = buyAmount) => {
    const res = buyGpuClusterBulk(gameStateRef.current, mode);
    if (res.count > 0) {
      setGameState(res.state);
      gameStateRef.current = res.state;
      playTap(res.state.soundEnabled ?? true);
    }
  };

  const handleBuyBuilding = () => {
    const nextState = buyBuilding(gameStateRef.current);
    setGameState(nextState);
    gameStateRef.current = nextState;
    playTap(nextState.soundEnabled ?? true);
  };

  const handleHireManager = (managerId: string) => {
    const nextState = hireManager(gameStateRef.current, managerId);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      gameStateRef.current = nextState;
      playLaunch(nextState.soundEnabled ?? true);
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
      playLaunch(nextState.soundEnabled ?? true);
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
    } else {
      playTap(res.state.soundEnabled ?? true);
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
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
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '2px 0' }}>
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
                    top: `${floater.y - 10}px`,
                    color: 'var(--success)',
                    fontSize: '14px',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    animation: 'floatUpFade 0.75s ease-out forwards',
                  }}
                >
                  {floater.amount}
                </div>
              ))}
            </div>

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
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--surface-active)',
                                color: 'var(--text-secondary)',
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
          onClose={() => setOfflineReport(null)}
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
