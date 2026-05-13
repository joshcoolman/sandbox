import Image from "next/image";
import NetworkCanvas from "./components/NetworkCanvas";
import HeroVideo from "./components/HeroVideo";
import CurtainLink from "./components/CurtainLink";
import SiteFooter from "./components/SiteFooter";
import HomeExperimentCard from "./components/HomeExperimentCard";
import HomeExperimentPlaceholderCard from "./components/HomeExperimentPlaceholderCard";
import HomeScrollRestore from "./components/HomeScrollRestore";
import { getAllPosts } from "@/lib/blog/loadBlog";
import { getRecentDocs } from "@/lib/docs/loadDocs";
import { getAllPlans, type PlanStatus } from "@/lib/plans/loadPlans";
import { experiments } from "@/lib/experiments/data";
import { getRequiredEnv, isRunnable } from "@/lib/experiments/runnable";

import styles from "./page.module.css";

export default function Home() {
  const recentExperiments = experiments.slice(0, 9);
  const posts = getAllPosts().slice(0, 4);
  const recentDocs = getRecentDocs(4);
  const recentPlans = getAllPlans().slice(0, 4);

  const statusLabel: Record<PlanStatus, string> = {
    exploratory: "Exploratory",
    "in-progress": "In progress",
    implemented: "Implemented",
    archived: "Archived",
  };

  return (
    <main className={styles.mainContainer}>
      <HomeScrollRestore />
      <div className={styles.networkBackground}>
        <NetworkCanvas className={styles.networkCanvas} />
      </div>

      <div className={styles.contentOverlay}>
        <div className={styles.contentWrapper}>
          <HeroVideo />
          <div className={styles.greetingText}>Greetings Starfighter!</div>

          <section className={styles.recentWorkSection}>
            <h2 className={styles.recentWorkHeader}>Recent Work</h2>
            <p className={styles.preamble}>
              These are experiments in agentic coding. Have a look around. All code available on{' '}
              <a
                href="https://github.com/joshcoolman-smc/sandbox"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.preambleLink}
              >
                GitHub
              </a>
              .
            </p>
            <div className={styles.cardGrid}>
              {recentExperiments.map((exp, index) => {
                const delay = Math.min(index + 1, 6);
                if (!isRunnable(exp.slug)) {
                  return (
                    <HomeExperimentPlaceholderCard
                      key={exp.slug}
                      experiment={exp}
                      required={getRequiredEnv(exp.slug)}
                      delay={delay}
                    />
                  );
                }
                return (
                  <HomeExperimentCard
                    key={exp.slug}
                    experiment={exp}
                    delay={delay}
                  />
                );
              })}
            </div>
            <CurtainLink
              href="/design-experiments"
              className={styles.seeAllLink}
              curtainTransition={true}
            >
              See all experiments
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </CurtainLink>
          </section>

          <div className={styles.secondarySection}>
            {/* Blog */}
            <div className={styles.column}>
              <CurtainLink href="/blog" className={styles.columnTitle} curtainTransition={true}>
                Blog
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
              <div className={styles.columnItems}>
                {posts.map((post) => (
                  <CurtainLink key={post.slug} href={`/blog/${post.slug}`} className={styles.columnItem} curtainTransition={true}>
                    {post.image && (
                      <Image
                        src={post.image}
                        alt={post.title}
                        width={60}
                        height={45}
                        className={styles.itemThumb}
                      />
                    )}
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>{post.title}</span>
                      {post.subtitle ? (
                        <span className={styles.itemDate}>{post.subtitle}</span>
                      ) : post.date ? (
                        <span className={styles.itemDate}>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      ) : null}
                    </div>
                  </CurtainLink>
                ))}
              </div>
            </div>

            {/* Docs */}
            <div className={styles.column}>
              <CurtainLink href="/docs" className={styles.columnTitle} curtainTransition={true}>
                Docs
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
              <div className={styles.columnItems}>
                {recentDocs.map((doc) => (
                  <CurtainLink key={doc.slug} href={doc.href} className={styles.columnItem} curtainTransition={true}>
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>{doc.title}</span>
                      {doc.description ? (
                        <span className={styles.itemDate}>{doc.description}</span>
                      ) : (
                        <span className={styles.itemDate}>
                          {doc.modified.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </CurtainLink>
                ))}
              </div>
            </div>

            {/* Plans */}
            <div className={styles.column}>
              <CurtainLink href="/plans" className={styles.columnTitle} curtainTransition={true}>
                Plans
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
              <div className={styles.columnItems}>
                {recentPlans.map((plan) => (
                  <CurtainLink key={plan.slug} href={`/plans/${plan.slug}`} className={styles.columnItem} curtainTransition={true}>
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>{plan.title}</span>
                      <span className={styles.itemDate}>{statusLabel[plan.status]}</span>
                    </div>
                  </CurtainLink>
                ))}
              </div>
            </div>
          </div>

          <SiteFooter className={styles.homeFooter} />
        </div>
      </div>
    </main>
  );
}
