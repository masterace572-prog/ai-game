# Model Foundry — game design

This is the design for a personal, offline Android idle game. The player runs a small fictional AI lab. They train models, launch them, compete with rival labs for market share, spend the money, and eventually start a "new era" for permanent bonuses.

Read this whole file before changing gameplay. Numbers in the **Balance constants** section are the source of truth. Put them in `src/game/balance.ts` and use them. Do not invent a second set of numbers.

The game is fiction. Do not use real company names, real model names, or real logos. Forbidden words in names and text: OpenAI, ChatGPT, GPT, Claude, Anthropic, Gemini, Google, DeepMind, Meta, Llama, Mistral, Grok, xAI, Microsoft, Copilot, NVIDIA (use "graphics chips" or "GPUs" as a generic word), Android brand logos, Play Store.

Working title: **Model Foundry**. Android package id: `com.modelfoundry.idle`. The player names their own lab. Default name: **Little Lamp Lab**.

## What the player feels

A session is short taps plus waiting.

- The first minute: name the lab, start a Tiny model, watch a bar fill.
- The first few minutes: launch it, see cash tick up, notice four rivals already on the board.
- The next half hour: buy GPUs, hire, raise data quality, train bigger models, react to a random event.
- Overnight: open the app and get a "while you were away" report (capped).
- After a long run: spend era points and start a new era. The lab resets; a few bonuses stay.

The player should always know three things without opening a menu: how much cash they have, how fast it is changing, and what the lab is doing right now.

## Screens

Portrait phone only. Design for a narrow screen (about 360–430 px wide). One thumb, big taps.

Bottom navigation, always visible:

| Tab | Shows |
| --- | --- |
| Lab | Home. Cash, income per second, current training, quick buttons: Train, Launch (if a model is ready), and the latest event. |
| Models | Your finished and in-progress models. Start training from here too. |
| Market | Leaderboard of your lab plus rivals, market-share bar, subscription vs API split. |
| Invest | Data centers, rival stocks, funding rounds. |
| More | Research, Team, Events, Achievements, New Era, Settings. |

Other states, as overlays not extra apps:

- First launch: lab name, then a 6-step tutorial.
- Model finished and not launched yet: a clear "Ready to launch" card.
- Offline return: a summary modal with one Close button.
- Event with a choice: two big buttons.
- Wipe save: must type the word `RESET`.

Empty states must say what to do next ("Train a Tiny model on the Lab tab"), never a blank screen.

## Resources

| Resource | Meaning | Starts at |
| --- | --- | --- |
| Cash | Spendable money | 25000 |
| GPUs | How many training chips you own | 2 |
| Power cap | How many of those GPUs can run at once | 4 |
| Researchers | People. Raise score, cost salary | 1 |
| Data quality | 0 to 100. Raises score | 20 |
| Reputation | 0 to 100. Raises a model's appeal. Decays slowly | 0 |
| Era | How many times you have prestiged, plus one | 1 |
| Era points | Permanent currency, kept across eras | 0 |

Usable GPUs = the smaller of GPUs owned and power cap.

Lifetime stats to store: total cash earned, best score ever (this era and all time), models trained, models launched, best market share, play time.

## Time

- While the app is open and visible, advance the game from a timer of about 4 times a second. Each step uses the real elapsed time, but cap one step at 1 second so a hitch cannot grant minutes.
- When the app is hidden or closed, stop the live timer and save the clock time.
- When it becomes visible again, run **offline catch-up** (below), then start the live timer.
- Do not apply both "uncapped background delta" and offline catch-up. That would pay the player twice.

## Core loop

1. Player picks a model size they have unlocked and can afford.
2. Cash is spent up front. A training job starts. Only one training job at a time.
3. The bar fills over real time. More usable GPUs make it faster, down to a floor.
4. When it finishes, roll a benchmark score and a product name. The model sits in inventory as unlaunched.
5. Player launches it. It becomes your public model if its score is your best launched score, or the player may still launch a weaker one (it does not replace the best). Your **best launched model** is the one that competes.
6. Revenue per second comes from your share of the market versus rivals.
7. Player spends cash on chips, people, data, research, buildings, and stocks.
8. Rivals train and launch on their own.
9. Sometimes an event pops up.
10. Much later, the player can start a new era.

### Temporary stipend (early phases only)

