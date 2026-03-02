"use client";

import { Suspense, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
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
      <CardStack />
    </Suspense>
  );
}

function CardStack() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isAnimatingRef = useRef(false);
  const savedRectRef = useRef<DOMRect | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const expandedCard = searchParams.get("card");
  const expandedIndex =
    expandedCard !== null ? parseInt(expandedCard, 10) : null;
  const isExpanded =
    expandedIndex !== null &&
    !isNaN(expandedIndex) &&
    expandedIndex >= 0 &&
    expandedIndex < CARDS.length;

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Card stack scroll effect:
  // All cards sit in a fixed stack. As you scroll, the top card peels off
  // upward, revealing the card beneath it.
  useEffect(() => {
    const spacers = spacerRefs.current.filter(Boolean) as HTMLElement[];
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

    // Set z-index so first card is on top
    cards.forEach((card, i) => {
      gsap.set(card, { zIndex: CARDS.length - i });
    });

    // Each spacer controls when its corresponding card peels off
    const triggers = spacers.map((spacer, i) => {
      if (i === cards.length - 1) return null; // last card doesn't peel

      return ScrollTrigger.create({
        trigger: spacer,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Distance from card's centered position to fully off the top of screen:
          // (viewport height + card height) / 2
          const distance =
            (window.innerHeight + cards[i].offsetHeight) / 2;
          gsap.set(cards[i], { y: -self.progress * distance });
        },
      });
    });

    return () => {
      triggers.forEach((t) => t?.kill());
    };
  }, []);

  // Pause/resume Lenis when expanded
  useEffect(() => {
    if (isExpanded) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [isExpanded]);

  // Handle direct URL load with ?card=N
  useEffect(() => {
    if (isExpanded && !isAnimatingRef.current) {
      const card = cardRefs.current[expandedIndex];
      const backBtn = backBtnRefs.current[expandedIndex];
      if (!card) return;

      savedRectRef.current = card.getBoundingClientRect();

      gsap.set(card, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 500,
        borderRadius: 0,
        yPercent: 0,
      });

      if (backBtn) gsap.set(backBtn, { opacity: 1 });
    }
  }, [isExpanded, expandedIndex]);

  const handleExpand = useCallback(
    (index: number) => {
      if (isAnimatingRef.current || isExpanded) return;
      isAnimatingRef.current = true;

      const card = cardRefs.current[index];
      const backBtn = backBtnRefs.current[index];
      if (!card) return;

      const rect = card.getBoundingClientRect();
      savedRectRef.current = rect;

      gsap.set(card, {
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 500,
        yPercent: 0,
      });

      gsap.to(card, {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        duration: 0.5,
        ease: "power3.inOut",
        onComplete: () => {
          if (backBtn) gsap.to(backBtn, { opacity: 1, duration: 0.2 });
          router.push(`?card=${index}`, { scroll: false });
          isAnimatingRef.current = false;
        },
      });
    },
    [isExpanded, router]
  );

  const handleCollapse = useCallback(
    (index: number) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const card = cardRefs.current[index];
      const backBtn = backBtnRefs.current[index];
      if (!card) return;

      const rect = savedRectRef.current;
      if (!rect) {
        gsap.set(card, { clearProps: "all" });
        router.push("/design-experiments/card-stack", { scroll: false });
        isAnimatingRef.current = false;
        return;
      }

      if (backBtn) gsap.set(backBtn, { opacity: 0 });
      router.push("/design-experiments/card-stack", { scroll: false });

      gsap.to(card, {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 12,
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(card, { clearProps: "all" });
          ScrollTrigger.refresh();
          isAnimatingRef.current = false;
        },
      });
    },
    [router]
  );

  return (
    <div className="card-stack-page">
      {/* Fixed stack of cards in the center of the viewport */}
      <div className="card-stack" ref={stackRef}>
        {CARDS.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="card"
            style={{ backgroundColor: card.color }}
          >
            <h2 className="card-title">{card.title}</h2>
            <button
              className="expand-button"
              onClick={() => handleExpand(i)}
              aria-label={`Expand ${card.title}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
            <button
              ref={(el) => {
                backBtnRefs.current[i] = el;
              }}
              className="back-button"
              onClick={() => handleCollapse(i)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Invisible spacers that drive scroll distance for each card peel */}
      <div className="scroll-spacers">
        {CARDS.map((card) => (
          <div
            key={`spacer-${card.id}`}
            ref={(el) => {
              spacerRefs.current[card.id - 1] = el;
            }}
            className="spacer"
          />
        ))}
      </div>
    </div>
  );
}
