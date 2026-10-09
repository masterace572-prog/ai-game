import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Microscope,
  Cpu,
  Building2,
  CheckCircle2,
  UserCheck,
  Zap,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from './Button';
import { Segmented } from './Segmented';
import {
  BUILDINGS,
  getBuildingMultiplier,
  getTrainingSpeed,
  MANAGERS,
  MANAGER_ORDER,
  UPGRADES,
  ALL_UPGRADE_IDS,
} from '../game/balance';
import { getEffectiveBuyPlan } from '../game/logic';
import type { GameState, BuyAmount } from '../game/types';
import { formatCost } from './format';

export interface ShopScreenProps {
  gameState: GameState;
  onHireEngineer: (mode?: BuyAmount) => void;
  onHireSales: (mode?: BuyAmount) => void;
  onHireResearcher: (mode?: BuyAmount) => void;
  onBuyGpuCluster: (mode?: BuyAmount) => void;
  onBuyBuilding: () => void;
  onHireManager: (managerId: string) => void;
  onToggleManagerAutoBuy: (managerId: string) => void;
  onBuyUpgrade: (upgradeId: string) => void;
  buyAmount: BuyAmount;
  onSetBuyAmount: (mode: BuyAmount) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  gameState,
  onHireEngineer,
  onHireSales,
  onHireResearcher,
  onBuyGpuCluster,
  onBuyBuilding,
  onHireManager,
  onToggleManagerAutoBuy,
  onBuyUpgrade,
  buyAmount,
  onSetBuyAmount,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'compute' | 'managers' | 'upgrades'>('team');
  const [ownedExpanded, setOwnedExpanded] = useState(false);

  const { engineers, sales, researchers } = gameState.people;
  const engPlan = getEffectiveBuyPlan(30, 1.16, engineers, gameState.cash, buyAmount);
  const salesPlan = getEffectiveBuyPlan(40, 1.17, sales, gameState.cash, buyAmount);
  const resPlan = getEffectiveBuyPlan(60, 1.18, researchers, gameState.cash, buyAmount);
  const gpuPlan = getEffectiveBuyPlan(50, 1.18, gameState.gpuClusters, gameState.cash, buyAmount);

  const speedMultiplier = getTrainingSpeed(engineers, gameState.gpuClusters, gameState.upgrades);
  const buildingMult = getBuildingMultiplier(gameState.buildings);

  // Upgrades calculation: 6 cheapest unowned
  const unownedUpgrades = ALL_UPGRADE_IDS
    .filter((id) => !gameState.upgrades?.[id])
    .map((id) => UPGRADES[id])
    .sort((a, b) => a.cost - b.cost);

  const displayUpgrades = unownedUpgrades.slice(0, 6);

