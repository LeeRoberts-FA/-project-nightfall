# Nightfall open-weight builder workers — no Codex

These are **actual, bounded coding workers** running on standard CPU GitHub Actions machines when the workflow executes. They do not run on the developer's laptop and do not consume OpenAI Codex or GitHub Copilot inference credits.

- **Gameplay builder**: Ollama + `qwen2.5-coder:1.5b`; reads the mobile control and shooting code in `public/game.js`.
- **3D visuals builder**: Ollama + `deepseek-coder:1.3b`; reads character animation and weapons code in `public/scene3d.js`.
- **Hugging Face asset scout**: Public Hugging Face Hub API, metadata-only; searches 3D character and zombie datasets for GLB/FBX files and reports license status. No paid inference, downloads, or automatic asset installation.
- **Build/test guard**: the harness checks each generated single-file replacement, runs JavaScript syntax and `npm test`, and rejects unacceptable candidates.
- **Existing independent reviewers**: Nightfall Quality Gate checks real touch/keyboard/multiplayer with Chromium, CodeQL scans source, Dependabot proposes dependency updates, and the pinned-asset sentinel checks licensing and downloads.

Each worker reports a rationale and, *only if its bounded code change passed local checks*, uploads a `candidate.patch` artifact. A human/developer still must review the patch, run real browser/mobile tests, and decide to merge or deploy.

## How it operates

Workflow: `.github/workflows/open-weights-builders.yml`

It starts on the merge that first introduces the workflow, can be started with **Actions → Nightfall Free Open-Weight Builder Agents → Run workflow**, and checks weekly on Monday. The job is intentionally capped at 16 minutes per worker. The binary is fetched from an immutable Ollama release with a SHA-256 check. The model runs on the temporary runner's **CPU**, not an on-demand commercial cloud GPU or a third-party inference API. Neither model can modify GitHub's default branch, create PRs, access repository secrets or publish the game.

The Qwen and DeepSeek model families are publicly distributed as open weights, including on model hubs such as Hugging Face. This pipeline fetches their Ollama-packaged versions; it does not require a Hugging Face token and does not spend Hugging Face inference credits.

### Limitations

These are **small** coding models and should not be represented as studio-quality autonomous senior game engineers. Some runs will produce no usable patch or encounter runner download/CPU limits. The logs and reports provide evidence of that rather than claiming success. They do not create AAA characters or animations on their own.

GitHub **Models** was retired on July 30, 2026. Hugging Face hosted inference has very limited free credits, so automated pay-as-you-go inference is deliberately not enabled. GitHub Copilot PR #5 remains a separate draft; do not restart it if it would consume AI credits. **Codex belongs to the LXRION project**, not to Nightfall.

For the contest, preserve the verified Nightfall Render build. The agents' patch proposals stay isolated until independently validated in the game's visual/mobile/co-op browser tests.
