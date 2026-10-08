import React from 'react';
import {
  ChevronLeft,
  Check,
  Lock,
} from 'lucide-react';
import { Icon } from './Icon';
import { Surface } from './Surface';
import {
  ACHIEVEMENTS,
  ALL_ACHIEVEMENT_IDS,
} from '../game/balance';
import {
  getAchievementScoreMultiplier,
  getAchievementRevenueMultiplier,
} from '../game/logic';
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
  const unlockedCount = ALL_ACHIEVEMENT_IDS.filter((id) => earned[id]).length;
  const scoreBonus = getAchievementScoreMultiplier(gameState);
  const revBonus = getAchievementRevenueMultiplier(gameState);

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Back button */}
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
          padding: 'var(--space-2) 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      {/* Screen Title */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          Achievements
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Permanent laboratory milestones persisted across all operational eras.
        </p>
      </div>

      {/* Summary Card */}
      <Surface
        style={{
          padding: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
            {unlockedCount} / 12
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Score Bonus
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>
            {scoreBonus.toFixed(2)}x
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Revenue Bonus
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--success)' }}>
            {revBonus.toFixed(2)}x
          </span>
        </div>
      </Surface>

      {/* Achievements List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {ALL_ACHIEVEMENT_IDS.map((id) => {
          const def = ACHIEVEMENTS[id];
          const isUnlocked = Boolean(earned[id]);

          return (
            <Surface
              key={id}
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                opacity: isUnlocked ? 1.0 : 0.65,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isUnlocked ? 'var(--surface)' : 'var(--surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: isUnlocked ? '1px solid var(--border)' : 'none',
                }}
              >
                <Icon
                  icon={isUnlocked ? Check : Lock}
                  size={20}
                  color={isUnlocked ? 'var(--success)' : 'var(--text-tertiary)'}
                  aria-hidden="true"
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                    {def.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isUnlocked ? 'var(--primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {def.bonusText}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {def.rule}
                </div>

                <div style={{ fontSize: '11px', color: isUnlocked ? 'var(--success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
                  {isUnlocked ? 'Earned' : 'Locked'}
                </div>
              </div>
            </Surface>
          );
        })}
      </section>
    </div>
  );
};
export default AchievementsScreen;
