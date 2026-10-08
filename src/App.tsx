import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  ChartLine,
  Landmark,
  Menu,
  Play,
  ArrowUpRight,
} from 'lucide-react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Surface } from './ui/Surface';
import { TopBar } from './ui/TopBar';
import { BottomNav, type NavTabId } from './ui/BottomNav';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { loadGameState, saveGameState } from './game/save';
import {
  stepGame,
  startTraining,
  launchModel,
  getUsableGpus,
  getTinyTrainingTime,
  getExpectedScoreRange,
} from './game/logic';
import {
  MODEL_SIZES,
  TEMP_STIPEND_PER_SEC,
  DEFAULT_LAB_NAME,
} from './game/balance';
import type { GameState } from './game/types';
import './styles.css';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const loaded = loadGameState();
    return loaded.state;
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('lab');
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
        // Resume timer without large offline catch-up (Phase 2 rule)
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

  const handleTrainTiny = () => {
    const nextState = startTraining(gameStateRef.current, 'tiny');
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

  // Derived values for Lab tab
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);
  const tinyDef = MODEL_SIZES.tiny;
  const tinyTrainingTime = getTinyTrainingTime(usableGpus);
  const expectedTinyRange = getExpectedScoreRange(
    tinyDef.baseScore,
    gameState.dataQuality,
    gameState.researchers
  );
  const canAffordTiny = gameState.cash >= tinyDef.cashCost;
  const isBusy = gameState.currentTraining !== null || gameState.readyModel !== null;

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <TopBar
        labName={gameState.labName}
        cash={gameState.cash}
        incomePerSec={TEMP_STIPEND_PER_SEC}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'lab' && (
          <div className="tab-pane">
            {/* Cash Headline */}
            <section className="cash-section">
              <span className="cash-label">Cash on hand</span>
              <div className="cash-amount">
                ${Math.floor(gameState.cash).toLocaleString()}
              </div>
              <div className="income-badge">
                <span className="income-rate">+${TEMP_STIPEND_PER_SEC.toFixed(2)}/s</span>
                <span className="income-label">Stipend (temporary)</span>
              </div>
            </section>

            {/* Public Model Card */}
            <Surface className="info-card">
              <div className="card-header">
                <span className="card-subtitle">Public Model</span>
              </div>
              {gameState.bestLaunchedModel ? (
                <div className="model-summary">
                  <div className="model-name">{gameState.bestLaunchedModel.name}</div>
                  <div className="model-meta">
                    <span>Score: {gameState.bestLaunchedModel.score}</span>
                    <span>·</span>
                    <span>Tiny</span>
                  </div>
                </div>
              ) : (
                <p className="card-empty-text">No models launched yet. Train a Tiny model below.</p>
              )}
            </Surface>

            {/* Training Job / Ready Model / Idle Card */}
            <section className="section-block">
              <h2 className="section-title">Training</h2>

              {gameState.currentTraining ? (
                <Surface className="training-card">
                  <div className="training-header">
                    <div>
                      <div className="model-name">{gameState.currentTraining.proposedName}</div>
                      <div className="card-subtitle">Training Tiny model</div>
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
                      <div className="card-subtitle">Training complete</div>
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
                      <div className="card-subtitle">Fast, low-cost starter model</div>
                    </div>
                  </div>

                  <div className="training-stats">
                    <div className="stat-item">
                      <span className="stat-label">Cost</span>
                      <span className="stat-value">${tinyDef.cashCost}</span>
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
                    onClick={handleTrainTiny}
                    disabled={!canAffordTiny || isBusy}
                    className="action-button"
                  >
                    <Icon icon={Play} size={16} aria-hidden="true" />
                    <span>
                      {!canAffordTiny
                        ? `Need $${tinyDef.cashCost} to Train`
                        : `Train Tiny Model — $${tinyDef.cashCost}`}
                    </span>
                  </Button>
                </Surface>
              )}
            </section>
          </div>
        )}

        {activeTab !== 'lab' && (
          <div className="tab-pane">
            <h1 className="screen-title">
              {activeTab === 'models' && 'Models'}
              {activeTab === 'market' && 'Market'}
              {activeTab === 'invest' && 'Invest'}
              {activeTab === 'more' && 'More'}
            </h1>
            <Surface className="empty-tab-surface">
              <div className="empty-icon-wrap">
                <Icon
                  icon={
                    activeTab === 'models'
                      ? Cpu
                      : activeTab === 'market'
                      ? ChartLine
                      : activeTab === 'invest'
                      ? Landmark
                      : Menu
                  }
                  size={24}
                  color="var(--text-secondary)"
                  aria-hidden="true"
                />
              </div>
              <p className="empty-tab-text">Not built yet</p>
            </Surface>
          </div>
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
