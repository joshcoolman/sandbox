import React from 'react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import CodeBlock from '../../(docs)/_components/CodeBlock'
import Callout from './Callout'
import styles from '../plans.module.css'

interface PlansContentProps {
  content: string
}

function flattenChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child
      if (typeof child === 'number') return String(child)
      if (React.isValidElement(child)) {
        const props = child.props as { children?: React.ReactNode }
        return flattenChildren(props.children)
      }
      return ''
    })
    .join('')
}

type ElementProps = { children?: React.ReactNode } & Record<string, unknown>

const components = {
  Callout,
  h2: ({ children, id, ...rest }: ElementProps & { id?: string }) => {
    const text = flattenChildren(children).trim()
    const moveMatch = text.match(/^Move\s+(\d+)\s*[—–-]\s*(.+)$/i)
    if (moveMatch) {
      const [, num, title] = moveMatch
      return (
        <h2 id={id} className={styles.moveHeading} {...rest}>
          <span className={styles.moveChip}>Move {num}</span>
          <span className={styles.moveTitle}>{title}</span>
        </h2>
      )
    }
    return <h2 id={id} {...rest}>{children}</h2>
  },
  p: ({ children, ...rest }: ElementProps) => {
    const arr = React.Children.toArray(children)
    const first = arr[0]
    if (React.isValidElement(first) && (first.type === 'strong' || (typeof first.type === 'object' && first.type !== null))) {
      const strongText = flattenChildren((first.props as ElementProps).children).trim()
      if (strongText.endsWith('.') && strongText.length <= 80) {
        const label = strongText.slice(0, -1).trim()
        const remainder = arr.slice(1)
        const cleaned = remainder.map((node, i) => {
          if (i === 0 && typeof node === 'string') {
            return node.replace(/^[\s ]+/, '')
          }
          return node
        })
        return (
          <p {...rest}>
            <span className={styles.eyebrow}>{label}</span>
            {cleaned}
          </p>
        )
      }
    }
    return <p {...rest}>{children}</p>
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

export default function PlansContent({ content }: PlansContentProps) {
  return (
    <div className={styles.prose}>
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            format: 'mdx',
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
        components={components}
      />
    </div>
  )
}
