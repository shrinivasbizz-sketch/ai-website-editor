import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { revisions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureInit();
  const { id } = await params;
  const body = await req.json();

  const updated = await db
    .update(revisions)
    .set({ status: body.status })
    .where(eq(revisions.id, id))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ revision: updated[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureInit();
  const { id } = await params;
  await db.delete(revisions).where(eq(revisions.id, id));
  return NextResponse.json({ ok: true });
}
