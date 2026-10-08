# Rules for the coding agent

You are building **Model Foundry**, a personal offline Android idle game, for a person who does not write code. They install a debug APK on their phone. Follow these rules every time, even if a later message is vague.

## Read first

Before editing, read `GAME_DESIGN.md` and this file. If they disagree with a chat message, follow the chat message for *what to build next*, and follow `GAME_DESIGN.md` for numbers and rules. Do not ask the user a list of questions. Pick the simplest option that matches the design and keep going.

## Stack (do not switch)

- Web app: **Vite 7** + **TypeScript** + **React 19**.
- Phone wrapper: **Capacitor 8.5.3** exactly (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`). Do not upgrade to Capacitor 9 or a nightly build.
- Tests: **Vitest**.
- Package manager: **npm** only. Commit `package-lock.json`. No pnpm, yarn, bun, or Expo.
- Node on the build server is **22**. Java is **21**. Do not require a newer Node.
- The Android project lives in `android/` and is committed. Package id `com.modelfoundry.idle`. App name `Model Foundry`.
- Portrait only.

Why this stack: the game is a web page, and GitHub Actions already knows how to build a web page and a debug APK. You do not need a game engine.

## Folder layout

```
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json
capacitor.config.ts
GAME_DESIGN.md
AGENT_RULES.md
src/main.tsx
src/App.tsx
src/styles.css
src/game/balance.ts      # numbers copied from GAME_DESIGN.md
src/game/types.ts
src/game/logic.ts        # pure functions: score, prices, revenue, one sim step
src/game/save.ts
src/ui/            # React screens
public/            # local images only, if you truly need any
android/           # Capacitor project, committed
.github/workflows/build-apk.yml
```

You may add files under `src/`. Do not rename `balance.ts` or `logic.ts` after they exist. Gameplay math must live in `src/game/` and must not read the DOM, `window`, or `localStorage`. The React UI calls those functions.

## Build commands that must keep working

`package.json` scripts:

- `"dev": "vite"`
- `"build": "tsc --noEmit && vite build"`
- `"test": "vitest run"`

After every phase:

1. `npm test` passes.
2. `npm run build` passes and writes `dist/`.
3. Do not delete or rewrite `.github/workflows/build-apk.yml` unless the prompt says the workflow file itself is broken. If you must edit it, keep the trigger on every branch (`branches: ["**"]`), Node 22, Java 21, `assembleDebug`, the artifact upload, and a GitHub Release on every successful push. Do not add a `pull_request` trigger.
4. Commit the lockfile and the `android/` project, including `android/gradlew` and `android/gradle/wrapper/gradle-wrapper.jar`.

## Capacitor rules

- `capacitor.config.ts`: `appId` `com.modelfoundry.idle`, `appName` `Model Foundry`, `webDir` `dist`.
- Do **not** set `server.url` or `server.cleartext`. Those point the app at a laptop and break the APK.
- After changing web code, the build workflow runs `npm run build` and `npx cap sync android`. You should run those locally too before you say you are done.
- Never commit `android/local.properties` (it contains one computer's SDK path). It must be in `.gitignore`. Do not commit `node_modules/`, `dist/`, `android/.gradle/`, `android/app/build/`, or `android/build/`.
- Do not commit an APK.

## Phone UI

- Portrait layout. It must look right at 360 px wide. No horizontal page scroll.
- Touch targets at least 48 px tall. No hover-only controls. No tiny links.
- Use only local files. No Google Fonts, no icon CDN, no remote images, no analytics script.
- The WebView must work with the network turned off.

## Visual rules (hard)

- No emoji or pictographs anywhere in the UI.
- No linear, radial, or conic gradients.
- No neon or blur glow.
- No box-shadow, text-shadow, or drop-shadow.
- Components use only the tokens defined in `src/ui/tokens.css` and do not introduce new hex colours.
- Icons only from `lucide-react` at stroke 1.75 and sizes: 22 nav, 20 row, 16 inline, 24 empty.
- Font: Inter bundled with `@fontsource/inter`, weights 400, 500, and 600. No font CDN, no Google Fonts.
- Page background is `--bg` (`#111110`). Font family is `--font`. Antialiased. No horizontal scroll.

Spacing and geometry:
- Spacing: 8pt grid (4, 8, 12, 16, 24, 32, 40).
- Radius: 8 controls, 12 cards, 16 sheet top.
- Surface: flat region with bg `--surface`, 1px `--border`, radius 12, padding 16. No shadow.
- Button: primary (height 48, radius 8, bg `--accent`, text `--on-accent`, weight 600, pressed bg `--accent-pressed`) and secondary (height 48, radius 8, transparent, 1px `--border-strong`, text `--text`). No shadow.

Typography:
- nav: 11/14
- meta: 12/16
- label: 13/18
- body: 16/24 (body never below 14)
- section: 20/28 weight 600
- screen title: 28/34 weight 600
- cash: 32/40 weight 600 with tabular-nums
- Number format: 999, 1.2K, 3.4M, 2.1B.

Icon map:
- Lab: Factory
- Models: Cpu
- Market: ChartLine
- Invest: Landmark
- More: Menu
- Research: FlaskConical
- Team: Users
- Events: Bell
- Achievements: Award
- New era: History
- Settings: Settings
- GPU: Cpu
- Data: Database
- Train: Play
- Launch: ArrowUpRight
- Sound: Volume2 and VolumeX

Rival marks:
- Monograms, not emoji: 32px square, radius 8, `--surface-2`, 1px `--border`, two letters weight 600 in `--text`.
- HA, PM, NG, VW, CL, BR for Helix Atelier, Pebble Mind, Northglass, Vesper Workshop, Copperline, Bracket Research.

Components and layout spec:
- Top bar: `--bg`, bottom 1px `--border`, pad 8 16 plus safe-area-top, lab name 16/600 truncated, cash and income tabular on the right, no pill.
- Stat card: label 13/500 secondary, value 20/600 tabular.
- List row: min-height 56, bottom border, icon 20.
- Bottom nav: `--bg`, top border, safe-area-bottom, inactive `--text-tertiary`, active `--text` weight 600, no active pill.
- Progress: height 4, track `--surface-2`, fill `--accent`, no pulse.
- Toast: surface, 1px border, radius 8, no shadow.
- Modal: flat `--scrim`, sheet `--surface`, top radius 16, no blur.
- Motion: 160ms `cubic-bezier(0.2, 0, 0, 1)`. No bounce or pulse. Reduced motion means no animation.
- Positive `#8fbfa8` and negative `#d27b6a` are for numbers only, never big fills.

## Offline and saves

- No `fetch`, `XMLHttpRequest`, WebSocket, or any library that phones home. Not even a version check.
- Save with `localStorage` exactly as `GAME_DESIGN.md` says (`modelfoundry.save.v1` plus a backup key).
- Pause the live clock when the page hides. Catch up with the offline simulator when it shows again. Never pay offline earnings twice.

## How to work

- This chat is the whole project. Stay in it. Keep using the **same branch** Arena assigned you. Do not create a new branch for each prompt.
- Keep the game playable after every phase. A later feature should be a stub screen ("Not built yet"), not a crash.
- Do not skip the tutorial, save, or airplane-mode rules when the prompt says they are in scope.
- Do not add extra features the prompt did not ask for.
- Prefer clear code over clever code. Name functions with words from the design (`appeal`, `revenuePerSec`, `usableGpus`).
- Add or update Vitest tests for any formula you implement (score, GPU price, revenue share, offline cap).
- When you finish a prompt: commit and **push that same branch**. Do not open a pull request. Do not merge to `main`. Do not force-push `main`. GitHub Actions builds an APK from the push.
- Tell the user the branch name and the short commit id in plain English, plus what to tap on the phone.
- If tests or the production build fail, fix them before you push.
- Only open a pull request into `main` when the user explicitly asks you to merge or to open that PR. One PR, at the end, not one per phase.
- If the only way this session will push is by opening a pull request: open **one draft** pull request into `main` the first time, then keep committing and pushing to that same branch. Do not merge it, do not close it, and do not open a second pull request.

## If the APK build fails

The user will paste a GitHub Actions log. Fix the cause. Do not turn off tests, and do not delete the workflow to make the red X go away. Common real fixes: commit the Gradle wrapper, delete a committed `local.properties`, pin Capacitor back to 8.5.3, or install the Android SDK package the log names.
