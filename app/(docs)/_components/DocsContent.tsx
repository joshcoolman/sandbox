import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import CodeBlock from './CodeBlock'

interface DocsContentProps {
  content: string
}

const components = {
  pre: ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  },
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => {
    const isBlock = typeof children === 'string' && children.includes('\n')
    if (isBlock || className) {
      return <CodeBlock className={className}>{String(children)}</CodeBlock>
    }
    return <code className={className} {...props}>{children}</code>
  },
}

export default function DocsContent({ content }: DocsContentProps) {
  return (
    <div className="prose compact">
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            format: 'md',
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
        components={components}
      />
    </div>
  )
}
