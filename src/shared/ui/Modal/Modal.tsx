import type { HTMLAttributes, ReactNode } from 'react'

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  onRequestClose?: () => void
}

/** Overlay shell. Dialog content, form state, and actions remain feature-owned. */
export function Modal({ children, className = '', onMouseDown, onRequestClose, ...props }: ModalProps) {
  return (
    <div
      {...props}
      className={['overlay', className].filter(Boolean).join(' ')}
      onMouseDown={event => {
        onMouseDown?.(event)
        if (event.currentTarget === event.target) onRequestClose?.()
      }}
    >
      {children}
    </div>
  )
}
