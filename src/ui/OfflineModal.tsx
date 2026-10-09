import React from 'react';
import { Button } from './Button';
import { formatMoney } from './format';
import { canDoubleAwayEarnings } from '../game/logic';
import type { OfflineReport } from '../game/logic';

export interface OfflineModalProps {
  report: OfflineReport | null;
  lastDoubleAt?: number;
  onCollect: () => void;
  onCollectDouble: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  report,
  lastDoubleAt,
  onCollect,
  onCollectDouble,
}) => {
  if (!report) return null;

  const doubleStatus = canDoubleAwayEarnings(lastDoubleAt);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--scrim)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-card)',
          borderTopRightRadius: 'var(--radius-card)',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-3)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          While you were away
        </span>

        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {formatDuration(report.elapsedSeconds)} offline
        </span>

        <div
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: 'var(--money)',
            letterSpacing: '-0.02em',
            margin: 'var(--space-1) 0',
          }}
        >
          +{formatMoney(report.cashEarned)}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" fullWidth onClick={onCollect}>
            Collect
          </Button>

          <Button
            variant="primary"
            fullWidth
            disabled={!doubleStatus.canDouble}
            onClick={onCollectDouble}
          >
            {doubleStatus.canDouble ? 'Collect x2' : doubleStatus.cooldownText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfflineModal;
