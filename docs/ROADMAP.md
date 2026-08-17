# Engineering Roadmap

## Phase 1: Local-First Core CLI (Weeks 1-2)
* **Objective:** Establish immediate personal utility.
* **Deliverables:** Node.js script. Headless Playwright scraper. Strict JSON schema configuration with `@google/genai`.
* **Acceptance Criteria:** User can pass a URL via terminal and receive a perfectly formatted, ATS-ready JSON payload containing resume edits and application answers.

## Phase 2: Web Hub & Visa Validator (Weeks 3-4)
* **Objective:** Abstract CLI logic into a GUI for high-volume management.
* **Deliverables:** React 19 + Tailwind v4 frontend. Kanban drag-and-drop board. `seed-database.ts` Home Office CSV ingestion script writing to LibSQL/SQLite.
* **Acceptance Criteria:** Kanban board accurately reflects state. Visa Sponsor badges (Green/Red) render deterministically based on LibSQL/SQLite matching.

## Phase 3: Autonomous Learning Sync (Weeks 5-6)
* **Objective:** Transform the Master Profile into an autonomously updating, living document.
* **Deliverables:** Express xAPI webhook endpoints (`/api/webhooks/xapi`) plus an SSE stream (`/api/webhooks/xapi/stream`). Server-side `/genai` skill extraction (no external cloud function).
* **Acceptance Criteria:** Completing a learning module externally automatically appends the relevant technical skills to the master profile in the local database.

## Phase 4: MCP Decoupling & Zero-Trust (Weeks 7-8)
* **Objective:** Comply with the 2026 MCP architecture for modularity.
* **Deliverables:** Separate the Playwright scraper into an isolated MCP tool (`server/mcp/playwrightScraper.ts`). Implement local inference routing to an Ollama-compatible endpoint (default `qwen2.5-coder:7b-instruct`) and in-browser WebGPU via `@mlc-ai/web-llm`.
* **Acceptance Criteria:** Highly sensitive profile data can be synthesized entirely on bare-metal without network calls to Google's cloud.

## Phase 5: Open-Source Release (Weeks 9-10)
* **Objective:** Package the repository as a definitive portfolio artifact.
* **Deliverables:** Environment variable abstraction (`.env.example`). Comprehensive setup documentation and this `docs/` portal (see [QUICKSTART.md](QUICKSTART.md)).
* **Acceptance Criteria:** Any developer can clone the repository, input their own API keys, and spin up the architecture locally in under 3 minutes.
