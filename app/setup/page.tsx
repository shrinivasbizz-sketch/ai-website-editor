"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, Globe, Package } from "lucide-react";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs transition-colors shrink-0"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700">
      {label && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-xs text-zinc-400 font-mono">{label}</span>
          <CopyBtn text={code} />
        </div>
      )}
      <pre className="bg-zinc-950 px-4 py-3 text-sm text-zinc-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

export default function SetupPage() {
  // These are the deployed/current URLs — detected at runtime
  const [editorUrl, setEditorUrl] = useState("http://localhost:3000");
  const [agentUrl, setAgentUrl] = useState("http://localhost:8000");
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect current editor URL from browser
    const url = `${window.location.protocol}//${window.location.host}`;
    setEditorUrl(url);

    // Try env-configured agent URL first, otherwise infer from editor URL
    const envAgent = process.env.NEXT_PUBLIC_AGENT_URL;
    const inferredAgent = envAgent && envAgent !== "http://localhost:8000"
      ? envAgent
      : url.replace(/:3000$/, ":8000");
    setAgentUrl(inferredAgent);

    // Check if Python agent is reachable
    fetch(inferredAgent + "/health", { signal: AbortSignal.timeout(3000) })
      .then((r) => setAgentOnline(r.ok))
      .catch(() => setAgentOnline(false));
  }, []);

  const scriptTag = `<script src="${editorUrl}/inject.js"></script>`;

  const bookmarklet = `javascript:(function(){if(window.__aiEditorLoaded)return;var s=document.createElement('script');s.src='${editorUrl}/inject.js';s.setAttribute('data-backend','${agentUrl}');document.head.appendChild(s);})()`;

  const dockerCmd = `# One command — runs everything
git clone https://github.com/yourname/ai-website-editor
cd ai-website-editor
docker compose up --build`;

  const railwayConfig = `# Deploy Python agent to Railway (free tier)
# 1. Push this repo to GitHub
# 2. Go to railway.app → New Project → Deploy from GitHub
# 3. Select the /backend folder as root
# 4. Railway auto-detects Python and deploys it
# 5. Copy the Railway URL, set as NEXT_PUBLIC_AGENT_URL in Vercel`;

  const vercelConfig = `# Deploy Next.js to Vercel (free)
# 1. Push this repo to GitHub
# 2. Go to vercel.com → Import Project
# 3. Set environment variable:
NEXT_PUBLIC_AGENT_URL=https://your-agent.railway.app
# 4. Deploy — Vercel auto-detects Next.js`;

  const nextjsUsage = `// Add to your Next.js layout.tsx
// Only loads in development — zero impact on production bundle
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="${editorUrl}/inject.js"
            data-backend="${agentUrl}"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-900/20 border border-violet-800/30 text-violet-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <Globe size={11} />
            Share with your team
          </div>
          <h1 className="text-4xl font-bold mb-4">Make it available to everyone</h1>
          <p className="text-zinc-400 text-lg">
            Deploy once — your boss, teammates, or clients can use it from any browser without installing anything.
          </p>
        </div>

        {/* Status */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Current Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-zinc-200">Editor UI (this page)</span>
              </div>
              <code className="text-xs text-violet-300 font-mono">{editorUrl}</code>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agentOnline === null ? "bg-yellow-400" : agentOnline ? "bg-green-400" : "bg-red-500"}`} />
                <span className="text-sm text-zinc-200">Python agent</span>
                {agentOnline === false && <span className="text-xs text-red-400">— not running</span>}
              </div>
              <code className="text-xs text-violet-300 font-mono">{agentUrl}</code>
            </div>
          </div>
          {agentOnline === false && (
            <div className="mt-3 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-xs text-red-300">
              Start the Python agent: <code className="font-mono">cd backend && uvicorn main:app --port 8000</code>
            </div>
          )}
        </div>

        {/* ── OPTION A: Docker ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
              <Package size={15} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Option A — Docker (office / LAN sharing)</h2>
              <p className="text-zinc-400 text-sm">Your boss runs one command on their machine. No Node.js or Python needed.</p>
            </div>
          </div>

          <div className="space-y-4">
            <CodeBlock code={dockerCmd} label="On your boss's machine" />
            <p className="text-sm text-zinc-400">
              Then they open <code className="text-violet-300">http://localhost:3000</code> — the full editor is running.
              They configure their own API key in the Settings panel.
            </p>

            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-3">If on the same office network — share your IP</p>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li className="flex gap-2"><span className="text-violet-400 shrink-0">1.</span> Run <code className="text-violet-300 font-mono">docker compose up</code> on YOUR machine</li>
                <li className="flex gap-2"><span className="text-violet-400 shrink-0">2.</span> Find your local IP: <code className="text-violet-300 font-mono">ipconfig</code> (Windows)</li>
                <li className="flex gap-2"><span className="text-violet-400 shrink-0">3.</span> Tell boss to open <code className="text-violet-300 font-mono">http://192.168.x.x:3000</code></li>
                <li className="flex gap-2"><span className="text-violet-400 shrink-0">4.</span> Boss gets the inject.js URL from <code className="text-violet-300 font-mono">/setup</code> and adds it to their site</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ── OPTION B: Cloud deploy ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-600/40 flex items-center justify-center">
              <Globe size={15} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Option B — Cloud (anyone, anywhere)</h2>
              <p className="text-zinc-400 text-sm">Deploy free on Vercel + Railway. Boss just visits a URL, no setup.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs font-bold">▲</div>
                  <span className="text-white text-sm font-medium">Step 1 — Deploy Python agent</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">Push repo to GitHub, then:</p>
                <a
                  href="https://railway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  railway.app → New Project → from GitHub <ExternalLink size={10} />
                </a>
                <p className="text-xs text-zinc-500 mt-2">Set root directory to <code>/backend</code>. Railway auto-detects Python + deploys.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs font-bold">▲</div>
                  <span className="text-white text-sm font-medium">Step 2 — Deploy Next.js</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">After Railway gives you a URL:</p>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  vercel.com/new → Import repo <ExternalLink size={10} />
                </a>
                <p className="text-xs text-zinc-500 mt-2">Add env var: <code className="text-violet-300">NEXT_PUBLIC_AGENT_URL=https://xxx.railway.app</code></p>
              </div>
            </div>

            <CodeBlock code={railwayConfig} label="backend/railway.toml (auto-detected)" />
            <CodeBlock code={vercelConfig} label="Vercel environment variables" />

            <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-4 text-sm text-green-200/80">
              After deploying, come back to <code className="text-green-300">/setup</code> on the deployed URL — it automatically shows the correct inject.js snippet and bookmarklet for your boss to use.
            </div>
          </div>
        </section>

        {/* ── OPTION C: Open source ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-zinc-700 border border-zinc-600 flex items-center justify-center text-zinc-300 font-bold text-sm">
              G
            </div>
            <div>
              <h2 className="text-xl font-semibold">Option C — Open source on GitHub</h2>
              <p className="text-zinc-400 text-sm">Share the repo. Anyone technical can clone and run it themselves.</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3 text-sm text-zinc-300">
            <ol className="space-y-2">
              <li className="flex gap-2"><span className="text-violet-400 shrink-0">1.</span> Push this project to GitHub (public or private repo)</li>
              <li className="flex gap-2"><span className="text-violet-400 shrink-0">2.</span> Share the repo link with your boss</li>
              <li className="flex gap-2"><span className="text-violet-400 shrink-0">3.</span> They clone it and run <code className="text-violet-300 font-mono">docker compose up</code></li>
              <li className="flex gap-2"><span className="text-violet-400 shrink-0">4.</span> They bring their own API key (Groq free, Gemini free, etc.)</li>
            </ol>
            <p className="text-xs text-zinc-500 pt-1">
              Everyone uses their own API key — zero cost to you, unlimited users.
            </p>
          </div>
        </section>

        {/* ── What boss gets ── */}
        <section>
          <h2 className="text-xl font-semibold mb-5">What your boss gets — the inject.js snippet</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Once the editor is deployed (at any URL), your boss adds this one line to their website. The editor toolbar appears automatically.
          </p>

          <div className="space-y-4">
            <CodeBlock code={scriptTag} label="Add to any website's HTML" />

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
              <p className="text-sm text-zinc-300 mb-4">Or use the bookmarklet — drag to bookmarks bar, click on any page:</p>
              <a
                href={bookmarklet}
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-grab select-none"
                draggable
              >
                ✏ AI Editor
              </a>
              <p className="text-xs text-zinc-600 mt-3">Right-click → Bookmark Link if drag doesn't work.</p>
            </div>

            <CodeBlock code={nextjsUsage} label="For Next.js projects" />
          </div>
        </section>

        {/* BYOK note */}
        <div className="bg-amber-900/10 border border-amber-800/30 rounded-2xl p-5">
          <h3 className="text-amber-300 font-semibold mb-2">Each user brings their own API key</h3>
          <p className="text-sm text-amber-200/70">
            When your boss opens the editor for the first time, they click <strong className="text-amber-300">⚙ Configure provider</strong> and paste their own free Groq or Gemini key.
            The key is stored only in their browser — never on your server. You pay nothing for their usage.
          </p>
        </div>

      </div>
    </div>
  );
}
