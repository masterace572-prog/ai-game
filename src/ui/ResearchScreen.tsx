import React, { useState } from 'react';
import {
  ChevronLeft,
  FlaskConical,
  Check,
  Lock,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { formatCost } from './format';
import {
  RESEARCH_NODES,
  RESEARCH_NODE_ORDER,
} from '../game/balance';
import { canBuyResearchNode } from '../game/logic';
import type { GameState, ResearchNodeId } from '../game/types';

export interface ResearchScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
  onBuyResearch: (nodeId: ResearchNodeId) => void;
}

export const ResearchScreen: React.FC<ResearchScreenProps> = ({
  gameState,
  onBackToMore,
  onBuyResearch,
}) => {
  const [showLocked, setShowLocked] = useState(false);

  const availableNodes: ResearchNodeId[] = [];
  const ownedNodes: ResearchNodeId[] = [];
  const lockedNodes: ResearchNodeId[] = [];

  for (const nodeId of RESEARCH_NODE_ORDER) {
    if (gameState.researchOwned?.[nodeId]) {
      ownedNodes.push(nodeId);
    } else {
      const check = canBuyResearchNode(nodeId, gameState);
      if (check.canBuy) {
        availableNodes.push(nodeId);
      } else {
        lockedNodes.push(nodeId);
      }
    }
  }

  const getShortLockedReason = (nodeId: ResearchNodeId): string => {
    const def = RESEARCH_NODES[nodeId];
    if (def.requiresNodeId) {
      const parentName = RESEARCH_NODES[def.requiresNodeId]?.name ?? def.requiresNodeId;
      return `need ${parentName}`;
    }
    return 'locked';
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

      <h1 className="screen-title">Research</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Available Nodes */}
        {availableNodes.map((nodeId) => {
          const def = RESEARCH_NODES[nodeId];
          const canAfford = gameState.cash >= def.cost;

          return (
            <GameRow
              key={nodeId}
              icon={FlaskConical}
              title={def.name}
              button={
                <Button
                  variant={canAfford ? 'primary' : 'secondary'}
                  disabled={!canAfford}
                  onClick={() => onBuyResearch(nodeId)}
                  style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
                >
                  <span>{canAfford ? `Buy ${formatCost(def.cost)}` : `Need ${formatCost(def.cost - gameState.cash)}`}</span>
                </Button>
              }
            />
          );
        })}

        {/* Owned Nodes */}
        {ownedNodes.map((nodeId) => {
          const def = RESEARCH_NODES[nodeId];
          return (
            <GameRow
              key={nodeId}
              icon={Check}
              iconColor="var(--positive)"
              title={def.name}
              value="Owned"
              valueColor="var(--text-secondary)"
            />
          );
        })}

        {/* Locked Nodes (single expandable row) */}
        {lockedNodes.length > 0 && (
          <>
            <GameRow
              icon={Lock}
              title={`Locked (${lockedNodes.length})`}
              showChevron
              onClick={() => setShowLocked(!showLocked)}
            />
            {showLocked && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lockedNodes.map((nodeId) => {
                  const def = RESEARCH_NODES[nodeId];
                  return (
                    <div
                      key={nodeId}
                      style={{
                        minHeight: '44px',
                        padding: '10px 16px 10px 48px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                        {def.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getShortLockedReason(nodeId)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResearchScreen;
