"use client";

import { useEffect, useState, useRef } from "react";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  element: HTMLElement;
  variant: "hover" | "selected";
}

export function ElementHighlighter({ element, variant }: Props) {
  const [rect, setRect] = useState<Rect>(() => {
    const r = element.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const r = element.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [element]);

  const isHover = variant === "hover";
  const border = isHover ? "2px dashed #3b82f6" : "2px solid #8b5cf6";
  const bg = isHover ? "rgba(59,130,246,0.07)" : "rgba(139,92,246,0.10)";
  const labelBg = isHover ? "#3b82f6" : "#8b5cf6";
  const label = `${element.tagName.toLowerCase()}${element.className ? " ." + element.className.trim().split(/\s+/)[0] : ""}`;

  return (
    <div
      data-editor="highlight"
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        border,
        background: bg,
        pointerEvents: "none",
        zIndex: 9990,
        transition: "all 80ms ease",
        boxSizing: "border-box",
      }}
    >
      {!isHover && (
        <span
          style={{
            position: "absolute",
            top: -22,
            left: 0,
            background: labelBg,
            color: "#fff",
            fontSize: 11,
            fontFamily: "monospace",
            padding: "2px 6px",
            borderRadius: "3px 3px 0 0",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {label}
        </span>
      )}
      {isHover && (
        <span
          style={{
            position: "absolute",
            bottom: -20,
            right: 0,
            background: labelBg,
            color: "#fff",
            fontSize: 10,
            fontFamily: "monospace",
            padding: "1px 5px",
            borderRadius: "0 0 3px 3px",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
