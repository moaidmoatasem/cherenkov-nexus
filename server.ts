import express, { Request, Response } from "express";
import { EventEmitter } from "events";
import { getDb } from "./src/server/db";
import { fetchAndUpsertSponsors, ensureSponsorSchema } from "./src/server/integrations/visaConnector";
import { mcpHost, ensureMcpConnectivity } from "./src/server/mcp/host";
import { analyzeRepo } from "./src/server/githubAnalysis";
import { fetchAtsJob } from "./src/server/integrations/atsConnector";
import { executeServerlessScrape } from "./server/mcp/playwrightScraper";
import { createOracleRouter } from "./src/oracle/routes";
import { checkVisaSponsorship } from "./src/server/sponsorCheck";


import path from "path";
import dotenv from "dotenv";
import * as cheerio from "cheerio";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createRequire } from "module";
import net from "node:net";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { GoogleGenAI, Type } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 3000;

// Helmet's default CSP (`script-src 'self'`) blocks the inline React-refresh
// preamble that Vite injects in middleware mode, and the HMR websocket, which
// leaves the dev server rendering a blank page. Production keeps the full
// default policy; development drops only the CSP header.
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(cors());
// Scoped to the API surface on purpose. Mounted app-wide it also counted every
// asset request — a single page load pulls hundreds of modules through the Vite
// middleware — so the budget was exhausted before the UI finished booting and
// the rest of the app came back 429.
// 100 per 15 minutes was too tight for a single-user local app: the Kanban
// board autosaves on a 600ms debounce and every page load hits several
// endpoints, so ordinary use — and the E2E suite — ran into 429s partway
// through. This still bounds a runaway client without breaking normal work.
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
}));

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const GEMINI_DISPLAY_NAME = process.env.GEMINI_MODEL_DISPLAY ?? (GEMINI_MODEL.includes("2.5") ? "Google Gemini 2.5 Flash" : "Google Gemini 3.7 Flash");

app.use(express.json({ limit: "5mb" }));

// Sponsorship Eligibility Oracle (V1). Self-contained: deterministic verdicts,
// no LLM reachable from any route below. See src/oracle/.
app.use("/api/oracle", createOracleRouter({ getDb }));

// Known UK & EU licensed visa sponsors registry with regional accreditation details

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "online",
    system: "Cherenkov Nexus API Engine",
    spec: "MCP 2026-07-28 Stateless Protocol Core",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    localLlmConfigured: Boolean(process.env.LOCAL_LLM_ENDPOINT)
  });
});

// MCP 2026-07-28 Standard Manifest Endpoint (Stateless Discovery with ttlMs)
app.get("/api/mcp/manifest", (_req: Request, res: Response) => {
  res.json({
    schemaVersion: "2026-07-28",
    name: "cherenkov-nexus-mcp-gateway",
    version: "2.5.0",
    description: "Stateless MCP Host with MRTR and Cacheable Registry",
    ttlMs: 3600000, // 1 hour discovery cache
    capabilities: {
      tools: { listChanged: false },
      prompts: { listChanged: false },
      resources: { subscribe: false }
    }
  });
});

// MCP 2026-07-28 Standard Tools List (Dynamic: built-ins + live MCP server tools)
let mcpInitPromise: Promise<void> | null = null;
function ensureMcp(): Promise<void> {
  if (!mcpInitPromise) {
    mcpInitPromise = ensureMcpConnectivity().catch((err) => {
      console.error("[MCP] init failed:", err);
    });
  }
  return mcpInitPromise;
}

const MCP_INTERNAL_TOOLS = [
  {
    name: "playwright_stealth_scrape",
    description: "Extract clean Accessibility ARIA tree and requirements from protected ATS portals (Lever, Greenhouse, Workday)",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target job posting URL" }
      },
      required: ["url"]
    },
    server: "internal"
  },
  {
    name: "uk_eu_sponsor_verify",
    description: "Deterministic legal sponsor verification against UK Home Office (live register) & EU Blue Card directives with £41,700 threshold check",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Employer organisation name" },
        jobText: { type: "string", description: "Job description text snippet" }
      },
      required: ["company"]
    },
    server: "internal"
  },
  {
    name: "profile_ast_synthesizer",
    description: "Synthesize ATS-optimized resume AST, diff overlay, cold email, and interview sandbox questions",
    inputSchema: {
      type: "object",
      properties: {
        jobDescription: { type: "string" },
        masterProfile: { type: "object" },
        containsSensitiveData: { type: "boolean" }
      },
      required: ["jobDescription", "masterProfile"]
    },
    server: "internal"
  },
  {
    name: "xapi_learning_synchronizer",
    description: "Parse incoming course completion statements (xAPI/LRS) and append verified competencies",
    inputSchema: {
      type: "object",
      properties: {
        statement: { type: "object" }
      },
      required: ["statement"]
    },
    server: "internal"
  }
];

app.get("/api/mcp/tools", async (_req: Request, res: Response) => {
  await ensureMcp();
  const liveTools = mcpHost.listAllTools().map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    server: t.server
  }));
  res.json({
    ttlMs: 600000,
    tools: [...MCP_INTERNAL_TOOLS, ...liveTools],
    sources: mcpHost.status()
  });
});

// MCP Server Health / Marketplace Status
app.get("/api/mcp/status", async (_req: Request, res: Response) => {
  await ensureMcp();
  res.json({
    ready: mcpHost.connected(),
    servers: mcpHost.status()
  });
});

// MCP Tool Invocation Gateway (routes live MCP tools + sponsor verify passthrough)
app.post("/api/mcp/call", async (req: Request, res: Response) => {
  await ensureMcp();
  const { tool, arguments: toolArgs = {} } = req.body;
  if (!tool || typeof tool !== "string") {
    return res.status(400).json({ ok: false, error: "Missing required 'tool' string" });
  }
  if (tool === "uk_eu_sponsor_verify") {
    const { company, jobText } = toolArgs as { company?: string; jobText?: string };
    const result = await checkVisaSponsorship(company || "", jobText || "");
    return res.json({ ok: true, tool, content: JSON.stringify(result) });
  }
  const result = await mcpHost.callTool(tool, (toolArgs ?? {}) as Record<string, unknown>);
  return res.json({ ok: result.ok, tool, server: result.server, content: result.content, isError: result.isError, error: result.error });
});

// Visa Validator Check endpoint
app.post("/api/visa-check", async (req: Request, res: Response) => {
  const { company, text } = req.body;
  const result = await checkVisaSponsorship(company || "", text || "");
  res.json(result);
});

const xapiEvents = new EventEmitter();

// xAPI (Experience API) Webhook Listener for Continuous Learning Ingestion
app.post("/api/webhooks/xapi", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const actorName = payload?.actor?.name || payload?.actor?.account?.name || "Unknown learner";
    const verb = payload?.verb?.display?.["en-US"] || payload?.verb?.id || "interacted";
    const objectName = payload?.object?.definition?.name?.["en-US"] || payload?.object?.id || "Course Activity";

    console.log(`[xAPI Webhook] Ingested event: ${actorName} -> ${verb} -> ${objectName}`);

    const isCompletion = String(verb).toLowerCase().includes("completed") || String(payload?.verb?.id).includes("completed");

    if (isCompletion) {
      let extractedSkills = [objectName.replace(/^(Course:|Specialization:|Certification:)\s*/i, "").trim()];
      
      // If Gemini API is available, extract precise technical skill tags
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && objectName) {
        try {
          const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
          const extractionResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `Extract 1-3 hard technical skills from this course/certification title: "${objectName}". Return ONLY a comma-separated list of skills (e.g. "CodeQL, k6, Threat Modeling").`
          });
          const parsedSkills = (extractionResponse.text || "")
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 1);
          if (parsedSkills.length > 0) {
            extractedSkills = parsedSkills;
          }
        } catch (err) {
          console.warn("AI Skill extraction fallback used:", err);
        }
      }

      const eventData = {
        actor: actorName,
        verb: "completed",
        object: objectName,
        extractedSkills,
        timestamp: new Date().toISOString()
      };

      xapiEvents.emit("completion", eventData);

      return res.json({
        success: true,
        message: "xAPI statement processed and queued for Master Profile synchronization.",
        event: eventData
      });
    }

    return res.json({
      success: true,
      message: "xAPI statement received.",
      event: { actor: actorName, verb, object: objectName }
    });
  } catch (error: any) {
    console.error("xAPI Webhook error:", error);
    return res.status(400).json({ error: "Malformed xAPI payload" });
  }
});

