import React, { useState } from 'react';
import {
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { Modal } from './Modal';
import {
  calculateEraPointsGained,
  canPrestigeNewEra,
} from '../game/logic';
import type { GameState } from '../game/types';

export interface NewEraScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
  onPrestige: () => void;
}

export const NewEraScreen: React.FC<NewEraScreenProps> = ({
  gameState,
  onBackToMore,
  onPrestige,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const bestScore = gameState.bestLaunchedModel?.score ?? 0;
  const cashEarned = gameState.lifetimeCashEarned ?? 0;
  const era = gameState.era ?? 1;
  const currentPoints = gameState.eraPoints ?? 0;

  const isEligible = canPrestigeNewEra(gameState);
  const pointsGained = calculateEraPointsGained(bestScore, cashEarned);

  const handleButtonClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
    } else {
      onPrestige();
    }
  };

  return (
    <div
      className="tab-pane"
      style={{
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
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
          padding: '8px 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      <h1 className="screen-title">New Era</h1>

      {/* Two summary lines */}
      <div
        style={{
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
            Gain
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            +{pointsGained} Era Points (+{pointsGained * 2}% score)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
            Lose
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Cash, GPUs, research, models
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Button
          variant={isEligible ? 'primary' : 'secondary'}
          disabled={!isEligible}
          onClick={handleButtonClick}
          style={{ width: '100%', minHeight: '48px' }}
        >
          <span>
            {!isEligible
              ? 'Need score 250 or $1M'
              : isConfirming
              ? 'Tap to Confirm'
              : 'Begin New Era'}
          </span>
        </Button>

        {isConfirming && (
          <Button
            variant="secondary"
            onClick={() => setIsConfirming(false)}
            style={{ width: '100%', minHeight: '48px' }}
          >
            <span>Cancel</span>
          </Button>
        )}
      </div>

      {/* Details Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        <GameRow
          icon={Sparkles}
          title="Details"
          value={`Era ${era} · ${currentPoints} pts`}
          showChevron
          onClick={() => setDetailsOpen(true)}
        />
      </div>

      {/* Details Sheet */}
      <Modal isOpen={detailsOpen}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            New Era Details
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>Current: Era {era} with {currentPoints} Era Points (+{currentPoints * 2}% permanent score bonus).</div>
            <div>Carryover: Achievements, sound/motion settings, and lifetime statistics are preserved.</div>
            <div>Rivals: Reset with refreshed starting baselines and two additional labs in Era 2+.</div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setDetailsOpen(false)}
            style={{ width: '100%', minHeight: '48px' }}
          >
            <span>Close</span>
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default NewEraScreen;
