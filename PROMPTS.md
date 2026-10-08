# Prompts to paste into Arena Agent Mode

Use **one** Agent Mode chat for the whole game (https://arena.ai/agent, GitHub turned on, this repo selected).

Paste these **one at a time**, in order, into that same chat. Wait until the agent says it pushed, and until the **Build Android APK** check is green, before you paste the next one.

Do not merge to `main` between prompts. Each push to the agent's branch builds an APK and puts it on **Releases**. The top release is the newest. A Pre-release label just means the branch is not `main`.

If Arena will not push without a pull request, it may open one draft PR. Leave that draft open and keep chatting. Do not merge it.

The last prompt in this file is optional. Use it only when you want everything copied onto `main`.

---

## Prompt 1 — Project setup and the first installable APK

```
Read GAME_DESIGN.md and AGENT_RULES.md in the repo root before you write any code. Follow them exactly.

Build phase 1 only: a project skeleton and a working debug APK. Do not build the real game loop yet.

Do not delete GAME_DESIGN.md, AGENT_RULES.md, PROMPTS.md, START_HERE.md, or .github/workflows/build-apk.yml. Do not rewrite the workflow file.

Create a Vite 7 + React 19 + TypeScript app in this repo (the markdown files are already here, so do not run a command that refuses a non-empty folder and do not wipe the folder). Use npm. Capacitor must be exactly 8.5.3: @capacitor/core, @capacitor/cli, and @capacitor/android. Add Vitest.

package.json scripts must be:
- "dev": "vite"
- "build": "tsc --noEmit && vite build"
- "test": "vitest run"

App id com.modelfoundry.idle. App name Model Foundry. capacitor.config.ts webDir is dist. Do not set server.url.

The phone screen, portrait, shows:
- Title "Model Foundry"
- One sentence: "Your AI lab. Offline."
- The lab name "Little Lamp Lab"
- A version string "0.1.0"
Use the colors in GAME_DESIGN.md. No network calls. No Google Fonts. No extra screens yet.

Create src/game/balance.ts with the starting numbers and tables from GAME_DESIGN.md (cash 25000, GPU price formula inputs, model sizes, rival start scores, offline cap of 8 hours, save key modelfoundry.save.v1). Add a Vitest test that checks: starting cash is 25000, Tiny base score is 12, Tiny base time is 30 seconds, offline cap is 8 hours, and the next GPU price with 2 GPUs owned is round(3500 * (1.12 ** 2)).

Add a .gitignore that ignores node_modules, dist, android/local.properties, android/.gradle, android/app/build, android/build, and any APK. Do not ignore the Gradle wrapper.

Run npx cap add android. Then delete android/local.properties if it exists. Commit the whole android folder, including gradlew and gradle/wrapper/gradle-wrapper.jar.

Run npm test and npm run build and npx cap sync android. Fix anything that fails.

Stay on the branch you were assigned at the start of this chat. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If you cannot push without a pull request, open one draft pull request into main and keep pushing to that same branch. Do not merge it and do not open a second one.

Done when npm test and npm run build pass and the push is on that branch. Reply with the branch name, the short commit id, and that this APK shows the Model Foundry title screen.
```

What you check: do not merge. Wait for the green Actions check, then on your phone open **Releases** and install the **top** one (see START_HERE.md). You should see the title Model Foundry and version 0.1.0. Turn on airplane mode and reopen the app. It should still open. If the build is red, paste the bug-fix prompt in this same chat.

---

## Prompt 2 — Core loop skeleton

```
Read GAME_DESIGN.md and AGENT_RULES.md before coding. Follow them. This is phase 2 only.

Do not rewrite .github/workflows/build-apk.yml. Do not add rivals, stocks, research, events, prestige, or offline catch-up yet. Keep npm test and npm run build passing. Keep Capacitor on 8.5.3 with no server.url.

Build a portrait shell with a top bar (lab name, cash, income per second) and bottom nav: Lab, Models, Market, Invest, More. Tabs other than Lab can say "Not built yet" in the words of the design. Touch targets at least 48px. Colors and emoji icons from the design. No horizontal scrolling. No network.

On a new game, ask the player to name the lab (default Little Lamp Lab) and store it.

Live timer: about 4 ticks a second while the page is visible. Cap one tick at 1 second. When the page hides, stop the timer and save. When it shows, just resume (offline earnings come in a later phase). Do not grant huge catch-up yet.

Lab tab:
- Cash starts at the balance.ts value.
- Temporary stipend TEMP_STIPEND_PER_SEC of $1 per second, labeled "Stipend (temporary)" so we can see the number move. Real market income replaces this later.
- Button to train a Tiny model only. It costs the design's Tiny cash cost, takes the design's Tiny seconds (GPU speed formula may already apply), and shows a progress bar.
- When training finishes, show the rolled score and a generated name from the design's word lists, and a Launch button. Launching marks it as your best launched model. For now, income stays the stipend only.
- Only one training job at a time.

Save the full state to localStorage key modelfoundry.save.v1 every 5 seconds and on hide, with the backup key from the design. Reloading the page restores cash, the lab name, and a training job in progress.

Put score rolls, GPU time, and prices in src/game/logic.ts using balance.ts. Unit test the Tiny training-time formula and that a save round-trip keeps cash and lab name (save helpers can be tested without a browser if you pass a fake storage object).

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request was already opened because pushing required it, push to that same branch and do not open another. Reply with the branch name, the short commit id, and what to tap on the phone.
```

What you check: wait for the green check, install the top Release over the old app, name the lab, tap Train, watch the bar, tap Launch. Force-close the app and reopen. The lab name and cash should still be there. Cash should creep up from the stipend.

---

## Prompt 3 — Models

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 3 only: the full model system. Do not add rivals yet. Do not change the GitHub workflow. Keep tests and the production build green. No network calls.

Replace the Tiny-only trainer with all six sizes from the design. Locked sizes show why they are locked (need a launch, need Medium, need Series A, need Series B plus research). Series A, Series B, and the agent-harness research node do not exist yet, so Huge and Frontier stay locked, but the lock text must be correct.

Use the design formulas for cost, training time, score (quality, talent, arch, era, achievement bonus, roll 0.92–1.08), expected range before confirm, and product names. Store the roll result. Do not reroll after training.

Models screen: list in-progress, ready-to-launch, and launched models with size, score, and name. Launch a finished model. The best launched score is what the lab is proud of. Show it on the Lab tab.

Until rivals exist, placeholder income (not stacked with the stipend): if you have a launched model, income per second is score * 0.15 and the stipend is OFF. If you have no launched model, the $1 stipend stays ON. Label placeholder income "Preview income" so the next phase can remove it.

Add Vitest tests for: score at known inputs with a fixed roll, the 20% GPU time floor, Medium locked before any launch, and preview income equals score * 0.15.

Save/load must keep the model list. Portrait UI, 48px buttons, design colors.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists from earlier, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: train Tiny, launch it, see preview income that is not the old $1 stipend. Start a Small model if you can afford it. Reload the app and see the same models. Huge should say it needs Series A.

---

## Prompt 4 — Rivals and real revenue

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 4: rivals, market share, and real revenue. Remove TEMP_STIPEND and "Preview income" completely. Do not change the workflow. Tests and build must pass. No network.

Add the four era-1 rivals from the design (Helix Atelier, Pebble Mind, Northglass, Vesper Workshop) with their starting scores, styles, NPC training times, growth caps, and Vesper's 1.15 hype. They train and launch on their own timers while the game is open. Freshness falls by 0.015 per real minute, floor 0.40, and resets to 1 when that lab launches.

Market screen: leaderboard, your share as a percent, a bar, and a 65% subscription / 35% API split of the SAME money (do not pay twice). Revenue formula from the design: demand = 6 * (1.55 ** (era - 1)), share = your appeal / total appeal.

Appeal uses score, freshness, reputation, and hype. Reputation +2 + score/50 on your launch, cap 100, decay 0.2 per minute.

Lab top bar shows this real income per second, and salaries are not in yet so do not subtract upkeep yet.

Unit test: with fixed appeals, share and revenue match a hand-computed example you write in the test. Test freshness floor. Test that stipend constants are gone (no income when the player has not launched and you set rival appeal to a positive number... player appeal 0 means $0).

Save rivals in the save file. Portrait UI. Stub tabs stay honest.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: Market shows four rivals and your lab. Launching a model makes cash rise faster or slower depending on share. Leave the app open a couple of minutes and at least one rival's score or freshness should change. Airplane mode still works.

---

## Prompt 5 — Spending, salaries, and investing

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 5: the economy. Do not change the workflow. No network. Tests and build stay green.

Team screen (from More, and a shortcut on Lab is fine): buy GPUs, hire researchers, buy cooling, buy office snacks. Prices and effects exactly from the design. Usable GPUs = min(owned, power cap). Training time uses usable GPUs.

Subtract salaries (0.15 * researchers * salary multiplier) and data-center upkeep every second. Cash never goes below 0. If they cannot pay, show "Payroll is tight" and do not stack debt.

Data quality upgrades on Team or Lab: +2 quality, price from the design, cap 100.

Invest tab:
- Four data centers, in order, costs and power and score bonuses from the design.
- Stocks for the four era-1 rivals only. Price = max(10, round(score * 3 + 20)) every 30 seconds. Buy at price, sell at 98%, cap 200 shares each.
- Funding: Seed, Series A, Series B with the design's cash, salary multipliers, score gates, and unlocks. Taking Series A unlocks Huge. Do not unlock Frontier until Series B AND the research node exists (research is next phase, so Frontier stays locked but Series B can be taken).

Marketing campaign button: $2000, hype at least 1.25 for 180s, cooldown 180s after it ends. Use the higher hype, do not stack two campaigns.

Unit test GPU price, hire price, salary drain for 10 seconds, stock sell fee, and Series A locked at score 79 and open at 80.

Save all of this. Portrait, 48px targets.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: hire nobody you cannot afford. Buy one GPU and see the price go up. If you launch a decent model, salary should not instantly bankrupt you. Series A stays locked until your best score is at least 80.

---

## Prompt 6 — Research and upgrades

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 6: research tree and the remaining unlocks. Do not change the workflow. No network. Tests and build stay green.

More → Research: the eight nodes from the design, with costs, requirements, and effects. Owned score nodes multiply researchScoreMultiplier. Clean data adds +5 quality once. Cheap flops multiplies training time by 0.90. Recruiter multiplies hire cost by 0.85. Brand studio multiplies revenue by 1.10. Show a locked node's requirement in plain words.

Frontier size unlocks only when Series B is taken AND agent-harness is owned, and the GPU and researcher minimums are met. Huge still needs Series A plus the minimums.

Wire data-center score bonuses into the same score multiplier path. Recompute the expected score range using the new multipliers.

Do not add events or prestige yet. Keep Invest and Team working.

Unit test: optimizers then mixture apply 1.08 * 1.12, mixture cannot be bought first, brand studio multiplies revenue by 1.10, Frontier stays locked with Series B but no agent-harness.

Save research. Portrait UI, cards not a tiny tree you cannot tap.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: buy "Better optimizers" if you have the cash, train a new model, and see a higher expected score than before. Frontier still explains what it needs.

---

## Prompt 7 — Events, achievements, and tutorial

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 7: events, achievements, and the tutorial. Do not change the workflow. No network. Tests and build stay green. Do not add prestige or the long offline simulator yet.

Events: every 60 seconds, 25% chance if none is open and the 90 second cooldown is clear. All 12 events from the design, with their durations and choices. A choice uses two big buttons. Offline play is not in this phase, so events only happen while the app is open. No events during the tutorial.

Achievements: the 12 in the design, kept in the save, toast when one unlocks, bonuses actually applied to score or revenue. Badges with no bonus still show as earned.

Tutorial on a brand-new save only, six steps from the design, Skip always visible. Existing saves are not forced back into the tutorial.

Event log under More → Events, newest first, last 30 is enough.

Unit test: poach does nothing harmful with 1 researcher; viral cash uses the formula; market-leader bonus is 1.02 only after the rule is met; an event does not fire when the cooldown is active (pure function is fine).

Portrait UI. Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: wipe is not required if you still have a save; if you want the tutorial, use Settings only if wipe exists, otherwise the tutorial can wait until the save phase. You should still get a toast or a log line when an event fires if you leave the app open a few minutes. Earn "First spark" if you have not already... if your old save already trained a model, the achievement should unlock when the new version loads.

---

## Prompt 8 — Look, icons, motion, and sound

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 8 is polish only. Do not change formulas, prices, or the workflow unless a formula is displayed wrong. Tests and build stay green. No network. No downloaded fonts, images, or sounds.

Polish every screen so it feels like one game:
- Design colors, 16px card corners, 14px minimum text, cash is the biggest number on Lab.
- Emoji icons from a single local map, including bottom nav.
- Empty states tell the player what to tap next.
- Short number format (1.2K, 3.4M, 2.1B) everywhere except small exact prices under 100000.
- 150ms transitions and a soft training-bar pulse. Settings gets Reduce motion, which turns those off.
- Web Audio beeps only (no audio files): quiet tap, brighter launch, soft event. Mute button on the top bar, saved, default sound on.
- Top bar still readable on a 360px-wide screen. No overlap, no horizontal scroll.
- Version text on Settings, plus "Offline game. Not a real company."

Do not add new gameplay. Fix any button under 48px tall that you touch.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: install the APK and tap through Lab, Models, Market, Invest, and More. Text should be readable. Mute should stop sounds. Turn on airplane mode and play for a minute.

---

## Prompt 9 — Offline earnings, backup, and new era

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 9: offline catch-up, export/import, and new era. Do not change the workflow. No network. Tests and build stay green.

When the app hides, save the clock. When it shows, if away time is under 5 seconds, just resume. Otherwise simulate min(away, 8 hours) in 30-second steps: money, salaries, training progress, rival timers, freshness. At most 3 events for the whole away period, auto-picking the first choice. Then show a modal: time simulated, if the cap cut a longer absence, net cash, models finished, rivals who launched, events resolved. The Night-shift achievement uses real away time.

Do not also add an uncapped live-timer delta. No double pay.

Settings: Export save (JSON in a text box), Import (must be version 1), Wipe (player must type RESET). Backup key behavior from the design.

New Era screen: button only if best launched score this era is at least 250 OR lifetime cash earned is at least 2000000. Explain what is lost and kept. Two-tap confirm. Era points formula from the design. Reset and keep lists from the design. Era 2+ adds Copperline and Bracket Research and scales old rivals' starting scores. Era points change future scores by the design formula. Research and stocks reset as specified.

Unit test: 10 hours away simulates 8 hours; 3 seconds away does not open a payout; era points for score 250 and cash earned 2000000 match the formula; a reset clears cash to 25000 and keeps era points.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: note your cash, close the app for 2 minutes, reopen. A report should show a small amount of time, not 8 hours. Export the save text somewhere safe (a note on your phone), wipe by typing RESET, then import and see the old lab return. Do not start a new era unless you want to.

---

## Prompt 10 — Balance pass

```
Read GAME_DESIGN.md and AGENT_RULES.md. Phase 10: a balance pass only. Do not add features. Do not change the workflow. No network.

Add a Vitest simulation that runs a "decent player" for 30 real minutes of game time using 1-second steps (this test can loop; it must finish in a few seconds):
- Starts a new game.
- Always trains the best size they can afford and have unlocked.
- Launches when training finishes.
- Buys a GPU when they can afford it and have under 8.
- Hires when they can afford it and have under 4 researchers.
- Buys the cheapest research they can afford.
Rivals run with the normal rules.

Print or assert these outcomes, and then adjust ONLY numbers inside src/game/balance.ts if a target is missed. You may change costs, speeds, and demand by up to 30% from the design values. Do not change the shape of formulas. Write the old and new numbers in your reply.

Targets for that 30-minute auto player:
- Still has cash above 0.
- Has launched at least 3 models.
- Has a market share between 10% and 70% at the end (not a total wipe, not a total monopoly).
- Can afford a GPU at least once.
- Has not already unlocked Frontier.

If the sim is already inside the targets, do not change numbers. Say so in your reply.

Keep the UI showing whatever the constants are. Tests and build must pass.

Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name and the short commit id.
```

What you check: play for a few minutes. Tiny should still finish in well under a minute. You should earn enough to buy something if you launch. If the game feels stuck at $0, use the bug-fix prompt and say "I cannot afford anything after launching a Tiny model."

---

## Prompt 11 — Bug-fix template

Copy this, then paste the error or describe what you saw under the last line.

```
Read GAME_DESIGN.md and AGENT_RULES.md. This is a bug fix, not a new feature.

Do not change gameplay numbers unless the bug is that the game ignores those numbers. Do not remove tests to go green. Do not delete .github/workflows/build-apk.yml. Keep Capacitor 8.5.3 and no server.url. No network calls.

The game should stay offline, portrait, and saved in localStorage.

Here is the problem (build log or what happened on my phone):

PASTE THE RED ERROR TEXT OR WHAT YOU SAW HERE

Find the cause, fix it, and add a test if it is a logic bug. Run npm test and npm run build. Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name, the short commit id, what was broken, and how you know it is fixed.
```

What you check: if it was a red GitHub build, the new run is green and a new Release is at the top. Install that APK. If it was a phone bug, repeat the same taps and confirm the bad behavior is gone.

---

## Prompt 12 — Add a new feature template

Copy this and replace the last lines with one feature. Examples you can type: "a daily goal with a small cash reward", "a second lab cosmetic color", "a news ticker of rival launches". Ask for one thing at a time.

```
Read GAME_DESIGN.md and AGENT_RULES.md. Add ONE feature. Do not redesign the game. Do not change the GitHub workflow. Do not upgrade Capacitor. No network calls. The game must stay fully offline, portrait, touch-friendly, and saved in localStorage under the same save key. Bump the save version only if you must, and keep old saves loading.

Feature to add:

DESCRIBE ONE FEATURE IN A FEW SENTENCES HERE

Match the existing colors, emoji icons, and 48px buttons. Put new math in src/game and unit test it. Run npm test and npm run build. Stay on the branch you were assigned. Commit and push to that same branch. Do not open a pull request. Do not merge to main unless I ask. If a draft pull request already exists, keep pushing to that branch and do not open another. Reply with the branch name, the short commit id, and what to tap on the phone to see the feature.
```

What you check: install the new top Release and try only that feature. Your old progress should still be there unless the prompt said it was a new era.

---

## Prompt 13 — Optional: put the game on main

Use this only when you are happy with the game and want `main` to match the branch you have been playing. Paste it in the **same** chat.

```
I want this on main now.

Open one pull request from the branch you have been pushing into main. If a draft pull request is already open, mark it ready; do not open a second one. The PR description, in plain English, should say what the game is and that it is a personal offline debug build.

Do not merge it yourself. Do not force-push main. Do not start a new branch. Leave the working branch as it is.

Reply with the pull request link.
```

What you check: on GitHub, open that pull request and click the green **Merge pull request** button. Actions will build `main` and add another Release. That one is not marked Pre-release. Install the top Release if you want the copy from `main`. The game is the same one you were already playing.
