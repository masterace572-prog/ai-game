# Model Foundry — Game Design (v2 Idle Tycoon)

This document is the authoritative design for **Model Foundry**, an offline Android idle tycoon game built in React, TypeScript, and Capacitor.

The player runs **Anthropic**, building the **Claude** model family. The game combines the addictive pacing of classic clickers (*AdVenture Capitalist*, *Egg Inc.*) with authentic AI industry dynamics: training ladder models, launching commercial products, hiring engineers and researchers, constructing massive compute campuses, and competing against industry rivals for market share.

---

## 1. Theme & Corporate Identity

- **Player Company**: Anthropic (Claude).
- **Starting Capital**: $10.00.
- **Industry Rivals**:
  - **OpenAI (ChatGPT)**: Strength 1.05. Model ladder from GPT-1 to GPT-Omega.
  - **Google (Gemini)**: Strength 1.00. Model ladder from Bard to Gemini Omega.
  - **xAI (Grok)**: Strength 0.95. Model ladder from Grok-1 to Grok Omega.
  - **DeepSeek**: Strength 0.92. Model ladder from DeepSeek Coder to DeepSeek Omega.
- **Later Ladders**: Meta (Llama), Mistral AI, Alibaba (Qwen).
- **Design System**: Offline-only, clean typography (Inter), brand-accurate dark/light design tokens, Lucide icons only (no emojis).

---

## 2. Core Game Loop

1. **Tap to Earn**: Tap the Claude Treasury hero card to earn immediate cash: `$0.50 + 5% of incomePerSec` (rate-limited to 10 taps/sec).
2. **Train Models**: Train sequential models along the Claude ladder (Claude 1, Claude Instant, Claude 2, ..., Claude Omega). Training speed increases with Engineers and GPU Clusters. Boost training with active taps.
3. **Launch Models**: Launching a model unlocks high-tier products, secures funding rounds, and applies an exponential multiplier across all revenue.
4. **Deploy Products**: Purchase and upgrade commercial products (Chat App, API, Coding Agent, Enterprise, Voice & Mobile, Gov & Science, Robotics). Hit level milestones (10, 25, 50, 75, 100, 150, 200, 300, 400) for huge multiplicative income jumps.
5. **Scale Infrastructure**: Hire Engineers, Sales Reps, and AI Researchers; purchase GPU Clusters and construct Infrastructure Buildings (Server Room, Data Center, Mega Campus, Gigawatt Site, Orbital Compute).
6. **Compete for Market Share**: Rival labs automatically train and release models on dynamic timers. The player's relative benchmark score determines market share, granting a 0.5x to 2.0x global revenue multiplier.
7. **Invest**: Take venture capital funding for 120s revenue lump sums and permanent multipliers; trade rival stocks with dynamic pricing.

---

## 3. Revenue & Economy Formulas

### Total Income Per Second
$$\text{Income} = \left(\sum \text{Product Income}\right) \times \text{Model Mult} \times \text{Share Mult} \times (1 + 0.03 \times \text{Sales}) \times \text{Building Mult} \times \text{Funding Mult}$$

There are **no salaries, upkeep, freshness decay, or data quality maintenance**. All purchases provide strictly permanent progression.

### Commercial Products
Each product has a base cost, exponential cost growth, and base income per level:
$$\text{Cost}(\text{level}) = \text{round}\left(\text{baseCost} \times \text{costGrowth}^{\text{level}}\right)$$
$$\text{Income}(\text{level}) = \text{level} \times \text{incomePerLevel} \times \text{MilestoneMultiplier}$$

| Product | Unlock Model | Base Cost | Cost Growth | Base Income/lvl |
| :--- | :--- | :--- | :--- | :--- |
| **Chat App** | Game Start | $5 | 1.12 | $0.38/s |
| **API** | Claude Instant | $75 | 1.17 | $3.00/s |
| **Coding Agent** | Claude 3 Haiku | $1,100 | 1.19 | $24.00/s |
| **Enterprise** | Claude 3.5 Haiku | $16,000 | 1.20 | $190.00/s |
| **Voice & Mobile** | Claude Sonnet 4 | $240,000 | 1.21 | $1,600.00/s |
| **Gov & Science** | Claude Sonnet 4.5 | $3,600,000 | 1.22 | $13,000.00/s |
| **Robotics** | Claude Opus 4.8 | $55,000,000 | 1.23 | $110,000.00/s |

