import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  elementSelector: text("element_selector").notNull(),
  originalHtml: text("original_html").notNull(),
  modifiedHtml: text("modified_html").notNull(),
  prompt: text("prompt").notNull(),
  explanation: text("explanation").notNull().default(""),
  changes: text("changes").notNull().default("[]"), // JSON array of strings
  status: text("status", { enum: ["pending", "applied", "rejected"] })
    .notNull()
    .default("applied"),
  pageUrl: text("page_url").notNull().default("/"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type RevisionRow = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;
