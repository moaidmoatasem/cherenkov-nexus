# 🧰 Technology Stack & Dependencies

## 1. Architecture Stack Topology

```mermaid
graph TD
    subgraph Frontend_Stack ["Frontend & Presentation Layer"]
        React["React 19.0.1 (Concurrent Mode)"]
        Vite["Vite 6.2.3 (ESM Bundler)"]
        Tailwind["Tailwind CSS v4.1 (Utility Engine)"]
        Lucide["Lucide React 0.546 (Modern Iconography)"]
        Motion["Motion 12.23 (Hardware Animated Transitions)"]
        Recharts["Recharts 3.10 (Telemetry Data Visualizations)"]
    end

    subgraph Backend_Stack ["Backend Gateway & Agent Layer"]
        Node["Node.js (v20+ LTS Runtime)"]
        TSX["TSX 4.21 (TypeScript Execution Engine)"]
        Express["Express 4.21.2 (HTTP & SSE Server)"]
        Cheerio["Cheerio 1.2.0 (Fast HTML Parser)"]
    end

    subgraph AI_Automation_Stack ["AI, Web Scraping & MCP"]
        GeminiSDK["@google/genai 2.4.0 (Gemini 2.5 Flash SDK)"]
        WebLLM["@mlc-ai/web-llm 0.2.84 (In-Browser WebGPU Inference)"]
        Playwright["Playwright & Playwright-Core 1.62.1 (Stealth Headless Scraping)"]
        MCP["Model Context Protocol (2026-07-28 Spec Compliance)"]
    end

    subgraph Storage_Desktop_Stack ["Storage & Cross-Platform Packaging"]
        LibSQL["@libsql/client 0.17.4 (Turso Edge & SQLite Embedded)"]
        Tauri["Tauri 2.11 (Rust Cross-Platform Desktop Wrapper)"]
        JsPDF["jsPDF 4.2.1 (AST to PDF Document Generator)"]
    end

    Frontend_Stack --> Backend_Stack
    Backend_Stack --> AI_Automation_Stack
    Backend_Stack --> Storage_Desktop_Stack
```

---

## 2. Comprehensive Dependency Catalog

### Core Dependencies
| Package | Version | Justification & Architectural Role |
|---|---|---|
| `react` & `react-dom` | `^19.0.1` | High-performance UI rendering with concurrent transitions and optimized DOM updates. |
| `vite` | `^6.2.3` | Instant HMR development server and fast optimized production bundling. |
| `express` | `^4.21.2` | Lightweight local API Gateway hosting REST controllers and SSE event streams. |
| `@google/genai` | `^2.4.0` | Official Google Gemini SDK supporting structured JSON schema enforcement. |
| `@mlc-ai/web-llm` | `^0.2.84` | WebGPU-accelerated local inference running quantized models directly in-browser. |
| `@libsql/client` | `^0.17.4` | Edge database driver connecting to Turso Cloud or local SQLite (`nexus.db`). |
| `playwright` | `^1.62.1` | Headless browser automation for stealth DOM scraping and E2E test execution. |
| `tailwindcss` | `^4.1.14` | Modern CSS framework providing low-overhead styling tokens and theme aura effects. |
| `lucide-react` | `^0.546.0` | Comprehensive iconography system for technical IDE interface aesthetics. |
| `motion` | `^12.23.24` | Fluid spring physics animations for modals, drag-and-drop, and copy feedbacks. |
| `jspdf` | `^4.2.1` | Client-side vector PDF generation compiling synthesized AST into printable resumes. |

### Development & Test Tooling
| Package | Version | Role |
|---|---|---|
| `@playwright/test` | `^1.62.1` | End-to-End browser test automation framework. |
| `@tauri-apps/cli` & `api` | `^2.11.4` | Rust-based desktop shell packager for macOS, Windows, and Linux. |
| `tsx` | `^4.21.0` | TypeScript execution runtime without ahead-of-time compilation steps. |
| `typescript` | `~5.8.2` | Static type checking and strict compiler invariant enforcement. |
| `esbuild` | `^0.25.0` | Ultra-fast Node.js server production bundle compiler. |
