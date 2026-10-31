# PROJECT NIGHTFALL — Zero-Cost GitHub Development Team

This project keeps its public game live on Render, the source in GitHub, and heavyweight or persistent workloads off the owner's Gateway laptop.

## Running now (no additional AI agent payments)

| Role | Engine | Work performed | Cost boundary |
| --- | --- | --- | --- |
| Multiplayer regression tester | Existing GitHub Actions Quality Gate | Runs server unit/network tests, mobile/desktop Chromium screenshots, two-browser remote session emulation and release verification | Standard GitHub-hosted runners in the **public** repository |
| Asset provenance sentinel | `cloud-qa-sentinels.yml` and `scripts/cloud-sentinel.cjs` | Re-downloads pinned models/textures, verifies hashes, checks third-party attribution and reports live health | Standard GitHub-hosted public runner; weekly/manual |
| Dependency watcher | GitHub Dependabot | Reviews npm/GitHub Actions updates and opens reviewable PRs | GitHub's free Dependabot service |
| Security scanner | GitHub CodeQL | Analyzes the JavaScript server and browser client for security weaknesses | GitHub Code Security, free for public repos |

None of these workflows buys an AI subscription, runs Ollama on the laptop, automatically merges third-party updates, purchases assets, or deploys the game.

## Available specialist configurations (not autonomous workers)

- `nightfall-graphics.agent.md`: rigged characters, real animation, detailed environment and licensing.
- `nightfall-mobile.agent.md`: iPhone Safari/Android GPU budget, touch controls, layout.
- `nightfall-multiplayer.agent.md`: authoritative WebSocket networking, class abilities and cross-device play.
- `nightfall-release-qa.agent.md`: CI, security, exact-commit Render verification and screenshots.

The files are reusable prompts in `.github/agents/` for **compatible coding agents**. They do not start a worker and do not use AI credits until someone selects/runs an agent. If a tool charges per use, check the account's allowance first; never authorize overage to use these profiles.

## Existing Ollama development team

The owner's existing Ollama agents can later read these same task specifications through a Git checkout **when his computer is running and he chooses to connect it**. There is no remote Ollama API or token configured here, and these GitHub cloud workflows do not secretly invoke the local models. Avoid long-lived GPU jobs or turning the laptop into a game host.

## Agent operating procedure

1. Pick a discrete task from GitHub Issues and read `.github/copilot-instructions.md`.
2. Work in a new branch, not `main`. Read the appropriate specialist profile and project tests.
3. Import only sources whose redistribution license allows the intended use; pin file hashes and retain `ASSET_CREDITS.md`.
4. Open a **draft pull request** with changes, test evidence, screenshots and clear remaining issues.
5. The free automated test team evaluates the PR. Human review approves whether to merge.
6. Render's public release must match the approved commit; the public game is never considered verified on a different SHA.

## Billing safeguards

- GitHub's standard **public** hosted runners are free at the time of setup. If the repository is made private, usage rules differ. Do not change its visibility without reviewing account costs.
- Never select a large/billable runner, paid third-party GitHub Action, private Codespace, paid cloud LLM/API or chargeable agent without the owner's express approval.
- Keep Copilot, Claude and Codex cloud coding tasks opt-in; free/included credits vary by account.
- Dependabot opens PRs but never automatically merges them. Cloud QA and CodeQL jobs may report failures; do not confuse them with the live game's availability.
- No GitHub Actions job in this repository is allowed to trigger Render deployment or mutate billing settings automatically.

## Existing public game

https://project-nightfall-lee.onrender.com

This game must remain accessible to multiple genuine players on separate physical networks. Automated multi-context Chromium tests are useful but do **not** substitute for a real cross-device test.
