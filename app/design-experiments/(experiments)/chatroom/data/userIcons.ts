/**
 * User-pickable avatars. These are the leaderboard avatars not already taken
 * by Maya (01) and Jordan (02). The "initials" sentinel renders the user's
 * initials over a default gradient instead of an image.
 */

export type UserIcon = {
	id: string;
	image: string | null;
	gradient: string;
	label: string;
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, #ffd24a 0%, #ff7a4d 100%)";

export const USER_ICONS: UserIcon[] = [
	{ id: "03", image: "/leaderboard/avatars/03.jpg", gradient: "linear-gradient(135deg, #a3e635, #22c55e)", label: "Atlas" },
	{ id: "04", image: "/leaderboard/avatars/04.jpg", gradient: "linear-gradient(135deg, #fbbf24, #f97316)", label: "Sam" },
	{ id: "05", image: "/leaderboard/avatars/05.jpg", gradient: "linear-gradient(135deg, #f472b6, #ec4899)", label: "Rin" },
	{ id: "06", image: "/leaderboard/avatars/06.jpg", gradient: "linear-gradient(135deg, #818cf8, #6366f1)", label: "Cleo" },
	{ id: "07", image: "/leaderboard/avatars/07.jpg", gradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", label: "Wren" },
	{ id: "08", image: "/leaderboard/avatars/08.jpg", gradient: "linear-gradient(135deg, #fb7185, #e11d48)", label: "Kai" },
	{ id: "initials", image: null, gradient: DEFAULT_GRADIENT, label: "Initials" },
];

export function getUserIcon(id: string | undefined): UserIcon {
	return USER_ICONS.find((i) => i.id === id) ?? USER_ICONS[0];
}

export function pickRandomIcon(): UserIcon {
	// Random from images only, not the initials fallback.
	const imageIcons = USER_ICONS.filter((i) => i.image);
	return imageIcons[Math.floor(Math.random() * imageIcons.length)];
}
