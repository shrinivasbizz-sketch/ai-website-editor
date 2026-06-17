"use client";

import { useState, useRef, useEffect } from "react";
import { X, Wand2, Check, RotateCcw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEditorStore } from "@/store/editor";
import { useProviderStore } from "@/store/provider";
import { DiffViewer } from "./DiffViewer";
import type { GenerateResponse } from "@/types/editor";
import { nanoid } from "@/lib/utils";

const PROMPT_SUGGESTIONS = [
  "Make the text larger and bolder",
  "Change the background color to dark blue",
  "Add a hover animation",
  "Make the button more prominent",
  "Increase spacing and padding",
  "Change font to sans-serif",
];

export function EditPanel() {
  const {
    isPanelOpen,
    selectedElement,
    isGenerating,
    generatedResult,
    generateError,
    isPreviewActive,
    sessionId,
    appliedRevisions,
    clearSelection,
    setGenerating,
    setGeneratedResult,
    setGenerateError,
    setPreviewActive,
    setPanelOpen,
    pushRevision,
  } = useEditorStore();

  const { config: providerConfig } = useProviderStore();
  const [prompt, setPrompt] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Keep a reference to the original outerHTML for restoration
  const originalHtmlRef = useRef<string>("");

  useEffect(() => {
    if (isPanelOpen && textareaRef.current) {
      textareaRef.current.focus();
      setPrompt("");
      setShowDiff(false);
    }
  }, [isPanelOpen, selectedElement]);

  const handleGenerate = async () => {
    if (!selectedElement || !prompt.trim()) return;
    setGenerating(true);
    setGeneratedResult(null);
    setGenerateError(null);
    setPreviewActive(false);
    originalHtmlRef.current = selectedElement.outerHtml;

    try {
      const res = await fetch("/api/editor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elementHtml: selectedElement.html,
          outerHtml: selectedElement.outerHtml,
          classes: selectedElement.classes,
          tagName: selectedElement.tagName,
          componentName: selectedElement.componentName,
          pageContext: selectedElement.pageContext,
          prompt,
          providerConfig,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const data: GenerateResponse = await res.json();
      setGeneratedResult(data);
      // Apply preview to DOM
      applyPreview(data.modifiedHtml);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const applyPreview = (modifiedHtml: string) => {
    if (!selectedElement) return;
    try {
      const el = selectedElement.element;
      // Replace outerHTML to show preview
      const parser = new DOMParser();
      const doc = parser.parseFromString(modifiedHtml, "text/html");
      const newEl = doc.body.firstElementChild as HTMLElement;
      if (newEl && el.parentElement) {
        el.outerHTML = modifiedHtml;
        setPreviewActive(true);
      }
    } catch {
      // If outerHTML swap fails (e.g. SVG), try innerHTML
      selectedElement.element.innerHTML = modifiedHtml;
      setPreviewActive(true);
    }
  };

  const revertPreview = () => {
    if (!selectedElement || !originalHtmlRef.current) return;
    // Find current element by selector and restore
    try {
      const el = document.querySelector(selectedElement.selector) as HTMLElement;
      if (el) el.outerHTML = originalHtmlRef.current;
    } catch {
      // Element may have moved during preview swap; use stored ref
    }
    setPreviewActive(false);
  };

  const handleApply = async () => {
    if (!generatedResult || !selectedElement) return;

    try {
      const res = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          elementSelector: selectedElement.selector,
          originalHtml: selectedElement.outerHtml,
          modifiedHtml: generatedResult.modifiedHtml,
          prompt,
          explanation: generatedResult.explanation,
          changes: generatedResult.changes,
          pageUrl: window.location.pathname,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        pushRevision(data.revision);
      }
    } catch {
      // Non-fatal — change is already applied to DOM
    }

    clearSelection();
  };

  const handleReject = () => {
    if (isPreviewActive) revertPreview();
    setGeneratedResult(null);
    setPreviewActive(false);
  };

  if (!isPanelOpen || !selectedElement) return null;

  return (
    <div
      data-editor="panel"
      className="fixed right-0 top-14 bottom-0 w-96 bg-zinc-900 border-l border-zinc-700 flex flex-col shadow-2xl z-[9985] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">Edit Element</h2>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            {selectedElement.tagName}
            {selectedElement.componentName ? ` · ${selectedElement.componentName}` : ""}
          </p>
        </div>
        <button
          onClick={() => { if (isPreviewActive) revertPreview(); clearSelection(); }}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Classes chip list */}
        {selectedElement.classes.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Tailwind Classes</p>
            <div className="flex flex-wrap gap-1">
              {selectedElement.classes.map((cls) => (
                <span key={cls} className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompt area */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Describe your change
          </label>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            placeholder="e.g. Make this heading bigger and change color to blue"
            rows={3}
            className="w-full bg-zinc-800 text-sm text-white placeholder-zinc-500 rounded-lg px-3 py-2 resize-none border border-zinc-700 focus:border-violet-500 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-zinc-600 mt-1">⌘ + Enter to generate</p>

          {/* Suggestions */}
          <div className="mt-2 flex flex-wrap gap-1">
            {PROMPT_SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {generateError && (
          <div className="mx-4 my-3 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
            <p className="text-red-300 text-xs">{generateError}</p>
          </div>
        )}

        {/* AI Result */}
        {generatedResult && (
          <div className="px-4 py-3 space-y-3">
            {/* Explanation */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">AI Explanation</p>
              <p className="text-xs text-zinc-300 leading-relaxed">{generatedResult.explanation}</p>
            </div>

            {/* Changes list */}
            {generatedResult.changes.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Changes</p>
                <ul className="space-y-1">
                  {generatedResult.changes.map((c, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex gap-1.5">
                      <span className="text-green-400 shrink-0">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diff viewer toggle */}
            <button
              onClick={() => setShowDiff((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {showDiff ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showDiff ? "Hide" : "Show"} code diff
            </button>

            {showDiff && (
              <DiffViewer
                original={selectedElement.outerHtml}
                modified={generatedResult.modifiedHtml}
              />
            )}

            {isPreviewActive && (
              <div className="bg-violet-900/20 border border-violet-800/40 rounded px-3 py-2">
                <p className="text-[11px] text-violet-300">Preview active — changes visible on page</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-zinc-700 px-4 py-3 space-y-2 shrink-0">
        {!generatedResult ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 size={15} />
                Generate with AI
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2.5 transition-colors"
            >
              <RotateCcw size={13} />
              Reject
            </button>
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg px-3 py-2.5 transition-colors"
            >
              <Check size={13} />
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
