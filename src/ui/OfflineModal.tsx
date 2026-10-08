import React from 'react';
import { Clock } from 'lucide-react';
import { Icon } from './Icon';
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
    <Modal isOpen={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Icon icon={Clock} size={24} color="var(--text-secondary)" aria-hidden="true" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            Welcome Back
          </h2>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your laboratory continued running while you were away.
        </p>

        {/* Away & Simulated Time */}
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
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Simulated Away Time</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(report.simulatedSeconds)}
            </span>
          </div>

          {report.capped && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Note: Offline simulation capped at 8 hours (actual away: {formatDuration(report.awaySeconds)}).
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-2)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net Cash Flow</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: report.netCash >= 0 ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {report.netCash >= 0 ? '+' : '-'}${formatMoney(Math.abs(report.netCash)).slice(1)}
            </span>
          </div>
        </div>

        {/* Models Finished */}
        {report.modelsFinished.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Finished Training
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {report.modelsFinished.join(', ')} (ready to launch)
            </span>
          </div>
        )}

        {/* Rivals Launched */}
        {report.rivalsLaunched.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Rivals Active
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {report.rivalsLaunched.join(', ')} launched updated models.
            </span>
          </div>
        )}

        {/* Events Auto-Resolved */}
        {report.eventsResolved.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Events Auto-Resolved ({report.eventsResolved.length})
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {report.eventsResolved.join(', ')}
            </span>
          </div>
        )}

        <Button
          variant="primary"
          onClick={onClose}
          style={{ minHeight: '48px', width: '100%', marginTop: 'var(--space-2)' }}
        >
          <span>Resume Operations</span>
        </Button>
      </div>
    </Modal>
  );
};

export default OfflineModal;
