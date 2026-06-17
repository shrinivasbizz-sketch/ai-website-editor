import type { CapturedElement } from "@/types/editor";

// Tags we consider "interesting" enough to select
const SELECTABLE_TAGS = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6",
  "P", "SPAN", "A", "BUTTON", "INPUT", "TEXTAREA",
  "IMG", "DIV", "SECTION", "ARTICLE", "ASIDE",
  "HEADER", "FOOTER", "MAIN", "NAV", "UL", "LI",
  "FORM", "LABEL", "SELECT", "FIGURE", "BLOCKQUOTE",
]);

/** Walk up the DOM to find the nearest selectable ancestor */
export function findSelectableElement(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute("data-editor")) return null; // editor UI – skip
    if (SELECTABLE_TAGS.has(current.tagName)) {
      const rect = current.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Generate a stable CSS selector for an element */
export function generateSelector(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current.tagName !== "BODY" && current.tagName !== "HTML") {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement?.children ?? []);
    const index = siblings.indexOf(current as Element) + 1;
    parts.unshift(`${tag}:nth-child(${index})`);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

/** Try to read the React component name from the fiber */
function getReactComponentName(el: HTMLElement): string | undefined {
  const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber"));
  if (!fiberKey) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fiber: any = (el as any)[fiberKey];
  while (fiber) {
    if (fiber.type && typeof fiber.type === "function") {
      return fiber.type.displayName || fiber.type.name || undefined;
    }
    fiber = fiber.return;
  }
  return undefined;
}

/** Capture full context from a DOM element */
export function captureElement(el: HTMLElement): CapturedElement {
  const rect = el.getBoundingClientRect();
  return {
    selector: generateSelector(el),
    html: el.innerHTML,
    outerHtml: el.outerHTML,
    classes: Array.from(el.classList),
    tagName: el.tagName.toLowerCase(),
    componentName: getReactComponentName(el),
    pageContext: el.parentElement?.outerHTML?.slice(0, 1000) ?? "",
    rect: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    },
    element: el,
  };
}
