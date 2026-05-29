import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import CodeBlock from '../../(docs)/_components/CodeBlock'
import styles from '../news.module.css'

interface NewsContentProps {
  content: string
}

const components = {
  a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: unknown }) => {
    const external = typeof href === 'string' && /^https?:\/\//.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props}>
        {children}
      </a>
    )
  },
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => {
    const isBlock = typeof children === 'string' && children.includes('\n')
    if (isBlock || className) {
      return <CodeBlock className={className}>{String(children)}</CodeBlock>
    }
    return <code className={className} {...props}>{children}</code>
  },
}

export default function NewsContent({ content }: NewsContentProps) {
  return (
    <div className={styles.prose}>
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
