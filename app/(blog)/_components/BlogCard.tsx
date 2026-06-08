'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { BlogMeta } from '@/lib/blog/types'
import styles from '../blog.module.css'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogCard({ post, delay }: { post: BlogMeta; delay?: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card} data-delay={delay}>
      <div className={styles.cardImageWrapper}>
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className={styles.cardImage}
          />
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <time>{formatDate(post.date)}</time>
        </div>
        <h2 className={styles.cardTitle}>{post.title}</h2>
        {post.subtitle && (
          <p className={styles.cardSubtitle}>{post.subtitle}</p>
        )}
      </div>
    </Link>
  )
}
