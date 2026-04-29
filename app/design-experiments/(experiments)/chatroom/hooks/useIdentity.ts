"use client";

import { useCallback, useEffect, useState } from "react";
import { pickRandomName } from "../data/userNames";
import { pickRandomIcon } from "../data/userIcons";

const STORAGE_KEY = "chatroom:identity:v1";
const MAX_NAME_LEN = 24;

export type Identity = {
	name: string;
	avatarId: string;
};

function loadFromStorage(): Identity | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<Identity>;
		if (typeof parsed.name === "string" && typeof parsed.avatarId === "string") {
			return { name: parsed.name.slice(0, MAX_NAME_LEN), avatarId: parsed.avatarId };
		}
	} catch {
		// fall through
	}
	return null;
}

function generateDefault(): Identity {
	return { name: pickRandomName(), avatarId: pickRandomIcon().id };
}

function persist(identity: Identity) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
	} catch {
		// quota / privacy mode — fail silently
	}
}

/**
 * Stable client-side identity. Reads from localStorage on mount; if absent,
 * generates a default and persists it. Returns `null` until hydrated to avoid
 * SSR/CSR mismatch (server has no localStorage).
 */
export function useIdentity(): {
	identity: Identity | null;
	update: (next: Identity) => void;
} {
	const [identity, setIdentity] = useState<Identity | null>(null);

	useEffect(() => {
		const existing = loadFromStorage();
		if (existing) {
			setIdentity(existing);
		} else {
			const fresh = generateDefault();
			persist(fresh);
			setIdentity(fresh);
		}
	}, []);

	const update = useCallback((next: Identity) => {
		const trimmed: Identity = {
			name: next.name.trim().slice(0, MAX_NAME_LEN) || pickRandomName(),
			avatarId: next.avatarId,
		};
		persist(trimmed);
		setIdentity(trimmed);
	}, []);

	return { identity, update };
}
