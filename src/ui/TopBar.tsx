import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Icon } from './Icon';
import { formatShort } from './format';

export interface TopBarProps {
  labName: string;
  cash: number;
  incomePerSec: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function formatTopBarCash(amount: number): string {
  return `$${formatShort(amount)}`;
}

export const TopBar: React.FC<TopBarProps> = ({
  labName,
  cash,
  incomePerSec,
  soundEnabled = true,
  onToggleSound,
}) => {
  return (
    <header
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-8) var(--space-16)',
        paddingTop: 'max(var(--space-8), env(safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-12)',
        minHeight: '48px',
        boxSizing: 'border-box',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 600,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {labName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              padding: 0,
            }}
          >
            <Icon
              icon={soundEnabled ? Volume2 : VolumeX}
              size={20}
              color="var(--text-secondary)"
              aria-hidden="true"
            />
          </button>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              lineHeight: '20px',
              fontWeight: 600,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatTopBarCash(cash)}
          </span>
          <span
            style={{
              fontSize: '12px',
              lineHeight: '16px',
              color: incomePerSec >= 0 ? 'var(--text-secondary)' : 'var(--danger)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {incomePerSec >= 0 ? '+' : '-'}${Math.abs(incomePerSec).toFixed(1)}/s
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
