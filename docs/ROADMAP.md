# Engineering Roadmap

## Phase 1: Local-First Core CLI (Weeks 1-2)
* **Objective:** Establish immediate personal utility.
* **Deliverables:** Node.js script. Headless Playwright scraper. Strict JSON schema configuration with `@google/genai`.
* **Acceptance Criteria:** User can pass a URL via terminal and receive a perfectly formatted, ATS-ready JSON payload containing resume edits and application answers.

## Phase 2: Web Hub & Visa Validator (Weeks 3-4)
* **Objective:** Abstract CLI logic into a GUI for high-volume management.
* **Deliverables:** React/Tailwind frontend. Kanban drag-and-drop board. `node-cron` Home Office CSV ingestion script.
* **Acceptance Criteria:** Kanban board accurately reflects state. Visa Sponsor badges (Green/Red) render deterministically based on Fuse.js matching.

## Phase 3: Autonomous Learning Sync (Weeks 5-6)
* **Objective:** Transform the Master Profile into an autonomously updating, living document.
* **Deliverables:** Express xAPI webhook endpoints (`/api/webhooks/xapi`). Firestore Cloud Function triggers for skill extraction.
* **Acceptance Criteria:** Completing a learning module externally automatically appends the relevant technical skills to the Firestore database.

## Phase 4: MCP Decoupling & Zero-Trust (Weeks 7-8)
* **Objective:** Comply with the 2026 MCP architecture for modularity.
* **Deliverables:** Separate Playwright scraper into an isolated MCP server. Implement the AnythingLLM local routing failover.
* **Acceptance Criteria:** Highly sensitive profile data can be synthesized entirely on bare-metal without network calls to Google's cloud.

## Phase 5: Open-Source Release (Weeks 9-10)
* **Objective:** Package the repository as a definitive portfolio artifact.
* **Deliverables:** Environment variable abstraction (`.env.example`). `docker-compose.yml`. Comprehensive setup documentation.
* **Acceptance Criteria:** Any developer can clone the repository, input their own API keys, and spin up the architecture locally in under 3 minutes.
