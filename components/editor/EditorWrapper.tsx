"use client";

import { EditorToolbar } from "./EditorToolbar";
import { EditModeOverlay } from "./EditModeOverlay";
import { EditPanel } from "./EditPanel";
import { RevisionHistory } from "./RevisionHistory";
import { useEditorStore } from "@/store/editor";

export function EditorWrapper({ children }: { children: React.ReactNode }) {
  const { isPanelOpen, isHistoryOpen } = useEditorStore();

  return (
    <>
      <EditorToolbar />
      <EditModeOverlay />
      <RevisionHistory />

      {/* Main content with padding adjustments for panels */}
      <div
        className="transition-all duration-200"
        style={{
          paddingTop: "56px", // toolbar height
          paddingRight: isPanelOpen ? "384px" : undefined,
          paddingLeft: isHistoryOpen ? "320px" : undefined,
        }}
      >
        {children}
      </div>

      <EditPanel />
    </>
  );
}
