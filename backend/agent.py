"""
Multi-step website editor agent.
Receives an LLMConfig and runs: analyze → plan → generate → validate (retry up to 2×).
"""
import re
from llm import chat, extract_json, LLMConfig


ANALYZE_SYSTEM = """You are a senior frontend developer analyzing a website element.
Understand what the element IS and what the user wants to change. Return JSON only."""

PLAN_SYSTEM = """You are a Tailwind CSS expert planning precise code changes.
Return JSON only with exact class names."""

GENERATE_SYSTEM = """You are an expert React/Next.js Tailwind CSS developer.
Apply the planned changes and return ONLY the modified HTML element.
Rules:
- Output ONLY the HTML — no explanation, no markdown fences
- Keep all data attributes and event handler text intact
- Use Tailwind utility classes, no inline styles unless asked
- Keep responsive prefixes (sm:, md:, lg:) where they exist"""


async def analyze(element_html: str, tag: str, classes: list[str], context: str, user_prompt: str, cfg: LLMConfig) -> dict:
    prompt = f"""Analyze this HTML element and the user's request.

Element tag: {tag}
Tailwind classes: {" ".join(classes) or "(none)"}
Element HTML:
{element_html[:1500]}

Surrounding context:
{context[:600]}

User request: "{user_prompt}"

Return JSON:
{{
  "element_purpose": "what this element does (e.g. hero headline, CTA button)",
  "current_style": "brief description of current appearance",
  "requested_change": "precise description of what the user wants",
  "affected_properties": ["list of css/html properties that will change"],
  "complexity": "simple|medium|complex"
}}"""

    raw = await chat(
        [{"role": "system", "content": ANALYZE_SYSTEM},
         {"role": "user", "content": prompt}],
        cfg, json_mode=True,
    )
    try:
        return extract_json(raw)
    except Exception:
        return {"element_purpose": tag, "requested_change": user_prompt, "complexity": "simple"}


async def plan(element_html: str, classes: list[str], analysis: dict, user_prompt: str, cfg: LLMConfig) -> dict:
    prompt = f"""Plan the exact Tailwind CSS / HTML changes needed.

Element HTML:
{element_html[:1500]}

Current classes: {" ".join(classes) or "(none)"}

Analysis:
- Purpose: {analysis.get("element_purpose", "")}
- User wants: {analysis.get("requested_change", user_prompt)}
- Affected properties: {", ".join(analysis.get("affected_properties", []))}

Return JSON:
{{
  "classes_to_remove": ["old classes to remove"],
  "classes_to_add": ["new classes to add"],
  "html_changes": "any structural HTML changes needed (or 'none')",
  "explanation": "one sentence explaining the change",
  "change_bullets": ["specific change 1", "specific change 2"]
}}"""

    raw = await chat(
        [{"role": "system", "content": PLAN_SYSTEM},
         {"role": "user", "content": prompt}],
        cfg, json_mode=True,
    )
    try:
        return extract_json(raw)
    except Exception:
        return {"classes_to_remove": [], "classes_to_add": [], "html_changes": "none",
                "explanation": user_prompt, "change_bullets": []}


async def generate(element_html: str, classes: list[str], plan_data: dict, user_prompt: str, cfg: LLMConfig, feedback: str = "") -> str:
    remove = plan_data.get("classes_to_remove", [])
    add = plan_data.get("classes_to_add", [])
    html_changes = plan_data.get("html_changes", "none")
    retry_note = f"\n\nPrevious attempt failed: {feedback}\nFix that and try again." if feedback else ""

    prompt = f"""Apply these changes to the HTML element:

ORIGINAL HTML:
{element_html}

CHANGES:
- Remove classes: {", ".join(remove) or "none"}
- Add classes: {", ".join(add) or "none"}
- HTML changes: {html_changes}
- User request: {user_prompt}{retry_note}

Output ONLY the modified HTML element, nothing else:"""

    result = await chat(
        [{"role": "system", "content": GENERATE_SYSTEM},
         {"role": "user", "content": prompt}],
        cfg, json_mode=False,
    )
    result = re.sub(r"^```(?:html)?\s*", "", result.strip(), flags=re.IGNORECASE)
    result = re.sub(r"\s*```\s*$", "", result)
    return result.strip()


def validate(html: str, original: str) -> tuple[bool, str]:
    if not html or len(html) < 5:
        return False, "Output was empty"
    if not re.search(r"<[a-zA-Z]", html):
        return False, "No HTML tags found in output"
    if len(html) > len(original) * 10:
        return False, "Output suspiciously long — possible hallucination"
    return True, "ok"


async def run_editor_agent(
    element_html: str,
    outer_html: str,
    classes: list[str],
    tag: str,
    context: str,
    user_prompt: str,
    cfg: LLMConfig,
) -> dict:
    source = outer_html or element_html
    steps: list[str] = []

    steps.append("analyze")
    analysis = await analyze(source, tag, classes, context, user_prompt, cfg)

    steps.append("plan")
    plan_data = await plan(source, classes, analysis, user_prompt, cfg)

    steps.append("generate")
    modified_html = ""
    feedback = ""
    for attempt in range(3):
        modified_html = await generate(source, classes, plan_data, user_prompt, cfg, feedback)
        valid, reason = validate(modified_html, source)
        if valid:
            break
        feedback = reason
        steps.append(f"retry({reason})")

    if not modified_html:
        modified_html = source

    return {
        "modifiedHtml": modified_html,
        "explanation": plan_data.get("explanation") or analysis.get("requested_change") or user_prompt,
        "changes": plan_data.get("change_bullets") or [user_prompt],
        "steps_taken": steps,
    }
