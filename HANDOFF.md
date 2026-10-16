# Project Nightfall: Codex / VS Code / Copilot handoff

Prepared 2026-10-16 UTC. Read `AGENTS.md` first. This is portable project context; the local agents do not automatically receive the full ChatGPT conversation, credentials, uploaded video, or cloud tools.

## Start in VS Code

For a new local copy, run these in PowerShell in the folder where you keep projects (Git and Node 22 must be installed):

```powershell
git clone --branch handoff/vscode-20261016 https://github.com/LeeRoberts-FA/-project-nightfall.git Project-Nightfall
cd Project-Nightfall
code Project-Nightfall.code-workspace
```

If `code` is unavailable, use VS Code's File > Open Workspace from File and select `Project-Nightfall.code-workspace`. If you already have this repository locally, inspect `git status` and preserve local changes before fetching and switching to this branch; do not clone over an existing folder.

In VS Code's terminal:

```powershell
npm ci
$env:PORT = "30281"
npm start
```

Open http://localhost:30281. The server needs to stay running while you play. Ctrl+C stops it. `npm ci` downloads the credited game assets and verifies their hashes; network access to the upstream asset repositories is required. If PowerShell blocks `npm.ps1`, invoke `npm.cmd` instead of changing machine-wide execution policy.

The workspace includes Run Task entries to install, start, test, and run browser QA. Run and Debug includes Node, Edge, and Chrome configurations. Start the Node configuration before the browser, or use a compound configuration; if the first browser load races server startup, refresh once. Use an installed browser. Stop any existing server on port 30281 before launching another one.

Enable the official OpenAI Codex extension, sign in, then use the Codex icon or Command Palette > `Codex: Open Codex Sidebar`. Copilot and Codex should both open this same project. They have separate conversations; the repository instructions provide shared context. `AGENTS.md` is the Codex entry point, and `.github/copilot-instructions.md` points Copilot to the same requirements.

Paste into the local Codex chat:

> Continue Project Nightfall. Read AGENTS.md and HANDOFF.md, inspect git status and the existing code, and check the tools and extensions actually available on this machine. Run the game and inspect current combat before editing. Work through the targeting and boss-visibility priorities in HANDOFF.md, then improve the environment and infected art. Preserve authoritative multiplayer and mobile controls. Coordinate files with Copilot, implement and test actual improvements, and update this handoff with results. Do not restart the project or claim visual quality from menu art.

For Copilot, give it a focused companion task such as reviewing the targeting fix or improving a separate agreed UI file. Avoid simultaneous edits to `public/game.js` / `public/scene3d.js` by both agents. Use separate branches or worktrees for concurrent changes, and commit completed work so this cloud agent can fetch it later.

Inventory local capabilities rather than assuming every extension exposes an agent tool:

```powershell
Get-Command node,npm,git,code -ErrorAction SilentlyContinue
node --version
code --list-extensions
```

The cloud workspace could edit, run Node tests, and inspect browser renders, but it could not access Lee's local VS Code or installed extensions. Its `code` wrapper reported no installed editor. Local extensions may provide previews, debug adapters, commands, or agent tools depending on their capabilities and configuration; they do not by themselves improve game assets or rendering.

## What exists and what Lee wants

An existing browser co-op action shooter for the Handshake multiplayer-game challenge. The direction is realistic military survival horror, with readable action, convincing infected and urban environments, and usable desktop/mobile controls. The current art is an intermediate implementation and falls short of that goal. Godot migration is on hold; continue the working web stack. Budget remains $0 unless Lee directs otherwise.

- Solo training and 2–4-player room-code/invite co-op.
- Assault, Medic, Heavy, Scout; class abilities; XP and mission-local Damage/Armor/Mobility upgrade points.
- Titan Raid: three waves and Warden Titan. Blackwater Outbreak: five waves and Harvester.
- Recruit, Veteran, Nightmare; server-enforced difficulty, combat, ammo, reloads, collision, win/loss.
- Desktop WASD/arrows, mouse aim, click/Space fire, E ability, R reload, U upgrades, 1/2/3 purchases, Q/C camera orbit. Mobile has movement/aim sticks and buttons.
- Independent orbit camera with screen-relative movement, rigged soldier, rifle, wrecked cars, PBR street materials, rain/shadows, optional synthesized sound. Infected reuse the soldier mesh with recoloring and growths.

