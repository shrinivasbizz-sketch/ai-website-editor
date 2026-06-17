"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProviderConfig {
  provider: string;   // groq | openai | anthropic | gemini | openrouter | ollama | claude-cli | custom
  apiKey: string;
  model: string;
  baseUrl: string;    // only for ollama / custom
}

export const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    badge: "Free tier",
    badgeColor: "text-green-400",
    defaultModel: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
    requiresKey: true,
    models: ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"],
    hint: "Get a free key at console.groq.com",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    badge: "Free models",
    badgeColor: "text-green-400",
    defaultModel: "google/gemma-4-31b-it:free",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresKey: true,
    models: [
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "openai/gpt-oss-120b:free",
      "google/gemma-4-26b-a4b-it:free",
    ],
    hint: "Free models available at openrouter.ai",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Free tier",
    badgeColor: "text-green-400",
    defaultModel: "gemini-2.0-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    requiresKey: true,
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    hint: "Get a free key at aistudio.google.com",
  },
  {
    id: "openai",
    name: "OpenAI",
    badge: "",
    badgeColor: "",
    defaultModel: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
    hint: "Get a key at platform.openai.com",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    badge: "",
    badgeColor: "",
    defaultModel: "claude-haiku-4-5-20251001",
    baseUrl: "",
    requiresKey: true,
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
    hint: "Get a key at console.anthropic.com",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    badge: "No key needed",
    badgeColor: "text-blue-400",
    defaultModel: "llama3.2",
    baseUrl: "http://localhost:11434",
    requiresKey: false,
    models: ["llama3.2", "llama3.1", "mistral", "codellama", "phi3"],
    hint: "Install from ollama.com then run: ollama pull llama3.2",
  },
  {
    id: "claude-cli",
    name: "Claude Code CLI",
    badge: "Pro/Max — no key",
    badgeColor: "text-orange-400",
    defaultModel: "claude-sonnet-4-6",
    baseUrl: "",
    requiresKey: false,
    models: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    hint: "Uses your local Claude Code CLI — no API key needed. Install: npm i -g @anthropic-ai/claude-code",
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    badge: "",
    badgeColor: "",
    defaultModel: "",
    baseUrl: "",
    requiresKey: false,
    models: [],
    hint: "Any OpenAI-compatible API endpoint",
  },
] as const;

interface ProviderStore {
  config: ProviderConfig;
  isConfigured: boolean;
  setConfig: (c: Partial<ProviderConfig>) => void;
  reset: () => void;
}

const DEFAULT: ProviderConfig = {
  provider: "groq",
  apiKey: "",
  model: "llama-3.3-70b-versatile",
  baseUrl: "",
};

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT,
      isConfigured: false,
      setConfig: (c) => {
        const next = { ...get().config, ...c };
        const meta = PROVIDERS.find((p) => p.id === next.provider);
        const needsKey = meta?.requiresKey ?? true;
        set({ config: next, isConfigured: !needsKey || next.apiKey.length > 4 });
      },
      reset: () => set({ config: DEFAULT, isConfigured: false }),
    }),
    { name: "ai-editor-provider-v1" }
  )
);
