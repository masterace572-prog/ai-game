import React from 'react';
import { Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { Button } from './Button';

export interface LaunchModalProps {
  modelName: string;
  score: number;
  multiplier: number;
  reduceMotion?: boolean;
  onClose: () => void;
}

const BURST_COLORS = [
  'var(--money)',
  'var(--gold)',
  'var(--compute)',
  'var(--people)',
  'var(--research)',
  'var(--hype)',
  'var(--brand-claude)',
  'var(--brand-openai)',
  'var(--brand-gemini)',
  'var(--money)',
  'var(--gold)',
  'var(--compute)',
];

export const LaunchModal: React.FC<LaunchModalProps> = ({
  modelName,
  score,
  multiplier,
  reduceMotion = false,
  onClose,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--scrim)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-card)',
          borderTopRightRadius: 'var(--radius-card)',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          padding: 'var(--space-6) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* 12 burst squares */}
        {!reduceMotion && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {BURST_COLORS.map((color, idx) => {
              const angle = (idx * 30 * Math.PI) / 180;
              const dist = 75 + (idx % 3) * 20;
              const dx = Math.round(Math.cos(angle) * dist);
              const dy = Math.round(Math.sin(angle) * dist);

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    backgroundColor: color,
                    borderRadius: '2px',
                    animation: `burstOut 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    // @ts-expect-error CSS variable
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Header Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Sparkles size={28} />
        </div>

        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Major AI Model Release
          </span>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text)',
              marginTop: '4px',
            }}
          >
            {modelName} launched
          </div>
        </div>

        {/* Stats card */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold)' }}>
              <Trophy size={16} />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Score</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
              {score}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Boost</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>
              +x{multiplier.toFixed(2)} income
            </span>
          </div>
        </div>

        <Button variant="primary" fullWidth size="lg" onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  );
};

export default LaunchModal;
