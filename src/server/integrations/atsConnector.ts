import * as cheerio from "cheerio";

export interface AtsJob {
  source: "greenhouse" | "lever" | "ashby" | "generic";
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  description: string;
  applyUrl?: string;
  isVisaSponsored: boolean;
  raw?: unknown;
}

const VISA_SIGNALS = [
  "visa sponsorship",
  "tier 2",
  "skilled worker visa",
  "sponsorship available",
  "sponsorship provided",
  "relocation support",
  "relocation package",
  "eligible for visa",
];

function stripHtml(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $("body").length ? $("body").text().replace(/\s+/g, " ").trim() : html.trim();
}

function visaFlag(text: string): boolean {
  const hay = text.toLowerCase();
  return VISA_SIGNALS.some((s) => hay.includes(s));
}

function extractGreenhouseJob(url: URL): Promise<AtsJob> | AtsJob {
  const segments = url.pathname.split("/").filter(Boolean); // [company, jobs, id]
  const company = segments[0];
  const id = url.pathname.match(/\/jobs\/(\d+)/)?.[1];
  if (!company || !id) {
    return {
      source: "greenhouse",
      title: "Unknown",
      company: company ?? "",
      description: "",
      isVisaSponsored: false,
    };
  }
  return (async () => {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${id}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "CherenkovNexus/2.0 (ATS connector)" } });
    if (!res.ok) throw new Error(`Greenhouse API returned ${res.status}`);
    const job = (await res.json()) as Record<string, unknown>;
    const content = String(job.content ?? "");
    const locationObj = job.location as Record<string, unknown> | undefined;
    const metadata = Array.isArray(job.metadata) ? (job.metadata as Array<{ name: string; value: string }>) : [];
    const salary = metadata.find((m) => /compensation|salary/i.test(m.name))?.value;
    return {
      source: "greenhouse",
      title: String(job.title ?? ""),
      company: String(job.company_name ?? company),
      location: [locationObj?.name, locationObj?.city, locationObj?.state, locationObj?.country]
        .filter(Boolean)
        .join(", "),
      salaryRange: salary,
      description: stripHtml(content),
      applyUrl: String(job.absolute_url ?? url.href),
      isVisaSponsored: visaFlag(stripHtml(content) + " " + String(job.title ?? "")),
      raw: { id, company },
    };
  })();
}

function extractLeverJob(url: URL): Promise<AtsJob> | AtsJob {
  const segments = url.pathname.split("/").filter(Boolean); // [company, id]
  const company = segments[0];
  const id = segments[1];
  if (!company || !id) {
    return {
      source: "lever",
      title: "Unknown",
      company: company ?? "",
      description: "",
      isVisaSponsored: false,
    };
  }
  return (async () => {
    const apiUrl = `https://api.lever.co/v0/postings/${company}/${id}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "CherenkovNexus/2.0 (ATS connector)" } });
    if (!res.ok) throw new Error(`Lever API returned ${res.status}`);
    const posting = (await res.json()) as Record<string, unknown>;
    const text = stripHtml(String(posting.description ?? "")) + " " + String(posting.additional ?? "");
    const salary = String(posting.salaryRange ?? "").trim() || undefined;
    return {
      source: "lever",
      title: String(posting.text ?? posting.title ?? ""),
      company: String(posting.company ?? company),
      location: String((posting.categories as Record<string, unknown> | undefined)?.location ?? ""),
      salaryRange: salary,
      description: text,
      applyUrl: String(posting.hostedUrl ?? url.href),
      isVisaSponsored: visaFlag(text),
      raw: { id, company },
    };
  })();
}

function extractAshbyJob(url: URL): Promise<AtsJob> | AtsJob {
  const segments = url.pathname.split("/").filter(Boolean); // [company, id?]
  const company = segments[0];
  const id = segments[1];
  if (!company) {
    return {
      source: "ashby",
      title: "Unknown",
      company: "",
      description: "",
      isVisaSponsored: false,
    };
  }
  if (!id) {
    return (async () => {
      const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${company}`;
      const res = await fetch(apiUrl, { headers: { "User-Agent": "CherenkovNexus/2.0 (ATS connector)" } });
      if (!res.ok) throw new Error(`Ashby API returned ${res.status}`);
      const data = (await res.json()) as { jobs?: Array<{ id: string; title: string; location: string }> };
      const jobs = data.jobs ?? [];
      return {
        source: "ashby",
        title: `${jobs.length} open roles`,
        company,
        description: `Ashby board for ${company} lists ${jobs.length} open roles.`,
        applyUrl: url.href,
        isVisaSponsored: false,
        raw: { jobCount: jobs.length },
      };
    })();
  }
  return (async () => {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${company}/job/${id}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "CherenkovNexus/2.0 (ATS connector)" } });
    if (!res.ok) throw new Error(`Ashby API returned ${res.status}`);
    const data = (await res.json()) as { job?: Record<string, unknown> };
    const job = data.job ?? {};
    const text = stripHtml(String(job.descriptionHtml ?? job.description ?? "")) + " " + String(job.descriptionPlain ?? "");
    return {
      source: "ashby",
      title: String(job.title ?? ""),
      company: String(job.companyName ?? company),
      location: String(job.location ?? ""),
      salaryRange:
        String((job.compensation as Record<string, unknown> | undefined)?.description ?? "").trim() || undefined,
      description: text,
      applyUrl: String(job.jobUrl ?? url.href),
      isVisaSponsored: visaFlag(text),
      raw: { id, company },
    };
  })();
}

export function identifyHost(url: string): "greenhouse" | "lever" | "ashby" | "generic" {
  const host = hostnameOf(url);
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  if (host.includes("ashbyhq.com")) return "ashby";
  return "generic";
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function fetchAtsJob(url: string): Promise<AtsJob> {
  const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host.includes("greenhouse.io")) {
    const result = extractGreenhouseJob(parsed);
    return result instanceof Promise ? await result : result;
  }
  if (host.includes("lever.co")) {
    const result = extractLeverJob(parsed);
    return result instanceof Promise ? await result : result;
  }
  if (host.includes("ashbyhq.com")) {
    const result = extractAshbyJob(parsed);
    return result instanceof Promise ? await result : result;
  }
  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Generic fetch returned ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer, iframe").remove();
  return {
    source: "generic",
    title: $("h1").first().text().trim() || $("title").text().trim(),
    company:
      $(".company-name").first().text().trim() ||
      $('meta[property="og:site_name"]').attr("content") ||
      "",
    description: $("body").text().replace(/\s+/g, " ").trim(),
    applyUrl: parsed.toString(),
    isVisaSponsored: false,
  };
}