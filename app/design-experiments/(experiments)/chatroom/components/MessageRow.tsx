"use client";

import { motion } from "motion/react";
import { getAgent } from "../data/agents";
import { SPRING, type WireMessage } from "../types";
import { AgentAvatar } from "./AgentAvatar";
import styles from "./MessageRow.module.css";

const USER_GRADIENT = "linear-gradient(135deg, #ffd24a 0%, #ff7a4d 100%)";

interface MessageRowProps {
	message: WireMessage;
	isMe: boolean;
}

export function MessageRow({ message, isMe }: MessageRowProps) {
	if (message.role === "system") {
		return <SystemMessage message={message} />;
	}

	const agent = message.agentId ? getAgent(message.agentId) : null;
	const displayName = agent?.name ?? message.author;
	const gradient = agent?.gradient ?? USER_GRADIENT;
	const image = agent?.image;

	return (
		<motion.li
			layout
			className={styles.row}
			data-me={isMe}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={SPRING}
		>
			<AgentAvatar name={displayName} gradient={gradient} image={image} />
			<div className={styles.body}>
				<div className={styles.meta}>
					<span className={styles.author}>{displayName}</span>
				</div>
				<div className={styles.content}>{message.content}</div>
			</div>
			<span className={styles.time}>{formatTime(message.created_at)}</span>
		</motion.li>
	);
}

interface TypingRowProps {
	agentId: string;
	name: string;
}

export function TypingRow({ agentId, name }: TypingRowProps) {
	const agent = getAgent(agentId);
	const displayName = agent?.name ?? name;
	const gradient = agent?.gradient ?? USER_GRADIENT;
	const image = agent?.image;
	return (
		<motion.li
			layout
			className={styles.row}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -4 }}
			transition={SPRING}
			aria-live="polite"
			aria-label={`${displayName} is typing`}
		>
			<AgentAvatar name={displayName} gradient={gradient} image={image} />
			<div className={styles.body}>
				<div className={styles.meta}>
					<span className={styles.author}>{displayName}</span>
				</div>
				<div className={styles.typingDots} aria-hidden>
					<span className={styles.typingDot} />
					<span className={styles.typingDot} />
					<span className={styles.typingDot} />
				</div>
			</div>
		</motion.li>
	);
}

function SystemMessage({ message }: { message: WireMessage }) {
	const lower = message.content.toLowerCase();
	const label = lower.startsWith("topic changed")
		? "topic changed"
		: lower.startsWith("production cutoff")
			? "dev session"
			: "conversation prompt";
	return (
		<motion.li
			layout
			className={styles.system}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={SPRING}
		>
			<span className={styles.systemRule} aria-hidden />
			<div className={styles.systemContent}>
				<span className={styles.systemLabel}>{label}</span>
				{message.content}
			</div>
			<span className={styles.systemRule} aria-hidden />
		</motion.li>
	);
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
