# Model Foundry — Game Design (v0.5.0 Idle Tycoon)

This document is the authoritative design for **Model Foundry**, an offline Android idle tycoon game built with React 19, TypeScript, Vite, and Capacitor 8.5.3.

The player runs **Anthropic**, building the **Claude** model family. The game combines the pacing and dopamine of classic clickers (*AdVenture Capitalist*, *Egg Inc.*) with authentic AI dynamics: training sequential foundation models, launching commercial products, hiring engineers and managers, acquiring upgrades, scaling GPU compute clusters, and competing against industry rivals for market share.

---

## 1. Theme & Corporate Identity

- **Player Company**: Anthropic (Claude HQ).
- **Starting Capital**: $10.00.
- **Save File Key**: `modelfoundry.save.v2` (stays on v2 format with safe backward-compatible field defaults for v0.4.0 and v0.5.0).
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
3. **Launch Models**: Launching a model opens the Launch Moment bottom sheet, displaying benchmark score and income multiplier boost with particle bursts, while unlocking higher product tiers and funding rounds.
4. **Deploy Products**: Purchase commercial product levels (Chat App, API, Coding Agent, Enterprise, Voice & Mobile, Gov & Science, Robotics) using `x1`, `x10`, or `Max` buy modes. Hit milestone levels (10, 25, 50, 75, 100, 150, 200, 300, 400) for multiplicative revenue jumps with audio-visual milestone feel.
5. **Hire Managers**: Hire Product Managers to gain a $\times 1.5$ product revenue boost and automated level purchasing (1 lvl/sec when cost $\le 10\%$ cash). Hire the Training Lead (auto-starts training when cost $\le 25\%$ cash) and Launch Lead (auto-launches ready models).
6. **Buy Upgrades**: Purchase permanent product upgrades ($\times 3$ each), global upgrades ($\times 2$ to $\times 5$ all revenue), and training speed upgrades ($\times 1.5$ to $\times 2$ training speed).
7. **Scale Infrastructure**: Hire Engineers, Sales Reps, and AI Researchers; deploy GPU Clusters and construct Infrastructure Buildings.
8. **Compete for Market Share**: Rival labs automatically train and release models on dynamic timers. Relative benchmark scores determine market share, granting a $0.5\times$ to $2.0\times$ revenue multiplier.
9. **Daily Rewards & Away Earnings**: Claim daily login rewards with streak bonuses and Day 7 income multiplier; collect offline earnings capped at 8 hours with free 4-hour cooldown 2x collection.
10. **Dynamic Industry Events**: Handle refreshed random events (Viral Launch, Golden GPU, Investor Visit, Hype Wave, Data Deal, Cloud Outage, Lawsuits, and Talent Poaching).

---

## 3. Revenue & Economy Formulas

### Total Income Per Second
$$\text{Income} = \left(\sum \text{Product Income} \times \text{ManagerMult} \times \text{ProductUpgradeMult}\right) \times \text{ModelMult} \times \text{ShareMult} \times (1 + 0.03 \times \text{Sales}) \times \text{BuildingMult} \times \text{FundingMult} \times \text{GlobalUpgradeMult} \times \text{EventMult}$$

Where $\text{EventMult}$ is the product of active event effects:
- **Viral Launch**: $\times 3.0$
- **Golden GPU Overclock**: $\times 7.0$
- **Day 7 Bonus**: $\times 2.0$
- **Cloud Outage**: $\times 0.5$

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
- Level 100: $\times 3$ (cumulative $\times 48$)
- Level 150: $\times 3$ (cumulative $\times 144$)
- Level 200: $\times 4$ (cumulative $\times 576$)
- Level 300: $\times 4$ (cumulative $\times 2,304$)
- Level 400: $\times 5$ (cumulative $\times 11,520$)

---

## 4. Feel & Juiciness (v0.5.0)

1. **Cash Scale Pop**:
   - Whenever cash increases by $>5\%$ in a single jump, the Treasury cash display executes a 180ms ease scale pop ($1.0 \to 1.06 \to 1.0$).
   - Respects user accessibility: disabled when `Reduce Motion` is toggled on.
2. **Floaters (+X)**:
   - Floating text indicators appear on tap-to-earn, model launch, daily reward claim, and event gains.
   - Strictly positive rewards only (no negative `-$X` floaters on purchases).
   - Rendered at 16px font-weight 800 in `--money` (`#34d399`) or `--gold` (`#fbbf24`), rising 24px and fading over 700ms (`@keyframes floatUp24`).
   - Capped at at most 6 alive simultaneously.
3. **Level-Up Flash & Pop**:
   - Product row level badges flash with an accent background and execute a 200ms scale pop ($1.0 \to 1.25 \to 1.0$) upon level purchase.
4. **Launch Moment Bottom Sheet**:
   - Triggered when launching any trained model.
   - Displays model name (e.g., "Claude 3 Opus Launched"), synthetic benchmark score, and global revenue multiplier boost (e.g., "+x1.6 Income").
   - 12 small flat colored squares burst radially outward and fade over 600ms (`@keyframes burstOut`), accompanied by an affirmative single "OK" button.

---

## 5. Haptics System (v0.5.0)

Integrated using `@capacitor/haptics@8.0.2` with native Android channel fallback and safe execution guards:
- **`tapLight()`**: Throttled to $\le 10$ vibrations per second; triggers on Treasury card taps and training boost taps.
- **`impactMedium()`**: Medium tactile feedback on store and staff purchases (products, engineers, clusters, upgrades, managers).
- **`success()`**: Distinct notification vibration on milestone completions, model launches, daily reward claims, and Golden GPU taps.
- **Settings Toggle**: "Vibration" row in the Settings screen (saved to `GameState.vibrationEnabled`, enabled by default).

