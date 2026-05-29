import { notFound } from 'next/navigation'
import { getFeed } from '@/lib/news/loadNews'
import NewsContent from '../_components/NewsContent'
import NewsEditableContent from '../_components/NewsEditableContent'
import NewsEditToggle from '../_components/NewsEditToggle'
import styles from '../news.module.css'

export const metadata = {
  title: 'AI News',
  description: 'A running feed of curated AI videos worth watching',
}

export default function NewsPage() {
  const feed = getFeed()
  if (!feed) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.newsHeader}>
          <div>
            <span className={styles.eyebrow}>News</span>
            <h1 className={styles.newsTitle}>{feed.title}</h1>
          </div>
          <NewsEditToggle />
        </header>
        <article>
          <NewsEditableContent>
            <NewsContent content={feed.content} />
          </NewsEditableContent>
        </article>
      </div>
    </div>
  )
}
