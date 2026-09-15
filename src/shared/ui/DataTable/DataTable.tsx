import type { TableHTMLAttributes } from 'react'

export type DataTableProps = TableHTMLAttributes<HTMLTableElement>

/** Semantic table shell. Columns and rows remain feature-owned. */
export function DataTable({ className = '', ...props }: DataTableProps) {
  return <table {...props} className={className} />
}
