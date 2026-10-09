import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import { GameRow } from './GameRow';
import type { GameState } from '../game/types';

export interface EventsLogScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
}

export const EventsLogScreen: React.FC<EventsLogScreenProps> = ({
  gameState,
  onBackToMore,
}) => {
  const logs = (gameState.eventLogs ?? []).slice().reverse();

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
          Events & Announcements
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Record of major milestones, model launches, and industry breakthroughs.
        </span>
      </div>

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
        {logs.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No events recorded yet. Start building your company to make headlines!
          </div>
        ) : (
          logs.map((log, idx) => (
            <GameRow
              key={idx}
              icon={Bell}
              iconColor="var(--accent)"
              title={log.title}
              subtitle={log.outcomeText}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EventsLogScreen;