Until rival market revenue exists, the Lab may pay a stipend of `$1` per second so the first build is obviously alive. Name the constant `TEMP_STIPEND_PER_SEC`. Delete it in the phase that adds real market revenue. It must not stack with market revenue.

## Models

Six sizes. A size is available when every unlock rule is true.

| Size | Base score | Base seconds | Cash cost | Min usable GPUs | Min researchers | Also required |
| --- | --- | --- | --- | --- | --- | --- |
| Tiny | 12 | 30 | 500 | 1 | 1 | nothing |
| Small | 28 | 120 | 2500 | 2 | 1 | nothing |
| Medium | 70 | 480 | 12000 | 4 | 2 | at least 1 model launched |
| Large | 160 | 1500 | 60000 | 8 | 4 | at least 1 Medium launched |
| Huge | 360 | 5400 | 250000 | 16 | 8 | Series A funding taken |
| Frontier | 800 | 21600 | 1000000 | 32 | 12 | Series B taken AND research node `agent-harness` owned |

### Score

When training finishes, roll once and store the score. Do not reroll it later.

```
quality = 0.65 + 0.35 * (dataQuality / 100)
talent = 1 + min(0.50, researchers * 0.03)
arch = researchScoreMultiplier          # starts at 1
eraBonus = 1 + eraPoints * 0.02
achievementScoreBonus                   # starts at 1, see achievements
roll = random from 0.92 to 1.08 inclusive
score = max(1, round(baseScore * quality * talent * arch * eraBonus * achievementScoreBonus * roll))
```

Show the player an expected range before they confirm (same formula with roll 0.92 and 1.08).

### Training time

```
usable = min(gpusOwned, powerCap)
speed = 1 + (usable - 1) * 0.08
seconds = baseSeconds / speed
seconds = max(seconds, baseSeconds * 0.20)
```

Then apply research and achievement time multipliers (they can go below that floor; the floor is only for GPU speed).

### Names

Pick `adjective + noun` from the lists below. Do not repeat a name you already used this era. If you run out, add a number ("Quiet Lantern 2").

Adjectives: Quiet, Amber, Brisk, Little, Copper, Velvet, Paper, North, Kind, Rapid, Soft, Bold, Glass, Lucky, Drift, Moss, Bright, Plain, Silver, Warm.

Nouns: Lantern, Sparrow, Kettle, Harbor, Notebook, Orbit, Meadow, Anvil, Comet, Basket, Lighthouse, Marble, Willow, Pocket, Echo, Furnace, Sail, Pebble, Chorus, Atlas.

### Freshness and appeal

A launched model's freshness starts at `1`. Every real minute it loses `0.015`, but it never goes below `0.40`. Unlaunched models have no appeal.

```
appeal = score * freshness * (1 + reputation / 250) * hypeMultiplier
```

`hypeMultiplier` is `1` unless an event or marketing campaign says otherwise. Reputation decays by `0.2` per real minute, never below 0, never above 100. Launching adds reputation: `+2 + score / 50`, still capped at 100.

## Rivals

Four labs in era 1. They are not the player. They do not use the player's cash.

| Lab | Style | Starting best score | Starting stock price |
| --- | --- | --- | --- |
| Helix Atelier | Balanced, slightly ahead | 18 | 120 |
| Pebble Mind | Many small models | 9 | 40 |
| Northglass | Slow, larger models | 14 | 80 |
| Vesper Workshop | Hype, average models | 11 | 55 |

Each rival acts on a timer (see balance constants). When the timer fires and they are not "training":

- They pick a size their style prefers and that their imaginary budget can afford.
- They "train" for a shortened time (they are NPCs, not a second full simulation): Tiny 20s, Small 45s, Medium 90s, Large 180s, Huge 300s, Frontier 600s, times their style speed.
- When done, they set their best score if the new score is higher. New score = their current best * a growth factor, plus a small flat bonus, with a little randomness. Cap a single NPC jump at +40% of their current best.
- Their public freshness resets to 1 when they launch.

Styles:

- Helix: prefers the biggest size their era allows, speed 1.0, growth 1.08.
- Pebble: prefers Tiny or Small, speed 0.7, growth 1.04, launches more often.
- Northglass: prefers Medium or Large, speed 1.4, growth 1.12.
- Vesper: prefers Small or Medium, speed 1.0, growth 1.05, plus a hype multiplier of 1.15 on appeal.

