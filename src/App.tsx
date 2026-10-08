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
import { MoreScreen } from './ui/MoreScreen';
import { loadGameState, saveGameState } from './game/save';
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
} from './game/logic';
import {
  MODEL_SIZES,
  DEFAULT_LAB_NAME,
} from './game/balance';
import type { GameState, ModelSizeId, FundingRoundId, ResearchNodeId } from './game/types';
import './styles.css';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const loaded = loadGameState();
    return loaded.state;
  });

  const [activeTab, setActiveTab] = useState<NavTabId | 'team' | 'research'>('lab');
  const [tempLabName, setTempLabName] = useState(gameState.labName || DEFAULT_LAB_NAME);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

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
          const { state: nextState, modelFinished } = stepGame(prevState, deltaSeconds);

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

    // Start timer on mount
    startTimer();

    // Listen for visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
        triggerSave(gameStateRef.current);
      } else {
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
    };
    setGameState(nextState);
    triggerSave(nextState);
  };

  const handleTrainModel = (sizeId: ModelSizeId) => {
    const nextState = startTraining(gameStateRef.current, sizeId);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleLaunch = () => {
    const nextState = launchModel(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  // Economy Actions
  const handleBuyGpu = () => {
    const nextState = buyGpu(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleHireResearcher = () => {
    const nextState = hireResearcher(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyCooling = () => {
    const nextState = buyCooling(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuySnacks = () => {
    const nextState = buyOfficeSnacks(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleUpgradeDataQuality = () => {
    const nextState = upgradeDataQuality(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyDataCenter = () => {
    const nextState = buyDataCenter(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleTakeFunding = (roundId: FundingRoundId) => {
    const nextState = takeFunding(roundId, gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyStock = (rivalId: string, sharesCount: number) => {
    const nextState = buyStock(gameStateRef.current, rivalId, sharesCount);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleSellStock = (rivalId: string, sharesCount: number) => {
    const nextState = sellStock(gameStateRef.current, rivalId, sharesCount);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleStartMarketing = () => {
    const nextState = startMarketingCampaign(gameStateRef.current);
    if (nextState !== gameStateRef.current) {
      setGameState(nextState);
      triggerSave(nextState);
    }
  };

  const handleBuyResearch = (nodeId: ResearchNodeId) => {
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
              <div className="cash-amount">
                ${Math.floor(gameState.cash).toLocaleString()}
              </div>
              <div className="income-badge">
                <span
                  className="income-rate"
                  style={{
                    color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)',
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
                style={{ minHeight: '36px', height: '36px', padding: '0 var(--space-3)', fontSize: '13px' }}
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
                <p className="card-empty-text">
                  No models launched yet. Launch your first model to enter the market and compete with rivals.
                </p>
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

        {activeTab === 'more' && (
          <MoreScreen
            gameState={gameState}
            onNavigateToTeam={() => setActiveTab('team')}
            onNavigateToResearch={() => setActiveTab('research')}
          />
        )}
      </main>

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
