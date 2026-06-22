import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import CurtainLink from "@/app/components/CurtainLink";
import SiteFooter from "@/app/components/SiteFooter";
import { GitHubIcon } from "@/app/components/icons";
import { inDevelopmentProjects, shippedProjects } from "@/lib/projects/data";
import type { Project } from "@/app/types/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Building",
  description:
    "Utilities I'm building in public -- agent-first, BYO-key, with the reasoning kept legible.",
};

function ProjectCard({ project }: { project: Project }) {
  const inDev = project.status === "in-development";
  return (
    <div className={styles.card}>
      {inDev && (
        <CurtainLink
          href={`/building/${project.slug}`}
          className={styles.cardLink}
          aria-label={`${project.name} — follow along`}
          curtainTransition
        />
      )}
      <span
        className={`${styles.badge} ${inDev ? styles.badgeDev : styles.badgeShipped}`}
      >
        {inDev ? "In development" : "Shipped"}
      </span>
      <h3 className={styles.cardName}>{project.name}</h3>
      <p className={styles.cardDesc}>{project.description}</p>
      <div className={styles.cardFooter}>
        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
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
            A running set of utilities I&apos;m making out in the open &mdash;
            agent-first, bring-your-own-key, with the reasoning kept legible.
            None of these are finished. That&apos;s the point.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} house-section`}>In development</h2>
          <p className={styles.sectionIntro}>
            Started this week and actively being built. Follow along on GitHub.
          </p>
          <div className={styles.cardGrid}>
            {inDevelopmentProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} house-section`}>Completed</h2>
          <p className={styles.sectionIntro}>
            Earlier projects that reached a usable state.
          </p>
          <div className={styles.cardGrid}>
            {shippedProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      </article>
      <SiteFooter className={styles.footer} />
    </main>
  );
}