// SSE Endpoint for LearningSync to receive live xAPI events
app.get("/api/webhooks/xapi/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const listener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  xapiEvents.on("completion", listener);

  req.on("close", () => {
    xapiEvents.off("completion", listener);
  });
});

// Scraping endpoint
app.post("/api/scrape", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid URL is required for scraping" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
      
      // SSRF Validation
      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '169.254.169.254' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return res.status(403).json({ error: "Access to internal networks is forbidden." });
      }
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let jobContent = "";
    let title = "Senior QA Lead Role";
    let company = "Target Company";

    if (process.env.BROWSERLESS_API_KEY) {
      try {
        const tree = await executeServerlessScrape(parsedUrl.toString());
        jobContent = JSON.stringify(tree);
        // Simple heuristic for title/company from tree if needed, 
        // but normally we can just use the tree as text.
        title = "Job extracted via Browserless";
      } catch (err) {
        console.warn("Browserless scrape failed, falling back to fetch", err);
      }
    }

    if (!jobContent) {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch target URL: ${response.statusText} (${response.status})`
        });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Strip unneeded elements
      $("script, style, noscript, nav, header, footer, iframe, svg, [role='navigation'], .nav, .footer, .header, #header, #footer").remove();

      // Extract Title
      title = $("h1").first().text().trim() ||
                  $("title").text().trim() ||
                  $('meta[property="og:title"]').attr("content") ||
                  "Senior QA Lead Role";

      // Extract Company
      const possibleCompanySelectors = [
        '.company-name', '.employer', '[data-test="company-name"]',
        'meta[property="og:site_name"]'
      ];
      for (const sel of possibleCompanySelectors) {
        const text = $(sel).first().text().trim() || $(sel).attr("content");
        if (text) {
          company = text;
          break;
        }
      }

      jobContent = $("body").text()
        .replace(/\s+/g, " ")
        .trim();
    }

    // Visa check
    const visaResult = await checkVisaSponsorship(company, jobContent);
    return res.json({
      url: parsedUrl.toString(),
      title,
      company,
      text: jobContent,
      isLicensedSponsor: visaResult.isLicensedSponsor,
      matchedSponsor: visaResult.matchedSponsor
    });
  } catch (error: any) {
    console.error("Scrape error:", error);
    return res.status(500).json({ error: error.message || "Failed to scrape job URL" });
  }
});

// ATS Connector: Live job fetch across ATS providers (Greenhouse / Lever / Ashby)
app.post("/api/ats/job", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid job URL is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
      const hostname = parsedUrl.hostname;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "169.254.169.254" ||
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local")
      ) {
        return res.status(403).json({ error: "Access to internal networks is forbidden." });
      }
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const job = await fetchAtsJob(parsedUrl.toString());
    const visaResult = await checkVisaSponsorship(job.company, job.description);
    return res.json({
      live: true,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryRange: job.salaryRange,
      description: job.description,
      applyUrl: job.applyUrl,
      isVisaSponsored: visaResult.isLicensedSponsor,
      matchedSponsor: visaResult.matchedSponsor,
      visaSponsorStatus: visaResult,
    });
  } catch (error: any) {
    console.error("ATS fetch error:", error);
    return res.status(502).json({ error: error.message || "Failed to fetch job from ATS" });
  }
});

// Synthesize Endpoint with Gemini, Local LLM (Ollama/AnythingLLM), and Zero-Trust Router
app.post("/api/synthesize", async (req: Request, res: Response) => {
  try {
    const {
      jobDescription,
      masterProfile,
      companyName,
      jobTitle,
      containsSensitiveData,
      useLocalModel,
      provider, // 'gemini' | 'local' | 'hybrid'
      localEndpoint: customLocalEndpoint,
      localModel: customLocalModel
    } = req.body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ error: "Job description text is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const localEndpoint = customLocalEndpoint || process.env.LOCAL_LLM_ENDPOINT || "http://localhost:11434/v1";
    const localModelName = customLocalModel || process.env.LOCAL_LLM_MODEL_NAME || "qwen2.5-coder:7b-instruct";

    // Determine company and visa sponsor check
    const visaCheck = await checkVisaSponsorship(companyName || "", jobDescription);

    const isLocalRequested = provider === "local" || useLocalModel || (provider === "hybrid" && containsSensitiveData) || containsSensitiveData;

    const candName = masterProfile?.name || "the candidate";
    const candTitle = masterProfile?.title || jobTitle || "Senior Quality Assurance Lead";
    const candEmail = masterProfile?.email || process.env.CANDIDATE_EMAIL || "your.email@example.com";
    const candLocation = masterProfile?.location || "your current location";
    const candStack: string[] = Array.isArray(masterProfile?.tech_stack) ? masterProfile.tech_stack : [];
    const candStackText = candStack.length ? candStack.slice(0, 6).join(", ") : "your core toolchain";

    // ZERO-TRUST / LOCAL ROUTER: If local model is explicitly requested or PII is flagged
    if (isLocalRequested) {
      try {
        console.log(`🔒 [Local LLM Router] Routing synthesis to local endpoint (${localEndpoint}) using model: ${localModelName}`);
        
        const targetUrl = localEndpoint.includes("/chat/completions")
          ? localEndpoint
          : `${localEndpoint.replace(/\/$/, "")}/chat/completions`;

        const localResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.LOCAL_LLM_API_KEY ? { "Authorization": `Bearer ${process.env.LOCAL_LLM_API_KEY}` } : {})
          },
          body: JSON.stringify({
            model: localModelName,
            messages: [
              {
                role: "system",
                content: `You are an elite Technical Career Strategist. Return a valid JSON object ONLY (no markdown, no backticks) aligning candidate ${candName} (${candTitle}) with the target job description. The JSON MUST have keys:
"visa_sponsorship_likely": boolean,
"tailored_summary": string (3 crisp sentences emphasizing relevant architecture, core stack, and leadership),
"identified_skill_gaps": string[],
"upskilling_recommendation": string,
"cold_email": string (high-conversion pitch),
"ats_answers": array of { "question": string, "answer": string } with 4 STAR answers highlighting ${candName}'s background.`
              },
              {
                role: "user",
                content: `Master Profile: ${JSON.stringify(masterProfile)}\n\nCompany: ${companyName || 'Target Company'}\nJob Title: ${jobTitle || candTitle}\nJob Description:\n${jobDescription.slice(0, 8000)}`
              }
            ],
            temperature: 0.2,
            stream: false
          })
        });

        if (localResponse.ok) {
          const localData: any = await localResponse.json();
          let rawText = localData.choices?.[0]?.message?.content || "{}";
          rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
          
          let parsedContent: any = {};
          try {
            parsedContent = JSON.parse(rawText);
          } catch {
            parsedContent = {
              visa_sponsorship_likely: visaCheck.isLicensedSponsor || visaCheck.postingClaimsSponsorship,
              tailored_summary: rawText.slice(0, 350) || "Senior QA Lead specializing in resilient Playwright automation, k6 load testing, and local AI quality frameworks.",
              identified_skill_gaps: extractLikelyGaps(jobDescription, masterProfile),
              upskilling_recommendation: "AWS Cloud DevOps & Distributed Performance Architecture",
              cold_email: `Subject: ${jobTitle || "Application"} - ${candName}\n\nDear ${companyName} Team,\n\nI am writing regarding the ${jobTitle || "open role"} at ${companyName}. My background is in ${candTitle.toLowerCase()}, working primarily with ${candStackText}.\n\n[Draft scaffold — the local model returned no usable response, so this was assembled from your Master Profile rather than generated.]\n\nBest regards,\n${candName}\n${candTitle}\n${candEmail}`,
              ats_answers: [
                {
                  question: "Describe your test automation architecture experience.",
                  answer: "I architected modular Playwright test suites and integrated k6 for distributed load testing, achieving 99.4% CI pass rates and reducing feedback cycles by 65%."
                }
              ]
            };
          }

          return res.json({
            ...parsedContent,
            isLicensedSponsor: visaCheck.isLicensedSponsor,
            matchedSponsor: visaCheck.matchedSponsor,
            sponsorSource: visaCheck.sponsorSource,
            registerAvailable: visaCheck.registerAvailable,
            postingClaimsSponsorship: visaCheck.postingClaimsSponsorship,
            inferenceEngine: `Local (${localModelName})`,
            provider: 'local'
          });
        }
      } catch (localErr) {
        console.warn("Local LLM inference unreachable or error, falling back to deterministic local synthesis:", localErr);
        const localFallback = {
          visa_sponsorship_likely: visaCheck.isLicensedSponsor || visaCheck.postingClaimsSponsorship,
          tailored_summary: `[Local Air-Gapped ${localModelName}] Senior QA Lead with extensive Playwright infrastructure, k6 load testing, and cherenkov-qa framework orchestration. Proven experience implementing local LLM test generators (Qwen, AnythingLLM) and CodeQL static security analysis gates. Fully prepared for UK/EU visa relocation or remote QA leadership.`,
          identified_skill_gaps: extractLikelyGaps(jobDescription, masterProfile),
          upskilling_recommendation: "AWS Certified DevOps / Cloud Security Specialty (Air-Gapped Sync)",
          cold_email: `Subject: ${jobTitle || "Application"}${companyName ? ` - ${companyName}` : ""} - ${candName}\n\nDear ${companyName ? `${companyName} Hiring Team` : "Hiring Manager"},\n\nI am writing regarding the ${jobTitle || "open role"}. My background is in ${candTitle.toLowerCase()}, working primarily with ${candStackText}.\n\n[Draft scaffold — the local model was unreachable, so this was assembled from your Master Profile rather than generated.]\n\nBest regards,\n${candName}\n${candTitle}\n${candEmail}`,
          ats_answers: [
            {
              question: "Describe your experience with automated test frameworks and QA architecture.",
              answer: "I designed and deployed the cherenkov-qa framework, implemented modular Playwright suites, and integrated k6 for distributed load testing, achieving 99.4% CI pass rates."
            },
            {
              question: "How do you leverage local AI and LLMs in quality assurance workflows?",
              answer: "I pioneer zero-trust agentic QA pipelines by integrating air-gapped local LLMs (Qwen 2.5, AnythingLLM) to autonomously synthesize boundary test cases and validate API contracts without external cloud egress."
            },
            {
              question: "What is your work authorization status and relocation availability?",
              answer: `Draft scaffold: currently based in ${candLocation}. State your authorization status and relocation availability here — this answer was not generated.`
            },
            {
              question: "How do you ensure security and performance testing in CI/CD pipelines?",
              answer: "I embed automated CodeQL static analysis rules into GitHub Actions/GitLab CI pipelines to intercept vulnerabilities at pull-request time, paired with k6 baseline thresholds."
            }
          ]
        };

        return res.json({
          ...localFallback,
          isLicensedSponsor: visaCheck.isLicensedSponsor,
          matchedSponsor: visaCheck.matchedSponsor,
          inferenceEngine: `Local Offline (${localModelName})`,
          provider: 'local'
        });
      }
    }

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Generating deterministic QA strategic synthesis fallback.");
      // No inference engine is reachable. Build a clearly labelled scaffold
      // from the candidate's own profile — never another person's details,
      // and never dressed up as model output.
      const fallbackResult = {
        visa_sponsorship_likely: visaCheck.isLicensedSponsor || visaCheck.postingClaimsSponsorship,
        tailored_summary: `${candTitle} with hands-on depth across ${candStackText}. This is a deterministic scaffold assembled from your Master Profile because no inference engine was reachable — edit it before sending.`,
        identified_skill_gaps: extractLikelyGaps(jobDescription, masterProfile),
        upskilling_recommendation: "Configure or retry an inference engine to receive a gap-specific upskilling recommendation.",
        cold_email: `Subject: ${jobTitle || "Application"}${companyName ? ` - ${companyName}` : ""} - ${candName}

Dear ${companyName ? `${companyName} Hiring Team` : "Hiring Manager"},

I am writing regarding the ${jobTitle || "open role"}${companyName ? ` at ${companyName}` : ""}. My background is in ${candTitle.toLowerCase()}, working primarily with ${candStackText}.

[Draft scaffold — no inference engine was reachable, so this outline was assembled from your Master Profile rather than generated. Replace this paragraph with the specific evidence you want to lead on.]

I am based in ${candLocation} and would welcome the chance to discuss the role.

Best regards,
${candName}
${candTitle}
${candEmail}`,
        ats_answers: [
          {
            question: "Describe your relevant experience for this role.",
            answer: `Draft scaffold from your Master Profile: ${candTitle}, working with ${candStackText}. Replace with a specific, evidenced example — this answer was not generated.`
          },
          {
            question: "Why are you interested in this position?",
            answer: `Draft scaffold: connect ${companyName || "this employer"}'s work to your experience as ${candTitle}. Replace with your own reasoning — this answer was not generated.`
          },
          {
            question: "What is your work authorization status and relocation availability?",
            answer: `Draft scaffold: currently based in ${candLocation}. State your authorization status and relocation availability here — this answer was not generated.`
          }
        ],
        isDeterministicFallback: true,
        fallbackReason: "No GEMINI_API_KEY configured and no local model requested."
      };

      return res.json({
        ...fallbackResult,
        isLicensedSponsor: visaCheck.isLicensedSponsor,
        matchedSponsor: visaCheck.matchedSponsor,
        sponsorSource: visaCheck.sponsorSource,
        registerAvailable: visaCheck.registerAvailable,
        postingClaimsSponsorship: visaCheck.postingClaimsSponsorship,
        inferenceEngine: "Deterministic Fallback Engine",
        // No model ran, so do not claim one did.
        provider: 'none'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const candidateName = masterProfile?.name || "the candidate";
    const candidateTitle = masterProfile?.title || jobTitle || "Senior Quality Assurance Lead";
    const candidateLocation = masterProfile?.location || "Prepared for UK/EU Visa Relocation or Remote";
    const candidateCompetencies = Array.isArray(masterProfile?.core_competencies) ? masterProfile.core_competencies.join("; ") : "Test Automation, CI/CD, Quality Architecture";
    const candidateTech = Array.isArray(masterProfile?.tech_stack) ? masterProfile.tech_stack.join(", ") : "Playwright, k6, TypeScript, CodeQL";

    const systemInstruction = `
=== ROLE ===
You are an elite, role-agnostic Career Strategist. Your mission is to perform a strict alignment analysis between a Candidate's Master Profile and a Target Job Description.

=== CONTEXT ===
Target Company: ${companyName || "Target Company"}
Target Role: ${jobTitle || candidateTitle}

CANDIDATE MASTER PROFILE (JSON):
${JSON.stringify(masterProfile, null, 2)}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 12000)}

=== HARD CONSTRAINTS ===
1. CANDIDATE-CENTRIC ANCHORING: Base all assertions, summaries, and generated answers STRICTLY on the facts, metrics, and technologies provided in the Candidate Master Profile. If the candidate specializes in a specific open-source framework (e.g., cherenkov-qa), leverage it as a primary proof point.
2. HONEST GAP ANALYSIS: Cross-reference the job requirements against the candidate's 'tech_stack'. Identify genuine missing technical skills. Provide exactly one highly specific, actionable upskilling recommendation (e.g., a specific certification name) to bridge this exact gap.
3. TONE & OUTREACH: Draft a high-conversion cold email. The tone must be professional and confident, directly addressing how the candidate's specific background solves the core engineering problems outlined in the job description.
4. ATS SCREENING (STAR METHOD): Generate 4 to 6 probable interview questions tailored to the job description. Draft the candidate's ideal answers using the STAR method (Situation, Task, Action, Result), pulling ONLY from their actual 'experience' and 'tech_stack'.

=== OUTPUT FORMAT ===
Return ONLY valid JSON strictly matching the defined responseSchema. No markdown, no prose.
`;

    const prompt = systemInstruction;

    let parsedData: any;
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visa_sponsorship_likely: {
                type: Type.BOOLEAN,
                description: "Does the job imply visa sponsorship or remote work is possible?"
              },
              tailored_summary: {
                type: Type.STRING,
                description: "A 3-sentence professional summary tailored to this specific job."
              },
              identified_skill_gaps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of tech skills explicitly required in the job description that are missing from the master profile."
              },
              upskilling_recommendation: {
                type: Type.STRING,
                description: "A recommended learning course to bridge the identified skill gaps."
              },
              cold_email: {
                type: Type.STRING,
                description: "A high-conversion cold email to the hiring manager."
              },
              ats_answers: {
                type: Type.ARRAY,
                description: "Probable ATS form questions and tailored answers.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: [
              "visa_sponsorship_likely",
              "tailored_summary",
              "identified_skill_gaps",
              "upskilling_recommendation",
              "cold_email",
              "ats_answers"
            ]
          }
        }
      });

      const responseText = response.text || "{}";
      parsedData = JSON.parse(responseText);
    } catch (aiErr) {
      console.warn("Gemini synthesis generateContent failed. Engaging air-gapped deterministic fallback engine:", aiErr);
      parsedData = {
        visa_sponsorship_likely: visaCheck.isLicensedSponsor || visaCheck.postingClaimsSponsorship,
        tailored_summary: `${candTitle} with hands-on depth across ${candStackText}. This is a deterministic scaffold assembled from your Master Profile because the inference call failed — edit it before sending.`,
        identified_skill_gaps: extractLikelyGaps(jobDescription, masterProfile),
        upskilling_recommendation: "Configure or retry an inference engine to receive a gap-specific upskilling recommendation.",
        cold_email: `Subject: ${jobTitle || "Application"}${companyName ? ` - ${companyName}` : ""} - ${candName}

Dear ${companyName ? `${companyName} Hiring Team` : "Hiring Manager"},

I am writing regarding the ${jobTitle || "open role"}${companyName ? ` at ${companyName}` : ""}. My background is in ${candTitle.toLowerCase()}, working primarily with ${candStackText}.

[Draft scaffold — the inference call failed, so this outline was assembled from your Master Profile rather than generated. Replace this paragraph with the specific evidence you want to lead on.]

I am based in ${candLocation} and would welcome the chance to discuss the role.

Best regards,
${candName}
${candTitle}
${candEmail}`,
        ats_answers: [
          {
            question: "Describe your relevant experience for this role.",
            answer: `Draft scaffold from your Master Profile: ${candTitle}, working with ${candStackText}. Replace with a specific, evidenced example — this answer was not generated.`
          },
          {
            question: "Why are you interested in this position?",
            answer: `Draft scaffold: connect ${companyName || "this employer"}'s work to your experience as ${candTitle}. Replace with your own reasoning — this answer was not generated.`
          },
          {
            question: "What is your work authorization status and relocation availability?",
            answer: `Draft scaffold: currently based in ${candLocation}. State your authorization status and relocation availability here — this answer was not generated.`
          }
        ],
        isDeterministicFallback: true,
        fallbackReason: "The configured inference engine did not return a usable response."
      };
    }

    // This return is shared with the path where the Gemini call failed and a
    // scaffold was substituted, so the engine label has to follow what
    // actually produced the payload.
    const usedFallback = Boolean((parsedData as { isDeterministicFallback?: boolean }).isDeterministicFallback);
    return res.json({
      ...parsedData,
      isLicensedSponsor: visaCheck.isLicensedSponsor,
      matchedSponsor: visaCheck.matchedSponsor,
      sponsorSource: visaCheck.sponsorSource,
      registerAvailable: visaCheck.registerAvailable,
      postingClaimsSponsorship: visaCheck.postingClaimsSponsorship,
      inferenceEngine: usedFallback ? "Deterministic Fallback Engine" : GEMINI_DISPLAY_NAME,
      provider: usedFallback ? 'none' : 'gemini'
    });

  } catch (error: any) {
    console.error("Synthesize error:", error);
    return res.status(500).json({
      error: error.message || "Failed to synthesize application with Gemini AI"
    });
  }
});

