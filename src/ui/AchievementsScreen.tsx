import React from 'react';
import { ChevronLeft, CheckCircle2, Lock } from 'lucide-react';
import { ACHIEVEMENTS, ALL_ACHIEVEMENT_IDS } from '../game/balance';
import type { GameState } from '../game/types';

export interface AchievementsScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  gameState,
  onBackToMore,
}) => {
  const earned = gameState.achievements ?? {};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
      }}
    >
      <button
        type="button"
        onClick={onBackToMore}
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
          padding: 0,
        }}
      >
        <ChevronLeft size={18} />
        <span>Back to More</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Achievements
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Unlock milestones to build your company's legacy.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {ALL_ACHIEVEMENT_IDS.map((id) => {
          const def = ACHIEVEMENTS[id];
          const isUnlocked = Boolean(earned[id]);

          return (
            <div
              key={id}
              style={{
                backgroundColor: 'var(--surface)',
                border: isUnlocked ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isUnlocked ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {isUnlocked ? (
                  <CheckCircle2 size={20} color="var(--success)" />
                ) : (
                  <Lock size={20} color="var(--text-tertiary)" />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                    {def.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {def.description}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isUnlocked ? 'var(--success)' : 'var(--text-tertiary)',
                  }}
                >
                  {def.bonusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsScreen;
