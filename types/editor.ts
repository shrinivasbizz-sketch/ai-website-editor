export interface CapturedElement {
  selector: string;
  html: string;
  outerHtml: string;
  classes: string[];
  tagName: string;
  componentName?: string;
  pageContext: string;
  rect: { top: number; left: number; width: number; height: number };
  element: HTMLElement;
}

export interface Revision {
  id: string;
  sessionId: string;
  elementSelector: string;
  originalHtml: string;
  modifiedHtml: string;
  prompt: string;
  explanation: string;
  changes: string[];
  status: "pending" | "applied" | "rejected";
  createdAt: string;
}

export interface GenerateResponse {
  modifiedHtml: string;
  explanation: string;
  changes: string[];
}

export interface EditorState {
  isEditMode: boolean;
  selectedElement: CapturedElement | null;
  hoveredElement: HTMLElement | null;
  sessionId: string;

  // Revision history (client-side undo/redo stack)
  appliedRevisions: Revision[];
  undoneRevisions: Revision[];

  // AI generation state
  isGenerating: boolean;
  generatedResult: GenerateResponse | null;
  generateError: string | null;

  // Panel visibility
  isPanelOpen: boolean;
  isHistoryOpen: boolean;

  // Preview state (element has been temporarily patched)
  isPreviewActive: boolean;
}

export interface EditorActions {
  toggleEditMode: () => void;
  setSelectedElement: (el: CapturedElement | null) => void;
  setHoveredElement: (el: HTMLElement | null) => void;
  setGenerating: (v: boolean) => void;
  setGeneratedResult: (r: GenerateResponse | null) => void;
  setGenerateError: (e: string | null) => void;
  setPanelOpen: (v: boolean) => void;
  setHistoryOpen: (v: boolean) => void;
  setPreviewActive: (v: boolean) => void;
  pushRevision: (r: Revision) => void;
  undo: () => Revision | undefined;
  redo: () => Revision | undefined;
  clearSelection: () => void;
}
