import React from 'react';

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Options',
}: SegmentedProps<T>): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        height: '36px',
        display: 'flex',
        alignItems: 'stretch',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--surface)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {options.map((opt, index) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              borderLeft: index > 0 ? '1px solid var(--border)' : 'none',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-tertiary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13px',
              lineHeight: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px',
              outline: 'none',
              transition: 'background var(--duration) var(--ease), color var(--duration) var(--ease)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
