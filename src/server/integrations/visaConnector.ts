import { getDb } from "../db";
import { parse } from "csv-parse/sync";

export interface RegisterRow {
  organisationName: string;
  town?: string;
  county?: string;
  typeAndRating?: string;
  route?: string;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
}

export interface SeedResult extends UpsertResult {
  source: string;
  lastUpdated: string;
  rowCount: number;
}

const REGISTER_PAGE =
  "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findHeaderIndex(headers: string[], needles: string[]): number | undefined {
  const normalized = headers.map(normalizeHeader);
  const normNeedles = needles.map(normalizeHeader);
  const idx = normalized.findIndex((h) =>
    normNeedles.some((n) => h === n || h.includes(n) || n.includes(h))
  );
  return idx >= 0 ? idx : undefined;
}

export async function resolveRegisterCsvUrl(): Promise<string> {
  const res = await fetch(REGISTER_PAGE, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CherenkovNexus/2.0)" },
  });
  if (!res.ok) throw new Error(`gov.uk register page returned ${res.status}`);
  const html = await res.text();
  const csvUrls = [...html.matchAll(/href="([^"]+\.csv)"/gi)].map((m) => m[1]);
  if (csvUrls.length === 0) throw new Error("No CSV attachment found on the gov.uk register page");
  return new URL(csvUrls[0], REGISTER_PAGE).href;
}

export async function downloadRegisterCsv(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CherenkovNexus/2.0)" },
  });
  if (!res.ok) throw new Error(`CSV download returned ${res.status}`);
  return await res.text();
}

export function parseRegisterCsv(text: string): RegisterRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, unknown>[];

  if (records.length === 0) return [];
  const headers = Object.keys(records[0]);

  const iName = findHeaderIndex(headers, ["organisation name", "organisation", "name", "sponsor"]);
  const iTown = findHeaderIndex(headers, ["town/city", "town", "city"]);
  const iCounty = findHeaderIndex(headers, ["county", "region"]);
  const iType = findHeaderIndex(headers, ["type & rating", "type and rating", "type", "rating"]);
  const iRoute = findHeaderIndex(headers, ["sub category (where applicable)", "sub-category", "sub category", "route", "sponsor route"]);

  if (iName === undefined) throw new Error("Could not locate the organisation name column in the register CSV");

  const value = (record: Record<string, unknown>, index: number | undefined): string | undefined => {
    if (index === undefined) return undefined;
    const raw = record[headers[index]];
    const s = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
    return s.length > 0 ? s : undefined;
  };

  return records.map((record) => {
    const organisationName = value(record, iName) ?? "Unknown Sponsor";
    return {
      organisationName,
      town: value(record, iTown),
      county: value(record, iCounty),
      typeAndRating: value(record, iType),
      route: value(record, iRoute),
    };
  });
}

