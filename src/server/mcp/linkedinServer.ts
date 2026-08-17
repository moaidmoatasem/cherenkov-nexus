import {
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, type BrowserContext } from "playwright-core";

export interface LinkedinScoutOutcome {
  status: "ok" | "simulated" | "error";
  statusReason?: string;
  recruiter_profile_status: "live" | "simulated";
  targetProfile: {
    publicId?: string;
    url?: string;
    fullName?: string;
    headline?: string;
    location?: string;
    about?: string;
    connections?: number;
  };
  networkingPlan?: string[];
  error?: string;
}

interface ScoutArgs {
  publicId?: string;
  url?: string;
  contactEmail?: string;
  contactLinkedinUrl?: string;
}

function loadCookies(): { name: string; value: string; domain: string; path: string }[] | undefined {
  const raw = process.env.LINKEDIN_COOKIES_JSON;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
    return parsed.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? "/",
    }));
  } catch (err) {
    console.warn("[LinkedInScout] LINKEDIN_COOKIES_JSON parse failed:", err);
    return undefined;
  }
}

function resolveTargetUrl(publicId?: string, url?: string): string {
  if (url) return url;
  const id = (publicId ?? "").trim();
  if (!id) return "";
  return `https://www.linkedin.com/in/${id}/`;
}

async function liveScrape(targetUrl: string): Promise<LinkedinScoutOutcome | undefined> {
  const cookies = loadCookies();
  if (!cookies) return undefined;
  let context: BrowserContext | undefined;
  try {
    const browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3500);

    const fullName = await page
      .locator("h1")
      .first()
      .innerText()
      .catch(() => "");
    const headline = await page
      .locator("div.text-body-medium")
      .first()
      .innerText()
      .catch(() => "");
    const location = await page
      .locator('span[class*="location"]')
      .first()
      .innerText()
      .catch(() => "");

    const canSeeProfile = Boolean(fullName && fullName.trim().length > 0);
    const about = await page
      .locator('section[data-section-id="about"] p.attributed-text-segment-list__content')
      .first()
      .innerText()
      .catch(() => "");

    await browser.close();
    return {
      status: canSeeProfile ? "ok" : "simulated",
      statusReason: canSeeProfile ? "Live LinkedIn profile fetched" : "Cookie session could not resolve a full profile view",
      recruiter_profile_status: canSeeProfile ? "live" : "simulated",
      targetProfile: {
        url: targetUrl,
        fullName: fullName.trim(),
        headline: headline.trim(),
        location: location.trim(),
        about: about.trim(),
      },
    };
  } catch (err) {
    if (context) await context.close().catch(() => {});
    console.warn(`[LinkedInScout] live scrape failed (${err instanceof Error ? err.message : err}); falling back to simulation`);
    return undefined;
  }
}

function simulatedScout(args: ScoutArgs): LinkedinScoutOutcome {
  const targetUrl = resolveTargetUrl(args.publicId, args.url);
  const publicId = args.publicId ?? (targetUrl.match(/\/in\/([^/?#]+)/)?.[1] ?? "");
  return {
    status: "simulated",
    statusReason: "LinkedIn live scraping requires a session cookie. Launch with LINKEDIN_COOKIES_JSON to enable live mode.",
    recruiter_profile_status: "simulated",
    targetProfile: {
      publicId: publicId || undefined,
      url: targetUrl || undefined,
      fullName: "Unavailable (simulated)",
    },
    networkingPlan: [
      `Send a concise, role-relevant connection request emphasizing mutual context (${publicId || "target profile"}).`,
      "Reference a specific skill or project from the target role to exceed the 300-character connection note limit intelligently.",
      "Follow up once after acceptance with a structured 3-bullet outreach referencing the specific role.",
    ],
  };
}

export function createLinkedInMcpServer(): Server {
  const server = new Server(
    { name: "cherenkov-linkedin", version: "2.5.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "linkedin_scout_profile",
        description:
          "Scout a LinkedIn profile for networking outreach. Uses a live authenticated session when LINKEDIN_COOKIES_JSON is present, otherwise returns simulated recruiting intel. Always reports recruiter_profile_status = live | simulated.",
        inputSchema: {
          type: "object",
          properties: {
            publicId: { type: "string", description: "LinkedIn public identifier, e.g. 'moayed-badawy'" },
            url: { type: "string", description: "Full public profile URL (alternative to publicId)" },
            contactEmail: { type: "string", description: "Optional email to include in the networking plan" },
            contactLinkedinUrl: { type: "string", description: "Optional outreach profile URL" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = request.params.name;
    if (tool !== "linkedin_scout_profile") {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${tool}` }) }],
        isError: true,
      };
    }
    const args = (request.params.arguments ?? {}) as ScoutArgs;
    const targetUrl = resolveTargetUrl(args.publicId, args.url);
    if (!targetUrl) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Provide publicId or url" }) }],
        isError: true,
      };
    }
    const live = await liveScrape(targetUrl);
    const outcome = live ?? simulatedScout(args);
    return { content: [{ type: "text", text: JSON.stringify(outcome, null, 2) }] };
  });

  return server;
}