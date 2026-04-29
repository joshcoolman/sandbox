export type MessageRole = "user" | "agent" | "system";

export type WireMessage = {
	id: number;
	role: MessageRole;
	agentId: string | null;
	author: string;
	content: string;
	created_at: number;
};

export type HelloEvent = {
	type: "hello";
	topic: { id: string | null; title: string };
	agents: Array<{ id: string; name: string }>;
	messages: WireMessage[];
	status: "active" | "ended";
	turnsUsed: number;
	maxTurns: number;
	phase: PhaseEvent["phase"];
	mode?: "dev" | "prod";
};

export type MessageEvent_ = { type: "message"; message: WireMessage };
export type EndedEvent = { type: "ended"; reason: "turn_cap" | "global_cap" };
export type PhaseEvent = {
	type: "phase";
	phase: "opening" | "awaiting_user" | "nudging" | "responding" | "idle";
};
export type TopicChangeRejectedEvent = { type: "topic_change_rejected"; reason: "limit" | "invalid" };
export type TypingEvent = { type: "typing"; agentId: string | null; name?: string };
export type ServerEvent = HelloEvent | MessageEvent_ | EndedEvent | PhaseEvent | TopicChangeRejectedEvent | TypingEvent;

// Client → server events
export type SayEvent = { type: "say"; author: string; content: string };
export type IdentifyEvent = { type: "identify"; name: string; avatarId: string };
export type ChangeTopicEvent = { type: "change_topic"; title: string };
export type AskMeSomethingEvent = { type: "ask_me_something" };
export type ClientEvent = SayEvent | IdentifyEvent | ChangeTopicEvent | AskMeSomethingEvent;

export type EndedReason =
	| EndedEvent["reason"]
	| "session_exhausted"
	| "config_missing"
	| "session_failed";

export type SessionResponse = { roomId: string; wssUrl: string; ticket: string };
export type SessionError = { code?: EndedReason; error?: string };

export const SPRING = {
	type: "spring" as const,
	stiffness: 420,
	damping: 30,
	mass: 0.8,
};

export const SPRINGY = {
	type: "spring" as const,
	stiffness: 500,
	damping: 18,
	mass: 0.7,
};
