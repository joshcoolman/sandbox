import type { MetadataRoute } from 'next'
import { experiments } from '@/lib/experiments/data'
import { getAllPosts } from '@/lib/blog/loadBlog'
import { getNavCategories } from '@/lib/docs/loadDocs'
import { getAllPlans } from '@/lib/plans/loadPlans'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.joshcoolman.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/design-experiments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/plans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/recommended`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const experimentRoutes: MetadataRoute.Sitemap = experiments.map((exp) => ({
    url: `${baseUrl}/design-experiments/${exp.slug}`,
    lastModified: exp.date ? new Date(exp.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const docRoutes: MetadataRoute.Sitemap = getNavCategories().flatMap((category) =>
    category.items.map((item) => ({
      url: `${baseUrl}/docs/${item.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  )

  const planRoutes: MetadataRoute.Sitemap = getAllPlans().map((plan) => ({
    url: `${baseUrl}/plans/${plan.slug}`,
    lastModified: plan.modified,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...blogRoutes, ...experimentRoutes, ...docRoutes, ...planRoutes]
}