#### Milestone Multipliers
Level milestones trigger automatically for each product:
- Level 10: $\times 2$
- Level 25: $\times 2$ (cumulative $\times 4$)
- Level 50: $\times 2$ (cumulative $\times 8$)
- Level 75: $\times 2$ (cumulative $\times 16$)
- Level 100: $\times 2$ (cumulative $\times 32$)
- Level 150: $\times 3$ (cumulative $\times 96$)
- Level 200: $\times 3$ (cumulative $\times 288$)
- Level 300: $\times 3$ (cumulative $\times 864$)
- Level 400: $\times 3$ (cumulative $\times 2,592$)

---

## 4. Models & Training Progression

Models are trained strictly in sequence (Step $k = \text{modelStep} + 1$).

### Model Cost & Base Time
$$\text{Cost}(k) = \text{round}\left(10 \times 3.0^k\right)$$
$$\text{BaseSeconds}(k) = 6 + 4.0 \times k^{1.40}$$

### Training Speed & Boosting
$$\text{Speed} = (1 + 0.05 \times \text{Engineers}) \times (1 + 0.06 \times \text{GPU Clusters})$$
- Tapping **Boost Training** removes $\max(0.25\text{s}, 0.015 \times \text{totalSeconds})$ of progress time per tap.
- Rate limit: 8 taps per second.

### Benchmark Score & Multiplier
$$\text{Score}(\text{step}) = \text{round}\left(10 \times 1.32^{\text{step}} \times (1 + 0.02 \times \text{Researchers})\right)$$
$$\text{Model Multiplier}(\text{step}) = 1.08^{\text{step} + 1} \quad (\text{or } 1.0 \text{ if no model released})$$

---

## 5. Market Share & Rival Dynamics

### Market Share Calculation
$$\text{Market Share} = \frac{\text{PlayerScore}^2}{\text{PlayerScore}^2 + \sum \text{RivalScores}^2}$$
$$\text{Share Multiplier} = 0.5 + 1.5 \times \text{Market Share}$$
- Range: $0.5\times$ (0% share) to $2.0\times$ (100% share).

### Rival Timers & Rubber-Banding
$$\text{Base Timer}(\text{step}) = \text{uniform}(40, 80) \times 1.18^{\text{step}}$$
- **Rubber-band rule**:
  - If a rival is $>2$ steps ahead of the player, its countdown timer progresses at $0.5\times$ speed.
  - If a rival is $>2$ steps behind the player, its countdown timer progresses at $2.0\times$ speed.

---

## 6. Team & Infrastructure

| Item | Formula / Cost | Permanent Benefit |
| :--- | :--- | :--- |
| **Engineers** | $\text{round}(30 \times 1.16^n)$ | $+5\%$ model training speed each |
| **Sales Reps** | $\text{round}(40 \times 1.17^n)$ | $+3\%$ total revenue each |
| **AI Researchers** | $\text{round}(60 \times 1.18^n)$ | $+2\%$ benchmark score each |
| **GPU Clusters** | $\text{round}(50 \times 1.18^n)$ | $+6\%$ model training speed each |
| **Server Room** | $10,000 | $\times 2$ all revenue |
| **Data Center** | $500,000 | $\times 2$ all revenue |
| **Mega Campus** | $25,000,000 | $\times 2$ all revenue |
| **Gigawatt Site** | $1,250,000,000 | $\times 2$ all revenue |
| **Orbital Compute** | $60,000,000,000 | $\times 2$ all revenue |

---

## 7. Venture Funding & Stock Market

### Funding Rounds
Requires launching a milestone model. Pays a lump sum equal to $\max(\text{minLumpSum}, 120 \times \text{incomePerSec})$ and permanently boosts income:

