"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import NetworkCanvas from "./components/NetworkCanvas";
import styles from "./page.module.css";

export default function Home() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const videoOverlayRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef(1);
  const isSwappedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    const videoOverlay = videoOverlayRef.current;

    if (!video1 || !video2 || !videoOverlay) return;

    function handleVideoClick() {
      if (!video1 || !video2 || !videoOverlay) return;
      if (isSwappedRef.current || isTransitioningRef.current) return;

      isTransitioningRef.current = true;
      activeVideoRef.current = 2;
      isSwappedRef.current = true;

      videoOverlay.classList.add(styles.disabled);

      video1.classList.remove(styles.videoVisible);
      video1.classList.add(styles.videoHidden);
      video2.classList.remove(styles.videoHidden);
      video2.classList.add(styles.videoVisible);

      if (video2.readyState >= 2) {
        video2.currentTime = 0;
        video2
          .play()
          .then(() => {
            isTransitioningRef.current = false;
          })
          .catch(() => {
            isTransitioningRef.current = false;
          });
      } else {
        video2.addEventListener(
          "canplay",
          () => {
            video2.currentTime = 0;
            video2.play();
            isTransitioningRef.current = false;
          },
          { once: true },
        );
      }
    }

    function handleVideo2Ended() {
      if (!video1 || !video2 || !videoOverlay) return;

      activeVideoRef.current = 1;
      isSwappedRef.current = false;

      video2.classList.remove(styles.videoVisible);
      video2.classList.add(styles.videoHidden);
      video1.classList.remove(styles.videoHidden);
      video1.classList.add(styles.videoVisible);

      videoOverlay.classList.remove(styles.disabled);

      video1.play().catch(() => {});
    }

    videoOverlay.addEventListener("click", handleVideoClick);
    video2.addEventListener("ended", handleVideo2Ended);

    video2.load();

    return () => {
      videoOverlay.removeEventListener("click", handleVideoClick);
      video2.removeEventListener("ended", handleVideo2Ended);
    };
  }, []);

  return (
    <main className={styles.mainContainer}>
      <div className={styles.networkBackground}>
        <NetworkCanvas className={styles.networkCanvas} />
      </div>

      <div className={styles.contentOverlay}>
        <div className={styles.contentWrapper}>
          <div className={styles.videoContainer}>
            <div ref={videoOverlayRef} className={styles.videoOverlay}></div>

            <video
              ref={video1Ref}
              autoPlay
              loop
              muted
              playsInline
              className={`${styles.interactiveVideo} ${styles.videoVisible}`}
            >
              <source src="/spinner-1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <video
              ref={video2Ref}
              muted
              playsInline
              preload="auto"
              className={`${styles.interactiveVideo} ${styles.videoHidden} ${styles.videoAbsolute}`}
            >
              <source src="/spinner-2.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className={styles.greetingText}>Greetings Starfighter!</div>

          <div className={styles.navCards}>
            <Link href="/design-experiments" className={styles.navCard}>
              <div className={styles.navCardText}>
                <span className={styles.navCardTitle}>Design Experiments</span>
                <span className={styles.navCardDesc}>
                  Explorations and rough sketches of layout, color, and
                  interaction
                </span>
              </div>
              <svg
                className={styles.navCardArrow}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/docs" className={styles.navCard}>
              <div className={styles.navCardText}>
                <span className={styles.navCardTitle}>Docs</span>
                <span className={styles.navCardDesc}>
                  Generally useful information for engineering agentic coding
                </span>
              </div>
              <svg
                className={styles.navCardArrow}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/blog" className={styles.navCard}>
              <div className={styles.navCardText}>
                <span className={styles.navCardTitle}>Blog</span>
                <span className={styles.navCardDesc}>
                  Thoughts on agentic design and building in public
                </span>
              </div>
              <svg
                className={styles.navCardArrow}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
