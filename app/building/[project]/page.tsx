import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import CurtainLink from "@/app/components/CurtainLink";
import SiteFooter from "@/app/components/SiteFooter";
import { GitHubIcon } from "@/app/components/icons";
import { projects } from "@/lib/projects/data";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ project: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.tagline,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className={styles.main}>
      <article className={styles.wrap}>
        <CurtainLink href="/building" className={styles.backLink} curtainTransition curtainReverse>
          <ChevronLeft size={14} />
          Building
        </CurtainLink>

        <header>
          <h1 className={`${styles.title} house-title`}>{project.name}</h1>
          <p className={`${styles.lede} house-dek`}>{project.tagline}</p>
          <div className={styles.stack}>
            {project.stack.map((item) => (
              <span key={item} className={styles.chip}>
                {item}
              </span>
            ))}
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} house-eyebrow`}>What it does</h2>
          <p className={styles.body}>{project.whatItDoes}</p>
        </section>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} house-eyebrow`}>Structure</h2>
          <pre className={styles.structure}>{project.structure}</pre>
        </section>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} house-eyebrow`}>Highlights</h2>
          <ul className={styles.highlights}>
            {project.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
          {project.liveUrl && (
            <a
              className={styles.repoLink}
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowUpRight size={16} />
              Live site
            </a>
          )}
        </div>
      </article>
      <SiteFooter className={styles.footer} />
    </main>
  );
}
