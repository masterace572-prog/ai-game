import React from 'react';
import {
  Users,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Icon } from './Icon';
import { Surface } from './Surface';
import { getUsableGpus } from '../game/logic';
import type { GameState } from '../game/types';

export interface MoreScreenProps {
  gameState: GameState;
  onNavigateToTeam: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  gameState,
  onNavigateToTeam,
}) => {
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          More
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Laboratory management, operational teams, and system overview.
        </p>
      </div>

      {/* Primary Navigation Item: Team & Compute */}
      <Surface
        onClick={onNavigateToTeam}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigateToTeam();
          }
        }}
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          minHeight: '64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon={Users} size={20} color="var(--primary)" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
              Team & Compute
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              GPUs, researchers, cooling, snacks, and data quality
            </div>
          </div>
        </div>
        <Icon icon={ChevronRight} size={20} color="var(--text-tertiary)" aria-hidden="true" />
      </Surface>

      {/* Lab Overview Card */}
      <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon icon={Info} size={18} color="var(--text-secondary)" aria-hidden="true" />
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
            Lab Overview
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Lab Name</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.labName}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Current Era</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Era {gameState.era} (Foundations)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Active Compute</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {usableGpus} / {gameState.gpus} GPUs
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Power Cap</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.powerCap} Units
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Researchers</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.researchers} Headcount
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Data Quality</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.dataQuality} / 100
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Models Launched</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.launchedModels.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Best Score</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {gameState.bestLaunchedModel?.score ?? 'None'}
            </span>
          </div>
        </div>
      </Surface>

      {/* Version Information */}
      <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--text-tertiary)', fontSize: '12px' }}>
        Model Foundry v0.1.1 · Phase 5: The Economy
      </div>
    </div>
  );
};
export default MoreScreen;