---

## 6. Away Earnings (v0.5.0)

- **Simulation Cap**: Offline catch-up is capped at 8 hours (28,800 seconds). Minimum away time to show sheet is 5 seconds.
- **Bottom Sheet Display**:
  - Title: "While you were away"
  - Offline duration formatted cleanly (e.g., `4h 12m`).
  - Cash earned displayed prominently in large `--money` typography (`+$12,450`).
  - Two action buttons:
    - **Collect**: Immediate 1x claim.
    - **Collect x2**: Free 2x claim available once every 4 hours (`lastDoubleAt`). If on cooldown, the button is disabled and displays the remaining cooldown time (e.g., `x2 in 2h 10m`).

---

## 7. Daily Rewards System (v0.5.0)

- **Calendar Date-Based**: Tracks claims against local calendar dates (`YYYY-MM-DD`).
- **7-Day Progression**:
  - Displays 7 day tiles with gift icons in `--gold` styling.
  - Streak continues uninterrupted if claimed on consecutive days; resets to Day 1 if a calendar day is skipped.
  - Cash reward formula:
    $$\text{Reward} = \max\left(\$50, \text{incomePerSec} \times [60, 120, 180, 300, 450, 600, 900][\text{day} - 1]\right)$$
  - **Day 7 Capstone**: Grants $\times 2.0$ total income for 10 minutes (600 seconds) via `day7BonusTimer`.

---

## 8. Refreshed Random Events (v0.5.0)

Rolled every 45 to 90 seconds while the app is active (paused while modal sheets are open), with a 70% chance of a favorable event and a 30% chance of an adverse event:

### Favorable Events (70%):
1. **Viral Launch**: Multiplies all income by $\times 3.0$ for 30 seconds.
2. **Golden GPU**: Spawns a 56px gold `Cpu` tile at a random position on the Lab screen for 8 seconds. Tapping it yields 60 seconds of instant income, or a 1-in-4 chance of an overclock burst granting $\times 7.0$ income for 15 seconds.
3. **Investor Visit**: Grants an immediate angel grant equal to 90 seconds of total income (min $100).
4. **Hype Wave**: Doubles model training speed ($\times 2.0$) for 45 seconds.
5. **Data Deal**: Secures a high-quality pre-training dataset, accelerating the next model training duration by 30%.

### Adverse Events (30%):
1. **Cloud Outage**: Cuts all income by 50% ($\times 0.5$) for 20 seconds. An interactive "Fix now" button in the active effect chip allows clearing the outage immediately for 30 seconds of income.
2. **Copyright Lawsuit**: Choice modal presenting:
   - **Settle**: Pay 2 minutes of current income.
   - **Fight**: Market share penalized to $\times 0.8$ for 2 minutes (`lawsuitPenaltyTimer = 120`).
3. **Talent Poach**: Choice modal presenting:
   - **Counter-offer**: Pay 1 minute of current income to retain the senior engineer.
   - **Let go**: Lose 1 research engineer.

### Active Effects Chips
Active buffs and debuffs render as compact, colored indicator chips under the Claude Treasury card with real-time countdown timers (e.g., `x3 Income · 24s`, `x2 Train Speed · 38s`, `Outage: x0.5 · 14s [Fix now]`).

---

## 9. Audio System

Implemented using pure Web Audio API synthesis (zero external audio asset dependencies):
- **Tap Tone**: High-frequency short sine tick (`playTap`).
- **Purchase Tone**: Soft dual-frequency coin tick (`playPurchase`).
- **Milestone Chime**: Ascending harmonic chord (`playMilestone`).
- **Model Launch**: Bright 4-tone ascending arpeggio (`playLaunch`).
- **Golden GPU**: High-frequency metallic chime (`playGoldenGpu`).
- **Mute Support**: Respects the global sound toggle in TopBar and Settings.

---

## 10. Save System & Backward Compatibility

- **Save Key**: `modelfoundry.save.v2`
- **Backup Key**: `modelfoundry.save.v2.backup`
- **Safe Defaults**: Loading an existing save initializes all v0.5.0 fields with defaults:
  - `vibrationEnabled`: `true`
  - `lastDoubleAt`: `0`
  - `dailyStreak`: `0`
  - `lastDailyClaimDate`: `null`
  - `day7BonusTimer`: `0`
  - `viralLaunchTimer`: `0`
  - `goldenGpuBuffTimer`: `0`
  - `hypeWaveTimer`: `0`
  - `dataDealActive`: `false`
  - `outageTimer`: `0`
  - `lawsuitPenaltyTimer`: `0`

---

## 11. Balance Tuning & Simulation Verification

The balance continues to satisfy all AdVenture Capitalist / Egg Inc. pacing benchmarks as verified by `src/game/simulation.test.ts`:
- **First Purchase**: Second 0 ($\le 1\text{s}$) — **PASS**
- **Max Drought (First 10m)**: 2s ($\le 30\text{s}$) — **PASS**
- **Claude 2 Launch**: 134s ($\le 150\text{s}$, 2m 14s) — **PASS**
- **Claude 3 Opus Launch**: 488s ($\le 720\text{s}$, 8m 08s) — **PASS**
- **30-Minute Milestones**:
  - Hired Managers: 8 ($\ge 3$) — **PASS**
  - Purchased Upgrades: 21 ($\ge 5$) — **PASS**
- **Final Model at 60m**: Claude 9, Step 28 ($\ge 12$) — **PASS**
- **10-Minute Income**: $\$29,510.38/\text{s}$ ($\ge \$50/\text{s}$) — **PASS**
