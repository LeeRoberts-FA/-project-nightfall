# Project Nightfall — AMD PC quality and future PlayStation readiness

**Status: engineering targets, NOT completed hardware certification.** Project Nightfall is currently a Three.js/WebGL browser game with Node.js/WebSocket authoritative multiplayer. It is **not** a native PS5 application; Sony's PlayStation Partners approval and console-specific SDK/porting work would be required.

## Goal
Deliver cinematic third-person co-op survival gameplay on compatible AMD Radeon and Ryzen-powered Windows/Linux PCs, while retaining real phone and modest-PC support. Preserve the existing live game until a reviewed PR passes CI and a separate cross-device release check.

## Required gameplay gates (block release on failures)
- Native WASD/arrow movement, mouse aim, manual mouse/space firing, dedicated mobile FIRE button, native touch movement and independent right-stick aiming. **Never auto-fire merely because an aiming stick is moved**.
- Real 2–4 player co-op over separate physical devices and networks. Validate a shared invite code, authoritative movement/combat, reconnect, team play, waves, boss outcome, and HUD synchronization.
- Visible and correctly scaled rigged 3D player/enemy models, animations for idle/movement/shoot/reload, readable third-person aiming, stable follow camera, weapon attachment, and hit feedback. No placeholder primitives in shipping visual presentation.
- Two playable modes, all four classes, difficulty choices, upgrades, boss encounters, complete self-explanatory instructions and correct win/loss screens.
- Verified provenance for every downloaded model, material, animation and sound; preserve `ASSET_CREDITS.md` and license conditions.

## AMD PC and browser compatibility matrix (must be measured)
| Environment | Target | Verification |
| --- | --- | --- |
| Discrete AMD Radeon GPU, desktop 1080p | Aim for stable 60 FPS with responsive input and full graphics preset | Browser telemetry, GPU/driver name, screenshots, repeatable active-combat capture. Not currently verified. |
| Ryzen integrated graphics / entry GPUs, 720p | Stable 30 FPS or better with reduced shadows, resolution and effects | Real device test, frame-time samples, browser health; not currently verified. |
| Phone with WebGL2 support | Responsive 30 FPS target where supported and fully usable portrait/landscape controls | Real iPhone Safari and Android browser test; headless Chromium alone is insufficient. |
| Browser cannot initialize WebGL | Usable compatibility fallback and a clear message rather than a blank screen | Automated error/fallback tests and user-facing screenshot. |

Targets are **goals**, not measured performance claims. Log median and 95th percentile frame time, low frame rates, draw calls, triangle count, load time, memory pressure, device pixel ratio, browser, graphics device and driver when available. Require no GPU-specific code path unless supported and measured.

## Rendering and optimization requirements
- Keep a reasonable WebGL rendering pixel ratio rather than scaling indiscriminately with high-DPI displays. Use dynamic resolution or user-selectable quality settings only when tested for visual clarity and input.
- Profile expensive lights, shadows, texture memory, draw calls, materials, asset decode and animation costs before introducing more effects. Optimize repeated geometry with appropriate instancing / LOD without destroying visual quality.
- Frame generation/upscaling can affect perceived smoothness but cannot cure broken gameplay or networking latency. AMD's **Unreal Engine FSR/Anti-Lag plugins cannot be installed into this Three.js/WebGL project**.
- Ship properly licensed GLB/GLTF rigs and animation clips; validate geometry and occlusion against actual browser screenshots at 390×844, 844×390, and 1440×900.
- Test gameplay (input, networking, shots, camera, combat) before cosmetic polish and again after optimization.

## Release sequence
1. Fix reproducible gameplay defects with small changes and regression tests; inspect every GitHub Actions artifact.
2. Conduct a visual Product Design audit using fresh screenshots of actual playable sessions.
3. Validate co-op with two human players on independent physical devices and networks.
4. Benchmark target AMD PCs; record measured settings and performance.
5. Review draft PRs and source licenses, merge approved changes, then compare Render `/health` SHA to the approved GitHub commit; visually retest the public game.
6. Only mark **AMD PC validated** after the specified actual-hardware tests pass. Do not describe a PC browser build as PS5 certified or console-ready.

## Separate future PlayStation workstream
The official route is [PlayStation Partners](https://partners.playstation.net/). Sony's [April 2026 developer submission guidance](https://sonyinteractive.com/en/news/blog/showing-your-game-to-playstation/) describes partner registration, a concise project plan, the Global Developer and Publisher Agreement and a title submission. Approved developer resources are gated. A native PlayStation build, platform input/services, performance, compliance and hardware tests would be new work; never assume that a WebGL web build is a PS5 release.

## References
- Three.js responsive canvas and GPU pixel ratio: https://threejs.org/manual/en/responsive.html
- PlayStation Partners: https://partners.playstation.net/
- Sony: https://sonyinteractive.com/en/news/blog/showing-your-game-to-playstation/
- Project Nightfall CI: `.github/workflows/quality.yml`
