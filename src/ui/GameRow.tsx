import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

export interface GameRowProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  valueColor?: string;
  button?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const GameRow: React.FC<GameRowProps> = ({
  icon: IconComponent,
  iconColor = 'var(--text-secondary)',
  title,
  subtitle,
  value,
  valueColor = 'var(--text)',
  button,
  showChevron = false,
  onClick,
  disabled = false,
}) => {
  const isClickable = Boolean(onClick && !disabled && !button);

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{
        minHeight: '56px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: isClickable ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        background: 'transparent',
      }}
    >
      {IconComponent && (
        <div
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
          }}
        >
          <IconComponent size={20} strokeWidth={1.75} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '16px',
            lineHeight: '20px',
            fontWeight: 500,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '12px',
              lineHeight: '16px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {(value !== undefined && value !== null) && (
        <div
          style={{
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
            fontSize: '16px',
            fontWeight: 600,
            color: valueColor,
            textAlign: 'right',
          }}
        >
          {value}
        </div>
      )}

      {button && (
        <div style={{ flexShrink: 0, minHeight: '48px', maxWidth: '120px', display: 'flex', alignItems: 'center' }}>
          {button}
        </div>
      )}

      {showChevron && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}
        >
          <ChevronRight size={20} strokeWidth={1.75} />
        </div>
      )}
    </div>
  );
};
