"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor";
import { captureElement, findSelectableElement } from "@/lib/editor/element-capture";
import { ElementHighlighter } from "./ElementHighlighter";

export function EditModeOverlay() {
  const { isEditMode, hoveredElement, selectedElement, setHoveredElement, setSelectedElement } =
    useEditorStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  const peekElement = useCallback(
    (x: number, y: number): HTMLElement | null => {
      if (!overlayRef.current) return null;
      overlayRef.current.style.pointerEvents = "none";
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      overlayRef.current.style.pointerEvents = "all";
      if (!el || el.closest("[data-editor]")) return null;
      return findSelectableElement(el);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = peekElement(e.clientX, e.clientY);
      setHoveredElement(el);
    },
    [peekElement, setHoveredElement]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const el = peekElement(e.clientX, e.clientY);
      if (!el) return;
      setSelectedElement(captureElement(el));
    },
    [peekElement, setSelectedElement]
  );

  useEffect(() => {
    if (!isEditMode) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEditMode, handleMouseMove]);

  if (!isEditMode) return null;

  return (
    <>
      {/* Invisible capture layer */}
      <div
        ref={overlayRef}
        data-editor="overlay"
        onClick={handleClick as unknown as React.MouseEventHandler<HTMLDivElement>}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9980,
          cursor: "crosshair",
          pointerEvents: "all",
        }}
      />

      {/* Highlights rendered outside overlay so they don't interfere */}
      {hoveredElement && !selectedElement && (
        <ElementHighlighter element={hoveredElement} variant="hover" />
      )}
      {selectedElement && (
        <ElementHighlighter element={selectedElement.element} variant="selected" />
      )}
    </>
  );
}
