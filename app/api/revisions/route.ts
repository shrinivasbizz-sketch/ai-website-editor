import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { revisions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "@/lib/utils";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

export async function GET(req: Request) {
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const rows = sessionId
    ? await db
        .select()
        .from(revisions)
        .where(eq(revisions.sessionId, sessionId))
        .orderBy(desc(revisions.createdAt))
        .limit(50)
    : await db
        .select()
        .from(revisions)
        .orderBy(desc(revisions.createdAt))
        .limit(50);

  const parsed = rows.map((r) => ({
    ...r,
    changes: JSON.parse(r.changes),
  }));

  return NextResponse.json({ revisions: parsed });
}

export async function POST(req: Request) {
  await ensureInit();
  const body = await req.json();

  const row = await db
    .insert(revisions)
    .values({
      id: nanoid(),
      sessionId: body.sessionId,
      elementSelector: body.elementSelector,
      originalHtml: body.originalHtml,
      modifiedHtml: body.modifiedHtml,
      prompt: body.prompt,
      explanation: body.explanation ?? "",
      changes: JSON.stringify(body.changes ?? []),
      status: "applied",
      pageUrl: body.pageUrl ?? "/",
    })
    .returning();

  return NextResponse.json({ revision: { ...row[0], changes: body.changes ?? [] } });
}
