import { describe, it, expect } from 'vitest';
import { createInitialState } from './save';
import {
  stepGame,
  startTraining,
  launchModel,
  canTrainModel,
  buyGpu,
  hireResearcher,
  canBuyResearchNode,
  buyResearchNode,
  calculateMarket,
  resolveEvent,
  getGpuPrice,
  getResearcherPrice,
  getModelUnlockStatus,
} from './logic';
import { RESEARCH_NODES, RESEARCH_NODE_ORDER } from './balance';
import type { ModelSizeId, ResearchNodeId } from './types';

describe('Phase 10: 30-Minute Decent Player Balance Simulation', () => {
  it('runs a decent player for 30 minutes (1800s) and meets all targets', () => {
    let state = createInitialState('Decent Lab', true);
    state.tutorialDone = true;

    const SIZES_REVERSE: ModelSizeId[] = ['frontier', 'huge', 'large', 'medium', 'small', 'tiny'];

    let gpusBoughtCount = 0;
    const initialGpus = state.gpus;

    // Simulate 30 minutes (1800 seconds) in 1-second steps
    for (let second = 1; second <= 1800; second++) {
      // 1. Step simulation by 1 second
      const stepRes = stepGame(state, 1);
      state = stepRes.state;

      // Auto-resolve pending event if any
      if (state.pendingEvent) {
        state = resolveEvent(state, 0);
      }

      // 2. Launch when training finishes
      if (state.readyModel) {
        state = launchModel(state);
      }

      // 3. Always trains the best size they can afford and have unlocked
      if (!state.currentTraining && !state.readyModel) {
        for (const size of SIZES_REVERSE) {
          if (canTrainModel(size, state).canTrain) {
            state = startTraining(state, size);
            break;
          }
        }
      }

      // 4. Buys a GPU when they can afford it and have under 8
      if (state.gpus < 8 && state.cash >= getGpuPrice(state.gpus)) {
        state = buyGpu(state);
        if (state.gpus > initialGpus + gpusBoughtCount) {
          gpusBoughtCount++;
        }
      }

      // 5. Hires when they can afford it and have under 4 researchers
      if (state.researchers < 4 && state.cash >= getResearcherPrice(state.researchers)) {
        state = hireResearcher(state);
      }

      // 6. Buys the cheapest research they can afford
      const availableNodes: { id: ResearchNodeId; cost: number }[] = [];
      for (const nodeId of RESEARCH_NODE_ORDER) {
        if (!state.researchOwned?.[nodeId]) {
          const check = canBuyResearchNode(nodeId, state);
          if (check.canBuy) {
            availableNodes.push({ id: nodeId, cost: RESEARCH_NODES[nodeId].cost });
          }
        }
      }
      if (availableNodes.length > 0) {
        availableNodes.sort((a, b) => a.cost - b.cost);
        state = buyResearchNode(state, availableNodes[0].id);
      }

      if (second % 300 === 0) {
        const m = calculateMarket(state);
        console.log(`[t=${second}s] Cash: $${state.cash.toFixed(0)} | Models: ${state.launchedModels.length} | Best: ${state.bestLaunchedModel?.score ?? 0} | Share: ${(m.playerShare * 100).toFixed(1)}% | Training: ${state.currentTraining?.sizeId ?? 'none'}`);
      }
    }

    const market = calculateMarket(state);
    const frontierUnlocked = getModelUnlockStatus('frontier', state).unlocked;

    console.log('=== Simulation Results After 30 Minutes ===');
    console.log(`Cash: $${state.cash.toFixed(2)}`);
    console.log(`Launched Models: ${state.launchedModels.length}`);
    console.log(`Market Share: ${(market.playerShare * 100).toFixed(1)}%`);
    console.log(`GPUs Owned: ${state.gpus} (Bought: ${gpusBoughtCount})`);
    console.log(`Researchers: ${state.researchers}`);
    console.log(`Frontier Unlocked: ${frontierUnlocked}`);
    console.log(`Best Launched Score: ${state.bestLaunchedModel?.score ?? 0}`);

    // Assert targets from Phase 10:
    // 1. Still has cash above 0
    expect(state.cash).toBeGreaterThan(0);

    // 2. Has launched at least 3 models
    expect(state.launchedModels.length).toBeGreaterThanOrEqual(3);

    // 3. Has a market share between 10% and 70% at the end
    expect(market.playerShare).toBeGreaterThanOrEqual(0.10);
    expect(market.playerShare).toBeLessThanOrEqual(0.70);

    // 4. Can afford a GPU at least once
    expect(gpusBoughtCount).toBeGreaterThanOrEqual(1);

    // 5. Has not already unlocked Frontier
    expect(frontierUnlocked).toBe(false);
  });
});
