"""
AI Website Editor — Standalone Agent
=====================================
A single Python server that is the complete product:
  GET  /              → Setup & onboarding page
  GET  /inject.js     → Universal client script (add to any website)
  GET  /health        → Health check + provider info
  POST /generate      → AI editing endpoint (BYOK — user's key per request)

Run:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000

Then add to any website:
  <script src="http://localhost:8000/inject.js"></script>
"""

import os
import pathlib
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel
from typing import Any
import uvicorn

from agent import run_editor_agent
from llm import resolve_config, provider_label, config_from_env

# ── App setup ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Website Editor",
    description="Open-source visual AI editor. Add to any website with one <script> tag.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = pathlib.Path(__file__).parent / "static"

# ── Static files ───────────────────────────────────────────────────────────────

@app.get("/inject.js", include_in_schema=False)
async def serve_inject_js():
    """Serve the universal client script with correct MIME type and cache headers."""
    path = STATIC_DIR / "inject.js"
    if not path.exists():
        raise HTTPException(status_code=404, detail="inject.js not found")
    return FileResponse(
        path,
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache"},   # always fresh in dev
    )

# ── Setup / onboarding page ────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def setup_page(request: Request):
    base_url = str(request.base_url).rstrip("/")
    env_cfg = config_from_env()
    provider = provider_label(env_cfg)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Website Editor — Setup</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#fafafa;min-height:100vh;padding:48px 24px}}
  .wrap{{max-width:720px;margin:0 auto}}
  .badge{{display:inline-flex;align-items:center;gap:6px;background:#1e0a3c;border:1px solid #4c1d95;color:#c4b5fd;font-size:12px;padding:4px 12px;border-radius:9999px;margin-bottom:32px}}
  h1{{font-size:40px;font-weight:800;line-height:1.15;margin-bottom:16px}}
  .sub{{color:#71717a;font-size:18px;line-height:1.6;margin-bottom:48px}}
  .status{{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:20px 24px;margin-bottom:36px;display:flex;align-items:center;gap:12px}}
  .dot{{width:10px;height:10px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 8px #4ade80}}
  .status-text{{font-size:14px;color:#a1a1aa}}
  .status-text strong{{color:#fff}}
  section{{margin-bottom:40px}}
  h2{{font-size:20px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:10px}}
  .num{{width:28px;height:28px;border-radius:50%;background:#7c3aed;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}}
  .card{{background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;margin-bottom:16px}}
  .card-head{{background:#1f1f23;border-bottom:1px solid #27272a;padding:10px 16px;display:flex;justify-content:space-between;align-items:center}}
  .card-label{{font-size:11px;color:#71717a;font-family:monospace}}
  .copy-btn{{background:#27272a;border:none;color:#a1a1aa;font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer}}
  .copy-btn:hover{{background:#3f3f46;color:#fff}}
  pre{{padding:16px;font-size:13px;color:#d4d4d8;font-family:'Fira Code',Consolas,monospace;overflow-x:auto;line-height:1.7;white-space:pre-wrap;word-break:break-all}}
  .providers{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:12px}}
  .provider{{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px 16px}}
  .provider-name{{font-size:14px;font-weight:600;color:#fff;margin-bottom:4px}}
  .provider-note{{font-size:11px;color:#71717a}}
  .free{{color:#4ade80;font-size:10px;font-weight:600;display:inline-block;margin-left:6px}}
  .bookmarklet{{display:inline-flex;align-items:center;gap:8px;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:10px 20px;border-radius:12px;text-decoration:none;cursor:grab}}
  .bookmarklet:hover{{background:#6d28d9}}
  .note{{background:#1a1207;border:1px solid #451a03;border-radius:12px;padding:14px 16px;font-size:13px;color:#fcd34d;margin-top:16px}}
  .note a{{color:#fbbf24}}
  footer{{margin-top:64px;padding-top:24px;border-top:1px solid #18181b;text-align:center;font-size:13px;color:#3f3f46}}
  footer a{{color:#71717a;text-decoration:none}}
  footer a:hover{{color:#a1a1aa}}
</style>
</head>
<body>
<div class="wrap">

  <div class="badge">✦ Open Source · BYOK · Works on any website</div>

  <h1>AI Website Editor</h1>
  <p class="sub">Click any element on any website. Describe a change in plain English. See it happen live.</p>

  <div class="status">
    <div class="dot"></div>
    <div class="status-text">
      Agent running at <strong>{base_url}</strong>
      &nbsp;·&nbsp; Provider: <strong>{provider}</strong>
    </div>
  </div>

  <!-- Step 1: Script tag -->
  <section>
    <h2><span class="num">1</span> Add to any website</h2>
    <div class="card">
      <div class="card-head">
        <span class="card-label">Paste before &lt;/body&gt; in any HTML page</span>
        <button class="copy-btn" onclick="copy(this, `{base_url}/inject.js`)">Copy</button>
      </div>
      <pre>&lt;script src="{base_url}/inject.js"&gt;&lt;/script&gt;</pre>
    </div>
    <p style="font-size:13px;color:#71717a">The AI editor toolbar will appear at the top of the page. No build step, no dependencies, no framework required.</p>
  </section>

  <!-- Step 2: Bookmarklet -->
  <section>
    <h2><span class="num">2</span> Or use the bookmarklet — edit any page instantly</h2>
    <p style="font-size:13px;color:#71717a;margin-bottom:16px">Drag to your browser bookmarks bar. Click on any website to activate the editor.</p>
    <a class="bookmarklet" href="javascript:(function(){{if(window.__aiEditorLoaded)return;var s=document.createElement('script');s.src='{base_url}/inject.js';s.setAttribute('data-backend','{base_url}');document.head.appendChild(s);}})()" draggable="true">
      ✏ AI Editor
    </a>
    <p style="font-size:11px;color:#52525b;margin-top:10px">Right-click → Bookmark Link if drag doesn't work in your browser.</p>
  </section>

  <!-- Step 3: Configure provider -->
  <section>
    <h2><span class="num">3</span> Configure your AI provider</h2>
    <p style="font-size:13px;color:#71717a;margin-bottom:16px">
      After adding the script tag, click <strong style="color:#fff">⚙ Configure provider</strong> in the toolbar.
      Your key is saved in browser localStorage only — never sent to this server.
    </p>
    <div class="providers">
      <div class="provider">
        <div class="provider-name">Groq <span class="free">FREE</span></div>
        <div class="provider-note">console.groq.com · llama-3.3-70b</div>
      </div>
      <div class="provider">
        <div class="provider-name">Google Gemini <span class="free">FREE</span></div>
        <div class="provider-note">aistudio.google.com · gemini-flash</div>
      </div>
      <div class="provider">
        <div class="provider-name">OpenRouter <span class="free">FREE</span></div>
        <div class="provider-note">openrouter.ai · free models</div>
      </div>
      <div class="provider">
        <div class="provider-name">Ollama</div>
        <div class="provider-note">ollama.com · runs locally · no key</div>
      </div>
      <div class="provider">
        <div class="provider-name">OpenAI</div>
        <div class="provider-note">platform.openai.com · gpt-4o-mini</div>
      </div>
      <div class="provider">
        <div class="provider-name">Anthropic</div>
        <div class="provider-note">console.anthropic.com · claude</div>
      </div>
    </div>
  </section>

  <!-- Share with team -->
  <section>
    <h2><span class="num">4</span> Share with your team</h2>
    <div class="card">
      <div class="card-head"><span class="card-label">Everyone on your network can use this URL</span></div>
      <pre>http://&lt;your-ip&gt;:8000/inject.js</pre>
    </div>
    <div class="note">
      Run <code>ipconfig</code> (Windows) or <code>ifconfig</code> (Mac/Linux) to find your local IP.
      Anyone on the same network opens <strong>{base_url}</strong> to get started.
    </div>
  </section>

  <!-- API reference -->
  <section>
    <h2>API Reference</h2>
    <div class="card">
      <div class="card-head"><span class="card-label">Endpoints</span></div>
      <pre>GET  /            → This setup page
GET  /inject.js   → Universal client script
GET  /health      → JSON health check
POST /generate    → AI editing (send element + prompt + providerConfig)
GET  /api/docs    → Interactive API docs (Swagger)</pre>
    </div>
  </section>

</div>

<footer>
  <a href="/api/docs">API Docs</a> &nbsp;·&nbsp;
  <a href="https://github.com" target="_blank">GitHub</a> &nbsp;·&nbsp;
  MIT License
</footer>

<script>
function copy(btn, url) {{
  navigator.clipboard.writeText('<script src="' + url + '"><\\/script>').then(() => {{
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  }});
}}
</script>
</body>
</html>"""
    return HTMLResponse(html)


# ── Models ─────────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    elementHtml: str
    outerHtml: str = ""
    classes: list[str] = []
    tagName: str = "div"
    componentName: str | None = None
    pageContext: str = ""
    prompt: str
    providerConfig: dict[str, Any] | None = None   # BYOK — user's own key


class GenerateResponse(BaseModel):
    modifiedHtml: str
    explanation: str
    changes: list[str]
    steps_taken: list[str] = []
    provider: str = ""


# ── Core API ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    env_cfg = config_from_env()
    return {
        "ok": True,
        "provider": provider_label(env_cfg),
        "mode": "BYOK — users supply their own provider config",
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "prompt is required")
    if not req.elementHtml.strip():
        raise HTTPException(400, "elementHtml is required")

    cfg = resolve_config(req.providerConfig)

    try:
        result = await run_editor_agent(
            element_html=req.elementHtml,
            outer_html=req.outerHtml,
            classes=req.classes,
            tag=req.tagName,
            context=req.pageContext,
            user_prompt=req.prompt,
            cfg=cfg,
        )
        return GenerateResponse(
            modifiedHtml=result["modifiedHtml"],
            explanation=result["explanation"],
            changes=result["changes"],
            steps_taken=result.get("steps_taken", []),
            provider=provider_label(cfg),
        )
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Dev entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"\n✦ AI Website Editor running at http://localhost:{port}\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
