/**
 * AI Website Editor — Universal Inject Script
 *
 * Add to ANY website:
 *   <script src="http://localhost:3000/inject.js"></script>
 *
 * Or use as a bookmarklet (generated at http://localhost:3000/setup).
 *
 * The script is self-contained: no React, no build step, no dependencies.
 * Communicates with the Python agent on port 8000.
 */
(function () {
  if (window.__aiEditorLoaded) return;
  window.__aiEditorLoaded = true;

  const BACKEND =
    (document.currentScript && document.currentScript.getAttribute("data-backend")) ||
    "http://localhost:8000";
  const STORAGE_KEY = "ai-editor-provider-v1";

  // ── Provider config (localStorage) ────────────────────────────────────────

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.state?.config || parsed || null;
      }
    } catch (_) {}
    return { provider: "groq", apiKey: "", model: "llama-3.3-70b-versatile", baseUrl: "" };
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { config: cfg } }));
    } catch (_) {}
  }

  // ── State ──────────────────────────────────────────────────────────────────

  var S = {
    editMode: false,
    hovered: null,
    selected: null,
    originalHtml: "",
    generating: false,
    generated: null,
    previewActive: false,
  };

  // ── Inject CSS ─────────────────────────────────────────────────────────────

  var css = document.createElement("style");
  css.textContent = [
    ".__ae *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5}",
    ".__ae-toolbar{position:fixed;top:0;left:0;right:0;height:52px;background:#18181b;border-bottom:1px solid #3f3f46;z-index:2147483640;display:flex;align-items:center;padding:0 16px;gap:10px}",
    ".__ae-brand{display:flex;align-items:center;gap:6px;color:#fff;font-size:13px;font-weight:600;margin-right:4px}",
    ".__ae-brand-icon{width:26px;height:26px;background:#7c3aed;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px}",
    ".__ae-sep{width:1px;height:20px;background:#3f3f46}",
    ".__ae-btn{padding:5px 13px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}",
    ".__ae-btn-edit{background:#27272a;color:#a1a1aa}",
    ".__ae-btn-edit:hover{background:#3f3f46;color:#fff}",
    ".__ae-btn-edit.on{background:#7c3aed;color:#fff}",
    ".__ae-btn-ghost{background:transparent;color:#71717a;border:1px solid #3f3f46}",
    ".__ae-btn-ghost:hover{color:#fff;border-color:#71717a}",
    ".__ae-btn-danger{background:#991b1b;color:#fca5a5}",
    ".__ae-badge{font-size:10px;padding:2px 7px;border-radius:9999px;background:#3f3f46;color:#a1a1aa;cursor:pointer;white-space:nowrap}",
    ".__ae-badge:hover{background:#52525b;color:#fff}",
    ".__ae-badge.warn{background:#451a03;color:#fb923c}",
    ".__ae-spacer{flex:1}",
    ".__ae-hint{font-size:11px;color:#52525b;display:flex;align-items:center;gap:4px}",
    ".__ae-overlay{position:fixed;inset:0;z-index:2147483630;pointer-events:none;cursor:crosshair}",
    ".__ae-overlay.on{pointer-events:all}",
    ".__ae-hl{position:fixed;pointer-events:none;z-index:2147483635;border:2px dashed #3b82f6;background:rgba(59,130,246,0.07);transition:top .07s,left .07s,width .07s,height .07s}",
    ".__ae-sel{position:fixed;pointer-events:none;z-index:2147483636;border:2px solid #8b5cf6;background:rgba(139,92,246,0.10)}",
    ".__ae-sel-label{position:absolute;top:-20px;left:0;background:#8b5cf6;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px 3px 0 0;white-space:nowrap;font-family:monospace}",
    ".__ae-panel{position:fixed;top:52px;right:0;width:360px;bottom:0;background:#18181b;border-left:1px solid #3f3f46;z-index:2147483637;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.2s;overflow:hidden}",
    ".__ae-panel.open{transform:translateX(0)}",
    ".__ae-ph{padding:12px 16px;border-bottom:1px solid #27272a;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-shrink:0}",
    ".__ae-ph-title{color:#fff;font-size:13px;font-weight:600;margin:0}",
    ".__ae-ph-sub{color:#71717a;font-size:10px;font-family:monospace;margin-top:2px}",
    ".__ae-close{background:none;border:none;color:#71717a;cursor:pointer;font-size:16px;padding:2px;line-height:1}",
    ".__ae-close:hover{color:#fff}",
    ".__ae-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:14px}",
    ".__ae-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#52525b;margin-bottom:6px}",
    ".__ae-tags{display:flex;flex-wrap:wrap;gap:4px}",
    ".__ae-tag{background:#27272a;color:#a1a1aa;font-size:10px;padding:2px 6px;border-radius:4px;font-family:monospace}",
    ".__ae-textarea{width:100%;background:#27272a;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:10px 12px;font-size:13px;resize:none;outline:none;min-height:72px}",
    ".__ae-textarea:focus{border-color:#7c3aed}",
    ".__ae-textarea::placeholder{color:#52525b}",
    ".__ae-suggestions{display:flex;flex-wrap:wrap;gap:5px}",
    ".__ae-sug{background:#27272a;border:none;color:#71717a;font-size:10px;padding:3px 8px;border-radius:9999px;cursor:pointer;white-space:nowrap}",
    ".__ae-sug:hover{background:#3f3f46;color:#d4d4d8}",
    ".__ae-result{background:#1a1a2e;border:1px solid #2d2d6b;border-radius:8px;padding:12px;font-size:12px;color:#a5b4fc;line-height:1.6}",
    ".__ae-changes{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px}",
    ".__ae-changes li{font-size:11px;color:#d4d4d8;display:flex;gap:6px}",
    ".__ae-changes li::before{content:'✓';color:#4ade80;flex-shrink:0}",
    ".__ae-preview-note{background:#1e1b4b;border:1px solid #4338ca;border-radius:6px;padding:8px 12px;font-size:11px;color:#a5b4fc}",
    ".__ae-error{background:#1f0505;border:1px solid #7f1d1d;border-radius:8px;padding:10px 12px;font-size:12px;color:#f87171}",
    ".__ae-footer{padding:12px 16px;border-top:1px solid #27272a;display:flex;gap:8px;flex-shrink:0}",
    ".__ae-btn-gen{flex:1;background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}",
    ".__ae-btn-gen:hover:not(:disabled){background:#6d28d9}",
    ".__ae-btn-gen:disabled{opacity:0.4;cursor:not-allowed}",
    ".__ae-btn-apply{flex:1;background:#15803d;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:500;cursor:pointer}",
    ".__ae-btn-apply:hover{background:#16a34a}",
    ".__ae-btn-reject{flex:1;background:#27272a;color:#d4d4d8;border:none;border-radius:8px;padding:10px;font-size:13px;cursor:pointer}",
    ".__ae-btn-reject:hover{background:#3f3f46}",
    ".__ae-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:__aespin .6s linear infinite}",
    "@keyframes __aespin{to{transform:rotate(360deg)}}",
    // Settings modal
    ".__ae-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)}",
    ".__ae-modal{background:#18181b;border:1px solid #3f3f46;border-radius:16px;width:480px;max-width:calc(100vw - 32px);overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.5)}",
    ".__ae-modal-head{padding:18px 20px;border-bottom:1px solid #27272a;display:flex;justify-content:space-between;align-items:flex-start}",
    ".__ae-modal-title{color:#fff;font-size:15px;font-weight:600;margin:0}",
    ".__ae-modal-sub{color:#71717a;font-size:11px;margin-top:3px}",
    ".__ae-modal-body{padding:20px;display:flex;flex-direction:column;gap:16px}",
    ".__ae-field label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;margin-bottom:6px}",
    ".__ae-field input,.__ae-field select{width:100%;background:#27272a;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:9px 12px;font-size:13px;outline:none}",
    ".__ae-field input:focus,.__ae-field select:focus{border-color:#7c3aed}",
    ".__ae-modal-foot{padding:14px 20px;border-top:1px solid #27272a;display:flex;justify-content:flex-end;gap:8px}",
    ".__ae-provider-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
    ".__ae-provider-opt{padding:8px 12px;border-radius:8px;border:1px solid #3f3f46;background:#27272a;cursor:pointer;text-align:left;transition:all .15s}",
    ".__ae-provider-opt:hover{border-color:#52525b}",
    ".__ae-provider-opt.sel{border-color:#7c3aed;background:#1e0a3c}",
    ".__ae-provider-opt-name{color:#fff;font-size:12px;font-weight:500}",
    ".__ae-provider-opt-badge{color:#4ade80;font-size:10px}",
  ].join("\n");
  document.head.appendChild(css);

  // ── Element detection ──────────────────────────────────────────────────────

  var SELECTABLE = new Set(["H1","H2","H3","H4","H5","H6","P","SPAN","A","BUTTON",
    "INPUT","TEXTAREA","IMG","DIV","SECTION","ARTICLE","HEADER","FOOTER","NAV",
    "MAIN","UL","LI","FIGURE","BLOCKQUOTE","FORM","LABEL"]);

  function findTarget(x, y) {
    overlay.style.pointerEvents = "none";
    var e = document.elementFromPoint(x, y);
    overlay.style.pointerEvents = "all";
    if (!e || e.closest("[data-editor],[data-ae]")) return null;
    var cur = e;
    while (cur && cur !== document.body) {
      if (SELECTABLE.has(cur.tagName)) {
        var r = cur.getBoundingClientRect();
        if (r.width > 8 && r.height > 8) return cur;
      }
      cur = cur.parentElement;
    }
    return null;
  }

  function selectorOf(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    var parts = [], cur = el;
    while (cur && cur.tagName !== "BODY") {
      var tag = cur.tagName.toLowerCase();
      var idx = Array.from(cur.parentElement ? cur.parentElement.children : []).indexOf(cur) + 1;
      parts.unshift(tag + ":nth-child(" + idx + ")");
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  // ── Highlight boxes ────────────────────────────────────────────────────────

  var hlBox = document.createElement("div");
  hlBox.className = "__ae-hl";
  hlBox.style.display = "none";
  document.body.appendChild(hlBox);

  var selBox = document.createElement("div");
  selBox.className = "__ae-sel";
  selBox.style.display = "none";
  var selLabel = document.createElement("div");
  selLabel.className = "__ae-sel-label";
  selBox.appendChild(selLabel);
  document.body.appendChild(selBox);

  function positionBox(box, el) {
    var r = el.getBoundingClientRect();
    box.style.top = r.top + "px";
    box.style.left = r.left + "px";
    box.style.width = r.width + "px";
    box.style.height = r.height + "px";
    box.style.display = "block";
  }

  function hideBox(box) { box.style.display = "none"; }

  // ── Toolbar ────────────────────────────────────────────────────────────────

  var toolbar = document.createElement("div");
  toolbar.className = "__ae-toolbar";
  toolbar.setAttribute("data-ae", "1");

  toolbar.innerHTML = [
    '<div class="__ae-brand"><div class="__ae-brand-icon">✏</div><span>AI Editor</span></div>',
    '<div class="__ae-sep"></div>',
    '<button class="__ae-btn __ae-btn-edit" id="__ae-edit-btn">⊕ Edit Mode</button>',
    '<span class="__ae-hint" id="__ae-hint" style="display:none">Click any element to edit · Esc to exit</span>',
    '<div class="__ae-spacer"></div>',
    '<button class="__ae-badge warn" id="__ae-cfg-btn">⚙ Configure provider</button>',
  ].join("");

  document.body.insertBefore(toolbar, document.body.firstChild);
  document.body.style.marginTop = (parseInt(document.body.style.marginTop || "0") + 52) + "px";

  var editBtn = document.getElementById("__ae-edit-btn");
  var hintEl = document.getElementById("__ae-hint");
  var cfgBtn = document.getElementById("__ae-cfg-btn");

  // ── Overlay ────────────────────────────────────────────────────────────────

  var overlay = document.createElement("div");
  overlay.className = "__ae-overlay";
  overlay.setAttribute("data-ae", "1");
  document.body.appendChild(overlay);

  overlay.addEventListener("mousemove", function (e) {
    if (!S.editMode) return;
    var t = findTarget(e.clientX, e.clientY);
    S.hovered = t;
    if (t && !S.selected) positionBox(hlBox, t);
    else hideBox(hlBox);
  });

  overlay.addEventListener("click", function (e) {
    e.preventDefault();
    var t = findTarget(e.clientX, e.clientY);
    if (!t) return;
    S.selected = t;
    S.originalHtml = t.outerHTML;
    S.generated = null;
    S.previewActive = false;

    hideBox(hlBox);
    positionBox(selBox, t);
    selLabel.textContent = t.tagName.toLowerCase() + (t.className ? " ." + String(t.className).trim().split(/\s+/)[0] : "");

    openPanel(t);
  });

  // ── Panel ──────────────────────────────────────────────────────────────────

  var panel = document.createElement("div");
  panel.className = "__ae-panel";
  panel.setAttribute("data-ae", "1");
  document.body.appendChild(panel);

  var SUGGESTIONS = [
    "Make the text larger and bold",
    "Change background color to dark navy",
    "Add rounded corners and shadow",
    "Make the button more prominent",
    "Increase padding and spacing",
    "Change text color to white",
  ];

  function buildPanel(el) {
    var classes = Array.from(el.classList).slice(0, 8);
    panel.innerHTML = [
      '<div class="__ae-ph">',
      '  <div>',
      '    <p class="__ae-ph-title">Edit ' + el.tagName.toLowerCase() + '</p>',
      '    <p class="__ae-ph-sub">' + (selectorOf(el).slice(0, 50)) + '</p>',
      '  </div>',
      '  <button class="__ae-close" id="__ae-panel-close">✕</button>',
      '</div>',
      '<div class="__ae-body" id="__ae-body">',
        classes.length ? [
          '<div>',
          '<div class="__ae-label">Tailwind classes</div>',
          '<div class="__ae-tags">' + classes.map(function(c){ return '<span class="__ae-tag">' + c + '</span>'; }).join("") + '</div>',
          '</div>',
        ].join("") : "",
        '<div>',
        '<div class="__ae-label">Describe your change</div>',
        '<textarea class="__ae-textarea" id="__ae-prompt" rows="3" placeholder="e.g. Make this heading larger and blue"></textarea>',
        '<div class="__ae-suggestions" style="margin-top:6px">' + SUGGESTIONS.slice(0,3).map(function(s){
          return '<button class="__ae-sug">' + s + '</button>';
        }).join("") + '</div>',
        '</div>',
        '<div id="__ae-result-area"></div>',
      '</div>',
      '<div class="__ae-footer" id="__ae-footer">',
        '<button class="__ae-btn-gen" id="__ae-gen-btn">✦ Generate with AI</button>',
      '</div>',
    ].join("");

    // Suggestion clicks
    panel.querySelectorAll(".__ae-sug").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.getElementById("__ae-prompt").value = btn.textContent;
      });
    });

    document.getElementById("__ae-panel-close").addEventListener("click", closePanel);
    document.getElementById("__ae-gen-btn").addEventListener("click", handleGenerate);
    document.getElementById("__ae-prompt").addEventListener("keydown", function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
    });

    setTimeout(function(){ var ta = document.getElementById("__ae-prompt"); if(ta) ta.focus(); }, 50);
  }

  function openPanel(el) {
    buildPanel(el);
    panel.classList.add("open");
  }

  function closePanel() {
    if (S.previewActive) revertPreview();
    panel.classList.remove("open");
    S.selected = null;
    S.generated = null;
    hideBox(selBox);
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    var prompt = (document.getElementById("__ae-prompt") || {}).value || "";
    if (!prompt.trim() || !S.selected) return;

    var cfg = getConfig();
    setGenerating(true);

    try {
      var res = await fetch(BACKEND + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elementHtml: S.selected.innerHTML,
          outerHtml: S.selected.outerHTML,
          classes: Array.from(S.selected.classList),
          tagName: S.selected.tagName.toLowerCase(),
          pageContext: S.selected.parentElement ? S.selected.parentElement.outerHTML.slice(0, 800) : "",
          prompt: prompt,
          providerConfig: cfg,
        }),
      });

      if (!res.ok) {
        var err = await res.json().catch(function(){ return { detail: res.statusText }; });
        throw new Error(err.detail || err.error || "Generation failed");
      }

      var data = await res.json();
      S.generated = data;
      applyPreview(data.modifiedHtml);
      showResult(data);
    } catch (e) {
      showError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function applyPreview(html) {
    if (!S.selected) return;
    try {
      S.selected.outerHTML = html;
      // Re-find the element by selector (outerHTML swap creates a new node)
      var sel = selectorOf(S.selected);
      var newEl = document.querySelector(sel);
      if (newEl) S.selected = newEl;
    } catch (_) {
      try { S.selected.innerHTML = html; } catch(_2) {}
    }
    S.previewActive = true;
    if (S.selected) positionBox(selBox, S.selected);
  }

  function revertPreview() {
    if (!S.originalHtml) return;
    try {
      var sel = S.selected ? selectorOf(S.selected) : null;
      if (sel) {
        var el = document.querySelector(sel);
        if (el) el.outerHTML = S.originalHtml;
      }
    } catch(_) {}
    S.previewActive = false;
  }

  // ── Result UI ──────────────────────────────────────────────────────────────

  function setGenerating(on) {
    S.generating = on;
    var btn = document.getElementById("__ae-gen-btn");
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<span class="__ae-spin"></span> Generating…'
      : '✦ Generate with AI';
  }

  function showResult(data) {
    var area = document.getElementById("__ae-result-area");
    if (!area) return;

    area.innerHTML = [
      '<div class="__ae-result">' + (data.explanation || "Changes applied.") + '</div>',
      data.changes && data.changes.length ? [
        '<ul class="__ae-changes">',
        data.changes.map(function(c){ return '<li>' + c + '</li>'; }).join(""),
        '</ul>',
      ].join("") : "",
      '<div class="__ae-preview-note">👁 Preview active — changes visible on page</div>',
    ].join("");

    var footer = document.getElementById("__ae-footer");
    if (footer) {
      footer.innerHTML = [
        '<button class="__ae-btn-reject" id="__ae-reject-btn">✕ Reject</button>',
        '<button class="__ae-btn-apply" id="__ae-apply-btn">✓ Apply</button>',
      ].join("");
      document.getElementById("__ae-reject-btn").addEventListener("click", function() {
        revertPreview();
        S.generated = null;
        buildPanel(S.selected);
      });
      document.getElementById("__ae-apply-btn").addEventListener("click", function() {
        S.previewActive = false;
        S.generated = null;
        closePanel();
        saveRevision();
      });
    }
  }

  function showError(msg) {
    var area = document.getElementById("__ae-result-area");
    if (area) area.innerHTML = '<div class="__ae-error">⚠ ' + msg + '</div>';
  }

  function saveRevision() {
    // Optionally POST to backend to persist the revision
    // (silently fire-and-forget)
    try {
      fetch(BACKEND.replace(":8000", ":3000") + "/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionStorage.getItem("__ae-session") || "inject-" + Date.now(),
          elementSelector: S.selected ? selectorOf(S.selected) : "",
          originalHtml: S.originalHtml,
          modifiedHtml: S.selected ? S.selected.outerHTML : "",
          prompt: (document.getElementById("__ae-prompt") || {}).value || "",
          explanation: S.generated ? S.generated.explanation : "",
          changes: S.generated ? S.generated.changes : [],
          pageUrl: location.pathname,
        }),
      });
    } catch(_) {}
  }

  // ── Settings modal ─────────────────────────────────────────────────────────

  var PROVIDERS = [
    { id: "groq",       name: "Groq",         badge: "Free",       model: "llama-3.3-70b-versatile",              base: "https://api.groq.com/openai/v1" },
    { id: "openrouter", name: "OpenRouter",    badge: "Free models",model: "google/gemma-4-31b-it:free",base: "https://openrouter.ai/api/v1" },
    { id: "gemini",     name: "Gemini",        badge: "Free tier",  model: "gemini-2.0-flash",                     base: "https://generativelanguage.googleapis.com/v1beta/openai" },
    { id: "openai",     name: "OpenAI",        badge: "",           model: "gpt-4o-mini",                          base: "https://api.openai.com/v1" },
    { id: "anthropic",  name: "Anthropic",     badge: "",           model: "claude-haiku-4-5-20251001",            base: "" },
    { id: "ollama",     name: "Ollama (local)",badge: "No key",     model: "llama3.2",                             base: "http://localhost:11434" },
    { id: "claude-cli", name: "Claude Code",   badge: "CLI · No key",model: "claude-sonnet-4-6",                   base: "" },
  ];

  function openSettings() {
    var existing = document.getElementById("__ae-modal");
    if (existing) return;
    var cfg = getConfig() || {};

    var modal = document.createElement("div");
    modal.className = "__ae-modal-bg";
    modal.id = "__ae-modal";
    modal.setAttribute("data-ae", "1");

    modal.innerHTML = [
      '<div class="__ae-modal">',
        '<div class="__ae-modal-head">',
          '<div>',
            '<p class="__ae-modal-title">AI Provider Settings</p>',
            '<p class="__ae-modal-sub">Your key is stored only in this browser (localStorage). Never sent to our servers.</p>',
          '</div>',
          '<button class="__ae-close" id="__ae-modal-close">✕</button>',
        '</div>',
        '<div class="__ae-modal-body">',
          '<div class="__ae-field">',
            '<label>Provider</label>',
            '<div class="__ae-provider-grid" id="__ae-prov-grid">',
              PROVIDERS.map(function(p) {
                return '<button class="__ae-provider-opt' + (cfg.provider === p.id ? ' sel' : '') + '" data-pid="' + p.id + '">' +
                  '<div class="__ae-provider-opt-name">' + p.name + '</div>' +
                  (p.badge ? '<div class="__ae-provider-opt-badge">' + p.badge + '</div>' : '') +
                '</button>';
              }).join(""),
            '</div>',
          '</div>',
          '<div class="__ae-field" id="__ae-key-field">',
            '<label>API Key</label>',
            '<input type="password" id="__ae-key-input" placeholder="Paste your key here…" value="' + (cfg.apiKey || "") + '">',
          '</div>',
          '<div class="__ae-field">',
            '<label>Model</label>',
            '<input type="text" id="__ae-model-input" value="' + (cfg.model || "") + '">',
          '</div>',
          '<div class="__ae-field" id="__ae-url-field" style="display:none">',
            '<label>Base URL</label>',
            '<input type="text" id="__ae-url-input" value="' + (cfg.baseUrl || "http://localhost:11434") + '">',
          '</div>',
        '</div>',
        '<div class="__ae-modal-foot">',
          '<button class="__ae-btn __ae-btn-ghost" id="__ae-modal-cancel">Cancel</button>',
          '<button class="__ae-btn __ae-btn-edit on" id="__ae-modal-save">Save</button>',
        '</div>',
      '</div>',
    ].join("");

    document.body.appendChild(modal);

    var selProvider = cfg.provider || "groq";

    function updateUI() {
      modal.querySelectorAll(".__ae-provider-opt").forEach(function(b) {
        b.classList.toggle("sel", b.getAttribute("data-pid") === selProvider);
      });
      var p = PROVIDERS.find(function(x){ return x.id === selProvider; }) || PROVIDERS[0];
      var isOllama = selProvider === "ollama" || selProvider === "custom";
      document.getElementById("__ae-key-field").style.display = (p.id === "ollama" || p.id === "claude-cli") ? "none" : "";
      document.getElementById("__ae-url-field").style.display = isOllama ? "" : "none";
      if (!document.getElementById("__ae-model-input").value) {
        document.getElementById("__ae-model-input").value = p.model;
      }
    }
    updateUI();

    modal.querySelectorAll(".__ae-provider-opt").forEach(function(b) {
      b.addEventListener("click", function() {
        var p = PROVIDERS.find(function(x){ return x.id === b.getAttribute("data-pid"); });
        if (!p) return;
        selProvider = p.id;
        document.getElementById("__ae-model-input").value = p.model;
        document.getElementById("__ae-key-input").value = "";
        updateUI();
      });
    });

    function closeModal() { modal.remove(); }

    document.getElementById("__ae-modal-close").addEventListener("click", closeModal);
    document.getElementById("__ae-modal-cancel").addEventListener("click", closeModal);
    modal.addEventListener("click", function(e) { if (e.target === modal) closeModal(); });

    document.getElementById("__ae-modal-save").addEventListener("click", function() {
      var p = PROVIDERS.find(function(x){ return x.id === selProvider; }) || PROVIDERS[0];
      var newCfg = {
        provider: selProvider,
        apiKey: document.getElementById("__ae-key-input").value.trim(),
        model: document.getElementById("__ae-model-input").value.trim() || p.model,
        baseUrl: isOllamaMode() ? document.getElementById("__ae-url-input").value.trim() : p.base,
      };
      saveConfig(newCfg);
      updateBadge(newCfg);
      closeModal();
    });

    function isOllamaMode() { return selProvider === "ollama" || selProvider === "custom"; }
  }

  function updateBadge(cfg) {
    var btn = document.getElementById("__ae-cfg-btn");
    if (!btn) return;
    var p = PROVIDERS.find(function(x){ return x.id === cfg.provider; });
    var name = p ? p.name : cfg.provider;
    var hasKey = cfg.apiKey && cfg.apiKey.length > 4 || cfg.provider === "ollama";
    btn.className = "__ae-badge" + (hasKey ? "" : " warn");
    btn.textContent = "⚙ " + name + (cfg.model ? " · " + cfg.model.split("/").pop() : "");
  }

  // Init badge
  updateBadge(getConfig() || {});

  // ── Edit mode toggle ───────────────────────────────────────────────────────

  function ensureTailwindCdn() {
    if (document.getElementById("__ae-tw-cdn")) return;
    var s = document.createElement("script");
    s.id = "__ae-tw-cdn";
    s.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(s);
  }

  editBtn.addEventListener("click", function() {
    S.editMode = !S.editMode;
    if (S.editMode) ensureTailwindCdn();
    overlay.classList.toggle("on", S.editMode);
    editBtn.classList.toggle("on", S.editMode);
    editBtn.textContent = S.editMode ? "✕ Exit Edit Mode" : "⊕ Edit Mode";
    hintEl.style.display = S.editMode ? "" : "none";
    if (!S.editMode) {
      closePanel();
      hideBox(hlBox);
      hideBox(selBox);
    }
  });

  cfgBtn.addEventListener("click", openSettings);

  // Keyboard shortcuts
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && S.editMode) {
      S.editMode = false;
      overlay.classList.remove("on");
      editBtn.classList.remove("on");
      editBtn.textContent = "⊕ Edit Mode";
      hintEl.style.display = "none";
      closePanel();
      hideBox(hlBox);
      hideBox(selBox);
    }
  });

  console.log("%cAI Website Editor loaded ✓", "color:#7c3aed;font-weight:bold;font-size:14px");
  console.log("Backend:", BACKEND);
})();
