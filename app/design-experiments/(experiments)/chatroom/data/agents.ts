/**
 * Display-only mirror of workers/chatroom/src/personas.ts.
 * System prompts live server-side and are never shipped to the browser.
 */

export type AgentDisplay = {
	id: string;
	name: string;
	bio: string;
	gradient: string;
};

export const AGENTS: AgentDisplay[] = [
	{
		id: "optimist",
		name: "Mira",
		bio: "Sees the upside. Asks what could go right.",
		gradient: "linear-gradient(135deg, #ffd24a 0%, #ff7a4d 100%)",
	},
	{
		id: "skeptic",
		name: "Caleb",
		bio: "Probes the second-order effects.",
		gradient: "linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)",
	},
	{
		id: "philosopher",
		name: "June",
		bio: "Reframes the question.",
		gradient: "linear-gradient(135deg, #a78bfa 0%, #6b7280 100%)",
	},
];

export function getAgent(id: string): AgentDisplay | undefined {
	return AGENTS.find((a) => a.id === id);
}
