import { createClient } from "@libsql/client";

const SPONSORS_DATABASE = [
  { name: "Google", aliases: ["Google UK Ltd", "Alphabet", "Google DeepMind", "DeepMind"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Monzo Bank", aliases: ["Monzo", "Monzo Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Revolut", aliases: ["Revolut Ltd", "Revolut Technologies"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Amazon", aliases: ["AWS", "Amazon UK Services Ltd", "Amazon Web Services"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Microsoft", aliases: ["Microsoft Limited", "Microsoft UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Meta", aliases: ["Meta Platforms Ireland Ltd", "Facebook UK Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Bloomberg", aliases: ["Bloomberg LP", "Bloomberg Finance"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Deliveroo", aliases: ["Roofoods Ltd", "Deliveroo UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Wise", aliases: ["TransferWise", "Wise Payments Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Checkout.com", aliases: ["Checkout Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Spotify", aliases: ["Spotify Ltd", "Spotify AB"], region: "EU", licenseType: "EU Relocation / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Stripe", aliases: ["Stripe Payments Europe Ltd", "Stripe UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Arm", aliases: ["ARM Holdings", "Arm Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Graphcore", aliases: ["Graphcore Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Klarna", aliases: ["Klarna Bank AB", "Klarna UK"], region: "EU", licenseType: "EU Blue Card", rating: "Verified", minSalaryThresholdGbp: 41700 },
  { name: "Booking.com", aliases: ["Booking.com B.V.", "Booking Holdings"], region: "Netherlands", licenseType: "Highly Skilled Migrant (30% Ruling)", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "ASML", aliases: ["ASML Netherlands B.V."], region: "Netherlands", licenseType: "Highly Skilled Migrant", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "Adyen", aliases: ["Adyen N.V."], region: "Netherlands", licenseType: "Highly Skilled Migrant", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "Zalando", aliases: ["Zalando SE"], region: "Germany", licenseType: "EU Blue Card (§18b AufenthG)", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "Personio", aliases: ["Personio SE & Co. KG"], region: "Germany", licenseType: "EU Blue Card", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "N26", aliases: ["N26 AG", "N26 Bank"], region: "Germany", licenseType: "EU Blue Card", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "Starling Bank", aliases: ["Starling Bank Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Palantir", aliases: ["Palantir Technologies UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Canonical", aliases: ["Canonical Group Ltd", "Ubuntu"], region: "UK", licenseType: "Skilled Worker (Global Remote)", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Datadog", aliases: ["Datadog UK", "Datadog SAS"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "GitLab", aliases: ["GitLab Inc", "GitLab B.V."], region: "EU", licenseType: "Global Remote / Visa Transfer", rating: "Verified", minSalaryThresholdGbp: 41700 },
  { name: "GitHub", aliases: ["GitHub UK Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Shopify", aliases: ["Shopify UK", "Shopify Inc"], region: "UK", licenseType: "Global Remote / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Cloudflare", aliases: ["Cloudflare Limited"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Snowflake", aliases: ["Snowflake Computing UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Twilio", aliases: ["Twilio UK Ltd", "Twilio Ireland"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Bolt", aliases: ["Bolt Technology OU", "Bolt Services UK"], region: "EU", licenseType: "EU Blue Card / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 }
];

async function seedDatabase() {
  const db = createClient({
    url: "file:C:/Users/moaid/.gemini/antigravity/brain/a4923698-19de-46e2-9bf7-9960557bcad1/scratch/nexus.db",
  });

  console.log("🌱 Initializing local SQLite database 'nexus.db'...");

  // Create table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aliases TEXT NOT NULL,
      region TEXT NOT NULL,
      licenseType TEXT NOT NULL,
      rating TEXT NOT NULL,
      minSalaryThresholdGbp INTEGER NOT NULL
    )
  `);

  // Clear existing data to prevent duplicates
  await db.execute(`DELETE FROM sponsors`);

  console.log("📝 Inserting Sponsor Records...");

  // Insert data
  for (const sponsor of SPONSORS_DATABASE) {
    await db.execute({
      sql: `INSERT INTO sponsors (name, aliases, region, licenseType, rating, minSalaryThresholdGbp) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        sponsor.name,
        sponsor.aliases.join(","),
        sponsor.region,
        sponsor.licenseType,
        sponsor.rating,
        sponsor.minSalaryThresholdGbp
      ]
    });
  }

  // Create table for kanban board state if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kanban_columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      color TEXT NOT NULL,
      orderIndex INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS kanban_tasks (
      id TEXT PRIMARY KEY,
      columnId TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      salary TEXT,
      location TEXT,
      timestamp TEXT NOT NULL,
      visaStatus TEXT NOT NULL,
      orderIndex INTEGER NOT NULL
    )
  `);

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seedDatabase().catch(console.error);
