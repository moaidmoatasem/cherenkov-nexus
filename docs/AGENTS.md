# Agent Roles & Orchestration

There is no graph framework here. Orchestration is plain Express route handlers in `server.ts`,
calling typed helpers in `src/server/`. An earlier revision of this document described a LangGraph
state machine; LangGraph has never been a dependency of this project.

The pipeline is a sequence, and the state it threads is the request/response payload of each route
rather than a shared graph object:

## The agents

1. **The Scout (data ingestion)** — takes a `jobUrl`, invokes the Playwright MCP scraper
   (`server/mcp/playwrightScraper.ts`), returns the extracted DOM. If the DOM is too small to be a
   real posting (e.g. a Cloudflare interstitial), it reports the failure rather than passing
   garbage downstream.
2. **The Visa Validator (deterministic)** — `src/server/sponsorCheck.ts` matches the employer
   against the locally held Register of Licensed Sponsors in SQLite. No model is involved, and the
   result is reproducible.
3. **The Synthesizer (profile alignment)** — the LLM step. Takes the extracted requirements and the
   local `masterProfile`, and calls Gemini (default `gemini-3.7-flash`) or a local model via
   `LOCAL_LLM_ENDPOINT`. With no engine configured it returns a profile-derived scaffold that is
   explicitly labelled as such in the UI.
4. **The Oracle (deterministic)** — `src/oracle/`, mounted at `/api/oracle`. Distinct from the Visa
   Validator: it does not ask *"does this employer sponsor?"* but *"does this role, at this salary,
   clear the rules — and which requirement is the binding one?"* See [ORACLE.md](ORACLE.md).

## Why determinism is split out

Steps 2 and 4 never call a model. That is deliberate: an eligibility verdict a user might act on
has to be reproducible and citable, so it is computed from the register and a sealed rules
snapshot, not generated. Only step 3 is probabilistic, and its output is labelled as generated.
