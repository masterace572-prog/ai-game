import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Play,
  ArrowUpRight,
  Award,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Surface } from './ui/Surface';
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
import { MoreScreen } from './ui/MoreScreen';
import { EventModal } from './ui/EventModal';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { Toast } from './ui/Toast';
import { OfflineModal } from './ui/OfflineModal';
import { loadGameState, saveGameState, createInitialState } from './game/save';
import { playTap, playLaunch, playEvent } from './ui/audio';
import { formatMoney } from './ui/format';
import {
  stepGame,
  startTraining,
  launchModel,
  getUsableGpus,
  getTinyTrainingTime,
  getExpectedScoreRange,
  getIncomePerSec,
  calculateMarket,
  canTrainModel,
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
  getTotalScoreMultiplier,
  resolveEvent,
  simulateOfflineCatchUp,
  type OfflineReport,
} from './game/logic';
import {
  MODEL_SIZES,
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

  const [activeTab, setActiveTab] = useState<NavTabId | 'team' | 'research' | 'events' | 'achievements' | 'settings'>('lab');
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
  const { income: netIncome, label: incomeLabel } = getIncomePerSec(gameState);
  const market = calculateMarket(gameState);

  // Derived values for Lab tab
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);
  const tinyDef = MODEL_SIZES.tiny;
  const timeMult = gameState.researchOwned?.['cheap-flops'] ? 0.90 : 1.0;
  const archMult = getTotalScoreMultiplier(gameState);
  const tinyTrainingTime = getTinyTrainingTime(usableGpus, timeMult);
  const expectedTinyRange = getExpectedScoreRange(
    tinyDef.baseScore,
    gameState.dataQuality,
    gameState.researchers,
    archMult
  );
  const trainTinyCheck = canTrainModel('tiny', gameState);
  const isBusy = gameState.currentTraining !== null || gameState.readyModel !== null;

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
          <div className="tab-pane">
            {/* Payroll Alert if cash is 0 */}
            {gameState.payrollTight && (
              <Surface
                style={{
                  borderColor: 'var(--warning)',
                  padding: 'var(--space-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <Icon icon={AlertTriangle} size={20} color="var(--warning)" aria-hidden="true" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--warning)' }}>
                    Payroll is tight
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Cash is $0. Salaries paused at zero floor; debt does not accumulate.
                  </span>
                </div>
              </Surface>
            )}

            {/* Cash Headline */}
            <section className="cash-section">
              <span className="cash-label">Cash on hand</span>
              <div className="cash-amount" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(gameState.cash)}
              </div>
              <div className="income-badge">
                <span
                  className="income-rate"
                  style={{
                    color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {netIncome >= 0 ? '+' : '-'}${Math.abs(netIncome).toFixed(2)}/s
                </span>
                <span className="income-label">
                  {market.playerShare > 0
                    ? `${incomeLabel} (${(market.playerShare * 100).toFixed(1)}% share)`
                    : 'No market revenue'}
                </span>
              </div>
            </section>

            {/* Shortcut to Team & Compute */}
            <Surface
              onClick={() => setActiveTab('team')}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('team');
                }
              }}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Icon icon={Users} size={20} color="var(--primary)" aria-hidden="true" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                    Team & Compute
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {usableGpus}/{gameState.gpus} GPUs online · {gameState.researchers} researcher{gameState.researchers === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setActiveTab('team');
                }}
                style={{ minHeight: '48px', padding: '0 var(--space-4)', fontSize: '13px' }}
              >
                <span>Manage</span>
              </Button>
            </Surface>

            {/* Best Launched Model Card */}
            <Surface className="info-card">
              <div className="card-header">
                <span className="card-subtitle">Public Model</span>
                {gameState.bestLaunchedModel && (
                  <span className="best-badge">
                    <Icon icon={Award} size={14} aria-hidden="true" />
                    <span>Best</span>
                  </span>
                )}
              </div>
              {gameState.bestLaunchedModel ? (
                <div className="best-model-display">
                  <div className="best-score-callout">
                    <span className="best-score-label">Score</span>
                    <span className="best-score-number">
                      {gameState.bestLaunchedModel.score}
                    </span>
                  </div>
                  <div className="model-summary">
                    <div className="model-name">{gameState.bestLaunchedModel.name}</div>
                    <div className="model-meta">
                      <span>{MODEL_SIZES[gameState.bestLaunchedModel.sizeId]?.name ?? 'Model'}</span>
                      <span>·</span>
                      <span>Freshness {((gameState.playerFreshness ?? 1.0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Icon icon={Award} size={24} color="var(--text-secondary)" aria-hidden="true" />
                  <p className="card-empty-text" style={{ margin: 0 }}>
                    No models launched yet. Tap 'Train Tiny Model' below to start your first run.
                  </p>
                </div>
              )}
            </Surface>

            {/* Training Section */}
            <section className="section-block">
              <div className="section-header-row">
                <h2 className="section-title">Training</h2>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setActiveTab('models')}
                >
                  All models
                </button>
              </div>

              {gameState.currentTraining ? (
                <Surface className="training-card">
                  <div className="training-header">
                    <div>
                      <div className="model-name">{gameState.currentTraining.proposedName}</div>
                      <div className="card-subtitle">
                        Training {MODEL_SIZES[gameState.currentTraining.sizeId]?.name ?? 'Model'}
                      </div>
                    </div>
                    <span className="time-remaining">
                      {Math.max(
                        0,
                        gameState.currentTraining.totalSeconds -
                          gameState.currentTraining.progressSeconds
                      ).toFixed(1)}
                      s
                    </span>
                  </div>
                  <ProgressBar
                    progress={
                      gameState.currentTraining.progressSeconds /
                      gameState.currentTraining.totalSeconds
                    }
                  />
                </Surface>
              ) : gameState.readyModel ? (
                <Surface className="training-card">
                  <div className="training-header">
                    <div>
                      <div className="model-name">{gameState.readyModel.name}</div>
                      <div className="card-subtitle">
                        {MODEL_SIZES[gameState.readyModel.sizeId]?.name} model finished
                      </div>
                    </div>
                    <div className="score-badge">
                      Score: {gameState.readyModel.score}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleLaunch}
                    className="action-button"
                  >
                    <Icon icon={ArrowUpRight} size={16} aria-hidden="true" />
                    <span>Launch Model</span>
                  </Button>
                </Surface>
              ) : (
                <Surface className="training-card">
                  <div className="training-header">
                    <div>
                      <div className="model-name">Tiny Model</div>
                      <div className="card-subtitle">Fast starter model</div>
                    </div>
                  </div>

                  <div className="training-stats">
                    <div className="stat-item">
                      <span className="stat-label">Cost</span>
                      <span className="stat-value">${tinyDef.cashCost.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Est. Time</span>
                      <span className="stat-value">~{Math.round(tinyTrainingTime)}s</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Exp. Score</span>
                      <span className="stat-value">
                        {expectedTinyRange.min}–{expectedTinyRange.max}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleTrainModel('tiny')}
                    disabled={!trainTinyCheck.canTrain || isBusy}
                    className="action-button"
                  >
                    <Icon icon={Play} size={16} aria-hidden="true" />
                    <span>
                      {isBusy
                        ? 'Busy'
                        : !trainTinyCheck.canTrain
                        ? trainTinyCheck.reason ?? 'Cannot Train'
                        : `Train Tiny Model — $${tinyDef.cashCost.toLocaleString()}`}
                    </span>
                  </Button>
                </Surface>
              )}
            </section>
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

        {activeTab === 'more' && (
          <MoreScreen
            gameState={gameState}
            onNavigateToTeam={() => setActiveTab('team')}
            onNavigateToResearch={() => setActiveTab('research')}
            onNavigateToEvents={() => setActiveTab('events')}
            onNavigateToAchievements={() => setActiveTab('achievements')}
            onNavigateToSettings={() => setActiveTab('settings')}
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
