import React from 'react';
import {
  Cpu,
  Users,
  Database,
  Fan,
  Coffee,
  Megaphone,
} from 'lucide-react';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { formatCost } from './format';
import {
  getUsableGpus,
  getGpuPrice,
  getResearcherPrice,
  getCoolingPrice,
  getDataUpgradePrice,
} from '../game/logic';
import {
  COOLING_MAX_PURCHASES,
  OFFICE_SNACKS_COST,
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

  const marketingActive = (gameState.marketingActiveSeconds ?? 0) > 0;
  const marketingCooldown = (gameState.marketingCooldownSeconds ?? 0) > 0;
  const canAffordMarketing = gameState.cash >= MARKETING_CAMPAIGN_COST;

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
      <h1 className="screen-title">Team</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* 1. Buy GPU */}
        <GameRow
          icon={Cpu}
          title="Buy GPU"
          value={`${usableGpus}/${gameState.gpus}`}
          button={
            <Button
              variant={gameState.cash >= gpuPrice ? 'primary' : 'secondary'}
              disabled={gameState.cash < gpuPrice}
              onClick={onBuyGpu}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {gameState.cash >= gpuPrice
                  ? formatCost(gpuPrice)
                  : `Need ${formatCost(gpuPrice - gameState.cash)}`}
              </span>
            </Button>
          }
        />

        {/* 2. Hire */}
        <GameRow
          icon={Users}
          title="Hire"
          value={gameState.researchers}
          button={
            <Button
              variant={gameState.cash >= researcherPrice ? 'primary' : 'secondary'}
              disabled={gameState.cash < researcherPrice}
              onClick={onHireResearcher}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {gameState.cash >= researcherPrice
                  ? formatCost(researcherPrice)
                  : `Need ${formatCost(researcherPrice - gameState.cash)}`}
              </span>
            </Button>
          }
        />

        {/* 3. Data */}
        <GameRow
          icon={Database}
          title="Data"
          value={`${gameState.dataQuality}/100`}
          button={
            <Button
              variant={dataQualityMaxed || gameState.cash < dataQualityPrice ? 'secondary' : 'primary'}
              disabled={dataQualityMaxed || gameState.cash < dataQualityPrice}
              onClick={onUpgradeDataQuality}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {dataQualityMaxed
                  ? 'Max'
                  : gameState.cash >= dataQualityPrice
                  ? formatCost(dataQualityPrice)
                  : `Need ${formatCost(dataQualityPrice - gameState.cash)}`}
              </span>
            </Button>
          }
        />

        {/* 4. Cooling */}
        <GameRow
          icon={Fan}
          title="Cooling"
          value={`${coolingLevel}/${COOLING_MAX_PURCHASES}`}
          button={
            <Button
              variant={coolingMaxed || gameState.cash < coolingPrice ? 'secondary' : 'primary'}
              disabled={coolingMaxed || gameState.cash < coolingPrice}
              onClick={onBuyCooling}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {coolingMaxed
                  ? 'Max'
                  : gameState.cash >= coolingPrice
                  ? formatCost(coolingPrice)
                  : `Need ${formatCost(coolingPrice - gameState.cash)}`}
              </span>
            </Button>
          }
        />

        {/* 5. Snacks */}
        <GameRow
          icon={Coffee}
          title="Snacks"
          value={gameState.officeSnacks ? 'Active' : 'None'}
          button={
            <Button
              variant={gameState.officeSnacks || gameState.cash < OFFICE_SNACKS_COST ? 'secondary' : 'primary'}
              disabled={gameState.officeSnacks || gameState.cash < OFFICE_SNACKS_COST}
              onClick={onBuySnacks}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {gameState.officeSnacks
                  ? 'Bought'
                  : gameState.cash >= OFFICE_SNACKS_COST
                  ? formatCost(OFFICE_SNACKS_COST)
                  : `Need ${formatCost(OFFICE_SNACKS_COST - gameState.cash)}`}
              </span>
            </Button>
          }
        />

        {/* 6. Marketing */}
        <GameRow
          icon={Megaphone}
          title="Marketing"
          value={
            marketingActive
              ? `${gameState.marketingActiveSeconds}s`
              : marketingCooldown
              ? `${gameState.marketingCooldownSeconds}s`
              : 'Ready'
          }
          button={
            <Button
              variant={marketingActive || marketingCooldown || !canAffordMarketing ? 'secondary' : 'primary'}
              disabled={marketingActive || marketingCooldown || !canAffordMarketing}
              onClick={onStartMarketing}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>
                {marketingActive
                  ? 'Active'
                  : marketingCooldown
                  ? 'Cooldown'
                  : canAffordMarketing
                  ? formatCost(MARKETING_CAMPAIGN_COST)
                  : `Need ${formatCost(MARKETING_CAMPAIGN_COST - gameState.cash)}`}
              </span>
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default TeamScreen;
