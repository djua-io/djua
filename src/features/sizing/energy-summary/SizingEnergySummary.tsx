import { CSSProperties, Fragment } from 'react'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { Card } from '../../../shared/ui'
import './sizing-energy-summary.css'

export type EnergyBreakdownItem = {
  label: string
  value: string
  color?: 'orange' | 'purple' | 'yellow' | 'green'
  weight?: number
}

export type SizingEnergySummaryProps = {
  dailyConsumption: string
  installedPower: string
  simultaneousPower: string
  distribution: EnergyBreakdownItem[]
  distributionTitle?: string
  itemCount?: { label: string; value: string; action?: () => void }
  advice?: { title: string; description: string }
  className?: string
}

/** Shared right-rail recap for every sizing path. Values remain owned by each flow. */
export function SizingEnergySummary({
  dailyConsumption,
  installedPower,
  simultaneousPower,
  distribution,
  distributionTitle = 'Répartition d’utilisation',
  itemCount,
  advice = {
    title: 'Conseil Djúa',
    description: 'Vérifiez avec le client les appareils et leurs horaires : une estimation cohérente suffit pour préparer la recommandation.',
  },
  className = '',
}: SizingEnergySummaryProps) {
  const palette = { orange: '#ff5a00', purple: '#7d67c7', yellow: '#f5b63e', green: '#21a55a' }
  const totalWeight = distribution.reduce((total, item) => total + (item.weight ?? 1), 0)
  let offset = 0
  const segments = distribution.map(item => {
    const start = offset
    offset += ((item.weight ?? 1) / totalWeight) * 100
    return `${palette[item.color ?? 'orange']} ${start}% ${offset}%`
  })
  const donutStyle = { background: `conic-gradient(${segments.join(', ')})` } as CSSProperties

  return (
    <aside className={['energy', 'applianceEnergy', 'sizingEnergySummary', className].filter(Boolean).join(' ')} aria-label="Estimation des besoins">
      <Card title="Estimation des besoins">
        <div className="energyChart">
          <small>Consommation quotidienne</small>
          <strong>{dailyConsumption}<em> / jour</em></strong>
          <svg viewBox="0 0 220 72" aria-hidden="true"><defs><linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff5a00" stopOpacity=".22" /><stop offset="1" stopColor="#ff5a00" stopOpacity="0" /></linearGradient></defs><path d="M4 62 L36 58 L70 52 L100 45 L132 38 L162 26 L194 9 L216 5 L216 68 L4 68 Z" fill="url(#energyFill)" /><polyline points="4,62 36,58 70,52 100,45 132,38 162,26 194,9 216,5" fill="none" stroke="#ff5a00" strokeWidth="2" />{[4, 36, 70, 100, 132, 162, 194, 216].map((x, index) => <circle cx={x} cy={[62, 58, 52, 45, 38, 26, 9, 5][index]} r="2.5" fill="#ff5a00" key={x} />)}</svg>
        </div>
        <div className="energyMetric"><small>Puissance nécessaire estimée</small><strong>{installedPower} <em>kW</em></strong></div>
        <div className="energyMetric"><small>Pic de puissance estimé</small><strong>{simultaneousPower} <em>kW</em></strong></div>
        <div className="usageDistribution">
          <small>{distributionTitle}</small>
          <div><i style={donutStyle} /><span>{distribution.map(item => <Fragment key={item.label}><b><em className={item.color} />{item.label}</b><strong>{item.value}</strong></Fragment>)}</span></div>
        </div>
        {itemCount && <div className="energyDevices"><span><small>{itemCount.label}</small><strong>{itemCount.value}</strong></span>{itemCount.action && <button type="button" onClick={itemCount.action}>Voir la liste complète <ArrowRight size={16} /></button>}</div>}
      </Card>
      <div className="advice"><Lightbulb size={22} /><span><b>{advice.title}</b><p>{advice.description}</p></span></div>
    </aside>
  )
}