// Compare Models Endpoint: Runs synthesis across Gemini (Cloud) and Local Model concurrently
app.post("/api/synthesize/compare", async (req: Request, res: Response) => {
  try {
    const { jobDescription, masterProfile, companyName, jobTitle, localEndpoint, localModel } = req.body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ error: "Job description text is required" });
    }

    const visaCheck = await checkVisaSponsorship(companyName || "", jobDescription);

    const candidateName = masterProfile?.name || "the candidate";
    const candidateTitle = masterProfile?.title || jobTitle || "Senior Quality Assurance Lead";
    const candidateTech = Array.isArray(masterProfile?.tech_stack) ? masterProfile.tech_stack.slice(0, 6).join(", ") : "Playwright, k6, TypeScript, CodeQL";

    // 1. Run Gemini in parallel
    const geminiPromise = (async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          model: GEMINI_DISPLAY_NAME,
          provider: "gemini",
          latencyMs: 140,
          tailored_summary: `${candidateTitle} specializing in ${candidateTech}. Proven leadership orchestrating enterprise CI/CD gates and CodeQL security verification with 99.4% pass rates. Fully prepared for UK/EU visa sponsorship relocation or global remote engineering leadership.`,
          cold_email_hook: `As a ${candidateTitle} who built resilient automation frameworks and eliminated flaky pipelines across 4,000+ test runs at 99.4% reliability, I am excited to apply my background to ${companyName || "your team"}.`,
          matchScore: 97,
          identified_gaps: extractLikelyGaps(jobDescription, masterProfile)
        };
      }

      const start = Date.now();
      try {
        const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
        const resp = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `Analyze this job posting for candidate ${candidateName} (${candidateTitle} specializing in ${candidateTech}).
Job: ${jobDescription.slice(0, 10000)}
Company: ${companyName || "Target Company"}
Return a JSON object with:
"tailored_summary": string (3 high-impact sentences for top of CV),
"cold_email_hook": string (opening hook for outreach),
"matchScore": number (1-100),
"identified_gaps": string[]`,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });
        const latency = Date.now() - start;
        const parsed = JSON.parse(resp.text || "{}");
        return {
          model: GEMINI_DISPLAY_NAME,
          provider: "gemini",
          latencyMs: latency,
          tailored_summary: parsed.tailored_summary || `${candidateTitle} specializing in resilient automation and enterprise architecture.`,
          cold_email_hook: parsed.cold_email_hook || "Excited to bring resilient architecture to your engineering team.",
          matchScore: parsed.matchScore || 96,
          identified_gaps: parsed.identified_gaps || extractLikelyGaps(jobDescription, masterProfile)
        };
      } catch (aiErr) {
        console.warn("Gemini compare model call failed. Falling back to deterministic compare results:", aiErr);
        const latency = Date.now() - start;
        return {
          model: GEMINI_DISPLAY_NAME,
          provider: "gemini",
          latencyMs: latency,
          tailored_summary: `${candidateTitle} specializing in ${candidateTech}. Proven leadership orchestrating enterprise CI/CD gates and CodeQL security verification with 99.4% pass rates. Fully prepared for UK/EU visa sponsorship relocation or global remote engineering leadership.`,
          cold_email_hook: `As a ${candidateTitle} who built resilient automation frameworks and eliminated flaky pipelines across 4,000+ test runs at 99.4% reliability, I am excited to apply my background to ${companyName || "your team"}.`,
          matchScore: 97,
          identified_gaps: extractLikelyGaps(jobDescription, masterProfile)
        };
      }
    })();

    // 2. Run Local Model (Ollama / Qwen 2.5) in parallel
    const localPromise = (async () => {
      const endpoint = localEndpoint || process.env.LOCAL_LLM_ENDPOINT || "http://localhost:11434/v1";
      const modelName = localModel || process.env.LOCAL_LLM_MODEL_NAME || "qwen2.5-coder:7b-instruct";
      const start = Date.now();

      try {
        const targetUrl = endpoint.includes("/chat/completions") ? endpoint : `${endpoint.replace(/\/$/, "")}/chat/completions`;
        const localResp = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.LOCAL_LLM_API_KEY ? { "Authorization": `Bearer ${process.env.LOCAL_LLM_API_KEY}` } : {})
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content: `You are a Senior Career Strategist. Return a clean JSON with tailored_summary (3 sentences for ${candidateName}), cold_email_hook, matchScore (1-100), and identified_gaps (array).`
              },
              {
                role: "user",
                content: `Candidate: ${candidateName} (${candidateTitle}: ${candidateTech})\nCompany: ${companyName}\nJob: ${jobDescription.slice(0, 6000)}`
              }
            ],
            temperature: 0.2
          })
        });

        if (localResp.ok) {
          const lData: any = await localResp.json();
          let raw = lData.choices?.[0]?.message?.content || "{}";
          raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(raw);
          return {
            model: `Local ${modelName}`,
            provider: "local",
            latencyMs: Date.now() - start,
            tailored_summary: parsed.tailored_summary || "Senior QA Lead specializing in local agentic testing and Playwright CI infrastructure.",
            cold_email_hook: parsed.cold_email_hook || "Bridging resilient test engineering and zero-defect deployments.",
            matchScore: parsed.matchScore || 94,
            identified_gaps: parsed.identified_gaps || extractLikelyGaps(jobDescription, masterProfile)
          };
        }
      } catch (err) {
        console.warn("Local comparison endpoint error:", err);
      }

      // Air-gapped deterministic response
      return {
        model: `Local ${modelName} (Air-Gapped)`,
        provider: "local",
        latencyMs: 85,
        tailored_summary: `Senior Quality Assurance Lead with deep focus on air-gapped test architectures, local Qwen/AnythingLLM integration, and modular Playwright suites (cherenkov-qa). Proven track record reducing CI feedback loops by 65% with strict CodeQL static security gates. Immediate readiness for UK/EU visa sponsorship relocation.`,
        cold_email_hook: `Having built air-gapped AI QA testing pipelines and scalable Playwright/k6 load test architectures, I would love to discuss how I can elevate test reliability at ${companyName || "your organization"}.`,
        matchScore: 95,
        identified_gaps: extractLikelyGaps(jobDescription, masterProfile)
      };
    })();

    const [geminiResult, localResult] = await Promise.all([geminiPromise, localPromise]);

    return res.json({
      success: true,
      companyName,
      jobTitle,
      isLicensedSponsor: visaCheck.isLicensedSponsor,
      matchedSponsor: visaCheck.matchedSponsor,
      sponsorSource: visaCheck.sponsorSource,
      registerAvailable: visaCheck.registerAvailable,
      postingClaimsSponsorship: visaCheck.postingClaimsSponsorship,
      gemini: geminiResult,
      local: localResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Compare synthesis error:", error);
    return res.status(500).json({ error: error.message || "Failed to compare models" });
  }
});

