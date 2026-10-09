import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { formatMoney } from './format';
import type { OfflineReport } from '../game/logic';

export interface OfflineModalProps {
  report: OfflineReport | null;
  onClose: () => void;
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

export const OfflineModal: React.FC<OfflineModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <Modal isOpen={true} title="Welcome Back" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your lab continued generating income while you were away.
        </p>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Away Time</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(report.elapsedSeconds)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Offline Income</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
              +{formatMoney(report.cashEarned)}
            </span>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>
          Claim Earnings
        </Button>
      </div>
    </Modal>
  );
};

export default OfflineModal;
