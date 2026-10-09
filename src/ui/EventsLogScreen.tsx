import React, { useState } from 'react';
import {
  ChevronLeft,
  Bell,
  Radio,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { Modal } from './Modal';
import type { GameState, EventLogEntry } from '../game/types';

export interface EventsLogScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
}

export const EventsLogScreen: React.FC<EventsLogScreenProps> = ({
  gameState,
  onBackToMore,
}) => {
  const [selectedLog, setSelectedLog] = useState<EventLogEntry | null>(null);

  const logs = (gameState.eventLogs ?? []).slice().reverse();
  const activeEvents = gameState.activeTimedEvents ?? [];

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

      <h1 className="screen-title">Events</h1>

      {/* Active Ongoing Effects */}
      {activeEvents.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid var(--border)',
          }}
        >
          {activeEvents.map((ev, idx) => (
            <GameRow
              key={`${ev.id}-${idx}`}
              icon={Radio}
              iconColor="var(--hype)"
              title={ev.title}
              value={`${Math.ceil(ev.remainingSeconds)}s left`}
              valueColor="var(--hype)"
            />
          ))}
        </div>
      )}

      {/* Events Log List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: '16px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            No events yet
          </div>
        ) : (
          logs.map((log) => (
            <GameRow
              key={log.id}
              icon={Bell}
              iconColor="var(--hype)"
              title={log.title}
              subtitle={new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              showChevron
              onClick={() => setSelectedLog(log)}
            />
          ))
        )}
      </div>

      {/* Event Details Sheet */}
      <Modal isOpen={selectedLog !== null}>
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                {selectedLog.title}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {new Date(selectedLog.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedLog.outcomeText}
            </p>
            <Button
              variant="secondary"
              onClick={() => setSelectedLog(null)}
              style={{ width: '100%', minHeight: '48px' }}
            >
              <span>Close</span>
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventsLogScreen;
