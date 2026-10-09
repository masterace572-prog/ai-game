import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Play,
  ArrowUpRight,
  Award,
  ChevronLeft,
  Cpu,
  Database,
} from 'lucide-react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { GameRow } from './ui/GameRow';
import { TopBar } from './ui/TopBar';
import { BottomNav, type NavTabId } from './ui/BottomNav';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { ModelsScreen } from './ui/ModelsScreen';
import { MarketScreen } from './ui/MarketScreen';
import { InvestScreen } from './ui/InvestScreen';
import { TeamScreen } from './ui/TeamScreen';
import { ResearchScreen } from './ui/ResearchScreen';
import { EventsLogScreen } from './ui/EventsLogScreen';
import { AchievementsScreen } from './ui/AchievementsScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { NewEraScreen } from './ui/NewEraScreen';
import { MoreScreen } from './ui/MoreScreen';
import { EventModal } from './ui/EventModal';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { Toast } from './ui/Toast';
import { OfflineModal } from './ui/OfflineModal';
import { loadGameState, saveGameState, createInitialState } from './game/save';
import { playTap, playLaunch, playEvent } from './ui/audio';
import { formatMoney, formatRate } from './ui/format';
import {
  stepGame,
  startTraining,
  launchModel,
  getUsableGpus,
  getIncomePerSec,
  buyGpu,
  hireResearcher,
  buyCooling,
  buyOfficeSnacks,
  upgradeDataQuality,
  buyDataCenter,
  takeFunding,
  buyStock,
  sellStock,
  startMarketingCampaign,
  buyResearchNode,
  resolveEvent,
  simulateOfflineCatchUp,
  prestigeNewEra,
  type OfflineReport,
} from './game/logic';
import {
  DEFAULT_LAB_NAME,
  ACHIEVEMENTS,
} from './game/balance';
import type { GameState, ModelSizeId, FundingRoundId, ResearchNodeId, AchievementId } from './game/types';
import './styles.css';

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

  const [activeTab, setActiveTab] = useState<NavTabId | 'team' | 'research' | 'events' | 'achievements' | 'settings' | 'new-era'>('lab');
  const [tempLabName, setTempLabName] = useState(gameState.labName || DEFAULT_LAB_NAME);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

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

  // Live timer: ~4 ticks a second (250ms)
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
          const { state: nextState, modelFinished, newlyUnlockedAchievements } = stepGame(prevState, deltaSeconds);

          if (newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0) {
            const firstId: AchievementId = newlyUnlockedAchievements[0];
            const def = ACHIEVEMENTS[firstId];
            if (def) {
              setToastMessage(`Achievement Unlocked: ${def.name} (${def.bonusText})`);
              playEvent(nextState.soundEnabled ?? true);
            }
          }

          if (!prevState.pendingEvent && nextState.pendingEvent) {
            playEvent(nextState.soundEnabled ?? true);
          }

          // Auto-advance tutorial if model finished during step 3
          let finalState = nextState;
          if (modelFinished && !finalState.tutorialDone && finalState.tutorialStep === 3) {
            finalState = {
              ...finalState,
              tutorialStep: 4,
            };
          }

          // Auto-save every 5 seconds or immediately when model finishes
          const timeSinceSave = now - lastSaveTimeRef.current;
          if (modelFinished || timeSinceSave >= 5000) {
            saveGameState(finalState);
            lastSaveTimeRef.current = now;
          }

          return finalState;
        });
      }, 250);
    };

    const stopTimer = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start timer on mount
    startTimer();

    // Listen for visibility change
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

  // Actions
  const handleConfirmLabName = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tempLabName.trim() || DEFAULT_LAB_NAME;
    const nextState: GameState = {
      ...gameStateRef.current,
      labName: finalName,
      labNameConfirmed: true,
      tutorialStep: Math.max(2, gameStateRef.current.tutorialStep ?? 1),
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleTrainModel = (sizeId: ModelSizeId) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    let nextState = startTraining(gameStateRef.current, sizeId);
    if (nextState !== gameStateRef.current) {
      if (!nextState.tutorialDone && nextState.tutorialStep === 2) {
        nextState = {
          ...nextState,
          tutorialStep: 3,
        };
      }
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleLaunch = () => {
    playLaunch(gameStateRef.current.soundEnabled ?? true);
    let nextState = launchModel(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      if (!nextState.tutorialDone && nextState.tutorialStep === 4) {
        nextState = {
          ...nextState,
          tutorialStep: 5,
        };
      }
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleResolveEvent = (choiceIndex: 0 | 1) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = resolveEvent(gameStateRef.current, choiceIndex);
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleTutorialNext = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const currentStep = gameState.tutorialStep ?? 1;
    if (currentStep >= 6) {
      const nextState: GameState = {
        ...gameStateRef.current,
        tutorialDone: true,
      };
      setGameState(nextState);
      triggerSave(nextState);
    } else {
      const nextStep = currentStep + 1;
      if (nextStep === 5) {
        setActiveTab('market');
      } else if (nextStep === 6) {
        setActiveTab('team');
      }
      const nextState: GameState = {
        ...gameStateRef.current,
        tutorialStep: nextStep,
      };
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleTutorialSkip = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState: GameState = {
      ...gameStateRef.current,
      tutorialDone: true,
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  // Settings Handlers
  const handleToggleSound = () => {
    const nextState: GameState = {
      ...gameStateRef.current,
      soundEnabled: !(gameStateRef.current.soundEnabled ?? true),
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleToggleReduceMotion = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState: GameState = {
      ...gameStateRef.current,
      reduceMotion: !(gameStateRef.current.reduceMotion ?? false),
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleImportSave = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || parsed.version !== 1 || typeof parsed.cash !== 'number') {
        return false;
      }
      setGameState(parsed);
      triggerSave(parsed);
      return true;
    } catch {
      return false;
    }
  };

  const handleWipeSave = () => {
    const fresh = createInitialState(DEFAULT_LAB_NAME, false);
    setGameState(fresh);
    triggerSave(fresh);
    setActiveTab('lab');
  };

  const handlePrestige = () => {
    playLaunch(gameStateRef.current.soundEnabled ?? true);
    const nextState = prestigeNewEra(gameStateRef.current);
    setGameState(nextState);
    triggerSave(nextState);
    setActiveTab('lab');
    setToastMessage(`Era ${nextState.era} Begun! Gained permanent Era Points.`);
  };

  // Economy Actions
  const handleBuyGpu = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyGpu(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleHireResearcher = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = hireResearcher(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyCooling = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyCooling(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuySnacks = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyOfficeSnacks(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleUpgradeDataQuality = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = upgradeDataQuality(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyDataCenter = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyDataCenter(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleTakeFunding = (roundId: FundingRoundId) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = takeFunding(roundId, gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyStock = (rivalId: string, sharesCount: number) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyStock(gameStateRef.current, rivalId, sharesCount);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleSellStock = (rivalId: string, sharesCount: number) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = sellStock(gameStateRef.current, rivalId, sharesCount);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleStartMarketing = () => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = startMarketingCampaign(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyResearch = (nodeId: ResearchNodeId) => {
    playTap(gameStateRef.current.soundEnabled ?? true);
    const nextState = buyResearchNode(gameStateRef.current, nodeId);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  // Real market revenue & net income
  const { income: netIncome } = getIncomePerSec(gameState);

  // Derived values for Lab tab
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);

  // Cash display count-up hook (300ms, snaps if reduce motion)
  const [displayCash, setDisplayCash] = useState(gameState.cash);
  const displayCashRef = useRef(displayCash);
  displayCashRef.current = displayCash;

  useEffect(() => {
    if (gameState.reduceMotion) {
      setDisplayCash(gameState.cash);
      return;
    }
    const startVal = displayCashRef.current;
    const endVal = gameState.cash;
    if (Math.abs(startVal - endVal) < 0.05) {
      setDisplayCash(endVal);
      return;
    }

    const duration = 300;
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 2);
      const val = startVal + (endVal - startVal) * eased;
      setDisplayCash(val);
      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayCash(endVal);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gameState.cash, gameState.reduceMotion]);

  const getNextGoal = (state: GameState): string => {
    if (!state.fundingTaken?.['series-a']) {
      return 'Next: score 80 · Series A';
    }
    if (!state.fundingTaken?.['series-b']) {
      return 'Next: score 220 · Series B';
    }
    if (!state.researchOwned?.['agent-harness']) {
      return 'Next: Agent harness';
    }
    if ((state.eraPoints ?? 0) === 0 && (state.era || 1) === 1) {
      return 'Next: score 250 · New Era';
    }
    return 'Next: score 250 · New Era';
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <TopBar
        labName={gameState.labName}
        cash={gameState.cash}
        incomePerSec={netIncome}
        soundEnabled={gameState.soundEnabled ?? true}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'lab' && (
          <div
            className="tab-pane"
            style={{
              padding: '16px',
              paddingBottom: '88px',
              maxWidth: '480px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* 1. Cash (32px) + 2. Income (formatRate) + 3. Next Goal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatMoney(displayCash)}
              </div>

              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 500,
                  color: netIncome >= 0 ? 'var(--positive)' : 'var(--negative)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatRate(netIncome)}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                }}
              >
                {getNextGoal(gameState)}
              </div>
            </div>

            {/* 4. Active Training Job or Ready to Launch */}
            {gameState.currentTraining ? (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                    {gameState.currentTraining.proposedName}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.max(
                      0,
                      gameState.currentTraining.totalSeconds -
                        gameState.currentTraining.progressSeconds
                    ).toFixed(0)}s left
                  </span>
                </div>
                <ProgressBar
                  progress={
                    gameState.currentTraining.progressSeconds /
                    gameState.currentTraining.totalSeconds
                  }
                />
              </div>
            ) : gameState.readyModel ? (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                  {gameState.readyModel.name}
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Score {gameState.readyModel.score}
                </span>
              </div>
            ) : null}

            {/* 5. Four stat rows, not a cramped grid: GPUs, People, Data, Best score. Label left, value right. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid var(--border)',
              }}
            >
              <GameRow
                icon={Cpu}
                title="GPUs"
                value={`${usableGpus}/${gameState.gpus}`}
              />
              <GameRow
                icon={Users}
                title="People"
                value={gameState.researchers}
              />
              <GameRow
                icon={Database}
                title="Data"
                value={gameState.dataQuality}
              />
              <GameRow
                icon={Award}
                title="Best score"
                value={gameState.bestLaunchedModel?.score ?? '—'}
              />
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <ModelsScreen
            gameState={gameState}
            onTrainModel={handleTrainModel}
            onLaunchModel={handleLaunch}
          />
        )}

        {activeTab === 'market' && (
          <MarketScreen gameState={gameState} />
        )}

        {activeTab === 'invest' && (
          <InvestScreen
            gameState={gameState}
            onBuyDataCenter={handleBuyDataCenter}
            onTakeFunding={handleTakeFunding}
            onBuyStock={handleBuyStock}
            onSellStock={handleSellStock}
          />
        )}

        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
                minHeight: '48px',
              }}
            >
              <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
              <span>Back to More</span>
            </button>
            <TeamScreen
              gameState={gameState}
              onBuyGpu={handleBuyGpu}
              onHireResearcher={handleHireResearcher}
              onBuyCooling={handleBuyCooling}
              onBuySnacks={handleBuySnacks}
              onUpgradeDataQuality={handleUpgradeDataQuality}
              onStartMarketing={handleStartMarketing}
            />
          </div>
        )}

        {activeTab === 'research' && (
          <ResearchScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
            onBuyResearch={handleBuyResearch}
          />
        )}

        {activeTab === 'events' && (
          <EventsLogScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
          />
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

        {activeTab === 'new-era' && (
          <NewEraScreen
            gameState={gameState}
            onBackToMore={() => setActiveTab('more')}
            onPrestige={handlePrestige}
          />
        )}

        {activeTab === 'more' && (
          <MoreScreen
            gameState={gameState}
            onNavigateToTeam={() => setActiveTab('team')}
            onNavigateToResearch={() => setActiveTab('research')}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToAchievements={() => setActiveTab('achievements')}
            onNavigateToSettings={() => setActiveTab('settings')}
            onNavigateToNewEra={() => setActiveTab('new-era')}
          />
        )}
      </main>

      {/* Tutorial Overlay (brand-new saves only, Skip always visible) */}
      {!gameState.tutorialDone && gameState.labNameConfirmed && (
        <TutorialOverlay
          step={gameState.tutorialStep ?? 1}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Event Modal dialog when an event occurs */}
      <EventModal
        pendingEvent={gameState.pendingEvent}
        onResolve={handleResolveEvent}
      />

      {/* Toast notification for achievement unlock */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* Offline Catch-up Report Modal */}
      <OfflineModal
        report={offlineReport}
        onClose={() => setOfflineReport(null)}
      />

      {/* Sticky bar just above the bottom nav for Lab tab */}
      {activeTab === 'lab' && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            maxWidth: '480px',
            margin: '0 auto',
            padding: '8px 16px',
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            minHeight: '64px',
            boxSizing: 'border-box',
          }}
        >
          {gameState.readyModel ? (
            <Button
              variant="primary"
              onClick={handleLaunch}
              style={{ width: '100%', height: '48px' }}
            >
              <ArrowUpRight size={16} strokeWidth={1.75} />
              <span>Launch</span>
            </Button>
          ) : gameState.currentTraining ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text)' }}>
                <span style={{ fontWeight: 600 }}>{gameState.currentTraining.proposedName}</span>
                <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.max(
                    0,
                    gameState.currentTraining.totalSeconds - gameState.currentTraining.progressSeconds
                  ).toFixed(0)}s left
                </span>
              </div>
              <ProgressBar
                progress={
                  gameState.currentTraining.progressSeconds / gameState.currentTraining.totalSeconds
                }
              />
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={() => setActiveTab('models')}
              style={{ width: '100%', height: '48px' }}
            >
              <Play size={16} strokeWidth={1.75} />
              <span>Train</span>
            </Button>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Name Your Lab Modal on new game */}
      <Modal isOpen={!gameState.labNameConfirmed}>
        <h2 className="modal-title">Name Your Lab</h2>
        <p className="modal-description">
          Welcome to Model Foundry. Choose a name for your AI lab.
        </p>
        <form onSubmit={handleConfirmLabName} className="modal-form">
          <input
            type="text"
            className="text-input"
            value={tempLabName}
            onChange={(e) => setTempLabName(e.target.value)}
            placeholder="Little Lamp Lab"
            maxLength={32}
            autoFocus
          />
          <Button variant="primary" type="submit" className="modal-submit-button">
            Confirm Lab Name
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default App;
