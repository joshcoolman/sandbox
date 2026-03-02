"use client";

import { Suspense, useEffect, useRef, useCallback, useState } from "react";
import { flushSync } from "react-dom";
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
    (urlIndex !== null && !isNaN(urlIndex) && urlIndex >= 0 && urlIndex < CARDS.length);
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
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

    cards.forEach((card, i) => {
      gsap.set(card, { zIndex: CARDS.length - i });
    });

    const triggers = spacers.map((spacer, i) => {
      if (i === cards.length - 1) return null;

      return ScrollTrigger.create({
        trigger: spacer,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
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

  // Handle direct URL load with ?card=N (no animation, just show expanded)
  useEffect(() => {
    if (urlIndex !== null && !isNaN(urlIndex) && urlIndex >= 0 && urlIndex < CARDS.length && !isAnimatingRef.current && expandedIndex === null && !hasCollapsedRef.current) {
      const overlay = overlayRef.current;
      if (!overlay) return;

      overlay.style.backgroundColor = CARDS[urlIndex].color;

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
  }, [urlIndex, expandedIndex]);

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

      // Stop scroll immediately
      lenisRef.current?.stop();

      // Set up the overlay to match the card's current screen position
      overlay.style.backgroundColor = CARDS[index].color;

      // Render title synchronously so it's in the DOM before GSAP positions
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

      // Animate overlay to fullscreen
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
    [isExpanded, router]
  );

  const handleCollapse = useCallback(() => {
    if (isAnimatingRef.current || activeIndex === null) return;
    isAnimatingRef.current = true;
    hasCollapsedRef.current = true;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = savedRectRef.current;

    // If no saved rect (direct URL load), just snap closed
    if (!rect) {
      gsap.set(overlay, { display: "none", clearProps: "all" });
      setExpandedIndex(null);
      router.push("/design-experiments/card-stack", { scroll: false });
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
        router.push("/design-experiments/card-stack", { scroll: false });
        ScrollTrigger.refresh();
        isAnimatingRef.current = false;
        lenisRef.current?.start();
      },
    });
  }, [activeIndex, router]);

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
            style={{ backgroundColor: card.color, cursor: "pointer" }}
            onClick={() => handleExpand(i)}
          >
            <h2 className="card-title">{card.title}</h2>
          </div>
        ))}
      </div>

      {/* Overlay: lives outside the stack, no transform containment issues */}
      <div
        ref={overlayRef}
        className="card-overlay"
        style={{ display: "none", cursor: "pointer" }}
        onClick={handleCollapse}
      >
        {activeIndex !== null && (
          <h2 className="card-title">{CARDS[activeIndex].title}</h2>
        )}
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
