import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

/** Native select wrapper for consistent import and future tokenized styling. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  return <select ref={ref} {...props} />
})
