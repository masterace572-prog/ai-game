import React, { useState } from 'react';
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';
import { formatShort } from './format';
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

  const bestScore = gameState.bestLaunchedModel?.score ?? 0;
  const cashEarned = gameState.lifetimeCashEarned ?? 0;
  const era = gameState.era ?? 1;
  const currentPoints = gameState.eraPoints ?? 0;

  const isEligible = canPrestigeNewEra(gameState);
  const pointsGained = calculateEraPointsGained(bestScore, cashEarned);
  const newTotalPoints = currentPoints + pointsGained;

  const scoreFromPoints = Math.floor(bestScore / 80);
  const cashFromPoints = Math.floor(cashEarned / 1000000);

  const handleButtonClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
    } else {
      onPrestige();
    }
  };

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Back button */}
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
          padding: 'var(--space-2) 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      {/* Screen Title */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          New Era (Prestige)
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Advance to the next technological frontier and secure permanent architecture bonuses.
        </p>
      </div>

      {/* Era Points Gained Card */}
      <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon icon={Sparkles} size={20} color="var(--primary)" aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
              Era Points Gained This Reset
            </span>
          </div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{pointsGained} pts
          </span>
        </div>

        {/* Breakdown Calculation */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>From Best Score ({bestScore} ÷ 80):</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text)', fontWeight: 600 }}>
              +{scoreFromPoints} pts
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>From Cash Earned (${formatShort(cashEarned)} ÷ 1M):</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text)', fontWeight: 600 }}>
              +{cashFromPoints} pts
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border)',
              paddingTop: 'var(--space-2)',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            <span>Next Total Points & Multiplier:</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
              {newTotalPoints} pts (×{(1 + newTotalPoints * 0.02).toFixed(2)} score bonus)
            </span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          Each Era Point permanently boosts all future model training scores by +2% (1 + eraPoints × 0.02).
        </div>
      </Surface>

      {/* Qualification Criteria Card */}
      <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
          Eligibility Requirements (Any One)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icon
                icon={bestScore >= 250 ? CheckCircle2 : AlertCircle}
                size={16}
                color={bestScore >= 250 ? 'var(--success)' : 'var(--text-tertiary)'}
                aria-hidden="true"
              />
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                Best Launched Score ≥ 250
              </span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: bestScore >= 250 ? 'var(--success)' : 'var(--text-secondary)' }}>
              {bestScore} / 250
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icon
                icon={cashEarned >= 2000000 ? CheckCircle2 : AlertCircle}
                size={16}
                color={cashEarned >= 2000000 ? 'var(--success)' : 'var(--text-tertiary)'}
                aria-hidden="true"
              />
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                Lifetime Cash Earned ≥ $2,000,000
              </span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: cashEarned >= 2000000 ? 'var(--success)' : 'var(--text-secondary)' }}>
              ${formatShort(cashEarned)} / $2.0M
            </span>
          </div>
        </div>

        {!isEligible && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            New Era button unlocks once your lab reaches score 250 or earns $2M this era.
          </div>
        )}
      </Surface>

      {/* What is Kept vs What is Reset Card */}
      <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
          Era Transition Summary
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
          {/* Kept */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--success)', fontWeight: 600 }}>
              Kept Forever
            </span>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <li>Era number ({era} → {era + 1})</li>
              <li>Era points ({newTotalPoints} total)</li>
              <li>All achievements & bonuses</li>
              <li>All-time best score</li>
              <li>Lab name & settings</li>
              <li>Lifetime prestige count</li>
            </ul>
          </div>

          {/* Reset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--danger)', fontWeight: 600 }}>
              Reset to Start
            </span>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <li>Cash ($25,000 start)</li>
              <li>GPUs (2) & Power Cap (4)</li>
              <li>Researchers (1) & Data (20)</li>
              <li>Reputation (0)</li>
              <li>Models & training runs</li>
              <li>Research nodes & tech equity</li>
              <li>Data centers & cooling</li>
              <li>Rivals re-seeded higher</li>
            </ul>
          </div>
        </div>

        {era === 1 && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border)' }}>
            Era 2 introduces rival labs Copperline and Bracket Research to the market.
          </div>
        )}
      </Surface>

      {/* Confirmation & Action Button (ONLY RENDERED IF ELIGIBLE) */}
      {isEligible && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {isConfirming && (
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--warning)',
                fontSize: '12px',
                color: 'var(--text)',
                textAlign: 'center',
              }}
            >
              Are you sure? Current cash, chips, and models will reset. Tap again to confirm.
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleButtonClick}
            style={{ minHeight: '48px', width: '100%', fontSize: '14px' }}
          >
            <Icon icon={RotateCcw} size={16} aria-hidden="true" />
            <span>
              {isConfirming
                ? `Confirm New Era (Advance to Era ${era + 1})`
                : `Begin New Era (Era ${era} → ${era + 1})`}
            </span>
          </Button>

          {isConfirming && (
            <Button
              variant="secondary"
              onClick={() => setIsConfirming(false)}
              style={{ minHeight: '48px', width: '100%', fontSize: '14px' }}
            >
              <span>Cancel</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default NewEraScreen;
