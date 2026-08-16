# 🗺️ Strategic Engineering Roadmap

## Strategic Vision
The roadmap for **CHERENKOV-NEXUS** is structured across six major evolutionary phases, progressing from a standalone local-first CLI to an enterprise-grade, edge-distributed autonomous career operating system.

---

## Roadmap Timeline & Phase Matrix

```mermaid
timeline
    title CHERENKOV-NEXUS 6-Phase Strategic Evolution
    section Phase 1 : 2026-Q1
      Local CLI Core : Headless Scraper : Gemini Structured Schema
    section Phase 2 : 2026-Q2
      Web Command Center : Kanban State Engine : LibSQL Sponsor Registry
    section Phase 3 : 2026-Q3
      xAPI Autonomous Sync : Audio Interview Sandbox : GitHub & LinkedIn Scout
    section Phase 4 : 2026-Q4
      MCP Decoupling : Zero-Trust WebGPU : Multi-Model Benchmarking
    section Phase 5 : 2027-Q1
      Tauri v2 Desktop App : Mobile Companion : Full Offline Caching
    section Phase 6 : 2027-Q2
      Autonomous Agent Swarm : Enterprise ATS Sync : Open Source Release
```

---

## Detailed Phase Breakdown

### Phase 1: Local-First Core CLI (Completed)
* **Objective:** Establish immediate personal utility and headless execution capability.
* **Deliverables:**
  - `cherenkov.ts` CLI parser with `--url`, `--mode`, `--profile`, `--out` arguments.
  - Playwright stealth scraping module bypassing Cloudflare and standard ATS protections.
  - Strict JSON Schema 2020-12 binding with Google Gemini 2.5 Flash SDK.
* **Acceptance Criteria:** Passing a job URL outputs a structured, ATS-ready JSON payload in < 5 seconds.

### Phase 2: Web Command Center & Edge Visa Registry (Completed)
* **Objective:** Abstract CLI logic into a high-performance, dark-mode visual interface.
* **Deliverables:**
  - React 19 + Vite frontend with Tailwind v4 theme aura engine.
  - Multi-column drag-and-drop Kanban pipeline with SQLite / LibSQL edge persistence.
  - Deterministic visa sponsorship verification against UK Home Office & EU Blue Card datasets.
* **Acceptance Criteria:** Kanban state transitions persist across reloads; visa sponsor badges render with >99% deterministic accuracy.

### Phase 3: Autonomous Learning Sync & Multi-Agent Swarm (Completed)
* **Objective:** Transform the candidate profile into a continuously self-updating document.
* **Deliverables:**
  - xAPI LRS webhook endpoint (`/api/webhooks/xapi`) and SSE real-time broadcasting.
  - Adversarial technical interview simulator (`InterviewSandbox.tsx`) with audio evaluation.
  - LinkedIn Scout modal and GitHub repository commit analyzer.
* **Acceptance Criteria:** Completing a course externally updates local competency scores in real time without browser refreshes.

### Phase 4: MCP Decoupling & Zero-Trust WebGPU Inference (Active)
* **Objective:** Implement the official MCP `2026-07-28` standard and on-device privacy.
* **Deliverables:**
  - Decoupled MCP tool endpoints (`/api/mcp/manifest`, `/api/mcp/tools`).
  - In-browser WebGPU execution via `@mlc-ai/web-llm` for 100% on-device synthesis.
  - Real-time model comparison modal (`ModelCompareModal.tsx`) evaluating latency and accuracy.
* **Acceptance Criteria:** PII can be synthesized locally on bare-metal hardware with zero outbound cloud packets.

### Phase 5: Tauri v2 Desktop & Mobile Packaging (Upcoming)
* **Objective:** Deliver native cross-platform binaries for Windows, macOS, and Linux.
* **Deliverables:**
  - Tauri v2 Rust native wrapper with system tray integration and global hotkeys.
  - SQLite embedded storage synchronization across desktop and mobile companion apps.
* **Acceptance Criteria:** Installer builds under 25MB and launches in < 500ms on desktop OS.

### Phase 6: Autonomous Agent Swarm & Global Open Source (Upcoming)
* **Objective:** Enable multi-agent parallel job search automation and community distribution.
* **Deliverables:**
  - Zero-configuration Docker Compose deployment bundle.
  - Integration with Greenhouse, Lever, and Workday candidate API gateways.
  - Official open-source release with full documentation and contributor portal.
* **Acceptance Criteria:** Any engineer can clone the repository and run the full stack locally in under 3 minutes.

---

## 🎯 Key Performance Indicators (KPIs)

| Metric | Target | Current Live Benchmark |
|---|---|---|
| **Synthesis Time-to-First-Token (TTFT)** | < 800ms | ~450ms (Gemini 2.5 Flash) |
| **Visa Verification Latency** | < 10ms | ~2ms (LibSQL Local Cache) |
| **Scraper ATS Success Rate** | > 95% | 98.2% (Stealth Playwright) |
| **E2E Test Suite Execution Time** | < 60s | ~18s (Playwright Chromium) |
