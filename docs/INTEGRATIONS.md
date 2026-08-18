# External Integrations

This document describes how Cherenkov Nexus integrates with external systems,
verified against the implementation in `server.ts`, `seed-database.ts`, and
`server/mcp/playwrightScraper.ts`.

## 1. UK Home Office Visa Sponsorship Dataset
Instead of AI hallucination, the backend verifies sponsorship deterministically
against the official UK Register of Licensed Sponsors.

* **Data Ingestion:** The sponsor list is loaded from the official Home Office
  CSV by `seed-database.ts`, which parses it with `csv-parse` and writes the
  `Worker Licence` / `Skilled Worker` entries into the `sponsors` table of the
  local SQLite / Turso database (`nexus.db`).
* **Schema Mapping:** The loader targets companies listed under the `Worker
  Licence` type, prioritizing the `Skilled Worker` route. It extracts the
  `Organisation Name`, `Town/City`, and `Type & Licence Rating`. A-rated sponsors
  are prioritized.
* **Matching:** Because job postings use trading names, the backend performs
  case-insensitive LibSQL/SQLite `LIKE` lookups against the `Organisation Name`
  field, with an in-memory `SPONSORS_DATABASE` array fallback when the database
  is unavailable. A secondary signal pass scans the posting text for visa
  keywords (e.g. `skilled worker visa`, `eu blue card`, `30% ruling`). There is
  **no** Fuse.js dependency — the fuzzy layer is implemented with native SQL
  `LIKE` plus JavaScript string matching.

## 2. Learning Platform Synchronization (xAPI)
The Node.js backend exposes a webhook endpoint (`POST /api/webhooks/xapi`)
acting as a lightweight Learning Record Store (LRS).
* **Payload Structure:** Listens for standard JSON payloads containing
  `Actor -> Verb -> Object`.
* **Trigger Logic:** Upon receiving a `completed` verb payload, the backend uses
  `@google/genai` to parse the course syllabus and extract the core tech stack
  tools (e.g. "CodeQL"), appending them to the `masterProfile.learning_certs`
  array. There is **no** Firebase Cloud Function involved — all logic runs in the
  local Express server.
* **Live Stream:** A companion SSE endpoint
  (`GET /api/webhooks/xapi/stream`) pushes these events to the Control Plane in
  real time.

## 3. Playwright Stealth Scraper (ATS Extraction)
To extract data from heavily fortified Single Page Applications (SPAs) like
Workday or Lever:
* **Configuration:** Uses the official `playwright` `chromium` driver. When
  `BROWSERLESS_API_KEY` is set, the scraper connects over CDP to a scalable
  Browserless cluster; otherwise it launches a local headless Chromium. It does
  **not** use `playwright-extra` or `puppeteer-extra-plugin-stealth`.
* **Semantic Targets:** Avoids brittle CSS classes. The scraper snapshots the
  Chromium accessibility tree (`page.accessibility.snapshot()`) to extract
  structured content rather than scraping raw DOM selectors.

## 4. Mailto URI Protocol
For direct outreach, the React client compiles AI-generated text into a
URL-encoded `mailto:` string. This bypasses SMTP/OAuth overhead, instantly
launching the user's native email client with the Hiring Manager's address, the
tailored subject line, and the generated pitch body ready to send.

## 5. GitHub Repository Analysis
* **Endpoint:** `POST /api/github/analyze-repo`
* Uses the `@modelcontextprotocol/server-github` MCP server to inspect a target
  organization's repositories. An optional `GITHUB_TOKEN` raises the unauthenticated
  API rate limit for heavier repo analysis during the Scout phase.
