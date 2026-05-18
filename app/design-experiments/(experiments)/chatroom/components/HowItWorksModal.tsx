"use client";

import { useEffect } from "react";
import styles from "./HowItWorksModal.module.css";

interface HowItWorksModalProps {
	onClose: () => void;
}

export function HowItWorksModal({ onClose }: HowItWorksModalProps) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div className={styles.backdrop} onClick={onClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="how-it-works-title"
			>
				<button type="button" className={styles.close} onClick={onClose} aria-label="Close">
					×
				</button>

				<h2 id="how-it-works-title" className={styles.title}>
					How it works
				</h2>

				<p className={styles.lead}>
					Two AI characters opened a conversation about a topic. You arrived. They&apos;re
					pausing for you to join — and the room will wait whenever it&apos;s your turn.
				</p>

				<h3 className={styles.heading}>The architecture</h3>
				<p>
					Most chat experiences live in a single Vercel route handler — request in, LLM call
					out, response back, done. That works for one-shot exchanges, but it can&apos;t drive
					a conversation that&apos;s running on its own clock.
				</p>
				<p>
					This room runs on a Cloudflare <strong>Hibernatable Durable Object</strong> instead —
					one actor per visitor, addressed by a UUID minted when you land. The actor holds the
					conversation in SQLite, drives turn cadence with <code>setAlarm()</code>, and keeps
					the WebSocket alive while the runtime evicts the actor from memory. Idle rooms cost
					essentially nothing.
				</p>
				<p>
					The Vercel side gates entry (per-IP session counter plus a monthly $ ceiling, both in
					Upstash), mints a 60-second HMAC ticket signed over the room ID, and hands you off.
					The Cloudflare worker validates the ticket and steps out of the way.
				</p>

				<h3 className={styles.heading}>The pacing</h3>
				<p>
					The conversation runs as a phase state machine inside the Durable Object&apos;s
					heartbeat. Two openers land, then the room enters{" "}
					<code>awaiting_user</code>. If you stay silent past the first beat, an agent nudges
					you by name <em>once</em> — that&apos;s the entire auto-prompting budget. After
					that, the room transitions to <code>idle</code> and waits.
				</p>
				<p>
					This is the inversion that took the longest to figure out. The first version raced
					toward a turn cap with agents stacking replies whether you&apos;d typed or not.
					Reading it felt like trying to catch a moving train. The current version asks the
					harder question: <em>how does a chatroom reward attention rather than punish
					hesitation?</em>
				</p>
				<p>
					If you want a fresh question, the <strong>ask me something</strong> button hands you
					one. If you want to pivot, <strong>change topic</strong> redirects Maya and Jordan
					mid-flight.
				</p>

				<h3 className={styles.heading}>Cost discipline</h3>
				<p>
					A non-engaging visitor costs <strong>three LLM calls</strong> total — two openers
					and one nudge — then the room is silent. An engaged visitor trades replies as long
					as they want, capped at 80 turns and roughly $0.05 per maxed session. Two
					independent gates protect the experiment: a per-IP counter so one visitor
					can&apos;t dominate, and a monthly ceiling so it can&apos;t blow the budget if it
					goes viral.
				</p>

				<h3 className={styles.heading}>Locally</h3>
				<p>
					Cloning the repo and running <code>pnpm dev</code> lifts the caps to 200 turns,
					skips the per-IP counter, and posts a &quot;production cutoff&quot; divider when you
					cross the prod limit. The dev signal is signed into the ticket itself, so it only
					unlocks when the session route detects <code>NODE_ENV === &quot;development&quot;</code>{" "}
					— production tickets never carry it.
				</p>

				<a
					className={styles.sourceLink}
					href="https://github.com/joshcoolman/sandbox"
					target="_blank"
					rel="noopener noreferrer"
				>
					View source on GitHub →
				</a>
			</div>
		</div>
	);
}
