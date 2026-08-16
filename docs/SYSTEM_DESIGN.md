# System Design & Data Flow

## Execution Pipeline (Sequence)
1. **Trigger:** User enters URL in Command Palette (`Cmd + K` -> `> New App`).
2. **Ingestion:** API Gateway triggers LangGraph. Scout Agent utilizes stealth Chromium to bypass ATS protections.
3. **Telemetry Check:** Invariant check validates that the scraped text contains standard semantic job markers (e.g., "Responsibilities", "Requirements"). If absent, execution halts, protecting the LLM context window from garbage data.
4. **Validation:** Visa sub-routine executes the Fuse.js search against the cached sponsor registry.
5. **Synthesis:** Google Gemini generates the structured JSON payload.
6. **Streaming:** Data is piped via Server-Sent Events (SSE) directly to the React client.
7. **Persistence:** Once synthesis completes, Firebase Firestore saves the full snapshot, transitioning the Kanban board to `Ready to Apply`.

## Invariant Testing (cherenkov-qa Methodology)
The system incorporates automated self-testing:
* **Rate Limit Invariants:** The scraper tracks request volumes per domain. If `Workday.com` requests exceed 5 per minute, exponential backoff is triggered automatically.
* **Schema Invariants:** If the Gemini API hallucinates an output outside the strict JSON schema, the backend validator catches the malformed AST before it hits the React client, triggering an automatic silent retry.
