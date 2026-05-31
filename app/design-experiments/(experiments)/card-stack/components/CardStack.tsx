"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { CardData } from "../types";
import styles from "./CardStack.module.css";

gsap.registerPlugin(ScrollTrigger);

interface CardStackProps {
  cards: CardData[];
  basePath?: string;
  className?: string;
}

export function CardStack({
  cards,
  basePath = "/design-experiments/card-stack",
  className,
}: CardStackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const hasCollapsedRef = useRef(false);
  const savedRectRef = useRef<DOMRect | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const cardParam = searchParams.get("card");
  const urlIndex = cardParam !== null ? parseInt(cardParam, 10) : null;
  const isExpanded =
    expandedIndex !== null ||
    (urlIndex !== null &&
      !isNaN(urlIndex) &&
      urlIndex >= 0 &&
      urlIndex < cards.length);
  const activeIndex = expandedIndex ?? urlIndex;

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

  // Card stack scroll effect
  useEffect(() => {
    const spacers = spacerRefs.current.filter(Boolean) as HTMLElement[];
    const cardEls = cardRefs.current.filter(Boolean) as HTMLElement[];

    cardEls.forEach((card, i) => {
      gsap.set(card, { zIndex: cards.length - i, y: i * 5 });
    });

    const triggers = spacers.map((spacer, i) => {
      if (i === cardEls.length - 1) return null;

      return ScrollTrigger.create({
        trigger: spacer,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const cardHeight = cardEls[i].offsetHeight;
          const distance = (window.innerHeight + cardHeight) / 2;
          const y = i * 5 - self.progress * distance;

          const nextCardTop = (i + 1) * 5;
          const thisCardBottom = y + cardHeight;
          const gap = nextCardTop - thisCardBottom;

          let opacity = 1;
          if (gap > 60) {
            opacity = Math.max(0, 1 - (gap - 60) / 120);
          }

          gsap.set(cardEls[i], { y, opacity });
        },
      });
    });

    return () => {
      triggers.forEach((t) => t?.kill());
    };
  }, [cards.length]);

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
    if (
      urlIndex !== null &&
      !isNaN(urlIndex) &&
      urlIndex >= 0 &&
      urlIndex < cards.length &&
      !isAnimatingRef.current &&
      expandedIndex === null &&
      !hasCollapsedRef.current
    ) {
      const overlay = overlayRef.current;
      if (!overlay) return;

      overlay.style.backgroundColor = cards[urlIndex].color;

      gsap.set(overlay, {
        display: "flex",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        opacity: 1,
      });

      setExpandedIndex(urlIndex);
    }
  }, [urlIndex, expandedIndex, cards]);

  const handleExpand = useCallback(
    (index: number) => {
      if (isAnimatingRef.current || isExpanded) return;
      isAnimatingRef.current = true;
      hasCollapsedRef.current = false;

      const card = cardRefs.current[index];
      const overlay = overlayRef.current;
      if (!card || !overlay) return;

      const rect = card.getBoundingClientRect();
      savedRectRef.current = rect;

      lenisRef.current?.stop();

      overlay.style.backgroundColor = cards[index].color;

      flushSync(() => setExpandedIndex(index));

      gsap.set(overlay, {
        display: "flex",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 12,
        opacity: 1,
      });

      gsap.to(overlay, {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        duration: 0.5,
        ease: "power3.inOut",
        onComplete: () => {
          router.push(`?card=${index}`, { scroll: false });
          isAnimatingRef.current = false;
        },
      });
    },
    [isExpanded, router, cards]
  );

  const handleCollapse = useCallback(() => {
    if (isAnimatingRef.current || activeIndex === null) return;
    isAnimatingRef.current = true;
    hasCollapsedRef.current = true;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = savedRectRef.current;

    if (!rect) {
      gsap.set(overlay, { display: "none", clearProps: "all" });
      setExpandedIndex(null);
      router.push(basePath, { scroll: false });
      isAnimatingRef.current = false;
      lenisRef.current?.start();
      return;
    }

    gsap.to(overlay, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: 12,
      duration: 0.45,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(overlay, { display: "none", clearProps: "all" });
        setExpandedIndex(null);
        router.push(basePath, { scroll: false });
        ScrollTrigger.refresh();
        isAnimatingRef.current = false;
        lenisRef.current?.start();
      },
    });
  }, [activeIndex, router, basePath]);

  return (
    <div className={`${styles.container}${className ? ` ${className}` : ""}`}>
      <div className={styles.scrollHint}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M1 9L8 2L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Scroll up</span>
      </div>

      <div className={styles.stack} ref={stackRef}>
        {cards.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.card}
            style={{ backgroundColor: card.color, cursor: "pointer" }}
            onClick={() => handleExpand(i)}
          >
            <h2 className={styles.cardTitle}>{card.title}</h2>
          </div>
        ))}
      </div>

      <div
        ref={overlayRef}
        className={styles.overlay}
        style={{ display: "none", cursor: "pointer" }}
        onClick={handleCollapse}
      >
        {activeIndex !== null && (
          <h2 className={styles.cardTitle}>{cards[activeIndex].title}</h2>
        )}
      </div>

      <div className={styles.scrollSpacers}>
        {cards.map((card, i) => (
          <div
            key={`spacer-${card.id}`}
            ref={(el) => {
              spacerRefs.current[i] = el;
            }}
            className={styles.spacer}
          />
        ))}
      </div>
    </div>
  );
}
