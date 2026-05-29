import { getAllSummaries } from '@/lib/news/loadNews'
import NewsSidebar from './_components/NewsSidebar'
import styles from './news.module.css'

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  const summaries = getAllSummaries()

  return (
    <div className={styles.layout}>
      <NewsSidebar summaries={summaries} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
