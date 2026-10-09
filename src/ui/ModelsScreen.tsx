import React, { useState } from 'react';
import { Lock, Award, Play, ArrowUpRight } from 'lucide-react';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { GameRow } from './GameRow';
import { Segmented } from './Segmented';
import { MODEL_SIZES } from '../game/balance';
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
import { formatCost } from './format';

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

  // Unlocked sizes for the segmented chooser
  const unlockedSizes = MODEL_SIZE_ORDER.filter(
    (sizeId) => getModelUnlockStatus(sizeId, gameState).unlocked
  );

  const [selectedSize, setSelectedSize] = useState<ModelSizeId>(() => {
    return unlockedSizes[unlockedSizes.length - 1] ?? 'tiny';
  });

  // Ensure selectedSize is unlocked; if not, fallback
  const activeSize = unlockedSizes.includes(selectedSize)
    ? selectedSize
    : unlockedSizes[unlockedSizes.length - 1] ?? 'tiny';

  const [showLocked, setShowLocked] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  const lockedSizes = MODEL_SIZE_ORDER.filter(
    (sizeId) => !getModelUnlockStatus(sizeId, gameState).unlocked
  );

  const def = MODEL_SIZES[activeSize];
  const timeMult = gameState.researchOwned?.['cheap-flops'] ? 0.90 : 1.0;
  const archMult = getTotalScoreMultiplier(gameState);
  const achScoreMult = getAchievementScoreMultiplier(gameState);
  const estTime = Math.round(calculateTrainingTime(def.baseSeconds, usableGpus, timeMult));
  const scoreRange = getExpectedScoreRange(
    def.baseScore,
    gameState.dataQuality,
    gameState.researchers,
    archMult,
    gameState.eraPoints ?? 0,
    achScoreMult
  );

  const trainCheck = canTrainModel(activeSize, gameState);

  // Short disabled reason
  let disabledReason = '';
  if (isBusy) {
    disabledReason = 'Busy';
  } else if (!trainCheck.canTrain) {
    if (gameState.cash < def.cashCost) {
      disabledReason = `Need ${formatCost(def.cashCost - gameState.cash)}`;
    } else if (usableGpus < def.minUsableGpus) {
      disabledReason = `Need ${def.minUsableGpus} GPUs`;
    } else if (gameState.researchers < def.minResearchers) {
      disabledReason = `Need ${def.minResearchers} People`;
    } else {
      disabledReason = trainCheck.reason ?? 'Locked';
    }
  }

  const getLockedRequirementText = (sizeId: ModelSizeId): string => {
    switch (sizeId) {
      case 'medium':
        return '1 model launched';
      case 'large':
        return 'Medium launched';
      case 'huge':
        return 'Series A';
      case 'frontier':
        return 'Series B + Agent harness';
      default:
        return 'Locked';
    }
  };

  return (
    <div
      className="tab-pane"
      style={{
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <h1 className="screen-title">Models</h1>

      {/* Active Training Status */}
      {gameState.currentTraining && (
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
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
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
              ).toFixed(0)}
              s left
            </span>
          </div>
          <ProgressBar
            progress={
              gameState.currentTraining.progressSeconds /
              gameState.currentTraining.totalSeconds
            }
          />
        </div>
      )}

      {/* Ready to Launch */}
      {gameState.readyModel && (
        <div
          style={{
            padding: '16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.readyModel.name}
            </span>
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Score {gameState.readyModel.score}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={onLaunchModel}
            style={{ minHeight: '48px', padding: '0 20px' }}
          >
            <ArrowUpRight size={16} strokeWidth={1.75} />
            <span>Launch</span>
          </Button>
        </div>
      )}

      {/* Training Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Segmented Size Chooser */}
        <Segmented<ModelSizeId>
          options={unlockedSizes.map((s) => ({
            id: s,
            label: MODEL_SIZES[s].name,
          }))}
          value={activeSize}
          onChange={(newSize) => setSelectedSize(newSize)}
        />

        {/* Time, score range, cost */}
        <div
          style={{
            fontSize: '13px',
            lineHeight: '18px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ~{estTime}s · Score {scoreRange.min}–{scoreRange.max} · {formatCost(def.cashCost)}
        </div>

        {/* Train Action Button */}
        <Button
          variant={trainCheck.canTrain && !isBusy ? 'primary' : 'secondary'}
          disabled={!trainCheck.canTrain || isBusy}
          onClick={() => onTrainModel(activeSize)}
          style={{ width: '100%', minHeight: '48px' }}
        >
          {trainCheck.canTrain && !isBusy ? (
            <>
              <Play size={16} strokeWidth={1.75} />
              <span>Train {def.name}</span>
            </>
          ) : (
            <span>{disabledReason}</span>
          )}
        </Button>
      </div>

      {/* Locked Sizes (single row, expandable) */}
      {lockedSizes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid var(--border)',
          }}
        >
          <GameRow
            icon={Lock}
            title={`Locked (${lockedSizes.length})`}
            showChevron
            onClick={() => setShowLocked(!showLocked)}
          />
          {showLocked && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lockedSizes.map((sizeId) => {
                const sDef = MODEL_SIZES[sizeId];
                return (
                  <div
                    key={sizeId}
                    style={{
                      minHeight: '44px',
                      padding: '10px 16px 10px 48px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                      {sDef.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {getLockedRequirementText(sizeId)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Launched Models */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {gameState.bestLaunchedModel ? (
          <>
            <GameRow
              icon={Award}
              iconColor="var(--gold)"
              title={gameState.bestLaunchedModel.name}
              subtitle={`${MODEL_SIZES[gameState.bestLaunchedModel.sizeId]?.name ?? 'Model'} · Freshness ${Math.round(
                (gameState.playerFreshness ?? 1) * 100
              )}%`}
              value={`Score ${gameState.bestLaunchedModel.score}`}
            />

            {gameState.launchedModels.length > 1 && (
              <>
                <GameRow
                  title={`All models (${gameState.launchedModels.length})`}
                  showChevron
                  onClick={() => setShowAllModels(!showAllModels)}
                />
                {showAllModels && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {gameState.launchedModels
                      .slice()
                      .reverse()
                      .map((m) => (
                        <div
                          key={m.id}
                          style={{
                            minHeight: '44px',
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--text)',
                              }}
                            >
                              {m.name}
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {MODEL_SIZES[m.sizeId]?.name ?? 'Model'}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            Score {m.score}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div
            style={{
              padding: '16px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            No models launched yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelsScreen;
