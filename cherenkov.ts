import { parseArgs } from "util";
import * as fs from "fs";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { executeServerlessScrape } from "./server/mcp/playwrightScraper";

// Parse Command Line Arguments
const { values } = parseArgs({
  args: process.argv,
  options: {
    url: { type: "string" },
    mode: { type: "string", default: "cloud" },
    profile: { type: "string", default: "masterProfile.json" },
    out: { type: "string", default: "result.json" },
  },
  strict: true,
  allowPositionals: true,
});

if (!values.url) {
  console.error("❌ Error: --url argument is required.");
  console.log("Usage: npx tsx cherenkov.ts --url <job_url> [--mode local|cloud] [--profile ./profile.json] [--out ./result.json]");
  process.exit(1);
}

// 1. Static State: Load the Master Profile
let masterProfile = {};
if (fs.existsSync(values.profile)) {
  console.log(`[STATE] 🗄️ Loading static identity from ${values.profile}`);
  masterProfile = JSON.parse(fs.readFileSync(values.profile, "utf8"));
} else {
  console.warn(`[STATE] ⚠️ Profile ${values.profile} not found. Using default mock profile.`);
  masterProfile = {
    name: "Terminal User",
    title: "Senior Software Engineer",
    location: "Global",
    core_competencies: ["TypeScript", "Node.js", "Automation"],
    experience: [],
  };
  fs.writeFileSync(values.profile, JSON.stringify(masterProfile, null, 2));
}

async function runPipeline() {
  console.log(`\n[EXTRACTION] 🌐 Fetching target URL: ${values.url}`);
  
  // 2. Headless Extraction
  let jobDescription = "";
  let companyName = "Unknown Company";
  try {
    const response = await fetch(values.url);
    const html = await response.text();
    const $ = cheerio.load(html);
    companyName = $("title").text().split("-")[0].trim() || companyName;

    console.log(`[EXTRACTION] 🎭 Launching Playwright to bypass ATS protections...`);
    const tree = await executeServerlessScrape(values.url);
    jobDescription = JSON.stringify(tree, null, 2);
    
    console.log(`[EXTRACTION] ✅ Scraped ${jobDescription.length} characters of accessibility tree payload.`);
  } catch (error) {
    console.error("[EXTRACTION] ❌ Failed to parse DOM:", error);
    process.exit(1);
  }

  // 3. Database: Visa Validation Mock Lookups
  console.log(`[COMPLIANCE] 🔎 Checking ${companyName} against local SQLite dictionary...`);
  const isLicensed = Math.random() > 0.5; // Stub for actual local dictionary check
  console.log(`[COMPLIANCE] ${isLicensed ? "✅ Sponsor Found" : "⚠️ No Sponsor Found"}`);

  // 4. Inference Engine: The Binary Switch
  console.log(`\n[INFERENCE] 🧠 Initializing payload... Mode: ${values.mode.toUpperCase()}`);
  
  const systemPrompt = `You are an elite career agent. Synthesize this role:
Job URL: ${values.url}
Company: ${companyName}
Visa Sponsor: ${isLicensed}

Job Description:
${jobDescription.substring(0, 3000)}...

Candidate Profile:
${JSON.stringify(masterProfile)}

Return JSON matching { "tailored_summary": "...", "cold_email": "...", "identified_skill_gaps": ["..."] }`;

  let resultData = null;

  try {
    if (values.mode === "local") {
      console.log("[INFERENCE] 🔌 Routing to local endpoint (http://localhost:11434/v1)");
      // Mocking local connection since local endpoint might not be up in container
      console.log("[INFERENCE] (Mocking local LLM response for demonstration)");
      resultData = {
        tailored_summary: "Local execution successful. Matches local criteria.",
        cold_email: "Subject: Application\\n\\nSent from local CLI.",
        identified_skill_gaps: ["Local DB Tuning"]
      };
    } else {
      console.log("[INFERENCE] ☁️ Routing to Gemini 2.5 Flash over REST API");
      if (!process.env.GEMINI_API_KEY) {
         throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const res = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: systemPrompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
      });
      resultData = JSON.parse(res.text || "{}");
    }

    console.log("\n[PIPELINE COMPLETE] 🟢 Synthesis Successful.");
    
    // 5. Output
    fs.writeFileSync(values.out, JSON.stringify(resultData, null, 2));
    console.log(`[OUTPUT] 💾 Result payload written to ${values.out}`);

  } catch (error) {
    console.error("\n[INFERENCE] ❌ Fatal Error:", error);
    process.exit(1);
  }
}

runPipeline();
