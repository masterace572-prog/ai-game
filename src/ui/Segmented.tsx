import React from 'react';

export interface SegmentedOption<T extends string = string> {
  id?: T;
  value?: T;
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
        const optKey = (opt.id ?? opt.value) as T;
        const isActive = optKey === value;

        return (
          <button
            key={optKey}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(optKey)}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              borderLeft: index > 0 ? '1px solid var(--border)' : 'none',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-tertiary)',
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px',
              boxShadow: 'none',
              textShadow: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background-color var(--duration) var(--ease), color var(--duration) var(--ease)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
