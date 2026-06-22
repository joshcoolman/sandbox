import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import CurtainLink from "@/app/components/CurtainLink";
import SiteFooter from "@/app/components/SiteFooter";
import { GitHubIcon } from "@/app/components/icons";
import BlogContent from "@/app/(blog)/_components/BlogContent";
import { projects, inDevelopmentProjects } from "@/lib/projects/data";
import { getProjectContent } from "@/lib/projects/loadBuildingContent";
import type { ProjectPhase, EntryVerdict } from "@/app/types/projects";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ project: string }>;
}

const phaseLabels: Record<ProjectPhase, string> = {
  scaffolding: "Scaffolding",
  "agent-loop": "Agent loop",
  knowledge: "Knowledge",
  byok: "BYO-key",
  shipped: "Shipped",
};

const verdictLabels: Record<EntryVerdict, string> = {
  kept: "Kept",
  reversed: "Reversed",
  open: "Open",
};

function formatDate(date: string): string {
  if (!date) return "";
  // Build from parts so a "YYYY-MM-DD" string renders as a local date, not a
  // UTC midnight that shifts back a day in western timezones.
  const [y, m, d] = date.split("-").map(Number);
  const parsed = y && m && d ? new Date(y, m - 1, d) : new Date(date);
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return inDevelopmentProjects.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project || project.status !== "in-development") notFound();

  const { brief, entries } = getProjectContent(slug);

  return (
    <main className={styles.main}>
      <article className={styles.wrap}>
        <CurtainLink href="/building" className={styles.backLink} curtainTransition curtainReverse>
          <ChevronLeft size={14} />
          Building
        </CurtainLink>

        <header>
          <span className={`${styles.badge} ${styles.badgeDev}`}>In development</span>
          <h1 className={`${styles.title} house-title`}>{project.name}</h1>
          <p className={`${styles.lede} house-dek`}>{project.description}</p>
        </header>

        {brief && (
          <div className={styles.brief}>
            <BlogContent content={brief} />
          </div>
        )}

        <section className={styles.progress}>
          <h2 className={`${styles.progressTitle} house-eyebrow`}>Progress</h2>
          {entries.length === 0 ? (
            <p className={styles.empty}>Planned — no entries yet.</p>
          ) : (
            <div className={styles.entries}>
              {entries.map((entry) => (
                <article key={entry.slug} className={styles.entry}>
                  <div className={styles.entryMeta}>
                    <time className={styles.entryDate}>{formatDate(entry.date)}</time>
                    {entry.phase && (
                      <span className={styles.entryTag}>{phaseLabels[entry.phase]}</span>
                    )}
                    {entry.verdict && (
                      <span
                        className={`${styles.entryTag} ${
                          entry.verdict === "reversed" ? styles.entryTagReversed : ""
                        }`}
                      >
                        {verdictLabels[entry.verdict]}
                      </span>
                    )}
                  </div>
                  <h3 className={`${styles.entryTitle} house-section`}>{entry.title}</h3>
                  <BlogContent content={entry.content} />
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.links}>
          <a
            className={styles.repoLink}
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            View on GitHub
          </a>
          {entries.length > 0 && (
            <a
              className={styles.repoLink}
              href={`${project.repo}/tree/main/log`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the raw log
            </a>
          )}
        </div>
      </article>
      <SiteFooter className={styles.footer} />
    </main>
  );
}
