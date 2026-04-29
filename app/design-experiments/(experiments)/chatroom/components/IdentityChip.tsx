"use client";

import { Pencil } from "lucide-react";
import { getUserIcon } from "../data/userIcons";
import type { Identity } from "../hooks/useIdentity";
import { AgentAvatar } from "./AgentAvatar";
import styles from "./IdentityChip.module.css";

interface IdentityChipProps {
	identity: Identity;
	onEdit: () => void;
}

export function IdentityChip({ identity, onEdit }: IdentityChipProps) {
	const icon = getUserIcon(identity.avatarId);
	return (
		<button type="button" className={styles.chip} onClick={onEdit} aria-label="Edit your identity">
			<AgentAvatar
				name={identity.name}
				gradient={icon.gradient}
				image={icon.image ?? undefined}
				size="sm"
			/>
			<span className={styles.label}>you</span>
			<span className={styles.name}>{identity.name}</span>
			<span className={styles.pencil} aria-hidden>
				<Pencil size={12} strokeWidth={2.5} />
			</span>
		</button>
	);
}
