# System Architecture

## Overview
Cherenkov Nexus utilizes a decoupled, modern agentic architecture. The UI acts solely as a presentation and state-management layer. Heavy DOM parsing, Model Context Protocol (MCP) tooling, and AI reasoning are offloaded to an asynchronous Node.js execution engine.

## Directory Structure
```text
cherenkov-nexus/
├── client/                 # React (Vite) SPA
│   ├── src/
│   │   ├── components/     # Generative UI blocks, Split-Screen layouts
│   │   ├── hooks/          # useAgentStream, useKanbanState
│   │   ├── store/          # Zustand global state (Master Profile)
│   │   └── utils/          # AST Resume renderers
├── server/                 # Node.js API Gateway & Orchestrator
│   ├── src/
│   │   ├── agents/         # LangGraph state machines (Scout, Synthesizer)
│   │   ├── mcp-servers/    # Playwright Scraper, xAPI Syncer
│   │   ├── routes/         # Express REST & SSE endpoints
│   │   └── services/       # Firebase Admin, Visa Verification
├── docs/                   # Engineering documentation
└── docker-compose.yml      # Local deployment orchestration
```

## Control Plane vs. Execution Plane

1. **The Control Plane (React + Zustand):** Manages the Kanban board, visualizes the "Diff" in the resume, and handles the Cmd+K command palette. It only communicates with the API Gateway.
2. **The API Gateway (Express):** Receives HTTP requests, authenticates the local user, and initializes the LangGraph state machine. It streams LLM tokens back to the Control Plane via SSE.
3. **The Execution Plane (MCP Servers):** Isolated processes that actually touch the outside world. The Scraper MCP launches headless Chromium. The Syncer MCP listens for external xAPI webhooks.
