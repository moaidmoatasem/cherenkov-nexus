# Core Feature Breakdown

## 1. The AST Resume Tailor
Generates a bespoke, ATS-optimized professional summary and job history. By outputting an Abstract Syntax Tree (AST) instead of raw Markdown, the React frontend maps the JSON nodes to perfect UI components, eliminating formatting errors.

## 2. Gap Analysis & Upskilling Routing
If the AI identifies a missing mandatory skill (e.g., "AWS Cloud Security"), it triggers an Upskilling Action Plan. The UI prompts the user to enroll in the relevant course. The Kanban card shifts to `Upskilling`. Once the xAPI webhook fires confirming completion, the card shifts back to `Ready to Apply`.

## 3. Real-Time Voice Interview Sandbox (Phase 2)
Upon transitioning a Kanban card to `Interviewing`, the system extracts the required tech stack and boots a local WebRTC audio channel. The AI conducts an adversarial, high-latency mock interview focused strictly on QA infrastructure, acting as the Hiring Manager.

## 4. "Cold-Network" Graphing
For unlisted jobs, the Scout agent maps the GitHub contributors or LinkedIn engineers associated with the target company's domain. The Synthesizer drafts hyper-personalized, highly technical outreach emails specifically referencing the engineer's recent open-source commits.
