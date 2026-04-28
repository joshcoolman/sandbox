import { NextResponse } from "next/server";
import { clearSession, getClientIp } from "@/lib/ai/rate-limit";

/**
 * Dev-only: clear the calling IP's chatroom session counter. Mirrors
 * /api/monono/reset. 404s in production so nobody can DoS the per-IP gate.
 *
 * Does NOT reset the global $ cap (chatroom:spend:YYYY-MM). That's
 * intentional — if global trips, treat it as a deliberate moment to look
 * at the dashboard, not a button-press recovery.
 */

const NAMESPACE = "chatroom";

export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const ip = getClientIp(request);
	await clearSession(ip, NAMESPACE).catch(() => {});

	return NextResponse.json({ ok: true, ip });
}
