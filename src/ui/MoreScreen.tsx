import React from 'react';
import {
  Bell,
  Award,
  Settings,
  Rocket,
} from 'lucide-react';
import { GameRow } from './GameRow';
import { CLAUDE_LADDER } from '../game/balance';
import { calculateTotalIncomePerSec } from '../game/logic';
import type { GameState } from '../game/types';
import { formatMoney, formatRate } from './format';

export interface MoreScreenProps {
  gameState: GameState;
  onNavigateToEvents: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNewEra: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  gameState,
  onNavigateToEvents,
  onNavigateToAchievements,
  onNavigateToSettings,
  onNavigateToNewEra,
}) => {
  const incomePerSec = calculateTotalIncomePerSec(gameState);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
      }}
    >
      {/* Navigation Menu */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <GameRow
          icon={Bell}
          iconColor="var(--accent)"
          title="Events"
          subtitle="Recent announcements & log"
          showChevron
          onClick={onNavigateToEvents}
        />
        <GameRow
          icon={Award}
          iconColor="var(--warning)"
          title="Achievements"
          subtitle="Milestones & badges"
          showChevron
          onClick={onNavigateToAchievements}
        />
        <GameRow
          icon={Rocket}
          iconColor="var(--accent)"
          title="New Era"
          subtitle="Space Compute (Coming soon)"
          showChevron
          onClick={onNavigateToNewEra}
        />
        <GameRow
          icon={Settings}
          iconColor="var(--text-secondary)"
          title="Settings"
          subtitle="Audio, motion & data"
          showChevron
          onClick={onNavigateToSettings}
        />
      </div>

      {/* Career Stats */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Career Overview
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Lifetime Earned</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              {formatMoney(gameState.lifetimeEarned)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Current Revenue</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--success)' }}>
              {formatRate(incomePerSec)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Current Model</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.modelStep >= 0 ? CLAUDE_LADDER[gameState.modelStep] : 'None'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total Team</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.people.engineers + gameState.people.sales + gameState.people.researchers} staff
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
