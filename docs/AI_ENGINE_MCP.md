# AI Engine & Model Context Protocol (MCP)

## The 2026-07-28 Stateless MCP Standard
Cherenkov Nexus strictly adheres to the official MCP `2026-07-28` specification. This update overhauls how the protocol handles execution, dropping legacy session state (Roots, Sampling, Logging) in favor of a stateless core designed for horizontal scaling.

* **Multi-Round-Trip Requests (MRTR):** The backend utilizes MRTR to allow the LLM to request additional mid-execution input (e.g., asking the Scraper to click a "Load More" pagination button) without maintaining brittle, long-lived connection streams.
* **Universal Context:** Execution relies heavily on the universal `_meta` object for contextual messaging and required issuer authorization metadata, ensuring enterprise-grade boundary security.

## @google/genai & Structured JSON Schema
To guarantee the React frontend can render the Split-Screen UI without crashing, all generative output is constrained using Full JSON Schema 2020-12. We pass this strictly into the `@google/genai` SDK's `responseSchema` configuration.

```javascript
// Excerpt: Node.js Route Schema Definition
responseSchema: {
  type: "OBJECT",
  properties: {
    tailored_summary: { type: "STRING" },
    identified_skill_gaps: { 
      type: "ARRAY", 
      items: { type: "STRING" } // Enforces array of strict strings
    },
    ats_answers: {
      type: "ARRAY",
      items: {
          type: "OBJECT",
          properties: {
              question: { type: "STRING" },
              answer: { type: "STRING" }
          }
      }
    }
  }
}
```

## Zero-Trust Local Fallback

For scenarios involving un-redacted PII, the AI router intercepts the request before it hits Google's servers. It reroutes the payload over standard REST to a local `AnythingLLM` endpoint running a quantized `Qwen` model, executing the synthesis entirely on the host machine.
