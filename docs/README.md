# 📚 CHERENKOV-NEXUS Documentation Portal

Welcome to the centralized engineering and operational documentation repository for **CHERENKOV-NEXUS**.

---

## 🧭 Master Documentation Index

```mermaid
mindmap
  root((CHERENKOV NEXUS))
    Architecture & Design
      [Sponsorship Oracle](ORACLE.md)
      [Architecture Deep Dive](ARCHITECTURE.md)
      [System Design & Invariants](SYSTEM_DESIGN.md)
      [Design System & UI Tokens](DESIGN_SYSTEM.md)
      [Code Standards & Clean Arch](CODE_STANDARDS.md)
    Agentic & AI Infrastructure
      [Agent Roles & Orchestration](AGENTS.md)
      [MCP Spec & AI Engine](AI_ENGINE_MCP.md)
      [External Integrations](INTEGRATIONS.md)
    Verification & Testing
      [Integration Testing Guide](INTEGRATION_TESTING.md)
      [E2E Automation Suite](E2E_TESTING.md)
    Strategy & Execution
      [Strategic Roadmap](ROADMAP.md)
      [Development Plan](DEVELOPMENT_PLAN.md)
      [Task Breakdown Catalog](TASKS.md)
      [Agent Handover Protocol](HANDOVER.md)
    Product & Specifications
      [Quickstart Guide](QUICKSTART.md)
      [Features Inventory](FEATURES.md)
      [Tech Stack & Dependencies](TECH_STACK.md)
      [Northstar & Vision](NORTHSTAR.md)
      [Code of Conduct](CODE_OF_CONDUCT.md)
```

---

## 📑 Core Documentation Categories

### 1. ⚖️ The Sponsorship Oracle

| Document | Focus | Audience |
|---|---|---|
| ⚖️ [ORACLE.md](ORACLE.md) | The rule ledger, binding-constraint semantics, PROVISIONAL verdicts, content-addressed snapshots, and the deliberately narrow V1 scope (UK Skilled Worker only) | Everyone — start here |

### 2. 🏛️ Architecture & System Design
| Document | Description | Target Audience |
|---|---|---|
| 📐 [ARCHITECTURE.md](ARCHITECTURE.md) | Multi-tiered decoupled model, Control vs Data vs Execution planes, Edge DB layer | Architects & Engineers |
| ⚡ [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Ingestion pipeline sequences, Invariant testing methodology, rate limiting, and fault tolerance | Backend & QA Engineers |
| 🎨 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Dark-mode IDE aesthetic, Cmd+K palette, Split-Screen Generative UI, Theme Aura | Frontend & UX Designers |
| 🧹 [CODE_STANDARDS.md](CODE_STANDARDS.md) | Clean Architecture conventions, strict TypeScript rules, and state management patterns | All Contributors |

### 3. 🤖 Agentic Swarm & AI Architecture
| Document | Description | Target Audience |
|---|---|---|
| 🐝 [AGENTS.md](AGENTS.md) | Agent roles — Scout, Synthesizer, Visa Validator, LinkedIn Scout, Audio Interviewer — and how the Express gateway orchestrates them | AI & Agent Engineers |
| 🧠 [AI_ENGINE_MCP.md](AI_ENGINE_MCP.md) | Model Context Protocol 2026-07-28 stateless spec, JSON Schema 2020-12, and WebLLM local inference | AI & Infrastructure |
| 🔌 [INTEGRATIONS.md](INTEGRATIONS.md) | Deep dive into 7 external systems (UK Home Office Visa Register, xAPI LRS, Playwright Stealth, LibSQL) | Integration Engineers |

### 4. 🧪 Testing, Quality Assurance & Verification
| Document | Description | Target Audience |
|---|---|---|
| 🔬 [INTEGRATION_TESTING.md](INTEGRATION_TESTING.md) | API contract tests, LibSQL Edge DB tests, Webhook event ingestion, and LLM fallback verification | QA & Automation |
| 🎭 [E2E_TESTING.md](E2E_TESTING.md) | Comprehensive Playwright test suite, CLI testing, UI stability fixtures, and console assertions | QA & CI/CD Engineers |

### 5. 🗺️ Project Management, Execution & Handover
| Document | Description | Target Audience |
|---|---|---|
| 🚀 [QUICKSTART.md](QUICKSTART.md) | 3-minute zero-friction setup guide for PowerShell and Unix environments | New Developers |
| 🗺️ [ROADMAP.md](ROADMAP.md) | 6-Phase Strategic Evolution Plan from Local CLI to Edge AI and Open Source | Product & Stakeholders |
| 📋 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | Sprint schedule, work breakdown packages, and risk mitigation strategies | Tech Leads |
| 📝 [TASKS.md](TASKS.md) | Granular task catalog with status, priorities, dependencies, and acceptance criteria | Developers & Agents |
| 🤝 [HANDOVER.md](HANDOVER.md) | Agent-to-Agent continuity protocol, current state, active commands, and token preservation | AI Pair Programmers |

### 6. 🎯 Product Strategy & Governance
| Document | Description | Target Audience |
|---|---|---|
| ✨ [FEATURES.md](FEATURES.md) | Exhaustive 12-module feature matrix and UX workflow breakdown | Product Managers & Users |
| 🧰 [TECH_STACK.md](TECH_STACK.md) | Complete technology stack, package justifications, and runtime versions | All Contributors |
| 🧭 [NORTHSTAR.md](NORTHSTAR.md) | Core vision, operational philosophy, success KPIs, and anti-goals | All Stakeholders |
| 📜 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Contributor Covenant v2.1, ethical AI usage, and PII protection rules | Community |

---

## 🛠️ Contribution Guidelines
When contributing to documentation:
1. Ensure all code blocks specify proper syntax highlighting (`typescript`, `powershell`, `json`, `mermaid`).
2. Update cross-references in [README.md](README.md) and [docs/README.md](README.md) whenever new files are introduced.
3. Validate all technical statements against the live codebase implementation in `server.ts`, `cherenkov.ts`, and `src/`.
