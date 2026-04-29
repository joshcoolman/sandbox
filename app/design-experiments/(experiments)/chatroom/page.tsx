import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { experimentMetadata } from "@/lib/experiments/metadata";
import { Chatroom } from "./components/Chatroom";
import styles from "./page.module.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = experimentMetadata("chatroom");

export default function ChatroomPage() {
	return (
		<div className={`${styles.page} ${sora.className}`}>
			<Chatroom />
		</div>
	);
}