From era 2 onward, add two more labs at the start of the era: **Copperline** (score 30 * era, stock 100) and **Bracket Research** (score 36 * era, stock 110). Older rivals' starting scores are multiplied by `1 + 0.15 * (era - 1)` at each new era.

If a lab has never launched, treat its appeal as its starting score (so the market is never empty).

## Money

### Market revenue

```
yourAppeal = appeal of your best launched model, or 0 if you have none
totalAppeal = yourAppeal + sum of each rival's current appeal
share = yourAppeal / totalAppeal          # 0 if total is 0
demand = 6 * (1.55 ^ (era - 1))
revenuePerSec = demand * share * marketingRevenueMultiplier * achievementRevenueBonus * fundingDoesNotChangeThis
```

Show share as a percent. Split the same money for flavor, do not pay it twice: **65% subscriptions**, **35% API**.

Marketing revenue multiplier starts at `1`. The Brand studio research node sets it to `1.10`. It multiplies with event hype, it does not replace it.

### Salaries and upkeep

Every second, subtract:

```
salaries = 0.15 * researchers * salaryMultiplier
dataCenterUpkeep = 0.20 * dataCentersOwned
```

`salaryMultiplier` starts at `1`. Funding rounds and the Office snacks upgrade change it. Cash may hit `0` but must not go negative. If the player cannot pay, pause salary debt (do not stack debt) and show "Payroll is tight" until cash is above 0. Training already in progress keeps going.

### Shop prices

Next GPU:

```
cost = round(3500 * (1.12 ^ gpusOwned))
```

Buying one GPU adds 1 GPU. There is no GPU sell.

Next researcher:

```
cost = round(8000 * (1.18 ^ researchers))
```

Hiring adds 1 researcher immediately.

Data upgrade: `+2` data quality, max 100.

```
cost = round(400 * (1.09 ^ dataQuality))
```

Cooling upgrade: `+2` power cap, max 5 purchases.

```
cost = 7000 * (1 + coolingPurchases) 
```

Use that linear price, not an exponent.

Office snacks: one purchase, cost `5000`, multiplies salary by `0.95`.

Marketing campaign: cost `2000`, sets hype multiplier to `1.25` for 180 seconds, then back to `1` (unless an event is also adding hype; take the higher one, do not multiply campaigns). Cooldown 180 seconds after it ends.

## Investing

### Data centers

Four purchases, in order, one each:

| # | Cost | Power cap added | Score multiplier added |
| --- | --- | --- | --- |
| 1 | 20000 | +6 | +0.02 |
| 2 | 50000 | +10 | +0.02 |
| 3 | 120000 | +16 | +0.02 |
| 4 | 300000 | +24 | +0.02 |

Score multipliers from data centers multiply into `arch` together with research (a +0.02 node means multiply score by 1.02). Upkeep is above.

### Stocks

The player may buy or sell whole shares in the four era-1 rivals. Cap **200 shares** of each. Price is recalculated every 30 seconds:

```
price = max(10, round(rivalBestScore * 3 + 20))
```

Buy spends `price` per share. Sell pays `price * 0.98` per share (2% fee). Stocks do not change the rival. Stocks are wiped in a new era. Copperline and Bracket are not publicly traded.

### Funding

Each round can be taken once per era. They reset on a new era.

| Round | Cash now | Salary multiplier | Unlocks | Requires |
| --- | --- | --- | --- | --- |
| Seed | +40000 | ×1.10 | nothing | nothing |
| Series A | +180000 | ×1.15 more | Huge models | best launched score this era ≥ 80 |
| Series B | +750000 | ×1.20 more | Frontier, with research | best launched score this era ≥ 220 |

Apply salary multipliers by multiplying the current salary multiplier.

## Research

Eight nodes. Each can be bought once per era and is lost on a new era (bonuses come back only if bought again). Era points do not buy these directly.

