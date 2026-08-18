# Agent Orchestration (LangGraph)

## The State Machine (DAG)
The execution flow is governed by a LangGraph Directed Acyclic Graph (DAG) state machine. This ensures determinism. State transitions are strictly typed in TypeScript.

```typescript
// Define the Graph State
interface ApplicationState {
  jobUrl: string;
  rawDomContent: string;
  sanitizedRequirements: string[];
  visaSponsorVerified: boolean;
  tailoredAst: JSON;
  errors: string[];
}
```

## The Agent Swarm Nodes

1. **The Scout (Data Ingestion):** Takes the `jobUrl`. Invokes the `mcp-ats-scraper`. Emits `rawDomContent`. If the DOM is too small (e.g., Cloudflare block), it appends to `errors` and halts execution.
2. **The Visa Validator (Deterministic Node):** Executes fuzzy matching against the Home Office cache. Mutates `visaSponsorVerified`.
3. **The Synthesizer (Profile Alignment):** The core LLM node. Takes the `sanitizedRequirements` and the local `masterProfile`. Runs the RAG prompt via Gemini (default `gemini-3.7-flash`). Compiles the `tailoredAst`.
