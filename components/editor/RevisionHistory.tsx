"use client";

import { useEffect, useState } from "react";
import { X, Clock, RotateCcw, Trash2 } from "lucide-react";
import { useEditorStore } from "@/store/editor";
import { formatTimeAgo } from "@/lib/utils";
import type { Revision } from "@/types/editor";

export function RevisionHistory() {
  const { isHistoryOpen, setHistoryOpen, sessionId, appliedRevisions } = useEditorStore();
  const [serverRevisions, setServerRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHistoryOpen) return;
    setLoading(true);
    fetch(`/api/revisions?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d) => setServerRevisions(d.revisions ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isHistoryOpen, sessionId, appliedRevisions.length]);

  const handleUndo = (rev: Revision) => {
    // Find the element and restore original HTML
    try {
      const el = document.querySelector(rev.elementSelector) as HTMLElement;
      if (el) el.outerHTML = rev.originalHtml;
    } catch {
      // selector may be stale
    }
    fetch(`/api/revisions/${rev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    setServerRevisions((prev) =>
      prev.map((r) => (r.id === rev.id ? { ...r, status: "rejected" } : r))
    );
  };

  const handleDelete = (id: string) => {
    fetch(`/api/revisions/${id}`, { method: "DELETE" });
    setServerRevisions((prev) => prev.filter((r) => r.id !== id));
  };

  if (!isHistoryOpen) return null;

  return (
    <div
      data-editor="history"
      className="fixed left-0 top-14 bottom-0 w-80 bg-zinc-900 border-r border-zinc-700 flex flex-col shadow-2xl z-[9985]"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">Revision History</h2>
        </div>
        <button
          onClick={() => setHistoryOpen(false)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="text-xs text-zinc-500 p-4">Loading history…</p>
        )}

        {!loading && serverRevisions.length === 0 && (
          <div className="p-6 text-center">
            <Clock size={24} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No revisions yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Changes appear here after you apply them.</p>
          </div>
        )}

        {serverRevisions.map((rev) => (
          <div
            key={rev.id}
            className={`border-b border-zinc-800 px-4 py-3 ${
              rev.status === "rejected" ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-200 leading-relaxed truncate">{rev.prompt}</p>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono truncate">
                  {rev.elementSelector}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      rev.status === "applied"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {rev.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">{formatTimeAgo(rev.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                {rev.status === "applied" && (
                  <button
                    onClick={() => handleUndo(rev)}
                    title="Undo this change"
                    className="p-1 text-zinc-500 hover:text-yellow-400 transition-colors"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(rev.id)}
                  title="Delete from history"
                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Changes list */}
            {rev.changes?.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {rev.changes.slice(0, 3).map((c: string, i: number) => (
                  <li key={i} className="text-[10px] text-zinc-500 flex gap-1">
                    <span className="text-green-600">·</span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
