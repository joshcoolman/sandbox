/**
 * Display-only mirror of workers/chatroom/src/personas.ts.
 * System prompts live server-side and are never shipped to the browser.
 *
 * Avatars + gradients are reused from leaderboard data so Maya and Jordan
 * are visually the same characters across both experiments.
 */

export type AgentDisplay = {
	id: string;
	name: string;
	bio: string;
	gradient: string;
	image: string;
};

export const AGENTS: AgentDisplay[] = [
	{
		id: "optimist",
		name: "Maya Chen",
		bio: "AI enthusiast",
		gradient: "linear-gradient(135deg, #ff6b9d, #c044ff)",
		image: "/leaderboard/avatars/01.jpg",
	},
	{
		id: "skeptic",
		name: "Jordan Park",
		bio: "AI enthusiast",
		gradient: "linear-gradient(135deg, #22d3ee, #3b82f6)",
		image: "/leaderboard/avatars/02.jpg",
	},
];

export function getAgent(id: string): AgentDisplay | undefined {
	return AGENTS.find((a) => a.id === id);
}
