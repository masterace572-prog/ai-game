import React, { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { Segmented } from './Segmented';
import {
  CLAUDE_LADDER,
  getModelCost,
  getModelBaseSeconds,
  getModelScore,
  getModelIncomeMultiplier,
  RIVAL_DEFINITIONS,
  getRivalScore,
} from '../game/balance';
import {
  calculatePlayerScore,
  calculateMarketShare,
  calculateMarketShareMultiplier,
} from '../game/logic';
import type { GameState } from '../game/types';
import { formatCost } from './format';

export interface ModelsScreenProps {
  gameState: GameState;
  onStartTraining: () => void;
  onLaunchModel: () => void;
}

export const ModelsScreen: React.FC<ModelsScreenProps> = ({
  gameState,
  onStartTraining,
  onLaunchModel,
}) => {
  const [activeTab, setActiveTab] = useState<'train' | 'rivals' | 'history'>('train');

  const currentStep = gameState.modelStep;
  const isTraining = gameState.training !== null;
  const isReady = gameState.readyStep !== null;

  // Next 3 ladder models to display
  const nextStep = currentStep + 1;
  const ladderSteps = [nextStep, nextStep + 1, nextStep + 2].filter(
    (s) => s < CLAUDE_LADDER.length
  );

  const playerScore = calculatePlayerScore(gameState);
  const playerShare = calculateMarketShare(gameState);
  const shareMultiplier = calculateMarketShareMultiplier(playerShare);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Sub-tab navigation */}
      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'train' | 'rivals' | 'history')}
        options={[
          { id: 'train', label: 'Train' },
          { id: 'rivals', label: 'Rivals' },
          { id: 'history', label: 'History' },
        ]}
      />

      {/* TRAIN SUB-TAB */}
      {activeTab === 'train' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {ladderSteps.map((step) => {
            const modelName = CLAUDE_LADDER[step];
            const cost = getModelCost(step);
            const baseSeconds = Math.round(getModelBaseSeconds(step));
            const multiplier = getModelIncomeMultiplier(step);
            const score = getModelScore(step, gameState.people.researchers);
            const isImmediateNext = step === nextStep;
            const canAfford = gameState.cash >= cost;

            return (
              <div
                key={step}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: isImmediateNext ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                        {modelName}
                      </span>
                      {isImmediateNext && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                          }}
                        >
                          Next Up
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Step {step + 1} of {CLAUDE_LADDER.length}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                      {formatCost(cost)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      ~{baseSeconds}s base
                    </div>
                  </div>
                </div>

                {/* Model stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'var(--space-2)',
                    backgroundColor: 'var(--bg)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Income Boost: </span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                      x{multiplier.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Target Score: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {score.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {isImmediateNext ? (
                  isReady ? (
                    <Button variant="primary" fullWidth onClick={onLaunchModel}>
                      Ready to Launch!
                    </Button>
                  ) : isTraining ? (
                    <Button variant="secondary" fullWidth disabled>
                      Training in Progress...
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={!canAfford}
                      onClick={onStartTraining}
                    >
                      {canAfford ? `Train ${modelName}` : `Need ${formatCost(cost - gameState.cash)}`}
                    </Button>
                  )
                ) : (
                  <Button variant="ghost" fullWidth disabled>
                    <Lock size={14} style={{ marginRight: '6px' }} />
                    Requires {CLAUDE_LADDER[step - 1]}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RIVALS SUB-TAB */}
      {activeTab === 'rivals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Market share summary */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Your Market Share
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                {(playerShare * 100).toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={playerShare} max={1} />
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Revenue multiplier: <strong style={{ color: 'var(--text)' }}>x{shareMultiplier.toFixed(2)}</strong> (0.5x to 2.0x based on market share)
            </div>
          </div>

          {/* Competitor leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Industry Leaderboard
            </span>

            {/* Player row */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Anthropic (You)
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    PLAYER
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {currentStep >= 0 ? CLAUDE_LADDER[currentStep] : 'No model released'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {playerScore.toLocaleString()} pts
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {(playerShare * 100).toFixed(1)}% share
                </div>
              </div>
            </div>

            {/* Rivals list */}
            {gameState.rivals.map((rival) => {
              const def = RIVAL_DEFINITIONS.find((r) => r.id === rival.id);
              if (!def) return null;
              const rivalScore = getRivalScore(rival.step, def.strength);
              const modelName = def.ladder[rival.step] ?? `${def.name} v${rival.step + 1}`;

              // Rival share
              const allScores = [
                playerScore,
                ...gameState.rivals.map((r) => {
                  const d = RIVAL_DEFINITIONS.find((x) => x.id === r.id);
                  return d ? getRivalScore(r.step, d.strength) : 0;
                }),
              ];
              const sumSq = allScores.reduce((acc, s) => acc + s * s, 0);
              const rivalShare = sumSq > 0 ? (rivalScore * rivalScore) / sumSq : 0;
              const approxTimer = 60 * Math.pow(1.18, rival.step);

              return (
                <div
                  key={rival.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{def.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {modelName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {rivalScore.toLocaleString()} pts
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {(rivalShare * 100).toFixed(1)}% share
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={Math.max(0, approxTimer - rival.timer)} max={approxTimer} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '40px', textAlign: 'right' }}>
                      {Math.ceil(rival.timer)}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HISTORY SUB-TAB */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {currentStep < 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
              No models launched yet. Start training your first Claude model!
            </div>
          ) : (
            Array.from({ length: currentStep + 1 }, (_, i) => {
              const step = currentStep - i;
              const name = CLAUDE_LADDER[step];
              const score = getModelScore(step, gameState.people.researchers);
              const multiplier = getModelIncomeMultiplier(step);

              return (
                <div
                  key={step}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <CheckCircle2 size={18} color="var(--success)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Ladder Step {step + 1}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                      {score.toLocaleString()} pts
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--success)' }}>
                      x{multiplier.toFixed(2)} revenue
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ModelsScreen;