| Id | Name | Cost | Effect | Requires |
| --- | --- | --- | --- | --- |
| clean-data | Clean data pipeline | 3000 | data quality +5, once | none |
| optimizers | Better optimizers | 8000 | score ×1.08 | none |
| cheap-flops | Cheap flops | 10000 | training time ×0.90 | none |
| recruiter | Recruiter | 12000 | hire cost ×0.85 | none |
| brand | Brand studio | 15000 | revenue ×1.10 | none |
| mixture | Mixture kernels | 25000 | score ×1.12 | optimizers |
| reasoning | Reasoning traces | 80000 | score ×1.15 | mixture |
| agent-harness | Agent harness | 200000 | score ×1.15, required for Frontier | reasoning |

`researchScoreMultiplier` is the product of owned score nodes (1.08, 1.12, 1.15, 1.15). Start at 1.

## Team screen

The Team screen is the place to hire researchers, buy GPUs, buy cooling, and buy office snacks. Show current salaries per second, usable GPUs, and power cap. Do not hide hiring only inside Invest.

## Events

Roll an event check every 60 real seconds. 25% chance to fire if no event is already open and the cooldown has passed. Cooldown after any event: 90 seconds. Do not fire events during the tutorial. Offline catch-up may fire at most **3** events for the whole away period, and it auto-picks the first choice if the player is away.

Each event lasts 180 seconds unless it says otherwise. Show a short title, one sentence, and buttons.

| Id | Title | What happens |
| --- | --- | --- |
| hype | Hype wave | For 180s, hype multiplier at least 1.25. Reputation +8. |
| outage | Chip outage | For 180s, usable GPUs count as half, rounded down, minimum 1. |
| rules | Draft rules | For 180s, revenue ×0.80. No funding buttons during that time. |
| viral | Viral demo | Cash bonus = 20 × current revenue per second × 30. Reputation +10. One-shot. |
| leak | Data leak | Data quality −5 (min 0). Reputation −8 (min 0). |
| poach | Recruiter calls | Choice: pay 5000 cash to keep the team, or if you have 2+ researchers lose 1. If you have 1 researcher or cannot pay, nothing is lost and the text says they stayed. |
| brownout | Brownout | Power cap −2 for 180s (minimum 1). |
| surprise | Surprise benchmark | Your best launched model's score this era changes by ±8% (50/50). It can be the new stored score. |
| investor | Investor visit | If reputation ≥ 20, choice: take +15000 cash and salary ×1.05, or decline. If reputation is lower, flavor text only. |
| stumble | Rival stumble | A random rival's appeal ×0.50 for 180s. |
| dataset | Community dataset | Data quality +4 (max 100). |
| quiet | Quiet week | Cash +500. Flavor only. |

## Achievements

Stored forever, including across eras. Pop a small toast when one unlocks. Each bonus multiplies into the matching stat. Start bonuses at 1.

| Id | Name | Rule | Bonus |
| --- | --- | --- | --- |
| first-spark | First spark | Finish training 1 model | score ×1.01 |
| on-the-board | On the board | Launch 1 model | revenue ×1.01 |
| pocket-lab | Pocket lab | Own 5 GPUs | none (badge) |
| full-house | Full house | Have 5 researchers | none |
| data-hoarder | Data hoarder | Data quality ≥ 60 | none |
| upset | Upset | Your best score > Helix Atelier's best score | revenue ×1.01 |
| market-leader | Market leader | Share ≥ 40% at any moment | revenue ×1.02 |
| millionaire | Millionaire | Cash on hand ≥ 1000000 | none |
| public-company | Funded | Take Series A | none |
| night-shift | Night shift | Return from at least 1 hour offline | none |
| new-era | New era | Prestige once | score ×1.01 |
| frontier | Frontier light | Launch a Frontier model | revenue ×1.02 |

## New era (prestige)

Show the New Era button only when, this era, best launched score ≥ 250 **or** lifetime cash earned ≥ 2000000. Explain clearly what is lost and what is kept. Ask the player to tap twice.

Era points gained this reset:

```
gained = max(1, floor(bestLaunchedScore / 80) + floor(lifetimeCashEarned / 1000000))
```

Add `gained` to era points, then set era to era+1.

**Reset:** cash, GPUs, power cap, researchers, data quality, reputation, models, training job, rivals (re-seed for the new era), stocks, funding rounds, research nodes, data centers, cooling, office snacks, marketing state, hype, current events.

**Keep:** era, era points, achievements and their bonuses, all-time best score, the lab name, settings, lifetime "times prestiged".

