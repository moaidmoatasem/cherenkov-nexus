import { mcpHost, ensureMcpConnectivity } from "./mcp/host";

interface ProofPoint {
  domain: string;
  metric: string;
  filePath: string;
  evidence: string;
  snippet?: string;
}

export interface RepoAnalysis {
  live: boolean;
  note?: string;
  repoName: string;
  owner: string;
  repo: string;
  branch: string;
  commitHash?: string;
  lastAnalyzed: string;
  alignmentScore: number;
  detectedArchitecture: Record<string, string>;
  codeProofPoints: ProofPoint[];
  extractedSkills: string[];
  alignmentSummary: string;
  raw?: {
    rootFiles: string[];
    workflows: string[];
    packageDeps?: string[];
    commitCount?: number;
  };
}

interface ToolCallResult {
  ok: boolean;
  content?: string;
  error?: string;
}

async function callTool(tool: string, args: Record<string, unknown>): Promise<ToolCallResult> {
  return mcpHost.callTool(tool, args);
}

function decodePayload(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return text;
  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

function extractFileText(payload: unknown): string | undefined {
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) return undefined;
  const obj = payload as Record<string, unknown>;
  if (obj.content && typeof obj.content === "string") return obj.content;
  if (obj.name && typeof obj.name === "string") return JSON.stringify(obj);
  return undefined;
}

function extractListing(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.map((e) =>
      String((e as Record<string, unknown>).name ?? "").replace(/\/$/, "")
    ).filter(Boolean);
  }
  if (typeof payload === "string") {
    return payload.split("\n").map((s) => s.trim()).filter((s) => s.length > 0 && !s.includes(":"));
  }
  return [];
}

function normalizeRepo(repoUrl: string): { owner: string; repo: string } {
  const clean = repoUrl
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
  const [owner, repo] = clean.split("/");
  return { owner: owner ?? clean, repo: repo ?? clean };
}

function detectSkills(depsText: string, fileStack: string[]): string[] {
  const haystack = `${depsText}\n${fileStack.join("\n")}`.toLowerCase();
  const skills: string[] = [];
  const matchers: Array<[RegExp, string]> = [
    [/\bplaywright\b/, "Playwright"],
    [/cypress/, "Cypress"],
    [/jest|vitest|mocha/, "Automated Unit/Integration Testing"],
    [/k6\b|load test/, "k6 Load Profiling"],
    [/codeql|sast|semgrep|dependency.?.check/, "SAST & Dependency Security"],
    [/github actions|\.github\/workflows|\bci\.ya?ml\b/, "GitHub Actions CI/CD"],
    [/dockerfile|docker/, "Docker"],
    [/kubernetes|k8s|helm/, "Kubernetes"],
    [/typescript|tsconfig/, "TypeScript"],
    [/react|next\.js|next/, "React / Next.js"],
    [/graphql/, "GraphQL"],
    [/model context protocol|\bmcp\b/, "Model Context Protocol (MCP)"],
    [/travis|jenkins|pipeline/, "Continuous Integration Pipelines"],
    [/locust|gatling/, "Performance Test Tooling"],
    [/allure|report-portal/, "Test Reporting / Allure"],
  ];
  for (const [re, label] of matchers) {
    if (re.test(haystack) && !skills.includes(label)) skills.push(label);
  }
  return skills;
}

function pickMetricEvidence(evidence: string): string {
  const lines = evidence.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return lines.slice(0, 5).join("\n") || evidence;
}

