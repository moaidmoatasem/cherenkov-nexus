# 📝 Comprehensive Task Catalog & Action Items

## 1. Task Management Framework
All tasks in **CHERENKOV-NEXUS** are organized by functional Epics and assigned strict priority tiers:
- **P0 (Critical):** Core engine, data integrity, synthesis stability, security boundaries, and multi-profile E2E testing.
- **P1 (High):** Major UI hubs, integrations, testing suites, and performance optimizations.
- **P2 (Medium):** Theme customization, auxiliary tools, and non-blocking enhancements.

---

## 2. Master Epic & Task Matrix

### Epic 1: Data Ingestion & Web Scraping (MCP)
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-101` | Build Playwright Stealth MCP Scraper | P0 | Done | `e2e/comprehensive-system.spec.ts` |
| `TSK-102` | Implement Cheerio Lightweight DOM Fallback | P0 | Done | `e2e/cli.spec.ts` |
| `TSK-103` | Add Rate Limiter & Exponential Backoff Engine | P1 | Done | Unit & Integration Tests |
| `TSK-104` | Extract Accessibility Tree Semantic Nodes | P1 | Done | `server/mcp/playwrightScraper.ts` |

### Epic 2: Compliance & Visa Sponsorship Engine
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-201` | Seed UK Home Office Sponsor Registry | P0 | Done | `seed-database.ts` |
| `TSK-202` | Implement LibSQL / Turso Fuzzy SQL Matcher | P0 | Done | `POST /api/visa-check` |
| `TSK-203` | Support EU Blue Card & IND 30% Ruling Records | P1 | Done | `server.ts` SPONSORS_DATABASE |
| `TSK-204` | Add Minimum Salary Threshold (£41.7k) Validator | P1 | Done | `docs/INTEGRATIONS.md` |

### Epic 3: AI Inference & Generative Synthesis
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-301` | Integrate Gemini 2.5 Flash SDK (`@google/genai`) | P0 | Done | `POST /api/synthesize` |
| `TSK-302` | Enforce JSON Schema 2020-12 `responseSchema` | P0 | Done | `server.ts` |
| `TSK-303` | Build WebLLM Browser WebGPU Inference Router | P0 | Done | `IdentityVaultModal.tsx` |
| `TSK-304` | Implement Model Comparison Benchmark View | P2 | Done | `ModelCompareModal.tsx` |

### Epic 4: Control Plane & UI Ergonomics
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-401` | Implement Split-Screen Reality vs Synthesizer UI | P0 | Done | `JobSynthesizer.tsx` |
| `TSK-402` | Build Git Diff Highlight Overlay for Resume Summary | P1 | Done | `JobSynthesizer.tsx` |
| `TSK-403` | Build Global Cmd+K Command Palette Navigator | P1 | Done | `CommandPalette.tsx` |
| `TSK-404` | Build Multi-Column Drag & Drop Kanban Board | P1 | Done | `KanbanBoard.tsx` |
| `TSK-405` | Implement Theme Aura Background Engine | P2 | Done | `ThemeAuraBackground.tsx` |

### Epic 5: Continuous Upskilling & Auxiliary Swarm
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-501` | Implement xAPI LRS Webhook Endpoint & SSE Bus | P0 | Done | `POST /api/webhooks/xapi` |
| `TSK-502` | Build Adversarial Mock Interview Sandbox | P1 | Done | `InterviewSandbox.tsx` |
| `TSK-503` | Implement LinkedIn & GitHub Repo Scout Modal | P1 | Done | `LinkedInScoutModal.tsx` |
| `TSK-504` | Build PDF Resume & Cover Letter Export Engine | P2 | Done | `jspdf` Exporter |

### Epic 6: Multi-Profile Headed Verification & Assessment
| Task ID | Title | Priority | Status | Verification Spec |
|---|---|---|---|---|
| `TSK-601` | Build Multi-Profile Headed E2E Suite (5 Personas) | P0 | Done | `e2e/multi-profile-headed.spec.ts` |
| `TSK-602` | Capture Visual Screenshots for All Archetypes | P0 | Done | `docs/assets/screenshots/profiles/` |
| `TSK-603` | Compile Granular Test Records & Latency Logs | P0 | Done | `docs/test-records/USER_PROFILES_TEST_RECORDS.md` |
| `TSK-604` | Conduct Heuristic UX & Zero-Trust Audit Report | P0 | Done | `docs/USER_PROFILES_ASSESSMENT.md` |
| `TSK-605` | Maintain Subagent Handover Protocol & Proof of Work | P0 | Done | `docs/HANDOVER.md` |
