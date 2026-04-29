import styles from "./AgentAvatar.module.css";

function initials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.filter(Boolean)
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

interface AgentAvatarProps {
	name: string;
	gradient: string;
	image?: string;
	size?: "sm" | "md";
}

export function AgentAvatar({ name, gradient, image, size = "md" }: AgentAvatarProps) {
	const className = size === "sm" ? `${styles.avatar} ${styles.avatarSm}` : styles.avatar;
	return (
		<div className={className} style={{ background: gradient }} aria-hidden>
			{image ? <img className={styles.avatarImg} src={image} alt="" /> : initials(name)}
		</div>
	);
}