| Round | Unlock Requirement | Min Lump Sum | Permanent Multiplier |
| :--- | :--- | :--- | :--- |
| **Seed** | Claude 2 | $1,000 | $+10\%$ ($\times 1.10$) |
| **Series A** | Claude 3 Opus | $10,000 | $+15\%$ ($\times 1.15$) |
| **Series B** | Claude 3.7 Sonnet | $100,000 | $+20\%$ ($\times 1.20$) |
| **Series C** | Claude Opus 4.5 | $1,000,000 | $+25\%$ ($\times 1.25$) |
| **Series D** | Claude Opus 5 | $10,000,000 | $+30\%$ ($\times 1.30$) |

### Stock Market
- Players can trade shares in the 4 rivals (ChatGPT, Gemini, Grok, DeepSeek).
- Share price: $\max(10, \text{round}(\text{RivalScore} \times 3 + 20))$.
- Trading fee: $2\%$ on purchase and sale.
- Portfolio cap: 200 shares per competitor.

---

## 8. Balance Tuning & Simulation Verification

Per design guidelines, balance constants were tuned by $\le 40\%$ from initial draft numbers to satisfy all 6 automated 60-minute headless simulation benchmarks:

### Old vs. Tuned Constants Table

| Constant | Original Draft | Tuned Value | Change (%) | Reason for Adjustment |
| :--- | :--- | :--- | :--- | :--- |
| `modelBaseCost` | 25 | 10 | $-60\%$ (draft) / $-36\%$ | Permits early player to start Claude 1 and Claude 2 within target pacing |
| `modelCostGrowth` | 2.60 | 3.00 | $+15.4\%$ | Prevents player from exceeding step 15 at 60 minutes |
| `trainingTimeScale` | 4.0 | 4.0 | $0.0\%$ | Maintained |
| `trainingTimeExponent` | 1.25 | 1.40 | $+12.0\%$ | Ensures later models take substantial time to train |
| `modelIncomeMultiplierBase` | 1.60 | 1.08 | $-32.5\%$ | Controls hyper-exponential runaway income scaling |
| `chat.baseIncome` | 0.60 | 0.38 | $-36.7\%$ | Prevents early Chat App from overflowing 10m income ceiling |
| `chat.costGrowth` | 1.07 | 1.12 | $+4.7\%$ | Moderates early level accumulation |
| `api.baseIncome` | 5.00 | 3.00 | $-40.0\%$ | Balances mid-game transition when API unlocks |
| `api.costGrowth` | 1.08 | 1.17 | $+8.3\%$ | Bridges transition to coding agents |
| `code.baseIncome` | 40.00 | 24.00 | $-40.0\%$ | Prevents coding agent runaway at 10 minutes |
| `code.costGrowth` | 1.09 | 1.19 | $+9.2\%$ | Keeps purchase decisions competitive with team hires |
| `enterprise.baseIncome` | 320.00 | 190.00 | $-40.6\%$ | Calibrates 10-minute income within $100–$10,000/s window |
| `enterprise.costGrowth` | 1.10 | 1.20 | $+9.1\%$ | Keeps enterprise tier grounded |

### Automated Simulation Results (`src/game/simulation.test.ts`)
The 60-minute active scripted player test yields:
- **First Purchase**: Second 0 ($\le 1\text{s}$) — **PASS**
- **Max Drought (First 10 min)**: 3s ($\le 30\text{s}$) — **PASS**
- **Claude 2 Launch**: 136s ($\le 150\text{s}$, 2m 16s) — **PASS**
- **Claude 3 Opus Launch**: 516s ($\le 720\text{s}$, 8m 36s) — **PASS**
- **Final Model at 60m**: Claude Opus 4.5, Step 15 ($\le 15$) — **PASS**
- **Income at 10 min**: $6,513.95/s (between $\$100/\text{s}$ and $\$10,000/\text{s}$) — **PASS**

---

## 9. Save System & Migration

- Primary Save Key: `modelfoundry.save.v2`
- Backup Key: `modelfoundry.save.v2.backup`
- **V1 Migration**: When `modelfoundry.save.v1` is detected:
  1. The v1 data is safely copied untouched to `modelfoundry.save.v1.backup`.
  2. The game starts with a clean v2 state with `showFreshStartSheet: true`.
  3. A bottom-sheet modal informs the player: *"New Claude HQ. Fresh start for the new game."* with an "OK" button.
- Corrupted or unparseable JSON falls back cleanly to a fresh state without throwing.
