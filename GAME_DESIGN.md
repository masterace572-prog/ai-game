# Model Foundry — Game Design (v0.4.0 Idle Tycoon)

This document is the authoritative design for **Model Foundry**, an offline Android idle tycoon game built with React 19, TypeScript, Vite, and Capacitor 8.5.3.

The player runs **Anthropic**, building the **Claude** model family. The game combines the pacing and dopamine of classic clickers (*AdVenture Capitalist*, *Egg Inc.*) with authentic AI dynamics: training sequential foundation models, launching commercial products, hiring engineers and managers, acquiring upgrades, scaling GPU compute clusters, and competing against industry rivals for market share.

---

## 1. Theme & Corporate Identity

- **Player Company**: Anthropic (Claude HQ).
- **Starting Capital**: $10.00.
- **Save File Key**: `modelfoundry.save.v2` (stays on v2 format with safe backward-compatible field defaults for v0.4.0).
- **Industry Rivals**:
  - **OpenAI (ChatGPT)**: Strength 1.05. Model ladder from GPT-1 to GPT-Omega.
  - **Google (Gemini)**: Strength 1.00. Model ladder from Bard to Gemini Omega.
  - **xAI (Grok)**: Strength 0.95. Model ladder from Grok-1 to Grok Omega.
  - **DeepSeek**: Strength 0.92. Model ladder from DeepSeek Coder to DeepSeek Omega.
- **Design System**: Strictly offline, clean typography (Inter), brand-accurate dark design tokens, Lucide icons only (no emojis).

---

## 2. Core Game Loop

1. **Tap to Earn**: Tap the Claude Treasury card to earn immediate cash: `$0.50 + 5% of incomePerSec` (rate-limited to 10 taps/sec).
2. **Train Models**: Train sequential models along the Claude ladder (Claude 1, Claude Instant, Claude 2, ..., Claude Omega). Training speed scales with Engineers, GPU Clusters, and Training Upgrades. Boost training actively with taps.
3. **Launch Models**: Launching a model unlocks higher commercial product tiers, unlocks funding rounds, and applies an exponential multiplier across all revenue.
4. **Deploy Products**: Purchase commercial product levels (Chat App, API, Coding Agent, Enterprise, Voice & Mobile, Gov & Science, Robotics) using `x1`, `x10`, or `Max` buy modes. Hit milestone levels (10, 25, 50, 75, 100, 150, 200, 300, 400) for huge multiplicative revenue jumps with audio-visual milestone feel.
5. **Hire Managers**: Hire Product Managers to gain a $\times 1.5$ product revenue boost and automated level purchasing (1 lvl/sec when cost $\le 10\%$ cash). Hire the Training Lead (auto-starts training when cost $\le 25\%$ cash) and Launch Lead (auto-launches ready models).
6. **Buy Upgrades**: Purchase permanent product upgrades ($\times 3$ each), global upgrades ($\times 2$ to $\times 5$ all revenue), and training speed upgrades ($\times 1.5$ to $\times 2$ training speed).
7. **Scale Infrastructure**: Hire Engineers, Sales Reps, and AI Researchers; deploy GPU Clusters and construct Infrastructure Buildings.
8. **Compete for Market Share**: Rival labs automatically train and release models on dynamic timers. Relative benchmark scores determine market share, granting a $0.5\times$ to $2.0\times$ revenue multiplier.
9. **Invest**: Take venture funding for lump sums and permanent revenue boosts; trade rival stocks with dynamic pricing.

---

## 3. Revenue & Economy Formulas

### Total Income Per Second
$$\text{Income} = \left(\sum \text{Product Income} \times \text{ManagerMult} \times \text{ProductUpgradeMult}\right) \times \text{ModelMult} \times \text{ShareMult} \times (1 + 0.03 \times \text{Sales}) \times \text{BuildingMult} \times \text{FundingMult} \times \text{GlobalUpgradeMult}$$

There are **no salaries, upkeep, freshness decay, or data quality maintenance**. All purchases provide strictly permanent progression.

### Commercial Products
$$\text{Cost}(\text{level}) = \text{round}\left(\text{baseCost} \times \text{costGrowth}^{\text{level}}\right)$$
$$\text{Income}(\text{level}) = \text{level} \times \text{baseIncome} \times \text{MilestoneMultiplier}$$

