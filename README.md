# ✏ AI Website Editor

> Click any element on any website. Describe a change in plain English. Watch it happen.

Open-source visual AI editor that works on **any website** via a single `<script>` tag.
No account. No subscription. Bring your own free API key.

---

## ✦ Quick Start (one command)

```bash
git clone https://github.com/yourname/ai-website-editor
cd ai-website-editor/backend
pip install -r requirements.txt
python main.py
```

Open **http://localhost:8000** → get your script tag → add to any website.

---

## Add to your website

```html
<!-- Paste before </body> on any HTML page -->
<script src="http://localhost:8000/inject.js"></script>
```

That's it. An editor toolbar appears at the top of the page.

---

## How it works

```
Your website  →  inject.js  →  Python Agent  →  Your AI provider
(any page)       (1 script)    (3-step agent)    (Groq/Gemini/Ollama)
```

**3-step AI agent pipeline:**
1. **Analyze** — understand what the selected element is and what the user wants
2. **Plan** — decide exact HTML/CSS/Tailwind changes to make
3. **Generate** — produce the modified HTML (retries if output is invalid)

---

## Supported AI Providers

Each user configures their own key — you pay nothing for their usage.

| Provider | Free Tier | Sign Up |
|---|---|---|
| **Groq** | ✅ 14,400 req/day | [console.groq.com](https://console.groq.com) |
| **Google Gemini** | ✅ 1M tokens/day | [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter** | ✅ Free models | [openrouter.ai](https://openrouter.ai) |
| **Ollama** | ✅ Unlimited local | [ollama.com](https://ollama.com) |
| OpenAI | ❌ Paid | [platform.openai.com](https://platform.openai.com) |
| Anthropic | ❌ Paid | [console.anthropic.com](https://console.anthropic.com) |

Keys stay **in the user's browser only** — never sent to your server.

---

## Share with your team

### Docker (everyone runs their own copy)

```bash
docker compose up --build
```

### Deploy free to cloud (one URL for the whole team)

| Service | Deploy |
|---|---|
| Python agent | [Railway](https://railway.app) — connect GitHub → select `/backend` |
| Next.js UI (optional) | [Vercel](https://vercel.com) — set `NEXT_PUBLIC_AGENT_URL` |

### Bookmarklet (no code changes needed)

Visit `http://localhost:8000` and drag **✏ AI Editor** to your bookmarks bar.

---

## Features

- Works on any website — React, Vue, Next.js, plain HTML, WordPress, anything
- Visual element selection with hover preview
- Natural language editing — "make this button red and add shadow"
- Live DOM preview before applying
- Undo/redo with full revision history
- Tailwind CSS aware — preserves responsive prefixes
- BYOK — each user brings their own free API key
- No account, no subscription, self-hostable
- MIT licensed

---

## Project Structure

```
backend/            ← Python agent (standalone — the core product)
  main.py           ← FastAPI + serves inject.js + setup page
  agent.py          ← 3-step AI pipeline
  llm.py            ← Multi-provider abstraction (BYOK)
  static/inject.js  ← Universal client script
  Dockerfile
  railway.toml

editor/             ← Optional Next.js rich UI
  app/
  components/editor/
  store/
```

The Python `backend/` is the complete standalone product.
The `editor/` Next.js app is optional and adds a richer interface.

---

## API

```
GET  /              Setup & onboarding page
GET  /inject.js     Universal client script
GET  /health        Health check
POST /generate      AI editing (BYOK)
GET  /api/docs      Swagger docs
```

---

## Contributing

PRs welcome. Fork → branch → PR.
Areas for contribution: more providers, file export, browser extension, VS Code plugin.

---

## License

MIT

---

## Next.js dev server (optional rich UI)

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
