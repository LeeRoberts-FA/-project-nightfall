# PROJECT NIGHTFALL — VERIFIED DEVELOPMENT CHECKPOINT

**Updated:** November 26, 2026. **Authority:** This repository (`LeeRoberts-FA/-project-nightfall`) is the existing Nightfall game source. Do not create copies in unrelated GitHub accounts or override the running game.

## Current architecture / release constraint
- Three.js/WebGL front end (`public/scene3d.js`, `public/game.js`, `public/index.html`) with authoritative Node/WebSocket server (`server.js`).
- Existing public deployment: https://project-nightfall-lee.onrender.com .
- Keep `main` and production unchanged until reviewed implementation and QA pass. A GitHub draft PR is not a deployed fix.
- Follow `.github/copilot-instructions.md`, `README.md` and `docs/FREE_AGENT_TEAM.md`. Codex remains reserved for LXRION.

## Workstream 1 — Manual aiming and reliable mobile controls
- **Draft PR #22:** https://github.com/LeeRoberts-FA/-project-nightfall/pull/22
- **Branch:** `fix/nightfall-manual-fire-regression-20261112`
- **Verified source change:** `public/game.js` no longer sets `fire=true` simply because the right aim joystick moves.
- **New regression:** `tests/browser-smoke.cjs` checks no ammunition is spent while moving the aim joystick without FIRE.
- **UI text:** `public/index.html` labels the right joystick AIM, and updates in-game instructions to match the dedicated FIRE button.
- **CI result recorded:** Quality Gate run https://github.com/LeeRoberts-FA/-project-nightfall/actions/runs/43260923310 passed against branch commit `7fe037fba69d3529968dc975c391766ab2f1e9fa`.
- **Limitations:** Passing emulated browser tests do not prove all real-device input and cross-network multiplayer conditions.

## Workstream 2 — AMD PC targets and future PlayStation feasibility
- **Draft PR #22** includes `docs/AMD_PC_AND_PLAYSTATION_READINESS.md`.
- Defines proposed graphics/framerate targets and real AMD Radeon/Ryzen hardware verification matrix. These are targets, **not measured hardware results**.
- The AMD Unreal Engine FSR and Anti-Lag 2 plugins are not plug-and-play for this Three.js/WebGL project.
- PlayStation developer application is separate (https://partners.playstation.net/); Nightfall is **not a native PlayStation/PS5 application** and has not passed certification.

## Workstream 3 — Infected appearance, animation and game visual quality
- **Draft PR #23:** https://github.com/LeeRoberts-FA/-project-nightfall/pull/23
- **Branch:** `graphics/nightfall-infected-overhaul-20261112`
- **Verified source change:** `public/scene3d.js` removes floating sphere-growth geometry, adds distressed procedural material variation and scales enemy variants differently without replacing the existing soldier rig.
- **CI result recorded:** Quality Gate run https://github.com/LeeRoberts-FA/-project-nightfall/actions/runs/43315742401 passed; screenshot artifact is `nightfall-iphone-gameplay`.
- **Visual review result: NOT ACCEPTED.** The actual desktop and mobile screenshots still resemble military soldier clones. Do **not** label it as the requested cinematic / console-quality presentation or merge it on that basis.
- **Issue and review notes:** https://github.com/LeeRoberts-FA/-project-nightfall/issues/19 . A separately rigged, properly licensed infected character with compatible animations is needed; a proposed Sketchfab model is **not downloaded or license/file verified**.

## Outstanding blockers / exact next action
1. Verify availability, license, model rig/skeleton, animations and file integrity for a genuine infected-character asset; record provenance and attribution in `ASSET_CREDITS.md` before importing it.
2. Implement the verified enemy-model replacement on the existing graphics branch (not a new engine, repo, or production overwrite).
3. Run Node/network tests and real browser portrait, landscape and desktop rendering; inspect screenshot artifacts against user-requested visual quality and repeat until accepted.
4. Measure performance on actual AMD Radeon/Ryzen hardware and test a real multiplayer session with two people on separate devices/networks.
5. Review PR #22 and PR #23 individually and coordinate merge order; check actual deployed `/health` SHA only after approved merge. **No auto-merge.**

## Project integrity and scope
The repository is public and accessible by link from other GitHub profiles. Do not mirror the game into unrelated repositories or a household member's account merely to create more GitHub commits. Share access or links appropriately instead; keep one authoritative Nightfall source.
