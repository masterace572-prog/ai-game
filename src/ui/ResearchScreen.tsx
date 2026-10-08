import React from 'react';
import {
  FlaskConical,
  Check,
  Lock,
  ChevronLeft,
  Database,
  Zap,
  Cpu,
  Users,
  Megaphone,
  Layers,
  Sparkles,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';
import {
  RESEARCH_NODES,
  RESEARCH_NODE_ORDER,
} from '../game/balance';
import {
  canBuyResearchNode,
  getResearchScoreMultiplier,
  getTotalScoreMultiplier,
} from '../game/logic';
import type { GameState, ResearchNodeId } from '../game/types';

export interface ResearchScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
  onBuyResearch: (nodeId: ResearchNodeId) => void;
}

const NODE_ICONS: Record<ResearchNodeId, LucideIcon> = {
  'clean-data': Database,
  'optimizers': Zap,
  'cheap-flops': Cpu,
  'recruiter': Users,
  'brand': Megaphone,
  'mixture': Layers,
  'reasoning': Sparkles,
  'agent-harness': Bot,
};

export const ResearchScreen: React.FC<ResearchScreenProps> = ({
  gameState,
  onBackToMore,
  onBuyResearch,
}) => {
  const researchMult = getResearchScoreMultiplier(gameState);
  const totalMult = getTotalScoreMultiplier(gameState);

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

      {/* Screen Header */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          Research & Development
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Pioneer architectural breakthroughs, talent pipelines, and foundational model techniques.
        </p>
      </div>

      {/* Multiplier Summary Card */}
      <Surface
        style={{
          padding: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Research Score Bonus
          </span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)' }}>
            {researchMult.toFixed(2)}x
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            From active research nodes
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Architecture
          </span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            {totalMult.toFixed(2)}x
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Research × Data centers
          </span>
        </div>
      </Surface>

      {/* Research Nodes Vertical Cards List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {RESEARCH_NODE_ORDER.map((nodeId) => {
          const def = RESEARCH_NODES[nodeId];
          const isOwned = Boolean(gameState.researchOwned?.[nodeId]);
          const check = canBuyResearchNode(nodeId, gameState);
          const NodeIcon = NODE_ICONS[nodeId] || FlaskConical;

          return (
            <Surface
              key={nodeId}
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                opacity: !isOwned && !check.canBuy && check.reason?.startsWith('Requires') ? 0.65 : 1.0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isOwned ? 'var(--surface)' : 'var(--surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isOwned ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Icon
                    icon={isOwned ? Check : !check.canBuy && check.reason?.startsWith('Requires') ? Lock : NodeIcon}
                    size={20}
                    color={isOwned ? 'var(--success)' : 'var(--primary)'}
                    aria-hidden="true"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                      {def.name}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: isOwned ? 'var(--text-tertiary)' : 'var(--text)',
                      }}
                    >
                      {isOwned ? 'Researched' : `$${def.cost.toLocaleString()}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {def.effect}
                  </div>

                  {def.requiresNodeId && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Prerequisite: {RESEARCH_NODES[def.requiresNodeId]?.name}
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant={isOwned ? 'secondary' : 'primary'}
                onClick={() => onBuyResearch(nodeId)}
                disabled={isOwned || !check.canBuy}
                style={{ minHeight: '48px', width: '100%' }}
              >
                <span>
                  {isOwned
                    ? 'Researched'
                    : !check.canBuy
                    ? (check.reason ?? 'Locked')
                    : `Research ${def.name} — $${def.cost.toLocaleString()}`}
                </span>
              </Button>
            </Surface>
          );
        })}
      </section>
    </div>
  );
};
export default ResearchScreen;
