import React from 'react';
import { Play, ArrowUpRight, Lock, Award, Cpu } from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';
import { ProgressBar } from './ProgressBar';
import {
  MODEL_SIZES,
} from '../game/balance';
import {
  MODEL_SIZE_ORDER,
  type GameState,
  type ModelSizeId,
} from '../game/types';
import {
  getUsableGpus,
  calculateTrainingTime,
  getExpectedScoreRange,
  getModelUnlockStatus,
  canTrainModel,
  getTotalScoreMultiplier,
  getAchievementScoreMultiplier,
} from '../game/logic';

import { formatMoney } from './format';

export interface ModelsScreenProps {
  gameState: GameState;
  onTrainModel: (sizeId: ModelSizeId) => void;
  onLaunchModel: () => void;
}

export const ModelsScreen: React.FC<ModelsScreenProps> = ({
  gameState,
  onTrainModel,
  onLaunchModel,
}) => {
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);
  const isBusy = gameState.currentTraining !== null || gameState.readyModel !== null;

  return (
    <div className="tab-pane">
      <h1 className="screen-title">Models</h1>

      {/* Active Training Job */}
      {gameState.currentTraining && (
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
      )}

      {/* Ready to Launch */}
      {gameState.readyModel && (
        <Surface className="training-card">
          <div className="training-header">
            <div>
              <div className="model-name">{gameState.readyModel.name}</div>
              <div className="card-subtitle">
                {MODEL_SIZES[gameState.readyModel.sizeId]?.name} model finished
              </div>
            </div>
            <div className="score-badge">Score: {gameState.readyModel.score}</div>
          </div>
          <Button
            variant="primary"
            onClick={onLaunchModel}
            className="action-button"
          >
            <Icon icon={ArrowUpRight} size={16} aria-hidden="true" />
            <span>Launch Model</span>
          </Button>
        </Surface>
      )}

      {/* Training Catalog: All 6 Sizes */}
      <section className="section-block">
        <h2 className="section-title">Train New Model</h2>
        <div className="models-catalog">
          {MODEL_SIZE_ORDER.map((sizeId) => {
            const def = MODEL_SIZES[sizeId];
            const unlockStatus = getModelUnlockStatus(sizeId, gameState);
            const trainCheck = canTrainModel(sizeId, gameState);
            const timeMult = gameState.researchOwned?.['cheap-flops'] ? 0.90 : 1.0;
            const archMult = getTotalScoreMultiplier(gameState);
            const achScoreMult = getAchievementScoreMultiplier(gameState);
            const estTime = calculateTrainingTime(def.baseSeconds, usableGpus, timeMult);
            const scoreRange = getExpectedScoreRange(
              def.baseScore,
              gameState.dataQuality,
              gameState.researchers,
              archMult,
              gameState.eraPoints ?? 0,
              achScoreMult
            );

            return (
              <Surface key={sizeId} className="model-catalog-card">
                <div className="catalog-header">
                  <div className="catalog-title-group">
                    <span className="catalog-name">{def.name}</span>
                    <span className="catalog-cost" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(def.cashCost, true)}
                    </span>
                  </div>
                  {!unlockStatus.unlocked && (
                    <div className="lock-tag">
                      <Icon icon={Lock} size={14} aria-hidden="true" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>

                {!unlockStatus.unlocked ? (
                  <p className="lock-reason">{unlockStatus.reason}</p>
                ) : (
                  <>
                    <div className="training-stats">
                      <div className="stat-item">
                        <span className="stat-label">Est. Time</span>
                        <span className="stat-value">~{Math.round(estTime)}s</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Exp. Score</span>
                        <span className="stat-value">
                          {scoreRange.min}–{scoreRange.max}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Min GPUs</span>
                        <span className="stat-value">{def.minUsableGpus}</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => onTrainModel(sizeId)}
                      disabled={!trainCheck.canTrain || isBusy}
                      className="action-button"
                    >
                      <Icon icon={Play} size={16} aria-hidden="true" />
                      <span>
                        {isBusy
                          ? 'Busy'
                          : !trainCheck.canTrain
                          ? trainCheck.reason ?? 'Cannot Train'
                          : `Train ${def.name} — ${formatMoney(def.cashCost, true)}`}
                      </span>
                    </Button>
                  </>
                )}
              </Surface>
            );
          })}
        </div>
      </section>

      {/* Launched Models History */}
      <section className="section-block">
        <h2 className="section-title">
          Launched Models ({gameState.launchedModels.length})
        </h2>
        {gameState.launchedModels.length === 0 ? (
          <Surface className="info-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Icon icon={Cpu} size={24} color="var(--text-secondary)" aria-hidden="true" />
            <p className="card-empty-text" style={{ margin: 0 }}>
              No models launched yet. Tap 'Train' above to begin training your first architecture.
            </p>
          </Surface>
        ) : (
          <div className="launched-models-list">
            {gameState.launchedModels.map((model) => {
              const isBest = model.id === gameState.bestLaunchedModel?.id;
              const sizeName = MODEL_SIZES[model.sizeId]?.name ?? model.sizeId;

              return (
                <Surface key={model.id} className="launched-model-row">
                  <div className="launched-left">
                    <div className="launched-name-group">
                      <span className="model-name">{model.name}</span>
                      {isBest && (
                        <span className="best-badge">
                          <Icon icon={Award} size={14} aria-hidden="true" />
                          <span>Best</span>
                        </span>
                      )}
                    </div>
                    <span className="card-subtitle">{sizeName} Model</span>
                  </div>
                  <div className="launched-right">
                    <span className="launched-score-label">Score</span>
                    <span className="launched-score-value">{model.score}</span>
                  </div>
                </Surface>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ModelsScreen;
