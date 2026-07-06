import Image from "next/image";
// Swap back to ./components/NetworkCanvas for the original organic-organisms backdrop
import MeshCanvas from "./components/MeshCanvas";
import CurtainLink from "./components/CurtainLink";
import SiteFooter from "./components/SiteFooter";
import HomeExperimentCard from "./components/HomeExperimentCard";
import HomeExperimentPlaceholderCard from "./components/HomeExperimentPlaceholderCard";
import HomeScrollRestore from "./components/HomeScrollRestore";
import ProfileCard from "./components/ProfileCard";
import { getAllPosts } from "@/lib/blog/loadBlog";
import { getRecentDocs } from "@/lib/docs/loadDocs";
import { getAllRecommendations } from "@/app/(blog)/recommended/loadRecommended";
import { experiments } from "@/lib/experiments/data";
import { getRequiredEnv, isRunnable } from "@/lib/experiments/runnable";

import styles from "./page.module.css";

export default async function Home() {
  const recentExperiments = experiments.slice(0, 9);
  const posts = getAllPosts().slice(0, 4);
  const recentDocs = getRecentDocs(4);
  const links = (await getAllRecommendations()).slice(0, 4);

  return (
    <main className={styles.mainContainer}>
      <HomeScrollRestore />
      <div className={styles.networkBackground}>
        <MeshCanvas className={styles.networkCanvas} />
      </div>

      <div className={styles.contentOverlay}>
        <div className={styles.contentWrapper}>
          <ProfileCard />

          <section className={styles.recentWorkSection}>
            <h2 className={styles.recentWorkHeader}>Recent Work</h2>
            <p className={styles.preamble}>
              Experiments in agentic coding. All code available on{' '}
              <a
                href="https://github.com/joshcoolman/sandbox"
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
              <CurtainLink href="/blog" className={styles.columnViewAll} curtainTransition={true}>
                View all blog posts
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
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
              <CurtainLink href="/docs" className={styles.columnViewAll} curtainTransition={true}>
                View documentation
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
            </div>

            {/* Link Worthy */}
            <div className={styles.column}>
              <CurtainLink href="/recommended" className={styles.columnTitle} curtainTransition={true}>
                Links
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
              <div className={styles.columnItems}>
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.columnItem}
                  >
                    {link.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.thumbnail}
                        alt=""
                        aria-hidden="true"
                        className={styles.itemThumb}
                      />
                    )}
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>{link.title}</span>
                      {link.date ? (
                        <span className={styles.itemDate}>
                          {new Date(link.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      ) : null}
                    </div>
                  </a>
                ))}
              </div>
              <CurtainLink href="/recommended" className={styles.columnViewAll} curtainTransition={true}>
                View all links
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CurtainLink>
            </div>
          </div>

          <SiteFooter className={styles.homeFooter} />
        </div>
      </div>
    </main>
  );
}
