import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getAllSummaries } from '@/lib/news/loadNews'

export const metadata = {
  title: 'AI News',
  description: 'Daily curated AI video digest',
}

export default function NewsPage() {
  const summaries = getAllSummaries()
  if (summaries.length === 0) notFound()
  redirect(`/news/${summaries[0].slug}`)
}
