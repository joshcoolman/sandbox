import { buildBundle } from '@/lib/okf/bundle'

// Serves the Open Knowledge Format bundle as plain markdown over HTTP.
// Prerendered to static files at build time — one .md per concept, plus
// index.md and log.md. Entry point for a visiting agent is /okf/index.md.
export const dynamic = 'force-static'

export function generateStaticParams() {
  return Object.keys(buildBundle()).map((file) => ({ file }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const bundle = buildBundle()
  const body = bundle[file]

  if (!body) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
