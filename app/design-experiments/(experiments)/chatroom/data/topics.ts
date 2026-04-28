/**
 * Display-only mirror of workers/chatroom/src/topics.ts.
 * Opener seeds live server-side.
 */

export type TopicDisplay = {
	id: string;
	title: string;
};

export const TOPICS: TopicDisplay[] = [
	{ id: "deepfakes", title: "AI deepfakes" },
	{ id: "parasocial", title: "Parasocial AI" },
	{ id: "search-death", title: "The death of search" },
	{ id: "attention", title: "Attention as currency" },
	{ id: "taste", title: "Taste in the age of generation" },
	{ id: "by-hand", title: "What's worth doing by hand" },
];