function deriveLicense(row: RegisterRow): { licenseType: string; rating: string; minSalaryThresholdGbp: number } {
  const type = (row.typeAndRating ?? "").toLowerCase();
  const isTemporary = type.includes("temporary");
  const ratingMatch = type.match(/rating\s*[:(]?\s*([ab])/i) || type.match(/\b([ab])\s*rating\b/i);
  const rating = ratingMatch ? `${ratingMatch[1].toUpperCase()} Rating` : "A Rating";
  return {
    licenseType: isTemporary ? "Temporary Worker" : "Skilled Worker",
    rating,
    minSalaryThresholdGbp: isTemporary ? 0 : 41700,
  };
}

export async function ensureSponsorSchema(db = getDb()): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aliases TEXT NOT NULL,
      region TEXT NOT NULL,
      licenseType TEXT NOT NULL,
      rating TEXT NOT NULL,
      minSalaryThresholdGbp INTEGER NOT NULL,
      town TEXT,
      county TEXT,
      typeRating TEXT,
      route TEXT
    )
  `);

  const tableInfo = await db.execute("PRAGMA table_info(sponsors)");
  const existing = new Set(tableInfo.rows.map((r) => r.name as string));
  const wanted: Array<[string, string]> = [
    ["town", "TEXT"],
    ["county", "TEXT"],
    ["typeRating", "TEXT"],
    ["route", "TEXT"],
  ];
  for (const [col, sqlType] of wanted) {
    if (!existing.has(col)) {
      await db.execute(`ALTER TABLE sponsors ADD COLUMN ${col} ${sqlType}`);
    }
  }
  await db.execute("CREATE INDEX IF NOT EXISTS idx_sponsors_name ON sponsors(name)");
  await db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsors_name_lower ON sponsors(LOWER(name))");
}

export async function upsertSponsors(db = getDb(), rows: RegisterRow[]): Promise<UpsertResult> {
  let inserted = 0;
  let updated = 0;
  const chunkSize = 2000;

  const unique = new Map<string, RegisterRow>();
  for (const row of rows) {
    const key = row.organisationName.trim().toLowerCase();
    if (!key) continue;
    if (!unique.has(key)) unique.set(key, row);
  }
  const entries = [...unique.values()];

  const existing = new Set<string>();
  const existingRows = await db.execute("SELECT LOWER(name) AS name FROM sponsors");
  for (const row of existingRows.rows) existing.add(row.name as string);

  const toInsert: RegisterRow[] = [];
  const toUpdate: RegisterRow[] = [];
  for (const row of entries) {
    (existing.has(row.organisationName.trim().toLowerCase()) ? toUpdate : toInsert).push(row);
  }

  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const slice = toInsert.slice(i, i + chunkSize);
    const stmts = slice.map((row) => {
      const { licenseType, rating, minSalaryThresholdGbp } = deriveLicense(row);
      return {
        sql: `INSERT OR IGNORE INTO sponsors (name, aliases, region, licenseType, rating, minSalaryThresholdGbp, town, county, typeRating, route)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          row.organisationName.trim(),
          "",
          "UK",
          licenseType,
          rating,
          minSalaryThresholdGbp,
          row.town ?? null,
          row.county ?? null,
          row.typeAndRating ?? null,
          row.route ?? null,
        ],
      };
    });
    if (stmts.length > 0) {
      const results = (await db.batch(stmts as never)) as unknown as Array<{ rowsAffected: number }>;
      inserted += results.reduce((sum, r) => sum + (r.rowsAffected ?? 0), 0);
    }
  }

  for (let i = 0; i < toUpdate.length; i += chunkSize) {
    const slice = toUpdate.slice(i, i + chunkSize);
    const stmts = slice.map((row) => {
      const { licenseType, rating, minSalaryThresholdGbp } = deriveLicense(row);
      return {
        sql: `UPDATE sponsors SET
                town = ?, county = ?, typeRating = ?, route = ?,
                licenseType = ?, rating = ?, minSalaryThresholdGbp = ?
              WHERE LOWER(name) = ?`,
        args: [
          row.town ?? null,
          row.county ?? null,
          row.typeAndRating ?? null,
          row.route ?? null,
          licenseType,
          rating,
          minSalaryThresholdGbp,
          row.organisationName.trim().toLowerCase(),
        ],
      };
    });
    if (stmts.length > 0) {
      await db.batch(stmts as never);
      updated += stmts.length;
    }
  }

  return { inserted, updated };
}

export async function fetchAndUpsertSponsors(db = getDb()): Promise<SeedResult> {
  await ensureSponsorSchema(db);
  const csvUrl = await resolveRegisterCsvUrl();
  const text = await downloadRegisterCsv(csvUrl);
  const rows = parseRegisterCsv(text);
  const { inserted, updated } = await upsertSponsors(db, rows);
  return {
    inserted,
    updated,
    rowCount: rows.length,
    source: csvUrl,
    lastUpdated: new Date().toISOString(),
  };
}