  const ownedUpgrades = ALL_UPGRADE_IDS
    .filter((id) => Boolean(gameState.upgrades?.[id]))
    .map((id) => UPGRADES[id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Sub-tab navigation */}
      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'team' | 'compute' | 'managers' | 'upgrades')}
        options={[
          { id: 'team', label: 'Team' },
          { id: 'compute', label: 'Compute' },
          { id: 'managers', label: 'Managers' },
          { id: 'upgrades', label: 'Upgrades' },
        ]}
      />

      {/* Buy Amount Selector (for Team & Compute) */}
      {(activeTab === 'team' || activeTab === 'compute') && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Buy Quantity
          </span>
          <div style={{ width: '180px' }}>
            <Segmented
              value={buyAmount}
              onChange={(val) => onSetBuyAmount(val as BuyAmount)}
              options={[
                { id: '1', label: 'x1' },
                { id: '10', label: 'x10' },
                { id: 'max', label: 'Max' },
              ]}
            />
          </div>
        </div>
      )}

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
              disabled={!engPlan.canAfford}
              onClick={() => onHireEngineer(buyAmount)}
            >
              Hire +{engPlan.count} • {formatCost(engPlan.cost)}
            </Button>
          </div>

          {/* Sales Reps */}
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
                    +3% commercial revenue multiplier each
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  +{(sales * 3)}% income
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={!salesPlan.canAfford}
              onClick={() => onHireSales(buyAmount)}
            >
              Hire +{salesPlan.count} • {formatCost(salesPlan.cost)}
            </Button>
          </div>

          {/* AI Researchers */}
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
                    Researchers ({researchers})
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
              disabled={!resPlan.canAfford}
              onClick={() => onHireResearcher(buyAmount)}
            >
              Hire +{resPlan.count} • {formatCost(resPlan.cost)}
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
              disabled={!gpuPlan.canAfford}
              onClick={() => onBuyGpuCluster(buyAmount)}
            >
              Deploy +{gpuPlan.count} • {formatCost(gpuPlan.cost)}
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

      {/* MANAGERS SUB-TAB */}
      {activeTab === 'managers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Managers automate operations and provide product multipliers.
          </div>

          {MANAGER_ORDER.map((mgrId) => {
            const def = MANAGERS[mgrId];
            if (!def) return null;
            const isHired = Boolean(gameState.managers?.[mgrId]);
            const isAutoOn = gameState.managerAutoBuy?.[mgrId] !== false;
            const canAfford = gameState.cash >= def.cost;

            return (
              <div
                key={mgrId}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: isHired ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isHired ? 'var(--people-tint)' : 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isHired ? 'var(--people)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                        {def.name}
                      </span>
                      {def.multiplier && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--money-tint)',
                            color: 'var(--money)',
                          }}
                        >
                          x{def.multiplier}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {def.description}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isHired ? (
                    def.type === 'product' ? (
                      <button
                        onClick={() => onToggleManagerAutoBuy(mgrId)}
                        style={{
                          backgroundColor: isAutoOn ? 'var(--money-tint)' : 'var(--surface-2)',
                          border: isAutoOn ? '1px solid var(--money)' : '1px solid var(--border)',
                          color: isAutoOn ? 'var(--money)' : 'var(--text-tertiary)',
                          borderRadius: 'var(--radius-control)',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isAutoOn ? 'Auto ON' : 'Auto OFF'}
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={16} /> Active
                      </span>
                    )
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => onHireManager(mgrId)}
                    >
                      Hire • {formatCost(def.cost)}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPGRADES SUB-TAB */}
      {activeTab === 'upgrades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Permanent technology upgrades multiplying product, training, and global revenue.
          </div>

          {/* 6 cheapest unowned upgrades */}
          {displayUpgrades.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {displayUpgrades.map((upg) => {
                const canAfford = gameState.cash >= upg.cost;
                const categoryColor =
                  upg.category === 'global'
                    ? 'var(--gold)'
                    : upg.category === 'training'
                    ? 'var(--compute)'
                    : 'var(--money)';
                const categoryTint =
                  upg.category === 'global'
                    ? 'var(--gold-tint)'
                    : upg.category === 'training'
                    ? 'var(--compute-tint)'
                    : 'var(--money-tint)';

                return (
                  <div
                    key={upg.id}
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: categoryTint,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: categoryColor,
                          flexShrink: 0,
                        }}
                      >
                        {upg.category === 'global' ? (
                          <TrendingUp size={18} />
                        ) : upg.category === 'training' ? (
                          <Zap size={18} />
                        ) : (
                          <Sparkles size={18} />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                            {upg.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: categoryTint,
                              color: categoryColor,
                              textTransform: 'capitalize',
                            }}
                          >
                            {upg.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {upg.description}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => onBuyUpgrade(upg.id)}
                    >
                      {formatCost(upg.cost)}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              All current upgrades purchased!
            </div>
          )}

          {/* Collapsible Owned Row */}
          {ownedUpgrades.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginTop: 'var(--space-2)',
              }}
            >
              <button
                onClick={() => setOwnedExpanded(!ownedExpanded)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                  <span>Owned ({ownedUpgrades.length})</span>
                </div>
                {ownedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {ownedExpanded && (
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  {ownedUpgrades.map((upg) => (
                    <div
                      key={upg.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--text)' }}>{upg.name}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {upg.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopScreen;
