import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import CurtainLink from "@/app/components/CurtainLink";
import SiteFooter from "@/app/components/SiteFooter";
import { GitHubIcon } from "@/app/components/icons";
import { projects } from "@/lib/projects/data";
import type { Project } from "@/app/types/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Building",
  description:
    "The public repos I'm building -- small, single-purpose utilities, most agent-first and bring-your-own-key.",
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className={styles.card}>
      <CurtainLink
        href={`/building/${project.slug}`}
        className={styles.cardLink}
        aria-label={project.name}
        curtainTransition
      />
      <h3 className={styles.cardName}>{project.name}</h3>
      <p className={styles.cardDesc}>{project.tagline}</p>
      <div className={styles.cardFooter}>
        <div className={styles.tags}>
          {project.stack.map((item) => (
            <span key={item} className={styles.tag}>
              {item}
            </span>
          ))}
        </div>
        <a
          className={styles.repoLink}
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon />
          GitHub
        </a>
      </div>
    </div>
  );
}

export default function BuildingPage() {
  return (
    <main className={styles.main}>
      <article className={styles.wrap}>
        <CurtainLink href="/" className={styles.backLink} curtainTransition curtainReverse>
          <ChevronLeft size={14} />
          Home
        </CurtainLink>
        <header>
          <h1 className={`${styles.title} house-title`}>Building in public</h1>
          <p className={`${styles.lede} house-dek`}>
            The public repos I&apos;m building &mdash; small, single-purpose
            utilities, most agent-first and bring-your-own-key. Each card links
            to what it does, how it&apos;s built, and the source.
          </p>
        </header>

        <section className={styles.section}>
          <div className={styles.cardGrid}>
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      </article>
      <SiteFooter className={styles.footer} />
    </main>
  );
}