Set a fresh run's starting resources to the normal start values (cash 25000, 2 GPUs, and so on). Then apply era score bonus from total era points as already in the score formula.

## Offline catch-up

On resume:

```
away = now - lastSavedClock
simulated = min(away, 8 hours)
```

If `away` is under 5 seconds, skip the modal and just resume.

Simulate `simulated` time in **30-second steps** (not 1-second steps) so a phone does not freeze. Scale per-second money and salary by 30. Training progress adds 30 seconds of training-time each step (GPU speed already baked into the training duration). Rival timers and freshness use the same 30 seconds. Event checks: at most 3 auto-resolved events for the whole catch-up, not every step.

Then show a modal:

- How long was simulated, and if the 8 hour cap cut it short, say the real away time too.
- Cash gained minus salaries (net).
- Models that finished.
- Rivals who launched (names only).
- Events that auto-resolved.

The Night-shift achievement uses the real away time, not the cap.

## Save / load

- Key: `modelfoundry.save.v1` in `localStorage` only.
- Save at least every 5 seconds, and immediately when the app hides, when a model finishes, and when the player buys something.
- JSON with `version: 1`, `savedAt` (unix ms), and the full game state.
- If JSON is corrupt, keep the backup key `modelfoundry.save.backup` if it parses; otherwise start a new game and tell the player.
- Before overwriting the main key, copy the previous main value to the backup key.
- Settings screen: **Export** shows the JSON in a text box the player can copy. **Import** pastes JSON, checks `version`, then replaces the save. **Wipe** requires the word `RESET`.
- No accounts, no cloud, no network.

## Tutorial

Six steps, only on a brand new save. Skip button always visible.

1. Welcome. Confirm the lab name.
2. Point at Train. Ask them to start Tiny.
3. Explain the bar. Wait until it is at least 10% or they tap Next.
4. When it finishes, ask them to Launch. If they tap Next early, allow it.
5. Open the Market tab in the tutorial and point at the leaderboard.
6. Point at Team (inside More, or a shortcut) and tell them the next good buy is a GPU. Then mark the tutorial done.

## UI style

Dark lab, not a spreadsheet.

- Background `#0c1222`, cards `#172036`, text `#f4f1ea`, muted text `#9aa6bd`.
- Cash and positive numbers `#3ddc97`. Accent buttons `#f5b942` with dark text `#1a1408`. Danger `#ff6b6b`. Rivals and links `#7aa2ff`.
- Corners 16 px on cards, 12 px on buttons. Card padding 16 px. Gap 12 px.
- Font: `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`. No downloaded fonts.
- Smallest text 14 px. Titles 22–28 px. The cash number is the largest text on the Lab screen.
- Every tappable control is at least 48 px tall and has a visible label, not only an icon.
- Bottom nav labels: Lab, Models, Market, Invest, More.
- Format big numbers: 999 as `999`, then `1.2K`, `3.4M`, `2.1B`. One decimal is enough. Cash on buttons shows the full cost if it is under 100000, otherwise the short form.
- Icons: emoji from a local map in code, not an icon font, not a CDN. Suggested: Lab 🏭, Models 🧠, Market 📊, Invest 💹, More ☰, Research 🔬, Team 👥, Events 🎲, Achievements 🏆, Era 🌌, Settings ⚙️, GPU 🖥️, Data 📚, Train ▶️, Launch 🚀.
- Motion: 150 ms fades, a soft pulse on the training bar. If the player turns on Reduce motion in Settings, stop pulses and use instant transitions.
- Sound: tiny tones made with the Web Audio API (no audio files). A tap tick, a higher tone on launch, a soft chord when an event appears. A mute toggle in the top bar, remembered in the save. Default **sound on**.

## Settings

- Sound on/off
- Reduce motion on/off
- Number test is not needed
- Export, import, wipe
- A line of text: version number of the app, and "Offline game. Not a real company."

## Out of scope

Do not add accounts, ads, payments, analytics, real AI API calls, multiplayer, chat, iOS, or Play Store signing. Do not add new model sizes or a second prestige layer unless a later prompt asks. Debug-signed APK only.

## Definition of done for a full game

A stranger can install the APK, turn on airplane mode, name a lab, train and launch a model, see rivals and cash move, buy a GPU, survive an event, close the app for several minutes, reopen it to an offline report, and still have their save.
