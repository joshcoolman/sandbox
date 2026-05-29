import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSummaries, getNewsByDate } from '@/lib/news/loadNews'
import NewsContent from '../../_components/NewsContent'
import styles from '../../news.module.css'

interface PageProps {
  params: Promise<{ date: string }>
}

function formatDate(slug: string): string {
  const date = new Date(slug + 'T12:00:00Z')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function generateStaticParams() {
  return getAllSummaries().map((s) => ({ date: s.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params
  const news = getNewsByDate(date)
  if (!news) return {}
  return {
    title: news.title,
    description: `${news.videoCount} curated AI videos from ${formatDate(date)}`,
  }
}

export default async function NewsDatePage({ params }: PageProps) {
  const { date } = await params
  const news = getNewsByDate(date)

  if (!news) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.newsHeader}>
          <span className={styles.eyebrow}>News</span>
          <h1 className={styles.newsTitle}>{news.title}</h1>
          <div className={styles.newsMeta}>
            <span>{formatDate(date)}</span>
            {news.videoCount > 0 && <span>{news.videoCount} videos</span>}
          </div>
        </header>
        <article>
          <NewsContent content={news.content} />
        </article>
      </div>
    </div>
  )
}
