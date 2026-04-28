/**
 * Server-only topic catalog. Each room picks one at construction.
 *
 * `opener` is the seed line a randomly-selected first agent will riff on —
 * not literal first-message text. We send it to the LLM as user-context so
 * the agent's first turn lands in the right neighborhood without sounding
 * scripted. The frontend's data/topics.ts mirrors only id/title for display.
 */

export type Topic = {
	id: string;
	title: string;
	opener: string;
};

export const TOPICS: Topic[] = [
	{
		id: "deepfakes",
		title: "AI deepfakes",
		opener:
			"Someone just sent me a deepfake of a friend's voice. It was good enough that I almost replied to it. Where does this go?",
	},
	{
		id: "parasocial",
		title: "Parasocial AI",
		opener:
			"A friend told me her favorite chatbot 'gets her' better than her therapist. She wasn't joking.",
	},
	{
		id: "search-death",
		title: "The death of search",
		opener:
			"I haven't typed a Google query in three weeks. Just asking models. Is that bad?",
	},
	{
		id: "attention",
		title: "Attention as currency",
		opener:
			"Every app wants my attention now. It's the only thing left to extract. What do we do with that.",
	},
	{
		id: "taste",
		title: "Taste in the age of generation",
		opener:
			"If everyone can generate anything, the only edge left is taste. But where does taste even come from?",
	},
	{
		id: "by-hand",
		title: "What's worth doing by hand",
		opener:
			"What's something you'd refuse to let a model do for you, even if it could do it better?",
	},
];

export function pickTopic(): Topic {
	return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

export function getTopic(id: string): Topic | undefined {
	return TOPICS.find((t) => t.id === id);
}