| Product | Unlock Model | Base Cost | Cost Growth | Base Income/lvl | Manager Cost ($\text{baseCost} \times 1000$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chat App** | Game Start | $5 | 1.12 | $0.38/s | $5,000 |
| **API** | Claude Instant | $75 | 1.17 | $3.00/s | $75,000 |
| **Coding Agent** | Claude 3 Haiku | $1,100 | 1.19 | $24.00/s | $1,100,000 |
| **Enterprise** | Claude 3.5 Haiku | $16,000 | 1.20 | $190.00/s | $16,000,000 |
| **Voice & Mobile** | Claude Sonnet 4 | $240,000 | 1.21 | $1,600.00/s | $240,000,000 |
| **Gov & Science** | Claude Sonnet 4.5 | $3,600,000 | 1.22 | $13,000.00/s | $3,600,000,000 |
| **Robotics** | Claude Opus 4.8 | $55,000,000 | 1.23 | $110,000.00/s | $55,000,000,000 |

#### Milestone Multipliers
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

## 4. Bulk Buy & Geometric Series Math

To support `x1`, `x10`, and `Max` buying across Products and Team/Compute:

### Cost of $N$ Levels from Level $L$
$$\text{Cost}(L, N) = \sum_{i=0}^{N-1} B \cdot r^{L + i} = B \cdot r^L \frac{r^N - 1}{r - 1} \quad (r \ne 1)$$
where $B$ is base cost and $r$ is cost growth factor.

### Maximum Affordable Levels with Cash $C$
$$N_{\max} = \left\lfloor \frac{\ln\left(1 + \frac{C(r - 1)}{B \cdot r^L}\right)}{\ln(r)} \right\rfloor$$
- If $C < B \cdot r^L$, $N_{\max} = 0$.
- Precision rounding and boundary step adjustments guarantee exact cash reconciliation.

### Buy Amount Modes
- **x1**: Buys 1 level.
- **x10**: Buys up to 10 levels (as many as cash allows, min 1 if affordable). Button displays count and total cost: `+7 · $1.2K`.
- **Max**: Buys as many as cash allows ($N_{\max}$). If affordable, button displays `+N · $Cost`; if unaffordable, displays `+1 · $Cost` (disabled).

---

## 5. Managers System

Managers are hired from the **Managers** sub-tab in Shop:

### Operations Leads
- **Training Lead** ($25,000): Automatically starts the next Claude model when its cost is $\le 25\%$ of current cash.
- **Launch Lead** ($10,000): Automatically launches models immediately upon training completion.

### Product Managers
- Cost: $\text{baseCost} \times 1,000$
- Multiplier: $\times 1.5$ product revenue.
- Automation: Automatically buys 1 level per second when the level cost $\le 10\%$ of cash.
- Control: Toggleable **Auto ON / Auto OFF** switch for each hired product manager.

| Manager | Product | Cost | Role & Effect |
| :--- | :--- | :--- | :--- |
| **Training Lead** | Model Training | $25,000 | Auto-starts models when cost $\le 25\%$ cash |
| **Launch Lead** | Model Deployment | $10,000 | Auto-launches ready models immediately |
| **Head of Chat** | Chat App | $5,000 | $\times 1.5$ Chat income · Auto-buys levels |
| **Head of API** | API | $75,000 | $\times 1.5$ API income · Auto-buys levels |
| **Head of Code** | Coding Agent | $1,100,000 | $\times 1.5$ Code income · Auto-buys levels |
| **Head of Enterprise** | Enterprise | $16,000,000 | $\times 1.5$ Enterprise income · Auto-buys levels |
| **Head of Mobile** | Voice & Mobile | $240,000,000 | $\times 1.5$ Mobile income · Auto-buys levels |
| **Head of Science** | Gov & Science | $3,600,000,000 | $\times 1.5$ Science income · Auto-buys levels |
| **Head of Robotics** | Robotics | $55,000,000,000 | $\times 1.5$ Robotics income · Auto-buys levels |

---

## 6. Upgrades System

Upgrades are permanent technological breakthroughs available in the **Upgrades** sub-tab in Shop (showing the 6 cheapest unowned upgrades with a collapsed "Owned" list), plus the next affordable upgrade highlighted as a shortcut on the Lab screen:

### 1. Product Upgrades (4 per product, each $\times 3$ product revenue)
Costs: $\text{baseCost} \times 10^3, 10^5, 10^7, 10^9$.
- **Chat App**: Better Prompts ($5K), Long Context ($500K), Memory ($50M), Voice Mode ($5B)
- **API**: Batch Endpoints ($75K), Streaming Responses ($7.5M), Prompt Caching ($750M), Dedicated Capacity ($75B)
- **Coding Agent**: Syntax Tree Analysis ($1.1M), Repo-Level Context ($110M), Autonomous Debugging ($11B), Self-Healing Tests ($1.1T)
- **Enterprise**: SOC2 Compliance ($16M), VPC Peering ($1.6B), Zero-Data Retention ($160B), SLA Guarantees ($16T)
- **Voice & Mobile**: On-Device Quantization ($240M), Neural Engine Offload ($24B), Sub-10ms Audio Pipeline ($2.4T), Always-On Assistant ($240T)
- **Gov & Science**: Literature Synthesis ($3.6B), Protein Folding ($360B), Hypothesis Generation ($36T), Automated Lab Trials ($3.6Qa)
- **Robotics**: Sim-to-Real Transfer ($55B), Vision-Language-Action ($5.5T), Tactile Feedback ($550T), Fleet Consensus ($55Qa)

### 2. Global Revenue Upgrades (multiplies all product revenue)
- **RLHF**: $250,000 ($\times 2$ All Revenue)
- **Constitutional AI**: $50,000,000 ($\times 2$ All Revenue)
- **Mixture of Experts**: $5,000,000,000 ($\times 3$ All Revenue)
- **Reasoning Mode**: $500,000,000,000 ($\times 3$ All Revenue)
- **Agentic Era**: $50,000,000,000,000 ($\times 5$ All Revenue)

### 3. Training Speed Upgrades
- **Flash Attention**: $5,000 ($\times 1.5$ Training Speed)
- **Distillation**: $2,000,000 ($\times 2$ Training Speed)
- **Custom Chips**: $1,000,000,000 ($\times 2$ Training Speed)

---

## 7. Milestone Feel & Lab Shortcuts

### Milestone Feel (v0.4.0)
When any product crosses a milestone level (10, 25, 50, 75, 100, 150, 200, 300, 400):
1. **Toast Notification**: `[Product Name] x2!` (or `x3!`).
2. **Row Border Flash**: 200ms highlight in `--money` (`#34d399`) with glow.
3. **Sound Chime**: Crisp higher-pitched Web Audio chord (`playMilestone`).
4. **Milestone Bar**: An always-visible progress bar on every product card displaying progress towards the next milestone.

### Lab Shortcuts
- **Best Buy Suggestion Row**: Situated under the Goal card on Lab. Dynamically calculates the purchase across Products, Upgrades, Managers, and Team with the highest immediate revenue gain per dollar spent. Displays a dedicated "Buy" button.
- **Next Upgrade Card**: Situated directly below the Products list on Lab. Displays the next cheapest affordable unowned upgrade with its name, description, and direct "Buy" button.

---

## 8. Balance Tuning & Simulation Verification

The balance has been verified using a 60-minute headless scripted tycoon simulation (`src/game/simulation.test.ts`), modeling an active player who hires managers, buys upgrades (cheapest first), and uses `Max` on products.

### Simulation Verification Results
- **First Purchase**: Second 0 ($\le 1\text{s}$) — **PASS**
- **Max Drought (First 10m)**: 2s ($\le 30\text{s}$) — **PASS**
- **Claude 2 Launch**: 132s ($\le 150\text{s}$, 2m 12s) — **PASS**
- **Claude 3 Opus Launch**: 489s ($\le 720\text{s}$, 8m 09s) — **PASS**
- **30-Minute Milestones**:
  - Hired Managers: 8 ($\ge 3$) — **PASS**
  - Purchased Upgrades: 21 ($\ge 5$) — **PASS**
- **Final Model at 60m**: Claude 9, Step 28 ($\ge 12$) — **PASS**
- **10-Minute Income**: $\$30,406.21/\text{s}$ ($\ge \$50/\text{s}$) — **PASS**

---

## 9. Save System & Backward Compatibility

- **Save Key**: `modelfoundry.save.v2`
- **Backup Key**: `modelfoundry.save.v2.backup`
- **Safe Defaults**: When an earlier v2 save (v0.3.0) is loaded:
  - `managers`: `{}`
  - `managerAutoBuy`: `{}`
  - `upgrades`: `{}`
  - `buyAmount`: `'1'`
  - `autoBuyAccumulator`: `0`
- Unit tests in `src/game/save.test.ts` guarantee no crashes or corruption when loading legacy saves.
