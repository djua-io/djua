import type { HTMLAttributes, ReactNode } from 'react'

export type PageProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode
  sub?: ReactNode
  hideTitle?: boolean
}

/** Standard constrained content area for legacy and future feature routes. */
export function Page({ title, sub, hideTitle = false, children, className = '', ...props }: PageProps) {
  return (
    <section {...props} className={['page', className].filter(Boolean).join(' ')}>
      {!hideTitle && <h1>{title}</h1>}
      {sub && <p className="muted">{sub}</p>}
      {children}
    </section>
  )
}
