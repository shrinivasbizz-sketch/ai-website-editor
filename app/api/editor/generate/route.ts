/**
 * Proxies to the Python agent backend (port 8000).
 * Falls back to direct LLM call if the Python backend is not running.
 */
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/ai/prompts";

const PYTHON_BACKEND = process.env.AGENT_BACKEND_URL ?? "http://localhost:8000";

// ── Try Python agent first ────────────────────────────────────────────────────

async function callPythonAgent(body: Record<string, unknown>) {
  const res = await fetch(`${PYTHON_BACKEND}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Python agent error");
  }
  return res.json();
}

// ── Direct LLM fallback (needs env key) ──────────────────────────────────────

function detectDirectProvider(): { client: OpenAI; model: string } | null {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" }),
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      }),
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" }),
      model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
    };
  }
  return null;
}

const JSON_INSTRUCTION = `\n\nRespond with ONLY valid JSON (no markdown):
{"modified_html":"...","explanation":"...","changes":["..."]}`;

async function callDirectLLM(body: Record<string, unknown>) {
  const provider = detectDirectProvider();
  if (!provider) throw new Error("No provider configured. Start the Python backend or set an API key.");

  const { elementHtml, outerHtml, classes, tagName, componentName, pageContext, prompt } = body as {
    elementHtml: string; outerHtml?: string; classes?: string[]; tagName?: string;
    componentName?: string; pageContext?: string; prompt: string;
  };

  const userMessage = buildUserMessage({
    elementHtml: (outerHtml || elementHtml) as string,
    classes: (classes ?? []) as string[],
    tagName: (tagName ?? "div") as string,
    componentName: componentName as string | undefined,
    pageContext: (pageContext ?? "") as string,
    prompt: prompt as string,
  });

  const completion = await provider.client.chat.completions.create({
    model: provider.model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT + JSON_INSTRUCTION },
      { role: "user", content: userMessage },
    ],
    max_tokens: 4096,
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    modifiedHtml: parsed.modified_html ?? parsed.modifiedHtml ?? "",
    explanation: parsed.explanation ?? "",
    changes: parsed.changes ?? [],
    provider: provider.model,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.prompt || !body.elementHtml) {
    return NextResponse.json({ error: "Missing prompt or elementHtml" }, { status: 400 });
  }

  // 1. Try Python agent
  try {
    const result = await callPythonAgent(body);
    return NextResponse.json(result);
  } catch (agentErr) {
    console.warn("[generate] Python agent unavailable:", (agentErr as Error).message);
  }

  // 2. Fallback to direct LLM call
  try {
    const result = await callDirectLLM(body);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
