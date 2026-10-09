import React from 'react';
import { ChevronLeft, Rocket } from 'lucide-react';
import { Button } from './Button';

export interface NewEraScreenProps {
  onBackToMore: () => void;
}

export const NewEraScreen: React.FC<NewEraScreenProps> = ({ onBackToMore }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      <button
        type="button"
        onClick={onBackToMore}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ChevronLeft size={18} />
        <span>Back to More</span>
      </button>

      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
        >
          <Rocket size={32} />
        </div>

        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Coming Soon
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 'var(--space-2) 0 0 0' }}>
            New Era: Space Compute
          </h2>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, maxWidth: '320px' }}>
          Take your models beyond Earth. Build solar dyson swarms, lunar data arrays, and quantum orbital accelerators in v0.4.
        </p>

        <Button variant="secondary" onClick={onBackToMore}>
          Return to Lab
        </Button>
      </div>
    </div>
  );
};
