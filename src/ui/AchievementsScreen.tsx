import React from 'react';
import {
  ChevronLeft,
  Award,
} from 'lucide-react';
import { Icon } from './Icon';
import { GameRow } from './GameRow';
import {
  ACHIEVEMENTS,
  ALL_ACHIEVEMENT_IDS,
} from '../game/balance';
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
          padding: '8px 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      <h1 className="screen-title">Achievements</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {ALL_ACHIEVEMENT_IDS.map((id) => {
          const def = ACHIEVEMENTS[id];
          const isUnlocked = Boolean(earned[id]);

          return (
            <GameRow
              key={id}
              icon={Award}
              iconColor={isUnlocked ? 'var(--gold)' : 'var(--text-tertiary)'}
              title={def.name}
              value={isUnlocked ? 'Got' : def.bonusText}
              valueColor={isUnlocked ? 'var(--gold)' : 'var(--text-secondary)'}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsScreen;
