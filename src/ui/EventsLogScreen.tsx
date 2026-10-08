import React from 'react';
import {
  ChevronLeft,
  Clock,
  Radio,
} from 'lucide-react';
import { Icon } from './Icon';
import { Surface } from './Surface';
import type { GameState } from '../game/types';

export interface EventsLogScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
}

export const EventsLogScreen: React.FC<EventsLogScreenProps> = ({
  gameState,
  onBackToMore,
}) => {
  const logs = gameState.eventLogs ?? [];
  const activeEvents = gameState.activeTimedEvents ?? [];

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
          Events Log
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Chronological record of lab occurrences, market shocks, and research breakthroughs.
        </p>
      </div>

      {/* Active Timed Events */}
      {activeEvents.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon icon={Radio} size={16} color="var(--primary)" aria-hidden="true" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Active Ongoing Effects ({activeEvents.length})
            </span>
          </div>

          {activeEvents.map((ev, idx) => (
            <Surface
              key={`${ev.id}-${idx}`}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor: 'var(--primary)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {ev.id === 'hype' && 'Hype boosted to ≥ 1.25x'}
                  {ev.id === 'outage' && 'Usable GPUs halved'}
                  {ev.id === 'rules' && 'Revenue reduced by 20%, funding paused'}
                  {ev.id === 'brownout' && 'Power cap reduced by 2'}
                  {ev.id === 'stumble' && 'Rival appeal reduced by 50%'}
                </div>
              </div>

              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                {Math.ceil(ev.remainingSeconds)}s remaining
              </span>
            </Surface>
          ))}
        </section>
      )}

      {/* History Log */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          Event History (Last 30)
        </h2>

        {logs.length === 0 ? (
          <Surface
            style={{
              padding: 'var(--space-6) var(--space-4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Icon icon={Clock} size={24} color="var(--text-tertiary)" aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              No recorded events this era yet. Market events occur periodically during laboratory operations.
            </p>
          </Surface>
        ) : (
          logs.map((log) => (
            <Surface
              key={log.id}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  {log.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {log.outcomeText}
              </p>
            </Surface>
          ))
        )}
      </section>
    </div>
  );
};
export default EventsLogScreen;
