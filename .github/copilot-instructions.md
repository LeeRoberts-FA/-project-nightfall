# PROJECT NIGHTFALL — shared instructions for all coding agents

You are enhancing the **existing browser-based game**, not replacing it with a different game engine, framework, or project.

## Architecture and files
- Public playable site: https://project-nightfall-lee.onrender.com ; cloud service is Render, not the developer's laptop.
- `server.js`: authoritative Node HTTP/WebSocket server, including squad rooms, mission waves, damage, classes and upgrades.
- `public/game.js`, `public/index.html`, `public/style.css`: browser UI, controls, and network client.
- `public/scene3d.js`: Three.js/WebGL tactical 3D renderer.
- `scripts/install-assets.cjs`: license-aware, hash-verified build-time downloads.
- `tests/*.test.js`, `tests/browser-smoke.cjs`: integration and real Chromium visuals on portrait/landscape/desktop, plus two browser contexts.

## Delivery requirements
- Keep real remote 2–4 player co-op working, including shareable six-character invites, solo, Titan Raid, Blackwater Outbreak, four classes, three difficulties, progression, boss fights and complete in-game rules.
- Treat quality as player-visible: no fake 3D placeholder boxes or absent models; preserve usable portrait and landscape controls. Do not claim realistic art without visual review.
- Inspect the current files before editing. Prefer the smallest isolated change that addresses the assigned task.
- Reuse open resources only after verifying licenses, origin, file hashes, size and compatibility. Record credits in `ASSET_CREDITS.md`. Never take copyrighted assets from commercial games, scrape restricted marketplaces, or introduce an untrusted network download that can break installation.
- Optimize for mobile GPU/memory and desktop; don't require gaming-grade hardware from the user.
- Run `npm test`, JavaScript syntax checks, and the browser smoke suite whenever appropriate. Review generated screenshot artifacts. A green server test does not guarantee the rendered game looks correct.
- Work on your own branch and create a **draft pull request** with exact changes, screenshots, checks, risks and license/source details. Do **not** merge, deploy or change hosting/billing automatically.
- Current contest submission release must stay stable; no changes to `main` without separate review. Distinguish test failures from the main branch's wait-for-live-deployment check.
- No new paid services, hardware purchases or recurring costs without explicit approval. GitHub Actions and coding-agent usage are subject to account limits.
