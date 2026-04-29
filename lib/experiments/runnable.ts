/**
 * Server-only helper: which env vars each gated experiment needs to run.
 *
 * Used by the home page (`app/page.tsx`) and the See All experiments page
 * (`app/design-experiments/page.tsx`) to render a placeholder card when the
 * required env isn't configured locally — so a fresh `pnpm install && pnpm dev`
 * still feels honest, with gated experiments visibly present but flagged
 * as needing setup rather than silently failing on click.
 *
 * `process.env` is only fully readable in server components / route handlers /
 * server actions. Don't import this from a `'use client'` file.
 */

const REQUIREMENTS: Record<string, string[]> = {
	monono: ["VERCEL_AI_GATEWAY_KEY"],
	chatroom: ["VERCEL_AI_GATEWAY_KEY", "NEXT_PUBLIC_CHATROOM_WSS_URL", "TICKET_SECRET"],
};

export function getRequiredEnv(slug: string): string[] {
	return REQUIREMENTS[slug] ?? [];
}

export function isRunnable(slug: string): boolean {
	const reqs = REQUIREMENTS[slug];
	if (!reqs || reqs.length === 0) return true;
	return reqs.every((envKey) => !!process.env[envKey]);
}

/**
 * Build a slug → boolean map for the full experiments registry. Cheap; do this
 * once per request in a server component and pass the map to client children.
 */
export function buildRunnableMap(slugs: string[]): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	for (const slug of slugs) {
		out[slug] = isRunnable(slug);
	}
	return out;
}
