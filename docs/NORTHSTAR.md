# Northstar & Vision: Project CHERENKOV-NEXUS

## Core Vision
To engineer a localized, agentic command center that transforms the international tech job search from a passive web-form submission process into a proactive, deterministically verifiable deployment pipeline. The hub specifically empowers Senior QA professionals to target remote and visa-sponsored roles in the UK and EU without wasting CPU cycles or cognitive load on incompatible corporate entities.

## Operational Philosophy
* **Privacy by Default (Local-First):** PII (passwords, physical addresses, passports) must never hit a cloud LLM. The routing layer must support "Zero-Trust" bare-metal inference (e.g., Qwen running via a local Ollama endpoint, or in-browser WebGPU via @mlc-ai/web-llm).
* **Deterministic Over Probabilistic:** Visa sponsorship capabilities are verified programmatically against official government datasets, never guessed or hallucinated by an AI model.
* **Continuous Synchronization:** A resume is not a static PDF; it is a living artifact. The system must autonomously sync with learning platforms (Coursera, Udemy) via xAPI to append newly acquired skills in real-time.
* **Invariant Observability:** Derived from the `cherenkov-qa` methodology, we treat the job application process like a QA framework. We implement robust invariant checks to catch failing ATS parsers before synthesizing bad data.

## Metrics for Success (KPIs)
1. **Application Velocity:** Reduce the time to tailor a resume, cover letter, and ATS questionnaire from 45 minutes to < 10 seconds.
2. **Deterministic Hit Rate:** 100% of generated applications must belong to companies legally verified on the UK Home Office Register of Licensed Sponsors.
3. **Execution Latency:** Generative UI components must stream to the client via Server-Sent Events (SSE) with a Time-To-First-Token (TTFT) of < 800ms.

## Anti-Goals
* **No Fully Autonomous Bots:** We are not building a bot that blindly clicks "Apply" hundreds of times. Enterprise ATS platforms (Workday, Greenhouse) aggressively block these. We are building a "Human-in-the-Loop" Split-Screen solver.
* **No Cloud Vendor Lock-in:** The AI layer must remain agnostic via the Model Context Protocol (MCP), allowing users to hot-swap cloud endpoints or local models at will.
