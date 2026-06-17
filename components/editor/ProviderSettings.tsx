"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertCircle, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import { useProviderStore, PROVIDERS } from "@/store/provider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProviderSettings({ open, onClose }: Props) {
  const { config, isConfigured, setConfig } = useProviderStore();
  const [local, setLocal] = useState(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (open) { setLocal(config); setTestResult(null); }
  }, [open, config]);

  const meta = PROVIDERS.find((p) => p.id === local.provider) ?? PROVIDERS[0];

  const update = (patch: Partial<typeof local>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      // Auto-fill model and baseUrl when provider changes
      if (patch.provider) {
        const m = PROVIDERS.find((p) => p.id === patch.provider);
        if (m) {
          next.model = m.defaultModel;
          next.baseUrl = m.baseUrl;
          next.apiKey = ""; // clear key when switching provider
        }
      }
      return next;
    });
    setTestResult(null);
  };

  const handleSave = () => {
    setConfig(local);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("http://localhost:8000/health");
      if (!res.ok) throw new Error("Backend not reachable");
      const data = await res.json();
      setTestResult({ ok: true, msg: `Connected — using ${data.provider ?? "backend"}` });
    } catch {
      setTestResult({ ok: false, msg: "Python backend not running. Start it with: uvicorn main:app --port 8000" });
    } finally {
      setTesting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <div>
            <h2 className="text-white font-semibold">AI Provider Settings</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Your key stays in your browser — never sent to any third party.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ provider: p.id })}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${
                    local.provider === p.id
                      ? "border-violet-500 bg-violet-900/20 text-white"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span>{p.name}</span>
                  {p.badge && <span className={`text-[10px] font-medium ${p.badgeColor}`}>{p.badge}</span>}
                </button>
              ))}
            </div>
            {meta.hint && (
              <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                <ExternalLink size={10} />
                {meta.hint}
              </p>
            )}
          </div>

          {/* API Key */}
          {meta.requiresKey && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">API Key</label>
              <input
                type="password"
                value={local.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder={`Paste your ${meta.name} key…`}
                className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-violet-500 focus:outline-none placeholder-zinc-600 font-mono"
              />
              <p className="mt-1 text-[10px] text-zinc-600">Stored in your browser localStorage only.</p>
            </div>
          )}

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Model</label>
            {meta.models.length > 0 ? (
              <div className="relative">
                <select
                  value={local.model}
                  onChange={(e) => update({ model: e.target.value })}
                  className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-violet-500 focus:outline-none appearance-none"
                >
                  {meta.models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-zinc-400 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                value={local.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder="e.g. llama3.2"
                className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-violet-500 focus:outline-none"
              />
            )}
          </div>

          {/* Base URL (Ollama / Custom) */}
          {(local.provider === "ollama" || local.provider === "custom") && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Base URL</label>
              <input
                type="text"
                value={local.baseUrl}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-violet-500 focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
              testResult.ok ? "bg-green-900/20 border border-green-800 text-green-300" : "bg-red-900/20 border border-red-800 text-red-300"
            }`}>
              {testResult.ok ? <Check size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              {testResult.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700 flex items-center justify-between gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : null}
            Test connection
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
