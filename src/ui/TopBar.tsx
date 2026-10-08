import React from 'react';

export interface TopBarProps {
  labName: string;
  cash: number;
  incomePerSec: number;
}

export function formatTopBarCash(amount: number): string {
  const whole = Math.floor(amount);
  if (whole < 1000) return `$${whole}`;
  if (whole < 1000000) return `$${(whole / 1000).toFixed(1)}K`;
  if (whole < 1000000000) return `$${(whole / 1000000).toFixed(1)}M`;
  return `$${(whole / 1000000000).toFixed(1)}B`;
}

export const TopBar: React.FC<TopBarProps> = ({ labName, cash, incomePerSec }) => {
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
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          +${incomePerSec % 1 === 0 ? incomePerSec.toFixed(0) : incomePerSec.toFixed(1)}/s
        </span>
      </div>
    </header>
  );
};

export default TopBar;
