import React from 'react';
import { HelpCircle, ChevronRight, X } from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';

export interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const STEP_DATA: Record<number, { title: string; instruction: string; actionLabel: string }> = {
  1: {
    title: 'Welcome to Model Foundry',
    instruction: 'Choose a name for your independent AI research laboratory.',
    actionLabel: 'Next',
  },
  2: {
    title: 'Start Tiny Model Run',
    instruction: 'Allocate your initial GPUs by tapping "Train Tiny Model" on the Lab screen.',
    actionLabel: 'Next',
  },
  3: {
    title: 'Training Progress',
    instruction: 'The progress bar advances as your compute cluster computes forward and backward passes.',
    actionLabel: 'Next',
  },
  4: {
    title: 'Public Launch',
    instruction: 'Training complete! Tap "Launch Model" to release your weights and start earning market revenue.',
    actionLabel: 'Next',
  },
  5: {
    title: 'Market Share & Rivals',
    instruction: 'Visit the Market tab to compare your flagship appeal against rival labs like Helix Atelier.',
    actionLabel: 'Next',
  },
  6: {
    title: 'Scale Team & Hardware',
    instruction: 'Open Team & Compute. Your next optimal purchase is a GPU to accelerate future training iterations.',
    actionLabel: 'Finish Tutorial',
  },
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  onNext,
  onSkip,
}) => {
  const current = STEP_DATA[step] || STEP_DATA[6];

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 'var(--space-2)',
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 var(--space-3)',
        boxSizing: 'border-box',
      }}
    >
      <Surface
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon icon={HelpCircle} size={16} color="var(--primary)" aria-hidden="true" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 600 }}>
              Tutorial · Step {Math.min(6, Math.max(1, step))} of 6
            </span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              padding: 'var(--space-1) var(--space-2)',
              minHeight: '36px',
            }}
          >
            <span>Skip</span>
            <Icon icon={X} size={14} aria-hidden="true" />
          </button>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
            {current.title}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {current.instruction}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          <Button
            variant="primary"
            onClick={onNext}
            style={{ flex: 1, minHeight: '48px', fontSize: '13px' }}
          >
            <span>{current.actionLabel}</span>
            <Icon icon={ChevronRight} size={16} aria-hidden="true" />
          </Button>

          <Button
            variant="secondary"
            onClick={onSkip}
            style={{ minHeight: '48px', fontSize: '13px', padding: '0 var(--space-3)' }}
          >
            <span>Skip All</span>
          </Button>
        </div>
      </Surface>
    </div>
  );
};
export default TutorialOverlay;
