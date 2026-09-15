import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

export const installationPeriods = ['Aujourd’hui', '7 derniers jours', '30 derniers jours', '90 derniers jours'] as const
export type InstallationPeriod = typeof installationPeriods[number]

const defaultPeriod: InstallationPeriod = '30 derniers jours'
const periodCodes: Record<InstallationPeriod, string> = {
  'Aujourd’hui': 'today',
  '7 derniers jours': '7d',
  '30 derniers jours': '30d',
  '90 derniers jours': '90d',
}

export function useInstallationPeriod() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = installationPeriods.find(option => periodCodes[option] === searchParams.get('period')) ?? defaultPeriod
  const setPeriod = (nextPeriod: InstallationPeriod) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('period', periodCodes[nextPeriod])
    setSearchParams(nextSearchParams)
  }
  const search = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return { period, setPeriod, search }
}

export function InstallationPeriodFilter({ period, onChange }: { period: InstallationPeriod; onChange: (period: InstallationPeriod) => void }) {
  const [open, setOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return <div className="installationDateFilter" ref={filterRef}><button className="parcDateRange" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)}><CalendarDays size={17} />{period}<ChevronDown size={16} /></button>{open && <div className="installationDateMenu" role="listbox" aria-label="Période affichée">{installationPeriods.map(option => <button type="button" role="option" aria-selected={period === option} className={period === option ? 'selected' : ''} key={option} onClick={() => { onChange(option); setOpen(false) }}>{option}{period === option && <Check size={16} />}</button>)}</div>}</div>
}
