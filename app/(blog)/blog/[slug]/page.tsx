import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
/* eslint-disable @next/next/no-img-element */
import { ChevronLeft } from 'lucide-react'
import { getAllPosts, getPostBySlug } from '@/lib/blog/loadBlog'
import CurtainLink from '@/app/components/CurtainLink'
import BlogContent from '../../_components/BlogContent'
import ThemeToggle from '../../_components/ThemeToggle'
import ShareButton from '../../_components/ShareButton'
import styles from '../../blog.module.css'

interface PageProps {
  params: Promise<{ slug: string }>
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.meta.title,
    description: post.meta.subtitle,
    openGraph: {
      title: post.meta.title,
      description: post.meta.subtitle || undefined,
      type: 'article',
      publishedTime: post.meta.date || undefined,
      authors: [post.meta.author || 'Josh Coolman'],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.meta.title,
    datePublished: post.meta.date || undefined,
    author: {
      '@type': 'Person',
      name: post.meta.author || 'Josh Coolman',
      url: 'https://www.joshcoolman.com',
    },
  }

  if (post.meta.overlay && post.meta.image) {
    return (
      <div className={styles.postWrapper}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <div className={styles.backRow}>
          <CurtainLink href="/blog" className={styles.indexBackLink} curtainTransition={true} curtainReverse={true}>
            <ChevronLeft size={14} />
            Blog
          </CurtainLink>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ShareButton title={post.meta.title} text={post.meta.subtitle} />
            <ThemeToggle />
          </div>
        </div>
        <div className={styles.overlayHero}>
          <img
            src={post.meta.image}
            alt={post.meta.title}
            className={styles.overlayImage}
          />
          <div className={styles.overlayGradient} />
          <header className={styles.overlayHeader}>
            <div className={styles.postMeta}>
              <time>{formatDate(post.meta.date)}</time>
            </div>
            <h1 className={styles.postTitle}>{post.meta.title}</h1>
            {post.meta.subtitle && (
              <p className={styles.postSubtitle}>{post.meta.subtitle}</p>
            )}
            {post.meta.author && (
              <p className={styles.postByline}>by {post.meta.author}</p>
            )}
          </header>
        </div>

        <BlogContent content={post.content} />
      </div>
    )
  }

  return (
    <div className={styles.postWrapper}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className={styles.backRow}>
        <CurtainLink href="/blog" className={styles.indexBackLink} curtainTransition={true} curtainReverse={true}>
          <ChevronLeft size={14} />
          Blog
        </CurtainLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ShareButton title={post.meta.title} text={post.meta.subtitle} />
          <ThemeToggle />
        </div>
      </div>
      <header className={styles.postHeader}>
        <div className={styles.postTitleRow}>
          <h1 className={styles.postTitle}>{post.meta.title}</h1>
          <time className={styles.postDate}>{formatDate(post.meta.date)}</time>
        </div>
        {post.meta.subtitle && (
          <p className={styles.postSubtitle}>{post.meta.subtitle}</p>
        )}
        {post.meta.author && (
          <span className={styles.postByline}>by {post.meta.author}</span>
        )}
      </header>

      {post.meta.image && (
        <div className={styles.postImageWrapper}>
          <img
            src={post.meta.image}
            alt={post.meta.title}
            className={styles.postImage}
          />
        </div>
      )}

      <BlogContent content={post.content} />
    </div>
  )
}
