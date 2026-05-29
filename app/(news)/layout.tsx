import NewsEditProvider from './_components/NewsEditContext'
import styles from './news.module.css'

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewsEditProvider>
      <div className={styles.layout}>
        <main className={styles.main}>{children}</main>
      </div>
    </NewsEditProvider>
  )
}
