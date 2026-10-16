# Project Nightfall agent instructions

Read [HANDOFF.md](HANDOFF.md) before continuing gameplay or art work. It records the current release, known defects, setup, tests, and the next priorities.

- Continue the existing Node/WebSocket + Three.js game. Preserve authoritative multiplayer, both operations, classes, difficulty, upgrades, and mobile controls. Do not replace it with a static mockup or restart in another engine without Lee's direction. Godot migration is on hold.
- Target convincing military survival horror. The present parking-lot arena and recolored soldier infected are interim art. Menu artwork is not evidence of gameplay quality.
- Inspect `git status` and the diff before editing. Codex and Copilot may both work on this project: agree on file ownership or use separate branches/worktrees. Do not overwrite another agent's changes.
- Keep the existing free Render service as the online host. Local development is a preview; Lee's laptop should not become the permanent multiplayer server. Do not add paid services, purchases, or subscriptions without direction.
- Use Node 22 (minimum 20), `npm ci`, and `npm test`. There is no bundler or `npm run build`. Model/texture installation runs during npm's postinstall; retain asset integrity checks and attribution.
- For gameplay/rendering changes, also run the browser smoke test and visually inspect actual combat screenshots on desktop, portrait phone, and landscape phone. Passing tests alone does not establish visual quality. Add focused behavioral checks for targeting/camera fixes.
- Preserve server-side combat authority and collision. Rendering changes that add physical cover must stay consistent with server obstacles. Do not expose QA controls as gameplay features.
- Keep secrets, downloaded model binaries, personal recordings, and generated test results out of commits. Retain `ASSET_CREDITS.md`; verify licenses for new assets. Current art does not include downloads from Lee's Mixamo account.
- Before calling a release live, confirm `/health.commit` matches the intended commit and test that public URL. GitHub success alone does not prove Render deployed it. Two browser contexts do not replace the outstanding two-real-player/device verification.
- Report concrete behavior, files changed, checks run, remaining defects, and the actual deployment state. Do not claim AAA quality, a finished game, or access to tools/extensions you have not verified.
