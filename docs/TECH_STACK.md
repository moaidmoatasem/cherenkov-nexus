# Technology Stack & Tooling

## Frontend Layer
* **Framework:** React 18 (via Vite)
* **Styling:** Tailwind CSS, Lucide Icons
* **State Management:** Zustand
* **Generative UI:** Custom AST component mapping, Server-Sent Events (SSE) listener

## Backend Orchestration Layer
* **Runtime:** Node.js (v20 LTS)
* **Framework:** Express.js
* **Agentic Framework:** LangGraph (JS/TS implementation)
* **Protocol:** Model Context Protocol (MCP) 2026-07-28 Spec

## Automation & AI
* **Web Automation:** `playwright`, `playwright-extra`, `puppeteer-extra-plugin-stealth`
* **Cloud AI:** `@google/genai` (Models: `gemini-3.7-flash` for speed, `gemini-3.7-flash` for complex routing)
* **Local AI:** `AnythingLLM`, `Qwen` (Quantized GGUF models)
* **Fuzzy Matching:** `fuse.js`

## Infrastructure
* **Database:** Firebase Firestore (NoSQL, Real-time sync)
* **Containerization:** Docker, Docker Compose
* **Load Testing (Internal QA):** `k6`
