"use client";

import { useState } from "react";
import styles from "./DevPanel.module.css";

type Props = {
	status: "connecting" | "open" | "closed" | "error" | "ended";
	sessionError: { error: string; key?: string; fix?: string } | null;
	llmError: { code: string } | null;
};

type Check = {
	label: string;
	ok: boolean;
	detail?: string;
	fix?: string;
	notes?: string[];
};

function diagnosticChecks(status: Props["status"], sessionError: Props["sessionError"], llmError: Props["llmError"]): Check[] | null {
	if (status === "open" && !llmError) return null;

	if (sessionError?.error === "worker_unreachable") {
		return [
			{
				label: "Wrangler running",
				ok: false,
				detail: "Worker not reachable at localhost:8787",
				fix: "cd workers/chatroom && npx wrangler dev",
				notes: [
					"Wrangler is Cloudflare's CLI and local dev server. This experiment runs code on Cloudflare Workers — a serverless platform separate from Vercel/Next.js. Wrangler lets you run that Worker code locally so you don't need to deploy to Cloudflare every time you make a change.",
					"This experiment requires two terminal processes running at the same time: the Next.js dev server (pnpm dev, port 3000) and the Cloudflare Worker via Wrangler (npx wrangler dev, port 8787). Next.js handles the UI and the session API. The Worker handles everything live: conversation state, agent turns, and LLM calls.",
					"If you haven't used Wrangler before, you may need to log in first: npx wrangler login. This opens a browser to authenticate with your Cloudflare account.",
				],
			},
		];
	}

	if (sessionError?.error === "worker_missing_key") {
		if (sessionError.key === "TICKET_SECRET") {
			return [
				{ label: "Wrangler running", ok: true },
				{
					label: "TICKET_SECRET set",
					ok: false,
					detail: "Missing from workers/chatroom/.dev.vars",
					fix: "# 1. Generate a secret (run this once in your terminal):\nopenssl rand -hex 32\n\n# 2. Add the output to workers/chatroom/.dev.vars:\nTICKET_SECRET=<paste the output here>\n\n# 3. The same value must also be in .env.local:\nTICKET_SECRET=<same value>",
					notes: [
						"TICKET_SECRET is a random string used to sign short-lived access tokens (HMAC tickets). When your browser opens the chatroom, the Next.js server mints a ticket proving you're allowed in. The Cloudflare Worker checks the ticket before accepting the WebSocket connection — without a valid ticket, it rejects everything.",
						"The secret must be identical in two places: .env.local (used by Next.js to sign the ticket) and workers/chatroom/.dev.vars (used by the Worker to verify it). In production these become a Vercel env var and a Wrangler secret (wrangler secret put TICKET_SECRET).",
						"Restart both servers after adding the secret.",
					],
				},
			];
		}

		if (sessionError.key === "VERCEL_AI_GATEWAY_KEY") {
			return [
				{ label: "Wrangler running", ok: true },
				{ label: "TICKET_SECRET set", ok: true },
				{
					label: "VERCEL_AI_GATEWAY_KEY set",
					ok: false,
					detail: "Missing from workers/chatroom/.dev.vars",
					fix: "# Add to workers/chatroom/.dev.vars:\nVERCEL_AI_GATEWAY_KEY=vck_...\n\n# Get the key from: vercel.com/dashboard → AI → Gateway → API Keys",
					notes: [
						"The Vercel AI Gateway is a paid proxy that routes LLM requests to Anthropic (Claude). It tracks spending so the experiment can enforce its $8/month cap. The key lives on the Worker side only — Next.js never makes LLM calls directly.",
						"This requires a Vercel account with a payment method. Each agent message costs roughly $0.0006, so a full 80-turn session costs about $0.05. The experiment has a built-in global cap and per-IP session limits to keep costs predictable.",
						"After getting the key from vercel.com/dashboard → AI → Gateway → API Keys, add it to workers/chatroom/.dev.vars and restart Wrangler. In production, set it with: wrangler secret put VERCEL_AI_GATEWAY_KEY",
					],
				},
			];
		}
	}

	if (llmError) {
		const detail: Record<string, { short: string; notes: string[] }> = {
			gateway_auth: {
				short: "VERCEL_AI_GATEWAY_KEY is invalid or expired",
				notes: [
					"The Worker reached Vercel's AI Gateway but the key was rejected (401). The key in workers/chatroom/.dev.vars may be wrong, or the key may have been revoked.",
					"Check vercel.com/dashboard → AI → Gateway → API Keys and confirm the key matches what's in your .dev.vars file. Restart Wrangler after updating.",
				],
			},
			gateway_funds: {
				short: "Vercel AI Gateway account needs funds",
				notes: [
					"The Gateway rejected the request because the account has no credits or has hit its spending limit (402). Add a payment method or top up your balance at vercel.com/dashboard.",
					"This experiment has its own $8/month soft cap tracked via Upstash, but that cap only triggers after the Gateway accepts the request — if the Gateway itself has no funds, nothing gets through.",
				],
			},
			gateway_rate_limit: {
				short: "Gateway rate limit hit — try again in a moment",
				notes: ["The Vercel AI Gateway returned a 429. This usually clears on its own within seconds."],
			},
			gateway_error: {
				short: "Vercel AI Gateway returned an unexpected error",
				notes: ["The Gateway responded with an error status. Check the Wrangler terminal for the full error body and status code."],
			},
			gateway_unreachable: {
				short: "Could not reach Vercel AI Gateway",
				notes: ["The Worker couldn't connect to the Gateway at all — likely a network issue or the Gateway URL is misconfigured. Check VERCEL_AI_GATEWAY_URL in the Worker source."],
			},
		};
		const d = detail[llmError.code] ?? { short: llmError.code, notes: [] };
		return [
			{ label: "Wrangler running", ok: true },
			{ label: "Keys configured", ok: true },
			{ label: "LLM calls working", ok: false, detail: d.short, notes: d.notes },
		];
	}

	if (status === "closed" || status === "error") {
		return [
			{
				label: "Wrangler running",
				ok: false,
				detail: "WebSocket connection failed",
				fix: "cd workers/chatroom && npx wrangler dev",
				notes: [
					"Wrangler is Cloudflare's CLI and local dev server. This experiment runs a Cloudflare Worker alongside Next.js — Wrangler lets you run that Worker locally on port 8787.",
					"The browser couldn't open a WebSocket connection to localhost:8787. Either Wrangler isn't running, or NEXT_PUBLIC_CHATROOM_WSS_URL in .env.local isn't set to ws://localhost:8787.",
					"If this is your first time: you may also need to run npx wrangler login to authenticate with Cloudflare before wrangler dev will work.",
				],
			},
		];
	}

	return null;
}