## Highest-priority defects and acceptance

Lee provided a 51.6-second video of the public game. The delivered file had no audio. It showed Titan Raid on Recruit, much running in an empty-looking arena, and MISSION COMPLETE after roughly 40 seconds of combat. These observations are from the recording; they are not a complete performance or difficulty study.

1. **Offscreen automatic targeting/fire.** In `public/game.js`, the 55ms input interval defaults `assist=true` and chooses the closest living enemy without a camera-visibility filter; it then fires automatically. This explains kills while the action is out of view. Decide and implement a clear aim-assist policy: visible, reachable targets with deliberate firing behavior, responsive manual aiming, and clear UI. Consider cover/line of sight consistently with server collision; a screen-bounds filter alone does not prove an enemy is reachable. Validate targets behind/outside the camera and behind cover, desktop and both mobile orientations, all orbit angles, manual override, reloads, and both operations. Keep hit/damage authority on the server.
2. **Boss encounter readability.** The recording showed boss HUD without a clearly staged visible fight. Inspect spawn, camera framing, approach, attack telegraphs, and health/difficulty before changing numbers. Ensure the player can locate and visibly fight the boss, with understandable feedback and a readable victory. Do not simply make an offscreen boss survive longer.
3. **Urban level and art quality.** The arena remains an open parking lot with repeated building fronts. Build coherent spaces, routes, recognizable landmarks, collision-aligned cover, varied architectural detail, and purposeful lighting. Replace or substantially improve interim infected art and movement using licensed assets. Judge results in gameplay camera views, not a generated promotional scene.
4. **Combat presentation/performance.** Improve weapon/hand alignment, locomotion and attack animation, hit reactions, feedback, and visual distinction among enemy types. Preserve framing, touch controls, load reliability, and mobile performance as scene detail grows.

No fixes to these items are included in this handoff-only branch. Green release tests do not resolve these design/visual defects.

## Code map

| File | Responsibility |
| --- | --- |
| `server.js` | HTTP serving, custom WebSocket handling, rooms, authoritative simulation/combat, enemy AI, waves, bosses, progression, collision |
| `public/game.js` | Menus, networking, input, aim assist, HUD/overlays, camera controls, touch, optional sound |
| `public/scene3d.js` | Three.js scene, camera, rigged GLB actors, animation, weapon placement, PBR surfaces, scenery, lighting |
| `public/index.html`, `public/style.css` | Screens, layout, controls and in-game rules |
| `public/arena.json` | Shared obstacle data; keep rendered cover aligned with authoritative collision |
| `scripts/install-assets.cjs` | Postinstall asset downloads and integrity checks; cktang88 source pinned to `130ac2a5c856401ec36e7d35afcfefe40c5801f4` |
| `ASSET_CREDITS.md` | Art, motion, license and menu-image attribution |
| `tests/combat.test.js`, `tests/live-modes.test.js` | Authoritative combat/mission and WebSocket mode/network checks |
| `tests/browser-smoke.cjs` | Playwright combat/control/framing/camera/co-op smoke checks and screenshots |
| `.github/workflows/quality.yml` | Syntax, integration, HTTP, rendered QA; exact public commit gate on main |
| `render.yaml` | Existing free Node web service definition |

Runtime: Node >=20 (CI uses 22), CommonJS server, vanilla browser scripts, Three.js 0.160.1. No bundler/build script. Server default port 3000; editor tasks and browser smoke use 30281. Static-only hosting will break multiplayer: HTTP and WebSocket upgrades are required.

`window.__nightfallNetworkReport()` is a cheap browser diagnostic for replicated state. `window.__nightfallVisualReport()` includes expensive animated bounds work; do not poll it in a render-frame loop. Shader prewarming happens before the menu enables launch. Preserve that sequencing and avoid UI automation clicks before initialization completes.

## Validation

Run from the repo root:

```powershell
npm test
node --check server.js
node --check public/game.js
```

