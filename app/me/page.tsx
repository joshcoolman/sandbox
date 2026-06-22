import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import CurtainLink from "@/app/components/CurtainLink";
import SiteFooter from "@/app/components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "About Josh Coolman — a designer-developer in Portland, Oregon, coding in public and building with AI.",
};

export default function AboutMePage() {
  return (
    <main className={styles.main}>
      <article className={styles.wrap}>
        <CurtainLink href="/" className={styles.backLink} curtainTransition curtainReverse>
          <ChevronLeft size={14} />
          Home
        </CurtainLink>
        <header>
          <h1 className={`${styles.title} house-title`}>Hello, my name is Josh.</h1>
          <p className={`${styles.lede} house-dek`}>
            I&apos;m a designer-developer in Portland, Oregon, currently coding in
            public and figuring out what software looks like when you build it
            with AI, rather than around it.
          </p>
        </header>

        <div className={`${styles.proseWrap} prose`}>
          <p>
            I came up through graphic design, moved into frontend development, and
            spent a good stretch of my career shipping products at Silicon Valley
            startups. Somewhere along the way the line between{" "}
            <em>designing</em> something and <em>building</em> it stopped feeling
            real to me, and these days I&apos;m far more interested in what happens
            when the two collapse into a single, faster loop.
          </p>

          <h2>What I&apos;m into right now</h2>
          <p>
            Most of my attention goes toward agentic engineering: building real
            things alongside AI instead of treating it as a bolt-on, and
            documenting the process as I go. I care about craft, and even more
            about directness, the shortest honest path from an idea to something
            you can actually click on.
          </p>

          <h2>What I&apos;m building</h2>
          <p>
            This site is my sandbox, a running set of design experiments, from
            layout systems and typography to little games and shader effects. A
            couple of other things I keep alive:
          </p>
          <ul>
            <li>
              <strong>repo-explorer</strong> &mdash; a local-only tool for browsing
              trending repos and running agentic analysis on them with Claude.
            </li>
            <li>
              <strong>type-explorer</strong> &mdash; Google Fonts as full-size
              specimens, with curated and algorithmic display-and-text pairings.
            </li>
          </ul>
          <p>
            It&apos;s all TypeScript, it&apos;s all out in the open, and most of it
            exists because I wanted to find out whether an idea would actually feel
            good once it was real.
          </p>

          <h2>Say hi</h2>
          <p>
            I&apos;m most active on{" "}
            <a href="https://x.com/joshiscoolman" target="_blank" rel="noopener noreferrer">
              X
            </a>{" "}
            and{" "}
            <a
              href="https://bsky.app/profile/joshcoolman.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bluesky
            </a>
            , and the code lives on{" "}
            <a href="https://github.com/joshcoolman" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . Always happy to talk design, frontend, or where this whole agentic
            thing is headed.
          </p>
        </div>
      </article>
      <SiteFooter className={styles.footer} />
    </main>
  );
}
