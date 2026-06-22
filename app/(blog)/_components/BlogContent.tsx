import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import CodeBlock from '../../(docs)/_components/CodeBlock'

interface BlogContentProps {
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

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose">
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
