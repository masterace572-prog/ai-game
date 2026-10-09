import React from 'react';
import { ShieldAlert, Users } from 'lucide-react';
import { Button } from './Button';
import { formatCost } from './format';
import type { EventChoiceModalData } from '../game/types';

export interface ChoiceModalProps {
  data: EventChoiceModalData;
  cash: number;
  onChoiceA: () => void;
  onChoiceB: () => void;
}

export const ChoiceModal: React.FC<ChoiceModalProps> = ({
  data,
  cash,
  onChoiceA,
  onChoiceB,
}) => {
  if (!data) return null;

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
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-card)',
          borderTopRightRadius: 'var(--radius-card)',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: data.type === 'lawsuit' ? 'var(--danger-tint)' : 'var(--people-tint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: data.type === 'lawsuit' ? 'var(--danger)' : 'var(--people)',
          }}
        >
          {data.type === 'lawsuit' ? <ShieldAlert size={24} /> : <Users size={24} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: data.type === 'lawsuit' ? 'var(--danger)' : 'var(--people)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {data.type === 'lawsuit' ? 'Legal Challenge' : 'Human Resources'}
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            {data.title}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {data.desc}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%' }}>
          {data.type === 'lawsuit' ? (
            <>
              <Button
                variant="primary"
                fullWidth
                disabled={cash < data.settleCost}
                onClick={onChoiceA}
              >
                Settle • Pay {formatCost(data.settleCost)}
              </Button>
              <Button variant="secondary" fullWidth onClick={onChoiceB}>
                Fight • -20% Market Share (2m)
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                fullWidth
                disabled={cash < data.counterCost}
                onClick={onChoiceA}
              >
                Counter-Offer • Pay {formatCost(data.counterCost)}
              </Button>
              <Button variant="secondary" fullWidth onClick={onChoiceB}>
                Let Go • Lose 1 Engineer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChoiceModal;
