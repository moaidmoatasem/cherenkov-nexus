import { createClient } from "@libsql/client";
import { resolve } from "node:path";

let db: ReturnType<typeof createClient> | null = null;

function resolveDbUrl(): string {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl && process.env.TURSO_AUTH_TOKEN) {
    return tursoUrl;
  }
  const configured = process.env.DATABASE_PATH;
  if (configured && configured.startsWith("file:")) {
    return configured;
  }
  return `file:${resolve(configured ?? "nexus.db").replace(/\\/g, "/")}`;
}

export function getDb(): ReturnType<typeof createClient> {
  if (!db) {
    const url = resolveDbUrl();
    const isTurso = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("libsql://");
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN as string | undefined });
    if (!isTurso) {
      client.execute("PRAGMA journal_mode=WAL;").catch(() => {});
    }
    db = client;
  }
  return db;
}