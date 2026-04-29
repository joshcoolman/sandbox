/**
 * Canned-copy fallback for the nudge phase. Used when the LLM call fails so
 * we don't burn an LLM retry on a one-shot prompt. Mirrors the
 * `monono/data/voice.ts` discipline.
 *
 * Substitute `{name}` with the visitor's name. If `{name}` is empty / unknown,
 * fall back to "you" — see `pickTemplate`.
 */

export const NUDGE_TEMPLATES = [
	"hey {name}, what's your read on this?",
	"{name}, you've been quiet — where do you land?",
	"curious what {name} thinks about all this.",
	"{name} — quick gut check, do you buy any of it?",
	"jumping back to {name} — what stands out?",
	"hold up, {name}, what would you push back on here?",
];

export function pickTemplate(templates: string[], name: string): string {
	const tpl = templates[Math.floor(Math.random() * templates.length)];
	const safe = name.trim() || "you";
	return tpl.replaceAll("{name}", safe);
}