export function DevPanel({ status, sessionError, llmError }: Props) {
	const [open, setOpen] = useState(false);
	const checks = diagnosticChecks(status, sessionError, llmError);
	const hasProblem = checks !== null;

	return (
		<div className={styles.panel} data-problem={hasProblem}>
			{hasProblem && (
				<div className={styles.diagnostic}>
					<div className={styles.diagnosticTitle}>Local setup issue</div>
					<ul className={styles.checklist}>
						{checks.map((c) => (
							<li key={c.label} className={styles.checkItem} data-ok={c.ok}>
								<div className={styles.checkRow}>
									<span className={styles.checkIcon}>{c.ok ? "✓" : "✗"}</span>
									<span className={styles.checkLabel}>{c.label}</span>
									{c.detail && <span className={styles.checkDetail}>{c.detail}</span>}
								</div>
								{!c.ok && c.notes && c.notes.map((n, i) => (
									<p key={i} className={styles.checkNote}>{n}</p>
								))}
								{!c.ok && c.fix && <code className={styles.checkFix}>{c.fix}</code>}
							</li>
						))}
					</ul>
				</div>
			)}

			<button type="button" className={styles.toggle} onClick={() => setOpen((v) => !v)}>
				<span className={styles.toggleIcon}>{open ? "▾" : "▸"}</span>
				how this is wired up
			</button>

			{open && (
				<div className={styles.orientation}>
					<ul className={styles.orientationList}>
						<li><strong>Two servers, not one.</strong> The Next.js dev server (port 3000) handles the UI and the session API. The Cloudflare Worker (port 8787, run with <code>npx wrangler dev</code>) handles the live chat. Both must be running locally.</li>
						<li><strong>Durable Object.</strong> Each visitor gets a private room — a Durable Object (DO) on the Worker. The DO holds the conversation history in SQLite and drives agent turns on a timer (<code>setAlarm</code>). It persists between requests but is evicted from memory when idle.</li>
						<li><strong>WebSocket.</strong> The browser opens a WebSocket directly to the DO. The server pushes messages, typing indicators, and phase changes in real time — no polling. The connection is kept alive by a ping/pong every 25s.</li>
						<li><strong>Signed ticket.</strong> The session API mints a short-lived HMAC token before the WebSocket opens. The Worker validates it on upgrade. <code>TICKET_SECRET</code> must match in both <code>.env.local</code> and <code>workers/chatroom/.dev.vars</code>.</li>
						<li><strong>Vercel AI Gateway.</strong> LLM calls go through Vercel&apos;s AI Gateway (a proxy to Anthropic) for spend tracking. <code>VERCEL_AI_GATEWAY_KEY</code> goes in <code>.dev.vars</code> on the Worker side — the Next.js app never makes LLM calls directly.</li>
					</ul>
				</div>
			)}
		</div>
	);
}
