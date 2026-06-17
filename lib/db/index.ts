import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "editor.db");

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

// Initialize tables on first import
export async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      element_selector TEXT NOT NULL,
      original_html TEXT NOT NULL,
      modified_html TEXT NOT NULL,
      prompt TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      changes TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'applied',
      page_url TEXT NOT NULL DEFAULT '/',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
