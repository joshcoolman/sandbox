/**
 * Friendly first names assigned by default to new visitors. Avoids the persona
 * names (Maya, Jordan) so there's no ambiguity in transcripts. Mostly short and
 * gender-ambiguous so the random pick feels casual, not loaded.
 */
export const USER_NAMES = [
	"Pat",
	"Sam",
	"Riley",
	"Casey",
	"Quinn",
	"Avery",
	"Reese",
	"Drew",
	"Sky",
	"Ash",
	"Devon",
	"Ellis",
	"Frankie",
	"Harper",
	"Indie",
	"Jess",
	"Kit",
	"Lane",
	"Marley",
	"Niko",
	"Oak",
	"Parker",
	"Remy",
	"Sage",
	"Tate",
	"Vale",
	"Wren",
	"Wes",
	"Zion",
	"Theo",
];

export function pickRandomName(): string {
	return USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
}
