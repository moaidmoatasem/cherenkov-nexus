# ⚡ System Design & Data Pipeline Specification

## 1. End-to-End Execution Sequence

The primary user journey begins with job ingestion via the UI or CLI and culminates in synthesized AST assets, visa validation, and live Kanban pipeline tracking.

```mermaid
sequenceDiagram
    autonumber
    actor User as Engineer / User
    participant UI as React 19 UI (Cmd+K / Synthesizer)
    participant Gateway as Express Gateway (server.ts)
    participant Scraper as Playwright MCP Scraper
    participant DB as LibSQL / Turso Sponsor DB
    participant Router as Zero-Trust AI Router
    participant LLM as Google Gemini 2.5 / WebLLM
    participant LRS as xAPI LRS Webhook Bus

    User->>UI: Input Job URL / Select Preset (Cmd + K)
    UI->>Gateway: POST /api/scrape { url }
    Gateway->>Scraper: executeServerlessScrape(url)
    Scraper-->>Gateway: Return Accessibility Tree & Clean Text
    Gateway-->>UI: Return Scraped Reality Layer
    
    User->>UI: Click "Synthesize Role & Tailor Weaponry"
    UI->>Gateway: POST /api/visa-check { companyName, text }
    Gateway->>DB: Query sponsors table (SQL LIKE match)
    DB-->>Gateway: SponsorRecord (License, Rating, MinSalary)
    Gateway-->>UI: Visa Verification Status Badge
    
    UI->>Gateway: POST /api/synthesize { jobUrl, companyName, jobDescription, masterProfile }
    Gateway->>Router: Inspect PII & Route Mode (Cloud vs Local)
    Router->>LLM: Generate Tailored AST (JSON Schema 2020-12)
    LLM-->>Gateway: Structured JSON Payload
    Gateway-->>UI: Return Tailored Summary, ATS Answers, Cold Pitch
    
    UI->>Gateway: POST /api/kanban/state { updatedApplications }
    Gateway->>DB: Upsert application record into applications table
    DB-->>Gateway: OK
    Gateway-->>UI: Synchronized Kanban State
    
    opt Learning Platform Webhook Event
        LRS->>Gateway: POST /api/webhooks/xapi { Actor, Verb, Object }
        Gateway->>Gateway: Parse Syllabus & Extract Competencies
        Gateway-->>UI: SSE Push (/api/webhooks/xapi/stream)
        UI->>UI: Auto-Append Skills to Master Profile
    end
```

---

## 2. Database Schema & Data Models (LibSQL / SQLite)

The platform utilizes LibSQL / SQLite (`nexus.db`) for deterministic querying and edge persistence.

```mermaid
erDiagram
    SPONSORS {
        integer id PK
        text name
        text aliases
        text region
        text licenseType
        text rating
        integer minSalaryThresholdGbp
    }

    APPLICATIONS {
        text id PK
        text column
        text company
        text jobTitle
        text salary
        text location
        text createdAt
        text updatedAt
        integer matchScore
        text jobDescription
        text coldEmail
    }

    COMPETENCIES {
        integer id PK
        text skillName
        text category
        text sourceLMS
        text verifiedDate
        text certificateUrl
    }

    APPLICATIONS ||--o{ COMPETENCIES : matches
```

### Table Definitions (DDL)

```sql
-- UK & EU Licensed Visa Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL,
  region TEXT NOT NULL,
  licenseType TEXT NOT NULL,
  rating TEXT NOT NULL,
  minSalaryThresholdGbp INTEGER NOT NULL
);

-- Kanban Application Pipeline State
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  column TEXT NOT NULL,
  company TEXT NOT NULL,
  jobTitle TEXT NOT NULL,
  salary TEXT,
  location TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  matchScore INTEGER DEFAULT 0,
  jobDescription TEXT,
  coldEmail TEXT
);

-- Learning Record Store (xAPI Ingestion)
CREATE TABLE IF NOT EXISTS competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skillName TEXT NOT NULL,
  category TEXT NOT NULL,
  sourceLMS TEXT NOT NULL,
  verifiedDate TEXT NOT NULL,
  certificateUrl TEXT
);
```

---

## 3. Invariant Testing & Observability Methodology

Derived from the `cherenkov-qa` discipline, all system nodes execute automated invariants:

```mermaid
graph LR
    Input["Scraped Web DOM"] --> Inv1{"DOM Length Invariant (>100 chars?)"}
    Inv1 -->|No: Bot Blocked| Halt["Abort & Return Clean Error"]
    Inv1 -->|Yes| Inv2{"Semantic Keywords Invariant ('Requirements' / 'Role')"}
    Inv2 -->|No: Non-Job Page| Warn["Flag Generic Warning"]
    Inv2 -->|Yes| Inv3{"Schema Invariant (Strict JSON 2020-12)"}
    Inv3 -->|Malformed AST| Retry["Silent Auto-Retry with Temperature 0"]
    Inv3 -->|Valid AST| Output["Stream to Generative UI"]
```

### Invariant Catalog
1. **Scrape Invariant:** If `rawDomContent.length < 100` or Cloudflare challenge markers are detected, the scraper automatically attempts an accessibility tree fallback or returns an actionable error.
2. **Deterministic Visa Invariant:** If the target company name does not exist in the database, the system will never guess sponsorship; it flags the role as `Unverified / Independent Sponsoring Required`.
3. **Structured Output Invariant:** All generative outputs are validated against the schema. If any field is missing or contains incorrect primitive types, the response is rejected before updating client state.

---

## 4. Rate Limiting, Exponential Backoff & Fault Tolerance

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> ExecutingScrape: Request Ingested
    ExecutingScrape --> Success: HTTP 200 & Valid DOM
    ExecutingScrape --> RateLimited: HTTP 429 / 403 Challenge
    RateLimited --> BackoffDelay: Base Delay (500ms * 2^attempt)
    BackoffDelay --> ExecutingScrape: Retry Attempt <= 3
    BackoffDelay --> FailoverCheerio: Attempt > 3
    FailoverCheerio --> Success: Fallback Parsed
    FailoverCheerio --> Error: Hard Failure
```

- **Per-Domain Rate Limiting:** Enforces maximum 5 requests/minute against major ATS portals (`workday.com`, `greenhouse.io`, `lever.co`).
- **Jittered Backoff:** Retries failed network requests with randomized exponential backoff (`delay = (2^attempt * 500ms) + random(0, 200ms)`).
- **Turso Edge Failover:** If connection to Turso Cloud Edge times out (>1500ms), the API Gateway immediately falls back to the local embedded SQLite database (`nexus.db`).
