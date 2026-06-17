"""
LLM provider abstraction — per-request config (BYOK model).
The caller passes provider + api_key + model + base_url in every request.
Falls back to .env values if no per-request config is provided.
"""
import os
import asyncio
import subprocess
import sys
import json
import re
import httpx
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class LLMConfig:
    provider: str       # groq | openai | anthropic | gemini | openrouter | ollama | custom
    api_key: str
    model: str
    base_url: str       # only used for ollama / custom


def config_from_env() -> LLMConfig:
    """Build config from environment variables (used as fallback)."""
    if os.getenv("GROQ_API_KEY"):
        return LLMConfig(
            provider="groq",
            api_key=os.getenv("GROQ_API_KEY", ""),
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            base_url="https://api.groq.com/openai/v1",
        )
    if os.getenv("OPENROUTER_API_KEY"):
        return LLMConfig(
            provider="openrouter",
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            model=os.getenv("OPENROUTER_MODEL", "google/gemma-4-31b-it:free"),
            base_url="https://openrouter.ai/api/v1",
        )
    if os.getenv("ANTHROPIC_API_KEY"):
        return LLMConfig(
            provider="anthropic",
            api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
            base_url="",
        )
    if os.getenv("GEMINI_API_KEY"):
        return LLMConfig(
            provider="gemini",
            api_key=os.getenv("GEMINI_API_KEY", ""),
            model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            base_url="https://generativelanguage.googleapis.com/v1beta/openai",
        )
    # Default: Ollama local
    return LLMConfig(
        provider="ollama",
        api_key="ollama",
        model=os.getenv("OLLAMA_MODEL", "llama3.2"),
        base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
    )


# Canonical base URLs for known providers
_BASE_URLS = {
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai",
    "ollama": "http://localhost:11434",
}


def resolve_config(raw: dict | None) -> LLMConfig:
    """
    Build an LLMConfig from the per-request dict sent by the browser.
    Falls back to env-derived config if nothing useful is provided.
    """
    if not raw or not raw.get("provider"):
        return config_from_env()

    provider = raw.get("provider", "ollama")
    api_key = raw.get("apiKey", "") or raw.get("api_key", "")
    model = raw.get("model", "")
    base_url = raw.get("baseUrl", "") or raw.get("base_url", "") or _BASE_URLS.get(provider, "")

    # If the user hasn't configured a key yet, try env fallback
    if not api_key and provider not in ("ollama", "custom", "claude-cli"):
        return config_from_env()

    return LLMConfig(provider=provider, api_key=api_key, model=model, base_url=base_url)


# ── Core chat function ─────────────────────────────────────────────────────────

_JSON_MODE_PROVIDERS = {"groq", "openai", "gemini"}  # providers that reliably support response_format

async def chat(messages: list[dict], cfg: LLMConfig, json_mode: bool = False) -> str:
    """
    Single LLM call with the given config. Returns the assistant's text.
    json_mode is only applied for providers that reliably support response_format.
    """
    effective_json_mode = json_mode and cfg.provider in _JSON_MODE_PROVIDERS
    if cfg.provider == "claude-cli":
        return await _claude_cli_chat(messages, cfg)
    elif cfg.provider == "anthropic":
        return await _anthropic_chat(messages, cfg)
    elif cfg.provider == "ollama":
        return await _ollama_chat(messages, cfg, effective_json_mode)
    else:
        return await _openai_chat(messages, cfg, effective_json_mode)


async def _claude_cli_chat(messages: list[dict], cfg: LLMConfig) -> str:
    """Use the local `claude` CLI (Claude Code). No API key required — uses the
    user's existing Claude Code / Pro / Max authentication.

    On Windows, claude is a .cmd wrapper so we need shell=True.
    We pass the prompt via stdin (not as a -p argument) to avoid
    command-line length limits and shell-escaping issues.
    """
    system = ""
    user = ""
    for m in messages:
        if m["role"] == "system":
            system = m["content"]
        elif m["role"] == "user":
            user = m["content"]

    full_prompt = f"{system}\n\n{user}" if system else user

    # Sanitize model name to prevent shell injection when shell=True
    safe_model = re.sub(r"[^a-zA-Z0-9\-\._:/]", "", cfg.model or "")
    cmd = f"claude --model {safe_model} -p" if safe_model else "claude -p"

    def _run() -> subprocess.CompletedProcess:
        return subprocess.run(
            cmd,
            input=full_prompt,
            capture_output=True,
            text=True,
            timeout=120,
            shell=True,  # required on Windows for .cmd wrappers; also works on Unix
        )

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(loop.run_in_executor(None, _run), timeout=125)
    except (asyncio.TimeoutError, subprocess.TimeoutExpired):
        raise Exception("Claude CLI timed out after 120s")

    if result.returncode != 0:
        raise Exception(f"Claude CLI error: {result.stderr.strip() or 'non-zero exit'}")

    return result.stdout.strip()


async def _openai_chat(messages: list[dict], cfg: LLMConfig, json_mode: bool) -> str:
    base = cfg.base_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {cfg.api_key}",
        "Content-Type": "application/json",
    }
    payload: dict = {
        "model": cfg.model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 4096,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{base}/chat/completions", headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def _ollama_chat(messages: list[dict], cfg: LLMConfig, json_mode: bool) -> str:
    base = (cfg.base_url or "http://localhost:11434").rstrip("/")
    payload: dict = {
        "model": cfg.model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.2},
    }
    if json_mode:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{base}/api/chat", json=payload)
        r.raise_for_status()
        return r.json()["message"]["content"]


async def _anthropic_chat(messages: list[dict], cfg: LLMConfig) -> str:
    system = ""
    chat_msgs = []
    for m in messages:
        if m["role"] == "system":
            system = m["content"]
        else:
            chat_msgs.append(m)

    headers = {
        "x-api-key": cfg.api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": cfg.model or "claude-haiku-4-5-20251001",
        "max_tokens": 4096,
        "system": system,
        "messages": chat_msgs,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
        r.raise_for_status()
        content = r.json()["content"]
        return next((b["text"] for b in content if b["type"] == "text"), "")


# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_json(raw: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    return json.loads(cleaned.strip())


def provider_label(cfg: LLMConfig) -> str:
    return f"{cfg.provider}/{cfg.model}"
