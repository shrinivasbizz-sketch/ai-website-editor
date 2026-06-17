"use client";

import { create } from "zustand";
import { nanoid } from "@/lib/utils";
import type { CapturedElement, EditorActions, EditorState, GenerateResponse, Revision } from "@/types/editor";

type Store = EditorState & EditorActions;

export const useEditorStore = create<Store>((set, get) => ({
  isEditMode: false,
  selectedElement: null,
  hoveredElement: null,
  sessionId: nanoid(),

  appliedRevisions: [],
  undoneRevisions: [],

  isGenerating: false,
  generatedResult: null,
  generateError: null,

  isPanelOpen: false,
  isHistoryOpen: false,
  isPreviewActive: false,

  toggleEditMode: () =>
    set((s) => ({
      isEditMode: !s.isEditMode,
      selectedElement: null,
      hoveredElement: null,
      isPanelOpen: false,
      generatedResult: null,
      isPreviewActive: false,
    })),

  setSelectedElement: (el: CapturedElement | null) =>
    set({
      selectedElement: el,
      isPanelOpen: el !== null,
      generatedResult: null,
      generateError: null,
      isPreviewActive: false,
    }),

  setHoveredElement: (el: HTMLElement | null) => set({ hoveredElement: el }),

  setGenerating: (v: boolean) => set({ isGenerating: v }),

  setGeneratedResult: (r: GenerateResponse | null) => set({ generatedResult: r, isPreviewActive: false }),

  setGenerateError: (e: string | null) => set({ generateError: e }),

  setPanelOpen: (v: boolean) => set({ isPanelOpen: v }),

  setHistoryOpen: (v: boolean) => set({ isHistoryOpen: v }),

  setPreviewActive: (v: boolean) => set({ isPreviewActive: v }),

  pushRevision: (r: Revision) =>
    set((s) => ({
      appliedRevisions: [...s.appliedRevisions, r],
      undoneRevisions: [], // clear redo stack on new action
    })),

  undo: () => {
    const { appliedRevisions, undoneRevisions } = get();
    if (appliedRevisions.length === 0) return undefined;
    const last = appliedRevisions[appliedRevisions.length - 1];
    set({
      appliedRevisions: appliedRevisions.slice(0, -1),
      undoneRevisions: [...undoneRevisions, last],
    });
    return last;
  },

  redo: () => {
    const { appliedRevisions, undoneRevisions } = get();
    if (undoneRevisions.length === 0) return undefined;
    const next = undoneRevisions[undoneRevisions.length - 1];
    set({
      appliedRevisions: [...appliedRevisions, next],
      undoneRevisions: undoneRevisions.slice(0, -1),
    });
    return next;
  },

  clearSelection: () =>
    set({
      selectedElement: null,
      isPanelOpen: false,
      generatedResult: null,
      generateError: null,
      isPreviewActive: false,
    }),
}));
