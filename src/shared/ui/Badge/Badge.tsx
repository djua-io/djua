import type { HTMLAttributes } from 'react'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  text: string
}

export function Badge({ text, className = '', ...props }: BadgeProps) {
  return <span {...props} className={['badge', text.toLowerCase(), className].filter(Boolean).join(' ')}>{text}</span>
}
