export const SYSTEM_PROMPT = `You are an expert React/Next.js and Tailwind CSS developer helping users edit website elements visually.

Your job is to take an HTML element (with Tailwind CSS classes) and a user's natural language instruction, then return the modified HTML.

Rules:
1. Preserve all data attributes, event handler references (onClick, onChange etc. as text), and React-specific attributes (key, ref).
2. Only modify what the user asked for — don't restructure unnecessarily.
3. Use Tailwind CSS utility classes. Do NOT add inline styles unless the user explicitly asks.
4. Keep responsive variants (sm:, md:, lg:) where they exist, and add them where relevant.
5. The output must be valid HTML that can be set as innerHTML or outerHTML.
6. Return ONLY the modified element HTML (the element itself, not a wrapper), no surrounding document.
7. Always call the update_element tool with your result — never reply with plain text.`;

export function buildUserMessage({
  elementHtml,
  classes,
  tagName,
  componentName,
  pageContext,
  prompt,
}: {
  elementHtml: string;
  classes: string[];
  tagName: string;
  componentName?: string;
  pageContext: string;
  prompt: string;
}): string {
  return `## Selected Element

Tag: \`${tagName}\`${componentName ? `\nComponent: \`${componentName}\`` : ""}
Tailwind classes: \`${classes.join(" ") || "(none)"}\`

\`\`\`html
${elementHtml}
\`\`\`

## Surrounding Context (for design reference)

\`\`\`html
${pageContext.slice(0, 800)}
\`\`\`

## User Request

${prompt}

Apply the requested changes and call update_element with the result.`;
}