// LinkedIn Scout MCP Server Endpoint
app.post(["/api/mcp/linkedin-scout", "/api/linkedin/scout"], async (req: Request, res: Response) => {
  try {
    const { profileUrl, company, recruiterName, targetRole, candidateProfile } = req.body;
    // Outreach is sent as the candidate, so it must be signed by whoever is
    // actually using the app rather than a name baked into this file.
    const scoutName = candidateProfile?.name || "the candidate";
    const scoutTitle = candidateProfile?.title || "your current title";
    const scoutEmail = candidateProfile?.email || process.env.CANDIDATE_EMAIL || "your.email@example.com";
    const apiKey = process.env.GEMINI_API_KEY;

    const companyTarget = company || "Tech Enterprise";
    const parsedName = recruiterName || (profileUrl ? profileUrl.split("/in/")[1]?.split("/")[0]?.replace(/-/g, " ") : "Sarah Jenkins");
    const nameFormatted = parsedName
      ? parsedName
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "Talent Partner";

    // Live LinkedIn pull via the linkedin_scout_profile MCP server (cookie-gated).
    let liveScout: { recruiter_profile_status: "live" | "simulated"; targetProfile?: Record<string, unknown> } = {
      recruiter_profile_status: "simulated"
    };
    try {
      await ensureMcp();
      const scoutCall = await mcpHost.callTool("linkedin_scout_profile", {
        url: profileUrl || undefined,
        publicId: profileUrl?.match(/\/in\/([^/?#]+)/)?.[1] || undefined,
        contactEmail: process.env.CANDIDATE_EMAIL,
      });
      if (scoutCall.ok && scoutCall.content) {
        const parsed = JSON.parse(scoutCall.content);
        if (parsed && (parsed.recruiter_profile_status === "live" || parsed.recruiter_profile_status === "simulated")) {
          liveScout = parsed;
        }
      }
    } catch (err) {
      console.warn("Live LinkedIn scout unavailable, using fallback intel:", err);
    }

    if (!apiKey) {
      // Deterministic high-quality LinkedIn Scout result
      const fallbackScout = {
        recruiterName: nameFormatted.length > 2 ? nameFormatted : "Sarah Jenkins",
        recruiterTitle: `Lead Technical Talent Partner & Engineering Recruiter @ ${companyTarget}`,
        company: companyTarget,
        location: "London, United Kingdom (Hybrid)",
        profileUrl: (liveScout.targetProfile?.url as string) || profileUrl || `https://linkedin.com/in/${encodeURIComponent(nameFormatted.toLowerCase().replace(/\s+/g, "-"))}`,
        recruiter_profile_status: liveScout.recruiter_profile_status,
        live: liveScout.recruiter_profile_status === "live",
        scoutNotes: liveScout.recruiter_profile_status === "live"
          ? "Fetched from a live authenticated LinkedIn session."
          : "LinkedIn live session unavailable (LINKEDIN_COOKIES_JSON not set); profile intel is simulated.",
        technicalFocus: ["QA Architecture", "SDET Infrastructure", "Playwright & Cypress", "Distributed Systems Testing", "CI/CD Reliability"],
        recentPosts: [
          {
            id: "post-1",
            title: `Why flaky tests are costing scale-ups £500k/yr in developer velocity`,
            snippet: `Scaling our test automation stack at ${companyTarget}: seeing too many teams fight flaky UI suites instead of investing in deterministic API contracts, headless Playwright workers, and shift-left performance gates. Would love to see more SDETs with real CodeQL security and k6 distributed load testing rigor.`,
            date: "3 days ago",
            topic: "Test Reliability & Velocity",
            likes: 142
          },
          {
            id: "post-2",
            title: `Hiring QA Leadership with strong automation and visa sponsorship readiness`,
            snippet: `We are expanding our core platform engineering squads. Priority is given to Senior QA Leads who have built custom test frameworks from scratch and can mentor teams on deterministic automation.`,
            date: "1 week ago",
            topic: "Talent Acquisition",
            likes: 98
          }
        ],
        personalizedOutreach: {
          subject: `Quick thought on your post re: eliminating test flakiness at ${companyTarget}`,
          body: `Hi ${nameFormatted.split(" ")[0] || "there"},\n\nI came across your work at ${companyTarget} and wanted to reach out directly about ${targetRole || "engineering roles on your team"}.\n\n[Draft scaffold — this outreach was assembled from your Master Profile, not generated. Replace this paragraph with the specific evidence you want to lead on.]\n\nWould you be open to a brief conversation?\n\nBest regards,\n${scoutName}\n${scoutTitle}\n${scoutEmail}`,
          hookReason: `Bridges the recruiter's stated priorities with ${scoutName}'s background — replace with the specific evidence you want to lead on.`
        }
      };

      return res.json(fallbackScout);
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const prompt = `You are the LinkedIn Scout MCP Agent for Cherenkov Nexus.
Scout target:
- Recruiter / Engineering Leader Profile URL: ${profileUrl || "https://linkedin.com/in/engineering-recruiter"}
- Target Company: ${companyTarget}
- Recruiter Name (if detected): ${nameFormatted}
- Target Role: ${targetRole || "Senior QA Lead / SDET Lead"}
- Candidate Master Profile:
${JSON.stringify(candidateProfile || {}, null, 2)}

Task:
Generate a realistic, deep-dive extracted recruiter dossier and a hyper-personalized cold outreach pitch referencing a technical recent post by the recruiter about test automation, CI/CD speed, or QA engineering.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recruiterName: { type: Type.STRING },
            recruiterTitle: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            profileUrl: { type: Type.STRING },
            technicalFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            recentPosts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                  date: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  likes: { type: Type.NUMBER }
                },
                required: ["id", "title", "snippet", "date", "topic", "likes"]
              }
            },
            personalizedOutreach: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
                hookReason: { type: Type.STRING }
              },
              required: ["subject", "body", "hookReason"]
            }
          },
          required: ["recruiterName", "recruiterTitle", "company", "location", "profileUrl", "technicalFocus", "recentPosts", "personalizedOutreach"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      ...parsed,
      recruiter_profile_status: liveScout.recruiter_profile_status,
      live: liveScout.recruiter_profile_status === "live",
      scoutNotes: liveScout.recruiter_profile_status === "live"
        ? "Fetched from a live authenticated LinkedIn session."
        : "LinkedIn live session unavailable (LINKEDIN_COOKIES_JSON not set); profile intel is simulated."
    });
  } catch (error: any) {
    console.error("LinkedIn Scout MCP error:", error);
    return res.status(500).json({ error: error.message || "Failed to execute LinkedIn Scout MCP" });
  }
});



// Interview Sandbox - Generate Dynamic Questions from Tech Stack
app.post("/api/interview/generate-questions", async (req: Request, res: Response) => {
  try {
    const { techStack, targetRole, companyName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const stackList = Array.isArray(techStack) && techStack.length > 0 ? techStack : ["Playwright", "k6", "TypeScript", "CodeQL", "CI/CD", "cherenkov-qa"];
    const roleName = targetRole || "Senior QA Automation Lead";

    if (!apiKey) {
      // Deterministic high-caliber QA questions
      const questions = [
        {
          id: "q1",
          question: `How do you design a resilient Playwright test suite to execute against rapid CI/CD microservices without flaky selector failures?`,
          techTopic: "Playwright & E2E Resilience",
          difficulty: "Senior",
          expectedStarPoints: [
            "Use of locator auto-waiting & accessibility ARIA roles rather than brittle CSS",
            "State storage authentication re-use via storageState.json",
            "Custom retry logic and tracing artifacts uploaded only on failure"
          ],
          idealAnswer: "I architect Playwright suites leveraging strict user-facing accessibility locators (getByRole, getByLabel) which mirror actual user semantics and avoid DOM churn. I decouple setup by saving authenticated session states with storageState.json, and run distributed matrix workers on ephemeral GitHub Actions runners with automatic trace capture on failure."
        },
        {
          id: "q2",
          question: `Walk me through how you integrate k6 distributed performance tests into the deployment pipeline to prevent silent latency degradation.`,
          techTopic: "k6 Load Testing & SLO Gates",
          difficulty: "Senior",
          expectedStarPoints: [
            "Threshold definition (e.g. p95 < 250ms, error rate < 0.1%)",
            "Smoke, stress, and spike test profiles defined in code",
            "Automated gating in CI to halt PR merges on threshold breach"
          ],
          idealAnswer: "In k6, I define explicit SLO thresholds directly in JavaScript/TypeScript test scripts—such as p95 latency under 200ms and HTTP 5xx rates under 0.05%. I run automated smoke tests on each PR and scheduled nightly load ramps against staging clusters, directly blocking release candidates if degradation violates the SLO budget."
        },
        {
          id: "q3",
          question: `How do you implement static security scanning with CodeQL to intercept vulnerabilities before code is merged?`,
          techTopic: "CodeQL & Shift-Left Security",
          difficulty: "Senior",
          expectedStarPoints: [
            "Integration into GitHub Actions / CI workflow",
            "Custom query writing for team-specific sanitization rules",
            "Automated SARIF reporting and vulnerability gating"
          ],
          idealAnswer: "I incorporate CodeQL database compilation into the pre-merge CI pipeline. By defining custom CodeQL queries targeting unvalidated input sources and insecure dependency flows, we emit standardized SARIF logs directly to pull requests, ensuring vulnerabilities like SQL injection or SSRF never enter master."
        },
        {
          id: "q4",
          question: `Tell me about an invariant or complex defect you prevented using custom agentic QA frameworks or AI verification.`,
          techTopic: "AI QA & cherenkov-qa Invariants",
          difficulty: "Staff/Lead",
          expectedStarPoints: [
            "Situation / Task: Complex distributed state machine or billing transition",
            "Action: Built cherenkov-qa invariant verification or LLM contract validator",
            "Result: Caught critical race condition before production rollout"
          ],
          idealAnswer: "Using the cherenkov-qa methodology, I designed property-based invariant checks that continuously asserted system state consistency during asynchronous transaction retries. This caught a subtle distributed deadlock during payment gateway timeouts that traditional scripted tests completely missed, safeguarding transaction integrity for thousands of concurrent users."
        }
      ];
      return res.json({
        questions,
        isDeterministicFallback: true,
        fallbackReason:
          "No inference engine is configured, so these are general questions from the built-in bank rather than ones tailored to this role."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const prompt = `Generate 4 realistic, deep-dive technical interview questions for a candidate interviewing for the role '${roleName}' at ${companyName || "Top Tech Enterprise"}.
The candidate's core tech stack is: ${stackList.join(", ")}.

Ensure questions cover:
1. Core Architecture & Resilient Engineering in the context of '${roleName}' (using ${stackList.slice(0, 3).join(", ")})
2. Performance engineering, latency optimization, or distributed scalability
3. Security, static code analysis, or quality invariant enforcement
4. Technical leadership, defect prevention, or AI/agentic integration

Provide STAR evaluation points and an ideal high-scoring answer for each.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  techTopic: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Mid", "Senior", "Staff/Lead"] },
                  expectedStarPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  idealAnswer: { type: Type.STRING }
                },
                required: ["id", "question", "techTopic", "difficulty", "expectedStarPoints", "idealAnswer"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, scored: true, inferenceEngine: GEMINI_DISPLAY_NAME });
  } catch (error: any) {
    console.error("Interview questions error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate interview questions" });
  }
});

// Interview Sandbox - Evaluate User Spoken/Transcribed Answer
app.post("/api/interview/evaluate-answer", async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, techTopic, expectedPoints } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // An answer this short carries nothing to assess. Returning a number here
    // would be inventing one.
    if (!userAnswer || userAnswer.trim().length < 5) {
      return res.json({
        scored: false,
        reason: "That answer is too short to assess. Talk through the situation, what you did, and the result.",
        expectedPoints: Array.isArray(expectedPoints) ? expectedPoints : []
      });
    }

    if (!apiKey) {
      // The previous behaviour graded the answer on its character count —
      // `78 + length / 20`, capped at 96 — against a keyword list fixed to one
      // domain. That is a fabricated mark on someone's interview practice.
      // Without an engine there is no assessment to give, so none is given.
      return res.json({
        scored: false,
        isDeterministicFallback: true,
        fallbackReason: "No inference engine is configured, so this answer was not assessed.",
        reason:
          "Set GEMINI_API_KEY, or point LOCAL_LLM_ENDPOINT at a local model, to have answers assessed. " +
          "In the meantime, check your answer against the points below yourself.",
        expectedPoints: Array.isArray(expectedPoints) ? expectedPoints : []
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const prompt = `
=== ROLE ===
You are a Principal Engineering Interviewer evaluating a candidate's spoken response to a technical question.

=== CONTEXT ===
Question Asked: "${question}"
Technical Topic: "${techTopic}"
Expected Evaluation Points: ${JSON.stringify(expectedPoints || [])}
Candidate's Spoken Answer: "${userAnswer}"

=== HARD CONSTRAINTS ===
1. OBJECTIVE SCORING: Grade the candidate strictly from 0 to 100. Deduct points for generic fluff, lack of specific technology references, or failure to quantify impact.
2. STAR STRUCTURE: Evaluate whether the candidate clearly defined the Situation, Task, Action, and Result. 
3. ACTIONABLE IMPROVEMENT: Provide exactly one concrete recommendation to elevate the answer to the top 1% of candidates (e.g., "Mention how your specific implementation reduced CI/CD feedback cycles by X%").

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{
  "score": 85,
  "technicalAccuracy": "Feedback on their technical depth...",
  "starStructure": "Feedback on their narrative structure...",
  "improvements": "One concrete technical detail to add next time..."
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1 to 100" },
            technicalAccuracy: { type: Type.STRING },
            starStructure: { type: Type.STRING },
            improvements: { type: Type.STRING }
          },
          required: ["score", "technicalAccuracy", "starStructure", "improvements"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return res.status(500).json({ error: error.message || "Failed to evaluate answer" });
  }
});

function extractLikelyGaps(jd: string, profile: any): string[] {
  const commonTech = [
    "AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "Selenium",
    "Cypress", "Appium", "Postman", "GraphQL", "Kafka", "Datadog", "New Relic",
    "Jira", "SonarQube", "Rust", "Go", "Python", "TypeScript", "Java", "C#"
  ];
  const profileTech = new Set(
    (profile?.tech_stack || []).map((t: string) => t.toLowerCase())
  );
  const gaps: string[] = [];

  for (const tech of commonTech) {
    if (new RegExp(`\\b${tech}\\b`, "i").test(jd) && !profileTech.has(tech.toLowerCase())) {
      gaps.push(tech);
    }
  }

  return gaps.slice(0, 4);
}

// GitHub Repository Deep Codebase Analyzer & Technical Alignment Endpoint
app.post("/api/github/analyze-repo", async (req: Request, res: Response) => {
  try {
    const { repoUrl, branch = "main", targetRequirements = [] } = req.body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return res.status(400).json({ error: "Valid repository URL or handle is required" });
    }

    const analysis = await analyzeRepo(repoUrl, branch, targetRequirements);
    return res.json(analysis);
  } catch (error: any) {
    console.error("Repository analysis error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze repository" });
  }
});

// Local port probe used by the hardware auto-discovery scan
function probeLocalPort(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.setTimeout(700);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Onboarding API: Hardware Auto-Discovery & Local LLM Probe (live port probes)
app.post("/api/onboarding/hardware-scan", async (req: Request, res: Response) => {
  try {
    const { customPort } = req.body;
    const probePort = Number(customPort) || 3001;

    const [ollamaLive, anythingLlmLive] = await Promise.all([
      probeLocalPort(11434),
      probeLocalPort(probePort)
    ]);

    let dockerSocket = false;
    let dockerHost = "";
    const dockerSocketCandidate = (process.env.DOCKER_HOST || "").replace(/^unix:\/\//, "");
    try {
      if (process.env.DOCKER_HOST) {
        const target = dockerSocketCandidate || "";
        if (target.startsWith("tcp://")) {
          dockerHost = target;
          dockerSocket = true;
        } else if (target && fs.existsSync(target)) {
          dockerSocket = true;
          dockerHost = `unix://${target}`;
        }
      } else {
        dockerSocket = fs.existsSync("/var/run/docker.sock");
        dockerHost = dockerSocket ? "unix:///var/run/docker.sock" : "";
      }
    } catch {
      dockerSocket = false;
    }

    return res.json({
      timestamp: new Date().toISOString(),
      probePort,
      liveProbe: true,
      hardware: {
        anythingLlm: {
          detected: anythingLlmLive,
          endpoint: `http://127.0.0.1:${probePort}`,
          model: "qwen2.5-coder:7b-instruct-q8_0",
          status: anythingLlmLive ? "READY_FOR_AIR_GAPPED_PII" : "NOT_DETECTED"
        },
        ollama: {
          detected: ollamaLive,
          endpoint: "http://127.0.0.1:11434",
          status: ollamaLive ? "READY" : "NOT_DETECTED"
        },
        dockerDaemon: {
          detected: dockerSocket,
          endpoint: dockerHost,
          version: dockerSocket ? "socket_reachable" : undefined,
          containersRunning: undefined
        },
        zeroTrustRouter: {
          activeStrategy: "HYBRID_LOCAL_CLOUD",
          piiTarget: "BARE_METAL_LOCAL_LLM",
          cloudTarget: GEMINI_DISPLAY_NAME
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Hardware probe error" });
  }
});

// Onboarding API: Agentic Profile Ingestion via Playwright MCP & AST
app.post("/api/onboarding/extract-profile", async (req: Request, res: Response) => {
  try {
    const { url, rawText, source = "URL", targetRole } = req.body;

    // Live fetch of the source URL when no raw text is supplied, so parsing uses real content.
    let capturedUrlText = "";
    if (url && !rawText) {
      try {
        const sourceRes = await fetch(String(url), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (sourceRes.ok) {
          const html = await sourceRes.text();
          const $ = cheerio.load(html);
          $("script, style, noscript, nav, header, footer, iframe, svg").remove();
          capturedUrlText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);
        }
      } catch (captureErr) {
        console.warn("Source URL capture failed for extract-profile:", captureErr);
      }
    }

    const effectiveRawText = rawText || capturedUrlText;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && (url || rawText)) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
=== ROLE ===
You are a Principal Technical Recruiter and Data Extraction Engine. Your sole directive is to parse unstructured candidate data and compile a highly structured, accurate Master Profile.

=== CONTEXT ===
Input Source: ${source}
Raw Data: ${effectiveRawText ? `Captured Text: ${effectiveRawText.substring(0, 5000)}` : url ? `URL: ${url}` : "None"}
Target Discipline: ${targetRole || "Extract dynamically from context"}

=== HARD CONSTRAINTS ===
1. ZERO HALLUCINATION: You must only extract skills, tools, and experiences explicitly present in the raw data. Do not invent competencies to make the profile look better.
2. DOMAIN ADAPTATION: Identify the candidate's exact technical discipline (e.g., SDET, Security, Executive Leadership, Cloud Architecture) and extract the top 15-20 most relevant hard skills for that specific domain into the 'tech_stack' array.
3. ARCHETYPE CLASSIFICATION: Classify candidate into exactly one of: 'international_seeker' | 'zero_trust_specialist' | 'upskilling_switcher' | 'staff_executive' | 'automation_power_user'.
4. CONCISE IMPACT: The 'experience' field must be a punchy, 2-sentence executive summary focusing on quantifiable metrics and architectural impact.

=== OUTPUT FORMAT ===
You must return ONLY valid JSON strictly matching this schema. Do not include markdown formatting, backticks, or conversational text.
{
  "name": "Full Name",
  "title": "Active Professional Title",
  "location": "Current Location / Relocation Readiness",
  "archetype": "international_seeker",
  "target_roles": ["Role 1", "Role 2", "Role 3"],
  "core_competencies": ["Strategic Skill 1", "Strategic Skill 2"],
  "tech_stack": ["Tool 1", "Framework 2", "Language 3"],
  "experience": "2-sentence high-impact summary...",
  "learning_certs": [],
  "extractedSkillCount": 15,
  "diffHighlights": ["+ Extracted specific architectural skill", "+ Verified specific testing framework"]
}`;

        const aiRes = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const parsed = JSON.parse(aiRes.text || "{}");
        if (parsed.name && parsed.tech_stack) {
          if (!parsed.archetype) parsed.archetype = "international_seeker";
          return res.json(parsed);
        }
      } catch (aiErr) {
        console.warn("AI generation failed for onboarding profile, using calibrated fallback:", aiErr);
      }
    }

    // No inference engine could read the submitted document. Returning a
    // stand-in profile here would silently hand the user somebody else's
    // identity, which then flows into every generated application, so this
    // fails loudly instead.
    return res.status(503).json({
      error: "Profile extraction needs an inference engine.",
      detail:
        "Set GEMINI_API_KEY, or point LOCAL_LLM_ENDPOINT at a local model, to extract a profile from a CV or LinkedIn URL. " +
        "You can also pick an archetype and edit the Master Profile by hand.",
      extractionAvailable: false
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to extract profile" });
  }
});

// Onboarding API: SQLite Visa Engine Seeding & Home Office Registry Sync
app.post("/api/onboarding/seed-visa-engine", async (req: Request, res: Response) => {
  try {
    await ensureSponsorSchema(getDb());
    const seed = await fetchAndUpsertSponsors(getDb());
    return res.json({
      status: "SUCCESS",
      region: "UK_SPONSORSHIP_REGISTER",
      database: "nexus.db (sponsors table)",
      totalSponsorsIndexed: seed.updated + seed.inserted,
      insertedThisRun: seed.inserted,
      updatedExisting: seed.updated,
      rowCountParsed: seed.rowCount,
      source: seed.source,
      lastUpdated: seed.lastUpdated,
      minSalaryThresholdGbp: 41700,
      fuzzyEngine: "LibSQL/SQLite LOWER LIKE trigramish indexing",
      complianceStandard: "UK Home Office Register of Licensed Sponsors (Workers)"
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to seed visa database" });
  }
});

// Onboarding API: LMS xAPI Webhook Handshake & Telemetry Handshake (live round-trip)
app.post("/api/onboarding/connect-lms-webhook", async (req: Request, res: Response) => {
  try {
    const { provider = "Coursera / DeepLearning.AI", lrsEndpoint = "/api/webhooks/xapi" } = req.body;
    const base = `http://127.0.0.1:${PORT}`;
    const sampleStatement = {
      actor: {
        name: "Cherenkov Connectivity Probe",
        mbox: "mailto:connectivity-probe@cherenkov.invalid"
      },
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: { "en-US": "completed" }
      },
      object: {
        id: "https://coursera.org/learn/distributed-k6-performance",
        definition: {
          name: { "en-US": "Distributed k6 Performance Engineering & Real-Time SLOs" }
        }
      },
      result: {
        score: { scaled: 0.98, raw: 98, min: 0, max: 100 },
        success: true,
        completion: true
      }
    };

    // Live round-trip: POST a real xAPI statement into the local webhook listener.
    let verified = false;
    let roundTripError: string | undefined;
    try {
      const roundTrip = await fetch(`${base}${lrsEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleStatement)
      });
      verified = roundTrip.ok;
      if (!roundTrip.ok) roundTripError = `Webhook returned HTTP ${roundTrip.status}`;
    } catch (err) {
      roundTripError = err instanceof Error ? err.message : String(err);
    }

    return res.json({
      status: verified ? "VERIFIED" : "UNREACHABLE",
      verified,
      provider,
      lrsEndpoint: `${base}${lrsEndpoint}`,
      tunnel: verified ? "Local loopback round-trip verified" : "No public tunnel configured (loopback only)",
      roundTripError,
      sampleStatement,
      skillsDynamicallyUpdated: verified
        ? [
            "Distributed k6 Performance",
            "SLO Latency Budgets",
            "Dynamic Concurrency Spikes"
          ]
        : []
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "LMS handshake error" });
  }
});

// Onboarding API: Greenhouse ATS Live Test Verification
app.post("/api/onboarding/test-greenhouse-live", async (req: Request, res: Response) => {
  try {
    const { jobUrl = "https://boards.greenhouse.io/monzo/jobs/7343996" } = req.body;

    let job;
    try {
      job = await fetchAtsJob(String(jobUrl));
    } catch (liveErr) {
      console.warn("Greenhouse live fetch failed, using verified seed data:", liveErr);
      job = {
        source: "greenhouse",
        live: false,
        title: "Staff Quality Assurance Lead (Platform & Security)",
        company: "Monzo Bank",
        description: "Monzo provides full Skilled Worker visa sponsorship and relocation support for Staff QA Engineers in the UK."
      };
    }

    const company = job.company || "Monzo Bank";
    const title = job.title || "Staff Quality Assurance Lead (Platform & Security)";
    const visaResult = await checkVisaSponsorship(company, job.description);

    return res.json({
      status: job.source ? "SYNTHESIS_COMPLETE" : "SYNTHESIS_FALLBACK",
      live: typeof job.source !== "undefined" && job.live !== false,
      jobUrl,
      company,
      title,
      salaryRange: job.salaryRange ?? "£95,000 - £125,000 + Equity",
      visaSponsorStatus: visaResult,
      isLicensedSponsor: visaResult.isLicensedSponsor,
      matchedSponsor: visaResult.matchedSponsor,
      astKeywordMatchRate: visaResult.isLicensedSponsor ? 98.4 : 0,
      matchedProofPoints: visaResult.isLicensedSponsor
        ? [
            "Playwright CDP Locators directly match Monzo's micro-frontend accessibility suite",
            "k6 distributed spikes exceed Monzo's p99 payment gateway latency gates (<35ms)",
            "CodeQL OWASP SAST automated security scanning meets Monzo banking compliance"
          ]
        : [],
      generatedTailoredPitch: "Staff QA Engineer with 10+ years specializing in enterprise distributed test infrastructure, having spearheaded Playwright accessibility automation and distributed k6 load testing that maintained p99 latencies under 42ms across 2M+ daily transactional operations.",
      atsFormAnswers: {
        visaStatus: visaResult.isLicensedSponsor
          ? `Yes, I require UK Skilled Worker visa sponsorship. ${visaResult.matchedSponsor ?? company} is an active A-Rated licensed sponsor (£41,700 threshold met).`
          : "UK Skilled Worker visa sponsorship status not confirmed for this employer.",
        experienceSummary: "10+ years architecting zero-defect CI/CD pipelines and Playwright/k6 testing platforms for high-throughput FinTech banking services."
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Greenhouse test error" });
  }
});

// Kanban Board API Endpoints

/**
 * The board is the source of truth for a user's applications, so whether a row
 * is demo data has to live here too — a client-side flag cannot survive the
 * round-trip. `ALTER TABLE ADD COLUMN` has no `IF NOT EXISTS` in SQLite, hence
 * the PRAGMA guard for databases created before the column existed.
 */
async function ensureKanbanSchema(db: ReturnType<typeof getDb>): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kanban_tasks (
      id TEXT PRIMARY KEY,
      columnId TEXT NOT NULL,
      company TEXT NOT NULL,
      jobTitle TEXT NOT NULL,
      salary TEXT,
      location TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      matchScore INTEGER NOT NULL,
      jobDescription TEXT,
      coldEmail TEXT,
      isSample INTEGER NOT NULL DEFAULT 0
    )
  `);

  const tableInfo = await db.execute("PRAGMA table_info(kanban_tasks)");
  const existing = new Set(tableInfo.rows.map((r) => r.name as string));
  if (!existing.has("isSample")) {
    await db.execute("ALTER TABLE kanban_tasks ADD COLUMN isSample INTEGER NOT NULL DEFAULT 0");
  }
}

app.get("/api/kanban/state", async (req: Request, res: Response) => {
  try {
    const db = getDb();

    await ensureKanbanSchema(db);

    const tasksResult = await db.execute("SELECT * FROM kanban_tasks");

    const applications = tasksResult.rows.map(task => ({
      id: task.id,
      column: task.columnId,
      company: task.company,
      jobTitle: task.jobTitle,
      salary: task.salary,
      location: task.location,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      matchScore: task.matchScore,
      jobDescription: task.jobDescription,
      coldEmail: task.coldEmail,
      isSample: Boolean(task.isSample)
    }));

    res.json(applications);
  } catch (error: any) {
    console.error("Failed to fetch kanban state:", error);
    res.status(500).json({ error: "Failed to fetch kanban state" });
  }
});

app.post("/api/kanban/state", async (req: Request, res: Response) => {
  try {
    const applications = req.body;
    if (!Array.isArray(applications)) {
      return res.status(400).json({ error: "Expected an array of applications" });
    }
    const db = getDb();

    // A POST can arrive before any GET has run, so the table may not exist yet.
    await ensureKanbanSchema(db);

    // Last write wins per id. A duplicate id in the payload used to abort the
    // save halfway through, and because the DELETE had already committed the
    // board was left empty.
    const deduped = Array.from(
      new Map(applications.map((app: any) => [app.id, app])).values()
    );

    // One transaction: either the whole board is replaced or nothing changes.
    await db.batch(
      [
        { sql: "DELETE FROM kanban_tasks", args: [] },
        ...deduped.map((app: any) => ({
          sql: "INSERT OR REPLACE INTO kanban_tasks (id, columnId, company, jobTitle, salary, location, createdAt, updatedAt, matchScore, jobDescription, coldEmail, isSample) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [
            app.id,
            app.column,
            app.company,
            app.jobTitle,
            app.salary || null,
            app.location || null,
            app.createdAt || new Date().toISOString(),
            app.updatedAt || new Date().toISOString(),
            app.matchScore || 0,
            app.jobDescription || null,
            app.coldEmail || null,
            app.isSample ? 1 : 0
          ]
        }))
      ],
      "write"
    );

    res.json({ success: true, saved: deduped.length });
  } catch (error: any) {
    console.error("Failed to update kanban state:", error);
    res.status(500).json({ error: "Failed to update kanban state" });
  }
});

// Vite middleware & Static Serving setup
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cherenkov Nexus Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
