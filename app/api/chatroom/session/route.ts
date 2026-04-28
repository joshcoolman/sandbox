import { NextResponse } from "next/server";

/**
 * Phase 1: mint a fresh roomId per request and return the WSS URL of the
 * chatroom worker. No gates, no signed ticket — those land in Phase 3.
 *
 * The frontend can override the random roomId via ?roomId=<uuid> in the
 * request URL, which is how we exercise the milestone-1 multi-tab broadcast.
 */
export async function GET(request: Request) {
	const wssUrl = process.env.NEXT_PUBLIC_CHATROOM_WSS_URL;
	if (!wssUrl) {
		return NextResponse.json(
			{ error: "NEXT_PUBLIC_CHATROOM_WSS_URL is not set" },
			{ status: 500 },
		);
	}

	const url = new URL(request.url);
	const overrideRoomId = url.searchParams.get("roomId");
	const roomId = overrideRoomId || crypto.randomUUID();

	return NextResponse.json({ roomId, wssUrl });
}
