import { describe, it, expect } from 'vitest';
import { createInitialState } from './save';
import {
  stepGame,
  tapEarn,
  startTraining,
  boostTraining,
  launchModel,
  buyProductBulk,
  hireEngineer,
  hireSales,
  hireResearcher,
  buyGpuCluster,
  hireManager,
  buyUpgrade,
  getEffectiveBuyPlan,
  calculateTotalIncomePerSec,
} from './logic';
import {
  CLAUDE_LADDER,
  PRODUCTS,
  PRODUCT_ORDER,
  MANAGERS,
  MANAGER_ORDER,
  UPGRADES,
  ALL_UPGRADE_IDS,
  getModelCost,
  getEngineerCost,
  getSalesCost,
  getResearcherCost,
  getGpuClusterCost,
} from './balance';

describe('AdVenture Capitalist / Egg Inc. 60-Minute Scripted Simulation', () => {
  it('meets all balance and pacing milestones over 60 minutes', () => {
    let state = createInitialState(false);

    let firstPurchaseSecond: number | null = null;
    let claude2LaunchSecond: number | null = null;
    let claude3OpusLaunchSecond: number | null = null;
    let incomeAt10Min = 0;
    let managersAt30Min = 0;
    let upgradesAt30Min = 0;

    let currentStretchNothingAffordable = 0;
    let maxStretchNothingAffordableInFirst10Min = 0;

    for (let second = 0; second <= 3600; second++) {
      // 1. First 2 minutes: tap earn 3x/s and boost 3x/s
      if (second <= 120) {
        for (let t = 0; t < 3; t++) {
          state = tapEarn(state).state;
        }
        for (let b = 0; b < 3; b++) {
          state = boostTraining(state);
        }
      }

      // 2. Launch immediately if ready
      if (state.readyStep !== null) {
        const { state: nextState } = launchModel(state);
        state = nextState;
        if (state.modelStep >= 2 && claude2LaunchSecond === null) {
          claude2LaunchSecond = second;
        }
        if (state.modelStep >= 6 && claude3OpusLaunchSecond === null) {
          claude3OpusLaunchSecond = second;
        }
      }

      // 3. Identify all available things to buy and their costs
      interface PurchaseCandidate {
        name: string;
        cost: number;
        execute: () => void;
      }

      const candidates: PurchaseCandidate[] = [];

      // Next model training
      if (!state.training && state.readyStep === null) {
        const nextK = state.modelStep + 1;
        if (nextK < CLAUDE_LADDER.length) {
          candidates.push({
            name: `Train ${CLAUDE_LADDER[nextK]}`,
            cost: getModelCost(nextK),
            execute: () => {
              state = startTraining(state);
            },
          });
        }
      }

      // Upgrades (unowned)
      for (const uid of ALL_UPGRADE_IDS) {
        if (!state.upgrades?.[uid]) {
          candidates.push({
            name: `Upgrade: ${UPGRADES[uid].name}`,
            cost: UPGRADES[uid].cost,
            execute: () => {
              state = buyUpgrade(state, uid);
            },
          });
        }
      }

      // Managers (unhired)
      for (const mid of MANAGER_ORDER) {
        if (!state.managers?.[mid]) {
          candidates.push({
            name: `Manager: ${MANAGERS[mid].name}`,
            cost: MANAGERS[mid].cost,
            execute: () => {
              state = hireManager(state, mid);
            },
          });
        }
      }

      // Product levels using Max
      for (const pid of PRODUCT_ORDER) {
        if (state.modelStep >= PRODUCTS[pid].unlockStep) {
          const lvl = state.products[pid] ?? 0;
          const def = PRODUCTS[pid];
          const plan = getEffectiveBuyPlan(def.baseCost, def.costGrowth, lvl, state.cash, 'max');
          if (plan.canAfford && plan.count > 0) {
            candidates.push({
              name: `${def.name} x${plan.count}`,
              cost: plan.cost,
              execute: () => {
                state = buyProductBulk(state, pid, 'max').state;
              },
            });
          }
        }
      }

      // Team & Clusters
      candidates.push({
        name: 'Engineer',
        cost: getEngineerCost(state.people.engineers),
        execute: () => {
          state = hireEngineer(state);
        },
      });
      candidates.push({
        name: 'Sales',
        cost: getSalesCost(state.people.sales),
        execute: () => {
          state = hireSales(state);
        },
      });
      candidates.push({
        name: 'Researcher',
        cost: getResearcherCost(state.people.researchers),
        execute: () => {
          state = hireResearcher(state);
        },
      });
      candidates.push({
        name: 'GPU Cluster',
        cost: getGpuClusterCost(state.gpuClusters),
        execute: () => {
          state = buyGpuCluster(state);
        },
      });

      const affordable = candidates.filter((c) => c.cost <= state.cash);

      // Track stretch with nothing affordable in first 10 minutes (0 to 600s)
      if (second <= 600) {
        if (affordable.length === 0) {
          currentStretchNothingAffordable++;
          if (currentStretchNothingAffordable > maxStretchNothingAffordableInFirst10Min) {
            maxStretchNothingAffordableInFirst10Min = currentStretchNothingAffordable;
          }
        } else {
          currentStretchNothingAffordable = 0;
        }
      }

      if (affordable.length > 0) {
        affordable.sort((a, b) => a.cost - b.cost);
        affordable[0].execute();
        if (firstPurchaseSecond === null) {
          firstPurchaseSecond = second;
        }
      }

      // Record 10-minute snapshot
      if (second === 600) {
        incomeAt10Min = calculateTotalIncomePerSec(state);
      }

      // Record 30-minute snapshot
      if (second === 1800) {
        managersAt30Min = Object.values(state.managers ?? {}).filter(Boolean).length;
        upgradesAt30Min = Object.values(state.upgrades ?? {}).filter(Boolean).length;
      }

      if (second > 0 && second % 600 === 0) {
        const inc = calculateTotalIncomePerSec(state);
        const mgrs = Object.values(state.managers ?? {}).filter(Boolean).length;
        const upgs = Object.values(state.upgrades ?? {}).filter(Boolean).length;
        console.log(
          `[t=${second}s / ${(second / 60).toFixed(0)}m] Cash: $${state.cash.toFixed(0)} | Income: $${inc.toFixed(1)}/s | Model: ${
            state.modelStep >= 0 ? CLAUDE_LADDER[state.modelStep] : 'None'
          } (step ${state.modelStep}) | Chat: lv ${state.products.chat} | Mgrs: ${mgrs} | Upgs: ${upgs}`
        );
      }

      // 4. Step 1s of simulation
      state = stepGame(state, 1).state;
    }

    console.log('=== Simulation Results ===');
    console.log(`First purchase second: ${firstPurchaseSecond}`);
    console.log(`Max stretch with nothing affordable in first 10m: ${maxStretchNothingAffordableInFirst10Min}s`);
    console.log(`Claude 2 launched at: ${claude2LaunchSecond}s (${(claude2LaunchSecond! / 60).toFixed(1)}m)`);
    console.log(`Claude 3 Opus launched at: ${claude3OpusLaunchSecond}s (${(claude3OpusLaunchSecond! / 60).toFixed(1)}m)`);
    console.log(`Final model: ${CLAUDE_LADDER[state.modelStep]} (step ${state.modelStep})`);
    console.log(`Income at 10m: $${incomeAt10Min.toFixed(2)}/s`);
    console.log(`Managers at 30m: ${managersAt30Min}`);
    console.log(`Upgrades at 30m: ${upgradesAt30Min}`);

    // Assertions
    expect(firstPurchaseSecond).not.toBeNull();
    expect(firstPurchaseSecond).toBeLessThanOrEqual(1);

    expect(maxStretchNothingAffordableInFirst10Min).toBeLessThanOrEqual(30);

    expect(claude2LaunchSecond).not.toBeNull();
    expect(claude2LaunchSecond!).toBeLessThanOrEqual(150); // 2:30

    expect(claude3OpusLaunchSecond).not.toBeNull();
    expect(claude3OpusLaunchSecond!).toBeLessThanOrEqual(720); // 12:00

    expect(state.modelStep).toBeGreaterThanOrEqual(12);

    expect(incomeAt10Min).toBeGreaterThanOrEqual(50);

    // v0.4.0 balance assertions
    expect(managersAt30Min).toBeGreaterThanOrEqual(3);
    expect(upgradesAt30Min).toBeGreaterThanOrEqual(5);
  });
});