export async function analyzeRepo(
  repoUrl: string,
  branch = "main",
  _targetRequirements: string[] = []
): Promise<RepoAnalysis> {
  const { owner, repo } = normalizeRepo(repoUrl);
  const base = {
    owner,
    repo,
    repoName: `${owner}/${repo}`,
    branch,
    lastAnalyzed: new Date().toISOString(),
  };

  try {
    await ensureMcpConnectivity();
  } catch (err) {
    return {
      ...base,
      live: false,
      note: `MCP host unavailable: ${err instanceof Error ? err.message : err}`,
      alignmentScore: 0,
      detectedArchitecture: {},
      codeProofPoints: [],
      extractedSkills: [],
      alignmentSummary: `Unable to reach the GitHub MCP connector — no live analysis performed for ${owner}/${repo}.`,
    };
  }

  const rootCall = await callTool("get_file_contents", { owner, repo, path: "", branch });
  if (!rootCall.ok) {
    return {
      ...base,
      live: false,
      note: `GitHub fetch failed: ${rootCall.error ?? "unknown error"}`,
      alignmentScore: 0,
      detectedArchitecture: {},
      codeProofPoints: [],
      extractedSkills: [],
      alignmentSummary: `Could not fetch ${owner}/${repo} through the GitHub MCP connector (${rootCall.error ?? "no error message"}).`,
    };
  }

  const rootFiles = extractListing(decodePayload(rootCall.content ?? ""));
  const workflows: string[] = [];
  const maybeWorkflow = await callTool("get_file_contents", {
    owner,
    repo,
    path: ".github/workflows",
    branch,
  });
  if (maybeWorkflow.ok) {
    const wfListing = extractListing(decodePayload(maybeWorkflow.content ?? ""));
    workflows.push(
      ...wfListing
        .filter((f) => /\.(ya?ml)$/i.test(f))
        .map((f) => `.github/workflows/${f}`)
    );
  }

  const interestingFiles: string[] = [".github/workflows", ...rootFiles]
    .filter((p) =>
      /(^|\/)(package\.json|pyproject\.toml|go\.mod|requirements\.txt|Cargo\.toml|pom\.xml|docker-compose\.ya?ml|Dockerfile|.*\.ya?ml)$/.test(p)
    )
    .slice(0, 4);

  const depsParts: string[] = [];
  const proofPoints: ProofPoint[] = [];

  for (const filePath of interestingFiles) {
    const call = await callTool("get_file_contents", { owner, repo, path: filePath, branch });
    if (!call.ok) continue;
    const text = extractFileText(decodePayload(call.content ?? ""));
    if (!text) continue;
    if (/package\.json$/.test(filePath)) {
      try {
        const pkg = JSON.parse(text);
        const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, string>;
        depsParts.push(Object.keys(allDeps).join("\n"));
        if (Object.keys(allDeps).length > 0) {
          proofPoints.push({
            domain: "Dependency Surface",
            metric: `${Object.keys(allDeps).length} direct packages declared`,
            filePath,
            evidence: pickMetricEvidence(
              Object.entries(allDeps).slice(0, 8).map(([k, v]) => `${k}@${v}`).join("\n")
            ),
          });
        }
      } catch {
        /* not JSON */
      }
    } else {
      proofPoints.push({
        domain: filePath.startsWith(".github") ? "CI/CD Pipelines" : "Infrastructure as Code",
        metric: "Explicit config committed to repository",
        filePath,
        evidence: pickMetricEvidence(text),
      });
    }
  }

  let commitHash: string | undefined;
  let commitCount: number | undefined;
  const commitCall = await callTool("list_commits", { owner, repo, perPage: 1 });
  if (commitCall.ok) {
    const payload = decodePayload(commitCall.content ?? "");
    if (Array.isArray(payload) && payload.length > 0) {
      const first = payload[0] as Record<string, unknown>;
      commitHash = String((first.sha as string) ?? "").slice(0, 7);
    }
  }
  const commitListCall = await callTool("list_commits", { owner, repo, perPage: 1, page: 1 });
  if (commitListCall.ok) {
    const payload = decodePayload(commitListCall.content ?? "");
    if (Array.isArray(payload)) commitCount = payload.length;
  }

  if (workflows.length > 0) {
    proofPoints.push({
      domain: "CI/CD Gateways",
      metric: `${workflows.length} workflow(s) detected`,
      filePath: workflows.join(", "),
      evidence: "GitHub Actions workflows committed to the repository.",
    });
  }

  const depsText = depsParts.join("\n");
  const extractedSkills = detectSkills(depsText, [...rootFiles, ...workflows, ...interestingFiles]);

  const architecture: Record<string, string> = {};
  if (/(^|\/)dependencies?\s*:|\bplaywright\b/.test(depsText)) architecture.e2eFramework = "Playwright browser test stack";
  if (workflows.some((w) => /codeql|security/i.test(w))) architecture.sastEngine = "GitHub CodeQL security scanning";
  if (workflows.length > 0) architecture.ciPipeline = `GitHub Actions (${workflows.length} workflows)`;
  if (/model context protocol|\bmcp\b/i.test(depsText)) architecture.agenticAi = "Model Context Protocol (MCP)";
  if (Object.keys(architecture).length === 0) architecture.e2eFramework = "Unverified (live evidence pending)";

  const score = Math.min(
    99,
    Math.round(40 + extractedSkills.length * 6 + (proofPoints.length > 0 ? 15 : 0) + (commitHash ? 10 : 0))
  );

  return {
    ...base,
    live: true,
    commitHash,
    alignmentScore: Math.max(score, 0),
    detectedArchitecture: architecture,
    codeProofPoints: proofPoints,
    extractedSkills,
    alignmentSummary:
      `Live analysis of ${owner}/${repo} via the GitHub MCP connector on branch '${branch}' resolved ${rootFiles.length} root entries, ` +
      `${proofPoints.length} evidence fragments, and ${extractedSkills.length} skill matches (alignment score ${score}).`,
    raw: {
      rootFiles,
      workflows,
      packageDeps: depsParts,
      commitCount,
    },
  };
}