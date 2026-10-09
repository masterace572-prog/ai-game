import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Icon } from './Icon';
import { formatShort } from './format';

export interface TopBarProps {
  labName: string;
  cash?: number;
  incomePerSec?: number;
  ratePerSec?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function formatTopBarCash(amount: number): string {
  return `$${formatShort(amount)}`;
}

export const TopBar: React.FC<TopBarProps> = ({
  labName,
  cash,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
        <span
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 700,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {labName}
        </span>
        {typeof cash === 'number' && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-subtle)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {formatTopBarCash(cash)}
          </span>
        )}
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
              color: soundEnabled ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              padding: 0,
              boxShadow: 'none',
              textShadow: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon icon={soundEnabled ? Volume2 : VolumeX} size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
