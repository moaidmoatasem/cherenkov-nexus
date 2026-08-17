# Technology Stack & Tooling

This document reflects the actual runtime dependencies declared in `package.json`
and verified against the source tree. Versions below are the minimums pinned in
`package.json`; installed ranges may resolve higher.

## Frontend Layer
* **Framework:** React 19 (`react`, `react-dom`) bundled with Vite 6
* **Build Tooling:** Vite 6 (`vite`, `@vitejs/plugin-react`) + Tailwind v4
  (`@tailwindcss/vite`, `tailwindcss`)
* **Styling & Icons:** Tailwind CSS v4, Lucide React icons (`lucide-react`)
* **Animation:** Framer Motion (`framer-motion`, `motion`)
* **State Management:** React's built-in `useState` / `useEffect` / refs in
  `src/App.tsx` — no external store library (Zustand/Redux) is used
* **Generative UI:** Custom AST-to-component mapping plus a Server-Sent Events
  (SSE) listener for streaming LLM output
* **Charts:** Recharts (`recharts`)
* **PDF Export:** jsPDF (`jspdf`)
* **Confetti FX:** `canvas-confetti`

## Backend Orchestration Layer
* **Runtime:** Node.js (v20+), invoked through `tsx` in development
* **Framework:** Express.js (`express`)
* **Agentic / Tool Protocol:** Model Context Protocol (MCP) SDK
  (`@modelcontextprotocol/sdk`, `@modelcontextprotocol/server-github`)
* **Scraping Automation:** `playwright-core` / `@playwright/test` driving a
  headless Chromium (see `server/mcp/playwrightScraper.ts`)
* **HTML Parsing:** Cheerio (`cheerio`)
* **CSV Parsing:** `csv-parse` (used when ingesting the Home Office sponsor list)

## Data & Persistence Tier
* **Primary Database:** LibSQL / Turso (`@libsql/client`)
  * Local mode: portable SQLite file at `./nexus.db` (path overridable via
    `DATABASE_PATH`)
  * Remote mode: Turso Edge when `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` are set
* **Visa Matching:** Deterministic LibSQL/SQLite `LIKE` queries against the
  `sponsors` table, with an in-memory `SPONSORS_DATABASE` array fallback when
  the database is unavailable — **no** Fuse.js dependency
* **Seed Script:** `seed-database.ts` populates `nexus.db` from the official
  Home Office CSV

## AI & Inference
* **Cloud AI:** `@google/genai` (Gemini). Default model id `gemini-3.7-flash`,
  overridable via the `GEMINI_MODEL` env var
* **Local / Zero-Trust AI:** `@mlc-ai/web-llm` running WebGPU-accelerated models
  in-browser (e.g. quantized Qwen)
* **Self-Hosted Fallback:** Optional local LLM server (Ollama-compatible) at
  `LOCAL_LLM_URL` (`http://localhost:11434/v1`)
* **Inference Routing:** `InferenceEngineMode = "cloud" | "local" | "hybrid"`
  chosen per request

## Desktop / Native Shell
* **Tauri v2** (`@tauri-apps/api`, `@tauri-apps/cli`) for the optional native
  desktop bundle in `app/` / `src-tauri/`

## Quality, Linting & Testing
* **Type Checking / Lint:** TypeScript 5.8 (`typescript`),
  `tsc --noEmit` (`npm run lint`), ESLint (`eslint`, `typescript-eslint`)
* **Unit Tests:** Vitest (`vitest`) — `npm run test:unit`
* **E2E Tests:** Playwright (`@playwright/test`) — `npm run test`; suite lives
  in `e2e/`
* **CI Gate:** `npm run test:ci` (lint + unit)

## Command Line Interface
* Standalone ingestion & synthesis entry point: `cherenkov.ts`
  (`npm run cli` or `npx tsx cherenkov.ts`)
