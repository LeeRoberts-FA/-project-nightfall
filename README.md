# PROJECT NIGHTFALL

Multiplayer co-op action RPG shooter for Handshake AI's **Create a Multiplayer Game** challenge.

## Gameplay
- 2–4 players connect from separate devices using a six-character squad code or invitation link.
- Choose Assault, Medic, Heavy, or Scout.
- Survive three enemy waves and defeat the Warden Titan boss.
- Earn XP to level up and spend points on Damage, Armor, and Mobility upgrades.
- Win by defeating the boss; lose if the squad is eliminated and reinforcements run out.

Controls and complete rules must be available **in the game**, before the squad deploys. Desktop: WASD, mouse, E for class ability, U for upgrades. Mobile: two virtual joysticks and touch buttons.

## Deployment requirements
A **persistent Node.js web server with WebSocket upgrades** is required; static hosting by itself is insufficient. Render web service: build `npm install`, start `npm start`, health endpoint `/health`.

## Verification
1. Run `npm test`.
2. Open the deployed HTTPS URL in a private browsing session.
3. On two separate devices/networks, join the same code, deploy, move, shoot, and verify synchronized game state.
4. Play through waves and boss to verify win/loss screens and upgrade mechanics before submitting the URL to Handshake.

**Release validation:** CI runs local combat/network/browser checks separately from live-release checks. On the main branch it waits for Render to report the exact commit, then runs browser tests against the deployed URL. Independent verification with two real people on separate physical devices must still be recorded before Handshake submission.


## 1.2 — Blackwater Outbreak and reproducible QA

Choose **Titan Raid** or **Blackwater Outbreak**, then set Recruit, Veteran, or Nightmare difficulty before creating a squad or beginning solo training. Outbreak features five escalating infected waves and the Harvester boss, including shamblers, runners, ranged spitters and armored bloaters. Difficulty scaling is enforced by the game server and affects enemy health, speed, damage, wave population, and reinforcements.

Run `npm test` to execute WebSocket protocol / multiplayer checks and the live mode smoke test. The solo smoke test independently connects to the actual local Node server, starts Outbreak on Nightmare and confirms wave/difficulty metadata. It then ensures a second socket cannot join a solo session and checks a two-user co-op match on Recruit. This source is for quality assurance; do not expose test controls or artificial player substitutes to users.

**Deployment caution:** GitHub commits do not guarantee the production version changed. Confirm Render's latest deployed commit is equal to or newer than the current main branch before testing the public URL. The Handshake external-device test still requires two independent real players.

## 1.3 — Quarantine release

Keeps the authoritative Node/WebSocket game and both operations. Adds a stable camera independent of targeting, standing-pose-normalized BAMEN rigged characters, material-based infected variants, a credited M4A1 and destroyed-car model, PBR street surfaces, architectural dressing, rain, shadows, health feedback, boss phases, explicit aim assist, 30-round magazines, automatic/manual reload, synthesized optional gunfire, in-game exit and correct mission result text. Menu key art is separate from gameplay rendering.

`npm test` now runs full Recruit missions against the same authoritative combat tick, collision checks and independent WebSocket movement/ammunition replication. CI captures mobile and desktop combat, checks actual animated bounds and movement, and saves screenshots. These checks do not replace the final Handshake test with two real people on separate physical devices.
