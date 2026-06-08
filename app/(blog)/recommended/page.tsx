import type { Metadata } from 'next'
import { ChevronLeft, ArrowUpRight, YoutubeIcon, GithubIcon, Globe, FileText } from 'lucide-react'
import Link from 'next/link'
import { getAllRecommendations } from './loadRecommended'
import type { Recommendation } from './types'
import styles from '../blog.module.css'

export const metadata: Metadata = {
  title: 'Recommended',
  description: 'Links worth sharing — videos, articles, and other finds',
}

const sourceConfig = {
  youtube: { icon: YoutubeIcon, label: 'YouTube' },
  github: { icon: GithubIcon, label: 'GitHub' },
  pdf: { icon: FileText, label: 'PDF' },
  web: { icon: Globe, label: 'Site' },
} as const

function SourceBadge({ source }: { source: Recommendation['source'] }) {
  const { icon: Icon, label } = sourceConfig[source]
  return (
    <span className={`${styles.recBadge} ${styles.recBadgeLabeled}`}>
      <Icon size={14} />
      <span className={styles.recBadgeLabel}>{label}</span>
    </span>
  )
}

export default async function RecommendedPage() {
  const items = await getAllRecommendations()

  return (
    <div className={styles.blogLayout}>
      <div className={styles.indexWrapper}>
        <div className={styles.backRow}>
          <Link href="/blog" className={styles.indexBackLink}>
            <ChevronLeft size={14} />
            Blog
          </Link>
        </div>
        <h1 className={styles.indexTitle}>Link Worthy</h1>
        <p className={styles.indexSubtitle}>
          If you&apos;re bored...
        </p>
        <ul className={styles.recList}>
          {items.map((item) => (
            <li key={item.id} className={styles.recItem}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.recItemLink}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" aria-hidden="true" className={styles.recThumb} />
                ) : (
                  <div className={styles.recThumbPlaceholder} />
                )}
                <div className={styles.recBody}>
                  <span className={styles.recLink}>
                    {item.title}
                    <ArrowUpRight size={14} className={styles.recArrow} />
                  </span>
                  {item.author && (
                    <span className={styles.recMeta}>{item.author}</span>
                  )}
                  {item.note && (
                    <p className={styles.recNote}>{item.note}</p>
                  )}
                </div>
                <SourceBadge source={item.source} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
