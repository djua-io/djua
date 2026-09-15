import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  CircleDot,
  Crosshair,
  MapPin,
  ShieldCheck,
  Signal,
  Wrench,
} from 'lucide-react'
import { loadLeaflet } from '../../../shared/lib/leaflet'
import './installation-location.css'

const geofenceDetails = [
  { icon: Crosshair, label: 'Position de référence', value: '-4.3208, 15.3075', note: 'Gombe, Kinshasa' },
  { icon: MapPin, label: 'Position actuelle', value: '-4.3207, 15.3074', note: 'Gombe, Kinshasa' },
  { icon: Signal, label: 'Précision GPS', value: '8 m' },
  { icon: CircleDot, label: 'Rayon autorisé', value: '100 m' },
  { icon: ShieldCheck, label: 'Statut global', value: 'Conforme', tone: 'positive' },
]

export function InstallationLocationPage() {
  const navigate = useNavigate()
  const { id = 'INS-00482' } = useParams()
  const [mapMode, setMapMode] = useState<'Plan' | 'Satellite'>('Plan')

  return (
    <section className="workspacePage installationLocationPage">
      <header className="workspaceHeading installationLocationHeading">
        <div>
          <span><h1>Jean Kabeya</h1><b className="installationLocationOnline offline"><i />Hors ligne</b></span>
          <p>{id}<em>•</em>Maison individuelle<em>•</em>Gombe, Kinshasa<em>•</em>Dernière donnée reçue : il y a 7 h</p>
        </div>
        <div className="installationLocationActions">
          <button type="button"><CalendarDays size={17} />30 derniers jours<ChevronDown size={16} /></button>
          <button type="button" className="installationLocationPrimaryAction" onClick={() => navigate('/interventions')}><Wrench size={16} />Créer une intervention</button>
        </div>
      </header>

      <nav className="installationTabs installationLocationTabs" aria-label="Navigation de l’installation">
        <button type="button" onClick={() => navigate(`/installations/${id}`)}>Vue d’ensemble</button>
        <button type="button">Énergie</button>
        <button type="button" onClick={() => navigate(`/installations/${id}/integrite`)}>Intégrité du kit</button>
        <button type="button" className="active" aria-current="page">Localisation</button>
        <button type="button">Alertes</button>
        <button type="button">Historique</button>
      </nav>

      <div className="installationLocationLayout">
        <main>
          <section className="installationLocationMetrics" aria-label="État de la localisation">
            <article><i className="orange"><MapPin size={23} /></i><span><small>Position actuelle</small><b>Gombe, Kinshasa</b><em>-4.3207, 15.3074</em></span></article>
            <article><i className="green"><CircleDot size={23} /></i><span><small>Rayon autorisé</small><b>100 m</b></span></article>
            <article><i className="orange"><CalendarDays size={22} /></i><span><small>Dernière position reçue</small><b>il y a 2 min</b><em>31 mars 2025, 14:28</em></span></article>
            <article><i className="green"><ShieldCheck size={23} /></i><span><small>Statut géofence</small><b>Conforme</b><em>Dans le périmètre autorisé</em></span></article>
          </section>

          <section className={'installationLocationMap '+mapMode.toLowerCase()} aria-label="Carte de localisation de l’installation">
            <OpenStreetMapGeofence mapMode={mapMode} />
            <div className="installationLocationMapControls" role="group" aria-label="Type de carte">
              {(['Plan', 'Satellite'] as const).map(mode => <button type="button" className={mapMode === mode ? 'selected' : ''} onClick={() => setMapMode(mode)} key={mode}>{mode}</button>)}
            </div>
            <div className="installationLocationLegend"><span><i />Installation (position actuelle)</span><span><i />Rayon autorisé (100 m)</span></div>
          </section>

        </main>

        <aside className="installationLocationRail">
          <section className="installationLocationSimple"><h2>Lecture simple</h2><div><i><MapPin size={25} /></i><span><b>Le kit est à l’emplacement attendu</b><small>L’installation se trouve dans le périmètre autorisé et n’a pas quitté la zone définie. Tout est conforme.</small></span></div></section>
          <section className="installationLocationDetails"><h2>Détails géofence</h2>{geofenceDetails.map(({ icon: Icon, label, value, note, tone }) => <article key={label}><Icon size={21} /><span>{label}</span><b className={tone}>{value}<small>{note}</small></b></article>)}</section>
        </aside>
      </div>
    </section>
  )
}

function OpenStreetMapGeofence({ mapMode }: { mapMode: 'Plan' | 'Satellite' }) {
  const elementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const tileRef = useRef<any>(null)
  const [status, setStatus] = useState('Chargement de la carte…')

  useEffect(() => {
    let active = true
    loadLeaflet().then(L => {
      if (!active || !elementRef.current) return

      const location = [-4.3207, 15.3074]
      const map = L.map(elementRef.current, { zoomControl: true, attributionControl: true }).setView(location, 15)
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)
      const pin = L.divIcon({
        className: 'installationLocationMapPin',
        html: '<span><b>⌂</b></span>',
        iconSize: [44, 50],
        iconAnchor: [22, 50],
      })
      L.circle(location, { radius: 100, color: '#0ba143', weight: 2, dashArray: '6 5', fillColor: '#44d475', fillOpacity: .24 }).addTo(map)
      L.marker(location, { icon: pin, title: 'Installation Jean Kabeya' }).addTo(map)
      mapRef.current = map
      tileRef.current = tiles
      window.setTimeout(() => active && map.invalidateSize({ animate: false }), 0)
      setStatus('Carte OpenStreetMap')
    }).catch(error => active && setStatus(error.message))

    return () => {
      active = false
      mapRef.current?.remove()
      mapRef.current = null
      tileRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.getContainer().classList.toggle('mapSatelliteMode', mapMode === 'Satellite')
  }, [mapMode])

  return <><div ref={elementRef} className="installationOpenStreetMap" /><span className="installationLocationMapStatus">{status}</span></>
}
