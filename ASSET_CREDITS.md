# Project Nightfall — Third-Party Art and Motion Credits

The Project Nightfall source and its rendering systems are separate from the credited art files below. Credits remain with the original creators. Licenses must be rechecked before any final commercial release.

## Tactical soldier (experimental 3D character)

- Original **FREE [Military Soldier] RIGGED** by **BAMEN** on Sketchfab: https://sketchfab.com/3d-models/free-military-soldier-rigged-e9c56308a67d4a3db62e914fafa4d198
- License: Creative Commons Attribution 4.0 (CC BY 4.0): https://creativecommons.org/licenses/by/4.0/
- Delivery / converted animation-bearing GLB from the open-source project **IRONLINE / 3d-fps**, maintained by cktang88: https://github.com/cktang88/3d-fps
- Motion library documented by that project: **Quaternius Universal Animation Library** (CC0); some bot walk/jog/crouch clips derive from the **100STYLE** dataset by **Ian Mason, Sebastian Starke and Taku Komura** (CC BY 4.0): https://zenodo.org/records/8127870
- Integration changes: normalization, runtime scale and Three.js skeletal cloning. Original authors do not endorse Nightfall.

## Infected test character (temporary)

- **Quaternius — Zombie Apocalypse Kit**, CC0 1.0: https://quaternius.com/packs/zombieapocalypsekit.html
- GLB mirrored in https://github.com/mars-tw/storm-apocalypse
- Temporary testing asset; not an acceptable substitute for the final realistic infected artwork.

## Environmental PBR textures

- **ambientCG** (Creative Commons CC0 1.0) materials Asphalt031, Bricks097, Concrete048: https://ambientcg.com/
- Optimized WebP maps mirrored in https://github.com/cktang88/3d-fps and integrity-verified during game builds.
- Included color, OpenGL normal, and roughness images; tiled across the Nightfall environment.

## Adobe Mixamo

Mixamo is a possible future source of additional game animations after an Adobe ID login and properly managed licensing; the current Nightfall build does not yet incorporate assets directly downloaded through the user's Mixamo account.

## Asset delivery

Game builds download these assets from the credited source repositories, verify their exact Git blob SHA-1 and file size, and host them locally on the same game origin. Source URLs and expected SHA values are defined in `scripts/install-assets.cjs`. The files are intentionally excluded from Git source control. Before a commercial release, replace these experimental characters with art that meets the target aesthetic; optimize performance and check license/attribution obligations. Third-party credits must be retained.

## Quarantine release 1.3

- **M4A1** by **Firewarden**, CC BY 4.0: https://sketchfab.com/3d-models/m4a1-40d8ef818c7549a896371cbb1f64fec6 — optimized GLB from cktang88/3d-fps; runtime scale and positioning changes.
- **Destroyed Ford Crown Vic** by **alexdelker**, CC BY 4.0: https://sketchfab.com/3d-models/destroyed-ford-crown-vic-1506140c97654d759cc4c60c20d1d2a8 — optimized GLB from cktang88/3d-fps, scaled and relit at runtime.
- Infected now use the credited **BAMEN Military Soldier** rig and motion library with Nightfall material recoloring, wounds, growths and altered animation speeds. These are military infected variants, not characters downloaded from Mixamo. The old Quaternius test zombie is not rendered in this release.
- Menu key art: generated for Project Nightfall using OpenAI image generation. It is menu artwork, not a gameplay capture. Prompt: realistic military survival horror, tactical operative in a rainy quarantined American city at blue hour, amber emergency lights, no text or logos. Asset: `public/menu-art.webp`.
- Uniform grain, environmental labels, architectural dressing and synthesized weapon feedback: authored in Nightfall code.
