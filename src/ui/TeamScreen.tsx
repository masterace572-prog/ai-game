import React from 'react';
import {
  Users,
  Cpu,
  Fan,
  Coffee,
  Database,
  Megaphone,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';
import { formatCost } from './format';
import {
  getUsableGpus,
  getGpuPrice,
  getResearcherPrice,
  getCoolingPrice,
  getDataUpgradePrice,
  getIncomePerSec,
} from '../game/logic';
import {
  COOLING_MAX_PURCHASES,
  COOLING_UPGRADE_POWER_CAP,
  OFFICE_SNACKS_COST,
  DATA_UPGRADE_AMOUNT,
  MARKETING_CAMPAIGN_COST,
} from '../game/balance';
import type { GameState } from '../game/types';

export interface TeamScreenProps {
  gameState: GameState;
  onBuyGpu: () => void;
  onHireResearcher: () => void;
  onBuyCooling: () => void;
  onBuySnacks: () => void;
  onUpgradeDataQuality: () => void;
  onStartMarketing: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  gameState,
  onBuyGpu,
  onHireResearcher,
  onBuyCooling,
  onBuySnacks,
  onUpgradeDataQuality,
  onStartMarketing,
}) => {
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);
  const gpuPrice = getGpuPrice(gameState.gpus);
  const researcherPrice = getResearcherPrice(gameState.researchers);
  const coolingLevel = gameState.coolingPurchases ?? 0;
  const coolingPrice = getCoolingPrice(coolingLevel);
  const coolingMaxed = coolingLevel >= COOLING_MAX_PURCHASES;
  const dataQualityPrice = getDataUpgradePrice(gameState.dataQuality);
  const dataQualityMaxed = gameState.dataQuality >= 100;

  const { income: netIncome, grossRevenue, salaries, upkeep } = getIncomePerSec(gameState);
  const totalBurn = salaries + upkeep;

  // Marketing campaign state
  const marketingActive = (gameState.marketingActiveSeconds ?? 0) > 0;
  const marketingCooldown = (gameState.marketingCooldownSeconds ?? 0) > 0;
  const canAffordMarketing = gameState.cash >= MARKETING_CAMPAIGN_COST;

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          Team & Compute
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Scale engineering talent, GPU infrastructure, and laboratory efficiency.
        </p>
      </div>

      {/* Payroll Alert if cash hit 0 */}
      {gameState.payrollTight && (
        <Surface
          style={{
            borderColor: 'var(--warning)',
            backgroundColor: 'var(--surface)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <Icon icon={AlertTriangle} size={20} color="var(--warning)" aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--warning)' }}>
              Payroll is tight
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Cash is $0. Revenue covers immediate upkeep; salaries are paused at zero floor without debt accumulating.
            </span>
          </div>
        </Surface>
      )}

      {/* Operating Expenses Card */}
      <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Operating Cash Flow
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {netIncome >= 0 ? '+' : ''}${netIncome.toFixed(2)}/s net
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Revenue</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              +${grossRevenue.toFixed(2)}/s
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Salaries</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              -${salaries.toFixed(2)}/s
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>DC Upkeep</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              -${upkeep.toFixed(2)}/s
            </span>
          </div>
        </div>

        <div
          style={{
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Total Burn Rate</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>${totalBurn.toFixed(2)}/sec</span>
        </div>
      </Surface>

      {/* Compute Infrastructure Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Compute Hardware
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {usableGpus} of {gameState.gpus} GPUs online
          </span>
        </div>

        {gameState.gpus > gameState.powerCap && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
            }}
          >
            <Icon icon={Zap} size={16} color="var(--warning)" aria-hidden="true" />
            <span>
              Power cap reached ({gameState.powerCap} max). {gameState.gpus - gameState.powerCap} GPU(s) unpowered.
            </span>
          </div>
        )}

        {/* Buy GPU Card */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
              <Icon icon={Cpu} size={20} color="var(--primary)" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                H100 Tensor Core GPU
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Accelerates training iterations. Reduces training time across all model sizes.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Owned: {gameState.gpus} · Active: {usableGpus}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={onBuyGpu}
            disabled={gameState.cash < gpuPrice}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>Buy GPU — {formatCost(gpuPrice)}</span>
          </Button>
        </Surface>

        {/* Buy Cooling Card */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
              <Icon icon={Fan} size={20} color="var(--primary)" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                Liquid Cooling Loop
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Expands lab power headroom by +{COOLING_UPGRADE_POWER_CAP} per stage (up to {COOLING_MAX_PURCHASES} stages).
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Stage {coolingLevel} of {COOLING_MAX_PURCHASES} installed · Total Cap: {gameState.powerCap}
              </div>
            </div>
          </div>

          <Button
            variant={coolingMaxed ? 'secondary' : 'primary'}
            onClick={onBuyCooling}
            disabled={coolingMaxed || gameState.cash < coolingPrice}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>
              {coolingMaxed
                ? 'Max Cooling Installed (Stage 5/5)'
                : `Upgrade Cooling — ${formatCost(coolingPrice)}`}
            </span>
          </Button>
        </Surface>
      </section>

      {/* Research & Talent Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Research Team
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {gameState.researchers} researcher{gameState.researchers === 1 ? '' : 's'} on staff
          </span>
        </div>

        {/* Hire Researcher Card */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                Hire AI Researcher
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Expands architecture exploration and raises the potential score roll of training runs.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Headcount: {gameState.researchers} · Base salary: $0.15/sec per person
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={onHireResearcher}
            disabled={gameState.cash < researcherPrice}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>Hire Researcher — {formatCost(researcherPrice)}</span>
          </Button>
        </Surface>

        {/* Office Snacks Card */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
              <Icon icon={Coffee} size={20} color="var(--primary)" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                Kitchen Micro-Kitchen & Cold Brew
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Perks reduce researcher salary expectations by 5% permanently.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {gameState.officeSnacks ? 'Active: 5% salary discount applied' : 'One-time upgrade'}
              </div>
            </div>
          </div>

          <Button
            variant={gameState.officeSnacks ? 'secondary' : 'primary'}
            onClick={onBuySnacks}
            disabled={gameState.officeSnacks || gameState.cash < OFFICE_SNACKS_COST}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>
              {gameState.officeSnacks
                ? 'Snacks Stocked (5% Discount Active)'
                : `Buy Snacks — ${formatCost(OFFICE_SNACKS_COST)}`}
            </span>
          </Button>
        </Surface>
      </section>

      {/* Dataset Quality Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Data Engineering
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Quality: {gameState.dataQuality} / 100
          </span>
        </div>

        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
              <Icon icon={Database} size={20} color="var(--primary)" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                Filter & Deduplicate Pretraining Data
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Higher quality training sets (+{DATA_UPGRADE_AMOUNT} quality) directly elevate expected model scores.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Current Score Bonus: +{Math.round(gameState.dataQuality * 0.40)} pts
              </div>
            </div>
          </div>

          <Button
            variant={dataQualityMaxed ? 'secondary' : 'primary'}
            onClick={onUpgradeDataQuality}
            disabled={dataQualityMaxed || gameState.cash < dataQualityPrice}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>
              {dataQualityMaxed
                ? 'Dataset Quality Maxed (100/100)'
                : `Clean Data (+${DATA_UPGRADE_AMOUNT} Qual) — ${formatCost(dataQualityPrice)}`}
            </span>
          </Button>
        </Surface>
      </section>

      {/* Marketing Campaign Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          Marketing & Promotion
        </h2>

        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
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
              <Icon icon={Megaphone} size={20} color="var(--primary)" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                Industry PR Blitz
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Guarantees at least 1.25× hype multiplier for 180 seconds to boost market appeal and subscription share.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {marketingActive
                  ? `Active: ${Math.ceil(gameState.marketingActiveSeconds ?? 0)}s remaining`
                  : marketingCooldown
                  ? `Cooldown: ${Math.ceil(gameState.marketingCooldownSeconds ?? 0)}s remaining`
                  : 'Ready to launch'}
              </div>
            </div>
          </div>

          <Button
            variant={marketingActive || marketingCooldown ? 'secondary' : 'primary'}
            onClick={onStartMarketing}
            disabled={marketingActive || marketingCooldown || !canAffordMarketing}
            style={{ minHeight: '48px', width: '100%' }}
          >
            <span>
              {marketingActive
                ? `Campaign Active (${Math.ceil(gameState.marketingActiveSeconds ?? 0)}s)`
                : marketingCooldown
                ? `Cooldown (${Math.ceil(gameState.marketingCooldownSeconds ?? 0)}s)`
                : `Launch Marketing Blitz — ${formatCost(MARKETING_CAMPAIGN_COST)}`}
            </span>
          </Button>
        </Surface>
      </section>
    </div>
  );
};
export default TeamScreen;
