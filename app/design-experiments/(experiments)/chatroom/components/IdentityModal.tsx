"use client";

import { useEffect, useState } from "react";
import { USER_ICONS } from "../data/userIcons";
import type { Identity } from "../hooks/useIdentity";
import styles from "./IdentityModal.module.css";

interface IdentityModalProps {
	identity: Identity;
	onSave: (next: Identity) => void;
	onClose: () => void;
}

function initials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.filter(Boolean)
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function IdentityModal({ identity, onSave, onClose }: IdentityModalProps) {
	const [name, setName] = useState(identity.name);
	const [avatarId, setAvatarId] = useState(identity.avatarId);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const submit = () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		onSave({ name: trimmed, avatarId });
	};

	return (
		<div className={styles.backdrop} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<h2 className={styles.title}>Your identity in the room</h2>

				<div className={styles.field}>
					<label className={styles.fieldLabel} htmlFor="identity-name">name</label>
					<input
						id="identity-name"
						className={styles.input}
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={24}
						autoFocus
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
						}}
					/>
				</div>

				<div className={styles.field}>
					<span className={styles.fieldLabel}>avatar</span>
					<div className={styles.grid}>
						{USER_ICONS.map((icon) => (
							<button
								key={icon.id}
								type="button"
								className={styles.iconBtn}
								data-selected={icon.id === avatarId}
								onClick={() => setAvatarId(icon.id)}
								aria-label={icon.label}
							>
								<div className={styles.iconInner} style={{ background: icon.gradient }}>
									{icon.image ? (
										<img className={styles.iconImg} src={icon.image} alt="" />
									) : (
										initials(name || "you")
									)}
								</div>
							</button>
						))}
					</div>
				</div>

				<div className={styles.actions}>
					<button type="button" className={styles.btn} onClick={onClose}>
						Cancel
					</button>
					<button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit}>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
