# Start here — Model Foundry

You do not need to code. You will upload a few files, paste prompts into **one** Arena chat, and install an APK on your phone after each push.

The game is personal and offline. It is not put on the Play Store. The APK is signed with a debug key, which is fine for your phone.

## 1. Make a GitHub repo

1. Sign in at https://github.com/new
2. Name it `model-foundry` (any name is fine).
3. Set it to **Public** or **Private**. Public is simpler.
4. Check **Add a README** so the repo is not empty.
5. Click **Create repository**.

## 2. Upload these files

On the repo page: **Add file → Upload files**.

Upload the contents of the `ai-idle-game` folder, not the zip itself:

- `GAME_DESIGN.md`
- `AGENT_RULES.md`
- `PROMPTS.md`
- `START_HERE.md`
- the folder `.github` (it contains `workflows/build-apk.yml`)

Drag the `.github` folder in with the other files so GitHub keeps the path `.github/workflows/build-apk.yml`.

Commit the upload (the green button at the bottom). That puts the files on `main`.

## 3. Turn on builds

Open the **Actions** tab. If GitHub asks you to enable workflows, click the button that allows them.

You will not get an APK from this upload. The game code is not there yet. The first APK appears after prompt 1 is pushed.

## 4. Connect Arena — one chat for the whole game

1. Open https://arena.ai/agent (or on https://arena.ai switch the top-left mode from Battle to **Agent Mode**).
2. Turn the **GitHub** connector on and allow this repository (**Manage repositories** if it asks).
3. Start **one** chat with this repo selected.

Stay in that same chat for every prompt. The agent keeps a single branch (Arena picks the name). It commits and pushes to that branch. You do **not** merge to `main` after each prompt.

If Arena will not push unless a pull request exists: let it open **one draft** pull request, leave that draft open, and keep using the same chat. Do not click Merge until you want the game on `main`.

## 5. Paste prompt 1

Open `PROMPTS.md`. Copy **only** the box under "Prompt 1". Paste it into the chat and send it.

When the agent says it pushed, go to the **Actions** tab. Wait until **Build Android APK** for that branch has a green check. The first build can take about 10–15 minutes.

## 6. Download the APK on your phone

1. On your phone, open Chrome and sign into GitHub.
2. Open your repo → **Releases**.
3. The **top** release is the newest. Its name looks like `Phone build 4 (some-branch @ a1b2c3d)`.
4. While you are still building, that release is marked **Pre-release**. That is normal. It means "not merged to main yet", not "broken". Ignore an older release that says Latest if the top one is newer.
5. Tap **ModelFoundry-debug.apk** and download it.

A copy also sits on the Actions run as an artifact. Releases are easier on a phone. Use those.

## 7. Install it

1. Tap the downloaded file.
2. If Android blocks it: **Settings → search "install unknown apps"** → allow it for **Chrome** (or for **Files**, if that is what opened the APK).
3. If Play Protect says the app is harmful: it is your own debug build, not a store app. Tap **More details**, then **Install anyway**.
4. Open **Model Foundry**. You should see the title and version 0.1.0.
5. Turn on airplane mode and open it again. It should still work.

## 8. Keep going in the same chat

Paste prompts 2 through 10, **one at a time**, into the **same** chat. Wait until the agent pushes and the Actions check is green before you paste the next one.

Each push adds a new Release at the top of the list. Download that top APK and install it over the old one. Your in-game save stays on the phone.

Each prompt in `PROMPTS.md` says what to tap afterward.

You do not need to merge. `main` can stay as the files you uploaded until you want a final copy there. When you do, paste the optional "merge to main" prompt at the bottom of `PROMPTS.md`.

## If a build fails

1. Actions tab → the red run → the failed job.
2. Scroll to the red lines. Select that text and copy it.
3. In the **same** Arena chat, paste **Prompt 11** from `PROMPTS.md`, and under its last line paste the red text.
4. Wait for the next Actions run to go green, then download the new top Release.

If the game opens but something feels wrong, use Prompt 11 the same way and describe what you tapped and what you saw.

## If the chat gets confused

A very long chat can start forgetting earlier rules (it might try to merge, or rebuild something you already have). If that happens:

1. Note the branch name (it is in the Release title, before the `@`).
2. Start a **new** Agent Mode chat, connect the **same repo**, and tell it to continue on **that same branch**, not a new one.
3. Paste the next prompt. Add: "Read AGENT_RULES.md again. Do not open a new pull request and do not merge."

Do this only when the old chat is stuck. Otherwise stay in the first chat.

## Later ideas

Prompt 12 is a blank "add one feature" prompt. Use it in the same chat, after prompt 10, and only for one idea at a time.
