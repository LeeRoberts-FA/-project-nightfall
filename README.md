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

**Release status:** Local tests passed; production deployment and independent external two-device verification are not yet confirmed. Do not submit a URL before verifying both.
