"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import styles from "./Composer.module.css";

// Server-side cap protects against absurd inputs; the UI doesn't surface it.

interface ComposerProps {
	value: string;
	disabled: boolean;
	turnsRemaining: number;
	maxTurns: number;
	phaseHint?: string | null;
	showAskButton?: boolean;
	onAskMeSomething?: () => void;
	onChange: (next: string) => void;
	onSubmit: () => void;
}

export function Composer({
	value,
	disabled,
	turnsRemaining,
	maxTurns,
	phaseHint,
	showAskButton,
	onAskMeSomething,
	onChange,
	onSubmit,
}: ComposerProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
	}, [value]);

	const handleKey = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (!disabled && value.trim()) onSubmit();
			}
		},
		[disabled, onSubmit, value],
	);

	const turnsLow = turnsRemaining <= 5;
	const placeholder = disabled
		? maxTurns > 0 && turnsRemaining === 0
			? "no turns left"
			: "connecting…"
		: "join the conversation — press enter to send";

	const showTopRow = !!phaseHint || !!showAskButton;

	return (
		<div className={styles.composer} data-disabled={disabled}>
			{showTopRow && (
				<div className={styles.topRow}>
					{phaseHint ? (
						<div className={styles.phaseHint}>
							<span className={styles.phaseDot} aria-hidden />
							{phaseHint}
						</div>
					) : (
						<div />
					)}
					{showAskButton && onAskMeSomething && (
						<button
							type="button"
							className={styles.askBtn}
							onClick={onAskMeSomething}
							aria-label="Ask Maya or Jordan to ask you a question"
						>
							<Sparkles size={11} strokeWidth={2.5} />
							ask me something
						</button>
					)}
				</div>
			)}
			<textarea
				ref={textareaRef}
				className={styles.input}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKey}
				placeholder={placeholder}
				disabled={disabled}
				rows={1}
			/>
			<div className={styles.footer}>
				<span className={styles.turnsLeft} data-low={turnsLow}>
					<strong>{turnsRemaining}</strong>
					{turnsRemaining === 1 ? "turn" : "turns"} left
				</span>
				<span className={styles.hint}>↵ to send · ⇧↵ for newline</span>
			</div>
		</div>
	);
}
