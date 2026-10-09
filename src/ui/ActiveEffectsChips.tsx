import React from 'react';
import { formatCost } from './format';
import type { GameState } from '../game/types';

export interface ActiveEffectsChipsProps {
  gameState: GameState;
  incomePerSec: number;
  onFixOutage: () => void;
}

export const ActiveEffectsChips: React.FC<ActiveEffectsChipsProps> = ({
  gameState,
  incomePerSec,
  onFixOutage,
}) => {
  const chips: React.ReactNode[] = [];

  const viral = Math.ceil(gameState.viralLaunchTimer ?? 0);
  if (viral > 0) {
    chips.push(
      <div
        key="viral"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--hype-tint)',
          border: '1px solid var(--hype)',
          color: 'var(--hype)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>x3 Income</span>
        <span style={{ opacity: 0.8 }}>· {viral}s</span>
      </div>
    );
  }

  const golden = Math.ceil(gameState.goldenGpuBuffTimer ?? 0);
  if (golden > 0) {
    chips.push(
      <div
        key="golden"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--gold-tint)',
          border: '1px solid var(--gold)',
          color: 'var(--gold)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>x7 Income</span>
        <span style={{ opacity: 0.8 }}>· {golden}s</span>
      </div>
    );
  }

  const day7 = Math.ceil(gameState.day7BonusTimer ?? 0);
  if (day7 > 0) {
    chips.push(
      <div
        key="day7"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--gold-tint)',
          border: '1px solid var(--gold)',
          color: 'var(--gold)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>x2 Day 7</span>
        <span style={{ opacity: 0.8 }}>· {day7}s</span>
      </div>
    );
  }

  const hype = Math.ceil(gameState.hypeWaveTimer ?? 0);
  if (hype > 0) {
    chips.push(
      <div
        key="hype"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--hype-tint)',
          border: '1px solid var(--hype)',
          color: 'var(--hype)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>x2 Train Speed</span>
        <span style={{ opacity: 0.8 }}>· {hype}s</span>
      </div>
    );
  }

  if (gameState.dataDealActive) {
    chips.push(
      <div
        key="dataDeal"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--research-tint)',
          border: '1px solid var(--research)',
          color: 'var(--research)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>Data Deal</span>
        <span style={{ opacity: 0.8 }}>· Next -30% Time</span>
      </div>
    );
  }

  const outage = Math.ceil(gameState.outageTimer ?? 0);
  if (outage > 0) {
    const fixCost = Math.max(10, Math.round(incomePerSec * 30));
    const canAffordFix = gameState.cash >= fixCost;

    chips.push(
      <div
        key="outage"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 6px 2px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--danger-tint)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>Outage x0.5 · {outage}s</span>
        <button
          onClick={onFixOutage}
          disabled={!canAffordFix}
          style={{
            backgroundColor: 'var(--danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: canAffordFix ? 'pointer' : 'default',
            opacity: canAffordFix ? 1 : 0.5,
          }}
        >
          Fix: {formatCost(fixCost)}
        </button>
      </div>
    );
  }

  const lawsuit = Math.ceil(gameState.lawsuitPenaltyTimer ?? 0);
  if (lawsuit > 0) {
    chips.push(
      <div
        key="lawsuit"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--danger-tint)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span>Share x0.8</span>
        <span style={{ opacity: 0.8 }}>· {lawsuit}s</span>
      </div>
    );
  }

  if (chips.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {chips}
    </div>
  );
};

export default ActiveEffectsChips;
