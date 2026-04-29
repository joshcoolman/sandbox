import { experiments } from '@/lib/experiments/data'
import { buildRunnableMap, getRequiredEnv } from '@/lib/experiments/runnable'
import GalleryClient from './GalleryClient'

export default function DesignExperimentsPage() {
  const runnable = buildRunnableMap(experiments.map((e) => e.slug))
  const requirements: Record<string, string[]> = {}
  for (const exp of experiments) {
    const reqs = getRequiredEnv(exp.slug)
    if (reqs.length > 0) requirements[exp.slug] = reqs
  }

  return (
    <GalleryClient
      experiments={experiments}
      runnable={runnable}
      requirements={requirements}
    />
  )
}
