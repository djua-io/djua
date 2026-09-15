import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, FileDown, FileSpreadsheet, FileText } from 'lucide-react'

type ExportFormat = 'pdf' | 'excel' | 'csv'

export type ExportMenuProps = {
  title: string
  fileName: string
  columns: string[]
  rows: string[][]
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

function downloadFile(filename: string, content: string, type: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 0)
}

function downloadPdf(filename: string, title: string, columns: string[], rows: string[][]) {
  const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ' ').replace(/[\\()]/g, '\\$&')
  const lines = [title, columns.join(' | '), ...rows.map(row => row.join(' | '))].map(clean)
  const stream = ['BT', '/F1 12 Tf', '40 800 Td', ...lines.flatMap((line, index) => [index ? '0 -18 Td' : '', `(${line}) Tj`]).filter(Boolean), 'ET'].join('\n')
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  downloadFile(filename, pdf, 'application/pdf')
}

export function ExportMenu({ title, fileName, columns, rows }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const exportRows = (format: ExportFormat) => {
    const csv = `\ufeff${[columns, ...rows].map(row => row.map(csvCell).join(',')).join('\n')}`
    if (format === 'pdf') downloadPdf(`${fileName}.pdf`, title, columns, rows)
    else downloadFile(`${fileName}.${format === 'excel' ? 'xls' : 'csv'}`, csv, format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8')
    setOpen(false)
  }

  return <div className="exportMenu" ref={menuRef}><button type="button" className="workspaceAction" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><Download size={16}/>Exporter<ChevronDown size={15}/></button>{open && <div className="exportMenuList" role="menu"><button type="button" role="menuitem" onClick={() => exportRows('pdf')}><FileText size={16}/>PDF</button><button type="button" role="menuitem" onClick={() => exportRows('excel')}><FileSpreadsheet size={16}/>Excel</button><button type="button" role="menuitem" onClick={() => exportRows('csv')}><FileDown size={16}/>CSV</button></div>}</div>
}
