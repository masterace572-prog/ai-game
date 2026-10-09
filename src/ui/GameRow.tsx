import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

export interface GameRowProps {
  icon?: LucideIcon;
  iconColor?: string;
  iconTileBg?: string;
  customTile?: React.ReactNode;
  title: string;
  subtitle?: string;
  titleWrap?: boolean;
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
  iconTileBg,
  customTile,
  title,
  subtitle,
  titleWrap = false,
  value,
  valueColor = 'var(--text)',
  button,
  showChevron = false,
  onClick,
  disabled = false,
}) => {
  const isClickable = Boolean(onClick && !disabled && !button);

  const tileBackground =
    iconTileBg ||
    (iconColor && !iconColor.startsWith('var(--text')
      ? `color-mix(in srgb, ${iconColor} 16%, transparent)`
      : 'var(--surface-2)');

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
      {customTile ? (
        <div style={{ flexShrink: 0 }}>{customTile}</div>
      ) : IconComponent ? (
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: '12px',
            backgroundColor: tileBackground,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={20} strokeWidth={1.75} />
        </div>
      ) : null}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '16px',
            lineHeight: '22px',
            fontWeight: 600,
            color: 'var(--text)',
            overflow: titleWrap ? 'visible' : 'hidden',
            textOverflow: titleWrap ? 'clip' : 'ellipsis',
            whiteSpace: titleWrap ? 'normal' : 'nowrap',
            wordBreak: titleWrap ? 'break-word' : undefined,
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '13px',
              lineHeight: '18px',
              color: 'var(--text-secondary)',
              overflow: titleWrap ? 'visible' : 'hidden',
              textOverflow: titleWrap ? 'clip' : 'ellipsis',
              whiteSpace: titleWrap ? 'normal' : 'nowrap',
              wordBreak: titleWrap ? 'break-word' : undefined,
              marginTop: '1px',
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
            fontSize: '15px',
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
