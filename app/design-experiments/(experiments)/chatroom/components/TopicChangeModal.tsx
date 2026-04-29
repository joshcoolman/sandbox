"use client";

import { useEffect, useState } from "react";
import styles from "./TopicChangeModal.module.css";

const MAX_TOPIC_LEN = 60;

interface TopicChangeModalProps {
	onSubmit: (title: string) => void;
	onClose: () => void;
}

export function TopicChangeModal({ onSubmit, onClose }: TopicChangeModalProps) {
	const [value, setValue] = useState("");

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const trimmed = value.trim();
	const submit = () => {
		if (!trimmed) return;
		onSubmit(trimmed.slice(0, MAX_TOPIC_LEN));
	};

	return (
		<div className={styles.backdrop} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<h2 className={styles.title}>Change the topic</h2>
				<p className={styles.help}>
					Maya and Jordan will pivot to whatever you write. Try something specific.
				</p>
				<div className={styles.field}>
					<input
						className={styles.input}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Bitcoin, working in public, growing up online…"
						maxLength={MAX_TOPIC_LEN}
						autoFocus
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
						}}
					/>
					<span className={styles.counter}>
						{value.length} / {MAX_TOPIC_LEN}
					</span>
				</div>
				<div className={styles.actions}>
					<button type="button" className={styles.btn} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={`${styles.btn} ${styles.btnPrimary}`}
						onClick={submit}
						disabled={!trimmed}
					>
						Pivot
					</button>
				</div>
			</div>
		</div>
	);
}
