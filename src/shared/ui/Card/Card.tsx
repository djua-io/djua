import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode
}

/** Generic surface container; product-specific content stays with its feature. */
export function Card({ title, className = '', children, ...props }: CardProps) {
  return (
    <section {...props} className={['card', className].filter(Boolean).join(' ')}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  )
}
