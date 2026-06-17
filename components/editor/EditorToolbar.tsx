"use client";

import { useEffect, useState } from "react";
import {
  MousePointer2,
  Undo2,
  Redo2,
  Clock,
  Pencil,
  X,
  Keyboard,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useEditorStore } from "@/store/editor";
import { useProviderStore, PROVIDERS } from "@/store/provider";
import { ProviderSettings } from "./ProviderSettings";

export function EditorToolbar() {
  const {
    isEditMode, toggleEditMode,
    isHistoryOpen, setHistoryOpen,
    appliedRevisions, undoneRevisions,
    undo, redo,
    selectedElement, isPanelOpen,
  } = useEditorStore();

  const { config, isConfigured } = useProviderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const providerMeta = PROVIDERS.find((p) => p.id === config.provider);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const rev = undo();
        if (rev) {
          try {
            const el = document.querySelector(rev.elementSelector) as HTMLElement;
            if (el) el.outerHTML = rev.originalHtml;
          } catch { /* stale selector */ }
        }
      }
      if (mod && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        const rev = redo();
        if (rev) {
          try {
            const el = document.querySelector(rev.elementSelector) as HTMLElement;
            if (el) el.outerHTML = rev.modifiedHtml;
          } catch { /* stale */ }
        }
      }
      if (e.key === "Escape" && isEditMode) toggleEditMode();
      if (e.key === "," && mod) { e.preventDefault(); setSettingsOpen(true); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isEditMode, toggleEditMode, undo, redo]);

  return (
    <>
      <div
        data-editor="toolbar"
        className="fixed top-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur border-b border-zinc-700 flex items-center px-4 gap-3 z-[9999]"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
            <Pencil size={13} className="text-white" />
          </div>
          <span className="text-white text-sm font-semibold hidden sm:block">AI Editor</span>
        </div>

        <div className="h-5 w-px bg-zinc-700" />

        {/* Edit mode toggle */}
        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            isEditMode
              ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          }`}
        >
          {isEditMode ? <X size={14} /> : <MousePointer2 size={14} />}
          {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
        </button>

        {isEditMode && (
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Keyboard size={11} />
            Click any element to edit
          </span>
        )}

        <div className="flex-1" />

        {/* Provider badge */}
        <button
          onClick={() => setSettingsOpen(true)}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
            isConfigured
              ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              : "bg-amber-900/20 border-amber-700/50 text-amber-400 hover:border-amber-500"
          }`}
        >
          {!isConfigured && <AlertTriangle size={11} />}
          {isConfigured
            ? `${providerMeta?.name ?? config.provider} · ${config.model}`
            : "Configure AI provider"}
        </button>

        {isPanelOpen && selectedElement && (
          <div className="hidden lg:flex items-center gap-1.5 bg-violet-900/20 border border-violet-800/40 px-2.5 py-1 rounded text-[11px] text-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Editing {selectedElement.tagName}
          </div>
        )}

        <div className="h-5 w-px bg-zinc-700" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const rev = undo();
              if (rev) {
                try {
                  const el = document.querySelector(rev.elementSelector) as HTMLElement;
                  if (el) el.outerHTML = rev.originalHtml;
                } catch { /* stale */ }
              }
            }}
            disabled={appliedRevisions.length === 0}
            title="Undo (⌘Z)"
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => {
              const rev = redo();
              if (rev) {
                try {
                  const el = document.querySelector(rev.elementSelector) as HTMLElement;
                  if (el) el.outerHTML = rev.modifiedHtml;
                } catch { /* stale */ }
              }
            }}
            disabled={undoneRevisions.length === 0}
            title="Redo (⌘⇧Z)"
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* History */}
        <button
          onClick={() => setHistoryOpen(!isHistoryOpen)}
          title="Revision history"
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
            isHistoryOpen ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          <Clock size={14} />
          <span className="hidden sm:block text-xs">History</span>
          {appliedRevisions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
              {appliedRevisions.length > 9 ? "9+" : appliedRevisions.length}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="AI Provider Settings (⌘,)"
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>

      <ProviderSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
