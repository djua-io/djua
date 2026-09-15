import type { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  secondary?: boolean
}

/** Shared Djua action button. It preserves the existing global CSS hooks. */
export function Button({ secondary = false, className = '', onClick, type, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type ?? (onClick ? 'button' : undefined)}
      onClick={onClick}
      className={['button', secondary && 'secondary', className].filter(Boolean).join(' ')}
    />
  )
}
