"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CardStack } from "./components/CardStack";
import type { CardData } from "./types";
import styles from "./page.module.css";

const CARDS: CardData[] = [
  { id: 1, title: "Card One", color: "#E63946" },
  { id: 2, title: "Card Two", color: "#457B9D" },
  { id: 3, title: "Card Three", color: "#2A9D8F" },
  { id: 4, title: "Card Four", color: "#E9C46A" },
  { id: 5, title: "Card Five", color: "#F4A261" },
  { id: 6, title: "Card Six", color: "#6A0572" },
  { id: 7, title: "Card Seven", color: "#264653" },
];

export default function CardStackPage() {
  return (
    <Suspense
      fallback={<div style={{ background: "#000", minHeight: "100vh" }} />}
    >
      <Link
        href="/design-experiments"
        className={styles.closeButton}
        aria-label="Back to experiments"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 5L5 15M5 5l10 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Link>
      <CardStack cards={CARDS} />
    </Suspense>
  );
}
