import React, { useState } from 'react';
import { Users, Briefcase, Microscope, Cpu, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Segmented } from './Segmented';
import {
  getEngineerCost,
  getSalesCost,
  getResearcherCost,
  getGpuClusterCost,
  BUILDINGS,
  getBuildingMultiplier,
  getTrainingSpeed,
} from '../game/balance';
import type { GameState } from '../game/types';
import { formatCost } from './format';

export interface ShopScreenProps {
  gameState: GameState;
  onHireEngineer: () => void;
  onHireSales: () => void;
  onHireResearcher: () => void;
  onBuyGpuCluster: () => void;
  onBuyBuilding: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  gameState,
  onHireEngineer,
  onHireSales,
  onHireResearcher,
  onBuyGpuCluster,
  onBuyBuilding,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'compute'>('team');

  const { engineers, sales, researchers } = gameState.people;
  const engCost = getEngineerCost(engineers);
  const salesCost = getSalesCost(sales);
  const resCost = getResearcherCost(researchers);
  const gpuCost = getGpuClusterCost(gameState.gpuClusters);

  const speedMultiplier = getTrainingSpeed(engineers, gameState.gpuClusters);
  const buildingMult = getBuildingMultiplier(gameState.buildings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Sub-tab navigation */}
      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'team' | 'compute')}
        options={[
          { id: 'team', label: 'Team' },
          { id: 'compute', label: 'Compute' },
        ]}
      />

      {/* TEAM SUB-TAB */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Engineers */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                    Engineers ({engineers})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    +5% model training speed each
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  +{(engineers * 5)}% speed
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={gameState.cash < engCost}
              onClick={onHireEngineer}
            >
              Hire Engineer • {formatCost(engCost)}
            </Button>
          </div>

          {/* Sales */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--success-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                  }}
                >
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                    Sales Reps ({sales})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    +3% total revenue each
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  +{(sales * 3)}% revenue
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={gameState.cash < salesCost}
              onClick={onHireSales}
            >
              Hire Sales Rep • {formatCost(salesCost)}
            </Button>
          </div>

          {/* Researchers */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--warning-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning)',
                  }}
                >
                  <Microscope size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                    AI Researchers ({researchers})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    +2% model benchmark score each
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)' }}>
                  +{(researchers * 2)}% score
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={gameState.cash < resCost}
              onClick={onHireResearcher}
            >
              Hire Researcher • {formatCost(resCost)}
            </Button>
          </div>
        </div>
      )}

      {/* COMPUTE SUB-TAB */}
      {activeTab === 'compute' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* GPU Clusters */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <Cpu size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                    GPU Clusters ({gameState.gpuClusters})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    +6% model training speed each
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  +{(gameState.gpuClusters * 6)}% speed
                </span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Total compute speed: <strong style={{ color: 'var(--text)' }}>{speedMultiplier.toFixed(2)}x</strong>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={gameState.cash < gpuCost}
              onClick={onBuyGpuCluster}
            >
              Deploy GPU Cluster • {formatCost(gpuCost)}
            </Button>
          </div>

          {/* Infrastructure Buildings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Infrastructure Buildings
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                Total: x{buildingMult} revenue
              </span>
            </div>

            {BUILDINGS.map((b, idx) => {
              const isOwned = idx < gameState.buildings;
              const isNext = idx === gameState.buildings;

              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: isOwned ? '1px solid var(--border)' : isNext ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: !isOwned && !isNext ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {isOwned ? (
                      <CheckCircle2 size={20} color="var(--success)" />
                    ) : (
                      <Building2 size={20} color="var(--text-secondary)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {b.description}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isOwned ? (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                        Owned (x2)
                      </span>
                    ) : isNext ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={gameState.cash < b.cost}
                        onClick={onBuyBuilding}
                      >
                        {formatCost(b.cost)}
                      </Button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {formatCost(b.cost)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopScreen;
