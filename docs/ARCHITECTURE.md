# System Architecture

## Overview
Cherenkov Nexus utilizes a decoupled, modern agentic architecture. The UI acts solely as a presentation and state-management layer. Heavy DOM parsing, Model Context Protocol (MCP) tooling, and AI reasoning are offloaded to an asynchronous Node.js execution engine.

## Directory Structure
```text
cherenkov-nexus/
├── src/                        # React 19 (Vite) SPA — the Control Plane
│   ├── components/             # Generative UI blocks, Split-Screen layouts
│   ├── data/                   # Default master profile & system presets
│   ├── hooks/                  # useAgentStream, hotkeys, SSE listeners
│   ├── server/                 # Frontend-side service helpers
│   │   ├── integrations/
│   │   └── mcp/
│   ├── utils/                  # AST resume renderers, PDF exporters
│   ├── App.tsx                 # Root layout & top-level state router
│   ├── index.css               # Tailwind v4 theme tokens
│   ├── main.tsx                # React DOM mount entrypoint
│   └── types.ts                # Strict shared TypeScript types
├── server.ts                   # Express API Gateway & agent orchestrator
├── server/
│   └── mcp/
│       └── playwrightScraper.ts # Headless Chromium accessibility-tree extractor
├── cherenkov.ts                # Standalone CLI ingestion & synthesis engine
├── seed-database.ts            # LibSQL/SQLite sponsor DB seeding
├── masterProfile.json          # Master candidate identity AST
├── nexus.db                    # Local SQLite sponsor database (generated)
├── e2e/                        # Playwright E2E test suites
├── app/ · src-tauri/           # Tauri v2 desktop shell (optional)
└── docs/                       # Engineering documentation
```

## Control Plane vs. Execution Plane

1. **The Control Plane (React + built-in hooks):** Manages the Kanban board,
   visualizes the resume "Diff", and handles the Cmd+K command palette. State is
   held with React `useState`/`useEffect` in `src/App.tsx` — no external store
   library is used. The Control Plane only communicates with the API Gateway.
2. **The API Gateway (Express, `server.ts`):** Receives HTTP requests, serves the
   Vite dev middleware / built assets, and orchestrates the agentic pipeline. It
   streams LLM output back to the Control Plane via SSE
   (`GET /api/webhooks/xapi/stream`).
3. **The Execution Plane (MCP tools & scrapers):** Isolated modules that touch the
   outside world. The Playwright scraper (`server/mcp/playwrightScraper.ts`)
   launches headless Chromium (or connects to a Browserless cluster when
   `BROWSERLESS_API_KEY` is set). The xAPI webhook listener ingests external LMS
   events at `POST /api/webhooks/xapi`.

## Data Plane

* **LibSQL / Turso** (`@libsql/client`) is the persistence layer. In local mode
  it backs a portable `./nexus.db` SQLite file; when `TURSO_DATABASE_URL` and
  `TURSO_AUTH_TOKEN` are configured it runs against a remote Turso Edge database.
* The **Master Profile** (`masterProfile.json`) is the canonical candidate
  identity AST; the Synthesizer agent aligns generated content against it.
* Visa sponsorship is verified deterministically against the `sponsors` table
  populated by `seed-database.ts` — there is no Firebase/Firestore dependency.