The four Node integration tests passed on the release baseline. `public/scene3d.js` is an ES module in a CommonJS package; CI checks it with `node --input-type=module --check < public/scene3d.js` in Bash. Do not convert the whole package module type just to syntax-check that file.

For rendered browser QA, install the optional local tooling once:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

With the dev server running in another terminal:

```powershell
node tests/browser-smoke.cjs
```

Or use the corresponding VS Code task, which starts the dev server. The script defaults to http://127.0.0.1:30281. `NIGHTFALL_URL` overrides the target. Inspect `test-results/` images and `mobile-report.json`; they are ignored by Git. Browser QA covers 390x844 portrait, 844x390 landscape, 1440x900 desktop, camera and movement, asset/bounds checks, and two isolated browser contexts joining/deploying/moving. Its initial draw-call ceiling is 450. Two contexts are automated clients, not two real people on separate devices. The latter acceptance check still needs to be recorded before Handshake submission.

After gameplay fixes, add focused regressions for the changed behavior and inspect before/after combat captures. Existing tests can pass while the game still has the targeting and art problems above. Do not check screenshots or downloaded art into the repository by accident.

## Verified release and deployment handoff

These are historical verification facts as of 2026-10-16, not a guarantee the service is unchanged when you read this. Recheck health and Git before deploying.

| Item | Verified value |
| --- | --- |
| Repository | https://github.com/LeeRoberts-FA/-project-nightfall |
| Public game | https://project-nightfall-lee.onrender.com |
| Health | https://project-nightfall-lee.onrender.com/health |
| Production release | 1.3.0 |
| Production/base main commit | `5c725656c754e9b861a615f269de877d60556ff5` |
| Merged release PR | https://github.com/LeeRoberts-FA/-project-nightfall/pull/1 |
| Successful public quality run | https://github.com/LeeRoberts-FA/-project-nightfall/actions/runs/38959896935 |
| Existing Render service | `srv-db8n26s9v7es73d5ja50` |
| Owning Render workspace | `tea-db8mibl9fdbs7390fp10` (My Workspace) |
| Verified live Render deploy | `dep-db989sc9v7es739edotg` completed 2026-10-16 20:11:56 UTC |
| Build / start / plan | `npm install` / `npm start` / free |

The public CI run verified the exact release SHA, loaded models/PBR assets, no JavaScript exceptions/failed requests, and automated two-client co-op replication. A sampled combat report recorded 69 draw calls; this is not an all-device performance guarantee. Actual screenshots were inspected and still showed the art limitations described above.

Render auto-deploy did not trigger reliably during this session despite being enabled; a manual deploy of the existing service was required. If using a Render integration, select the known owning workspace above. Do not create a duplicate service or change plan to work around workspace selection. Verify `/health.commit` against the intended commit after deployment. Main-branch CI waits for that exact SHA, so documentation-only handoff files are on a separate branch and have not been promoted to production.

Lee explicitly authorized the prior release merge/deployment. That does not imply authorization to spend money, publish personal recordings, change accounts, or create unrelated infrastructure. Local VS Code requires its own GitHub/Render connections; cloud connectors and credentials do not transfer through this document. In the cloud session Git fetch worked but direct Git push lacked credentials; commits were published through the connected GitHub integration.

## Art and portability notes

Retain credits for the BAMEN soldier (CC BY 4.0), nisu rifle (CC0, with Quaternius attachment metadata), alexdelker wrecked Crown Vic (CC BY 4.0), ambientCG PBR textures (CC0), and credited motion sources. `ASSET_CREDITS.md` and the installer are the source of asset details. The old Quaternius zombie is downloaded for legacy checks but not rendered in release 1.3. No assets from Lee's Mixamo account have been imported. `public/menu-art.webp` is generated menu art, not an actual gameplay capture.

Source-controlled code and installer definitions are portable. Ignored model/texture binaries regenerate through `npm ci`. The personal recording and cloud test-output directories are intentionally not included in this handoff. Do not rely on `/workspace/scratch/...` paths from the cloud on Lee's computer.

Official editor references: [Codex IDE setup](https://learn.chatgpt.com/docs/codex/ide) and [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions).
