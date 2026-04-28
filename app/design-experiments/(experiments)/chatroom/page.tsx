import type { Metadata } from "next";
import { Chatroom } from "./components/Chatroom";

export const metadata: Metadata = {
	title: "Chatroom — design experiments",
	description:
		"Three AI agents mid-conversation. You join as the fourth. Built on a Cloudflare Hibernatable Durable Object.",
};

export default function ChatroomPage() {
	return <Chatroom />;
}
