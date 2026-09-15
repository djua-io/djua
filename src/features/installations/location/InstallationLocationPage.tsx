import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Activity, ChevronDown, CircleAlert, CircleDot, Clock3, Crosshair, House, MapPin, ShieldCheck, Signal, UserRound, Wrench } from 'lucide-react'
import { getInstallationHeader, type InstallationHeader } from '../../../domain/installations'
import { InstallationPeriodFilter, useInstallationPeriod } from '../InstallationPeriodFilter'
import { loadLeaflet } from '../../../shared/lib/leaflet'
import './installation-location.css'

type LocationTone = 'complete' | 'warning' | 'critical' | 'unknown'
type LocationEvent = { time: string; date: string; title: string; note: string; tone: LocationTone }
type LocationState = {
  tone: LocationTone; client: string; site: string; location: string; lastData: string; headerStatus: string
  positionLabel: string; positionValue: string; positionNote: string; secondLabel: string; secondValue: string; secondNote?: string
  lastPosition: string; lastPositionNote: string; geofenceStatus: string; geofenceNote: string; simpleTitle: string; simpleNote: string
  reference: [number, number]; current?: [number, number]; radius: number; distance?: string; events?: LocationEvent[]
}

const locationStates: Record<string, LocationState> = {
  'INS-00482': {
    tone: 'complete', client: 'Jean Kabeya', site: 'Maison individuelle', location: 'Gombe, Kinshasa', lastData: 'il y a 2 min', headerStatus: 'En ligne',
    positionLabel: 'Position actuelle', positionValue: 'Gombe, Kinshasa', positionNote: '-4.3207, 15.3074', secondLabel: 'Rayon autorisé', secondValue: '100 m',
    lastPosition: 'il y a 2 min', lastPositionNote: '31 mars 2025, 14:28', geofenceStatus: 'Conforme', geofenceNote: 'Dans le périmètre autorisé',
    simpleTitle: 'Le kit est à l’emplacement attendu', simpleNote: 'L’installation se trouve dans le périmètre autorisé et n’a pas quitté la zone définie. Tout est conforme.', reference: [-4.3208, 15.3075], current: [-4.3207, 15.3074], radius: 100,
  },
  'INS-00841': {
    tone: 'warning', client: 'Kivu Market SARL', site: 'Commerce', location: 'Gombe, Kinshasa', lastData: 'il y a 2 min', headerStatus: 'À surveiller',
    positionLabel: 'Position actuelle', positionValue: 'Gombe, Kinshasa', positionNote: '-4.3202, 15.3071', secondLabel: 'Rayon autorisé', secondValue: '100 m',
    lastPosition: 'il y a 2 min', lastPositionNote: '31 mars 2025, 14:28', geofenceStatus: 'À surveiller', geofenceNote: 'Proche de la limite autorisée',
    simpleTitle: 'L’installation est proche de la limite autorisée', simpleNote: 'Le kit se trouve toujours dans le périmètre autorisé, mais il est proche de la limite (à environ 8 m du bord). Aucune action immédiate n’est requise.', reference: [-4.3208, 15.3075], current: [-4.3202, 15.3071], radius: 100, distance: '8 m',
  },
  'INS-00912': {
    tone: 'critical', client: 'Sarah Ilunga', site: 'Maison individuelle', location: 'Ngaliema, Kinshasa', lastData: 'il y a 3 min', headerStatus: 'Hors zone',
    positionLabel: 'Position actuelle', positionValue: 'Kinshasa', positionNote: '-4.3191, 15.3218', secondLabel: 'Rayon autorisé', secondValue: '100 m',
    lastPosition: 'il y a 3 min', lastPositionNote: '31 mars 2025, 14:33', geofenceStatus: 'Non conforme', geofenceNote: 'Hors du périmètre autorisé',
    simpleTitle: 'Le kit a quitté la zone autorisée', simpleNote: 'L’installation se trouve en dehors du périmètre autorisé défini (rayon de 100 m). Une vérification est nécessaire.', reference: [-4.3208, 15.3075], current: [-4.3191, 15.3218], radius: 100, distance: '230 m',
    events: [
      { time: 'Il y a 3 min', date: '31 mars 2025, 14:33', title: 'Sortie du périmètre détectée', note: 'Position GPS : -4.3191, 15.3218 (distance au centre : 230 m, limite : 100 m)', tone: 'critical' },
      { time: 'Il y a 12 min', date: '31 mars 2025, 14:21', title: 'Géofence respectée', note: 'L’installation était dans le périmètre autorisé (distance au centre : 45 m)', tone: 'complete' },
      { time: 'Il y a 2 h 15', date: '31 mars 2025, 12:18', title: 'Dernière transmission GPS', note: 'Donnée de localisation reçue avec succès', tone: 'unknown' },
      { time: 'Il y a 3 j', date: '28 mars 2025, 09:02', title: 'Position de référence enregistrée', note: 'Position de référence définie : -4.3208, 15.3075', tone: 'complete' },
    ],
  },
  'INS-01024': {
    tone: 'unknown', client: 'École La Source', site: 'École', location: 'Kintambo, Kinshasa', lastData: 'il y a 8 h', headerStatus: 'Données indisponibles',
    positionLabel: 'Position actuelle', positionValue: 'Indisponible', positionNote: 'Aucune donnée GPS', secondLabel: 'Précision GPS', secondValue: 'Indisponible', secondNote: 'Données non reçues',
    lastPosition: 'il y a 8 h', lastPositionNote: '31 mars 2025, 06:14', geofenceStatus: 'Données indisponibles', geofenceNote: 'En attente de données',
    simpleTitle: 'Djua ne peut pas confirmer actuellement la position de cette installation.', simpleNote: 'Aucune donnée GPS n’a été reçue depuis 8 h. L’installation est peut-être hors connexion ou dans une zone avec une couverture limitée.', reference: [-4.3208, 15.3075], radius: 100,
  },
}

export function InstallationLocationPage() {
  const navigate = useNavigate()
  const { id = 'INS-00482' } = useParams()
  const [mapMode, setMapMode] = useState<'Plan' | 'Satellite'>('Plan')
  const state = locationStates[id] ?? locationStates['INS-00482']
  const header = getInstallationHeader(id)
  const { period, setPeriod, search } = useInstallationPeriod()
  const StateIcon = state.tone === 'complete' ? ShieldCheck : state.tone === 'unknown' ? CircleDot : CircleAlert
  const details = [
    { icon: Crosshair, label: 'Position de référence', value: '-4.3208, 15.3075', note: 'Gombe, Kinshasa' },
    { icon: MapPin, label: 'Position actuelle', value: state.current ? state.positionNote : 'Indisponible', note: state.current ? state.location : 'Aucune donnée GPS', tone: state.tone === 'critical' ? 'critical' : undefined },
    { icon: Signal, label: 'Précision GPS', value: state.tone === 'unknown' ? 'Indisponible' : '8 m', note: state.tone === 'unknown' ? 'Données non reçues' : undefined },
    { icon: CircleDot, label: 'Rayon autorisé', value: '100 m' },
    ...(state.distance ? [{ icon: CircleAlert, label: state.tone === 'warning' ? 'Distance à la limite' : 'Distance au centre', value: state.distance, tone: state.tone }] : []),
    { icon: ShieldCheck, label: 'Statut global', value: state.geofenceStatus, tone: state.tone },
  ]
  return <section className={`workspacePage installationLocationPage tone-${state.tone}`}>
    <header className="workspaceHeading installationLocationHeading"><div><span><h1>{header.client}</h1><b className={`installationLocationOnline is-${header.connection}`}><i />{header.connectionLabel}</b></span><p>{header.id}<em>•</em>{header.site}<em>•</em>{header.location}<em>•</em>Dernière donnée reçue : {header.lastData}</p></div><div className="installationLocationActions"><InstallationPeriodFilter period={period} onChange={setPeriod}/><button type="button" className="installationLocationPrimaryAction" onClick={() => navigate('/interventions')}><Wrench size={16} />Créer une intervention</button></div></header>
    <nav className="installationTabs installationLocationTabs" aria-label="Navigation de l’installation"><button type="button" onClick={() => navigate({ pathname: `/installations/${id}`, search })}>Vue d’ensemble</button><button type="button" onClick={() => navigate({ pathname: `/installations/${id}/integrite`, search })}>Intégrité du kit</button><button type="button" className="active" aria-current="page">Localisation</button></nav>
    <div className="installationLocationLayout"><main><section className="installationLocationMetrics" aria-label="État de la localisation"><Metric icon={MapPin} label={state.positionLabel} value={state.positionValue} note={state.positionNote} tone={state.tone} /><Metric icon={state.tone === 'unknown' ? Signal : CircleDot} label={state.secondLabel} value={state.secondValue} note={state.secondNote} tone={state.tone} /><Metric icon={Clock3} label="Dernière position reçue" value={state.lastPosition} note={state.lastPositionNote} tone={state.tone} /><Metric icon={StateIcon} label="Statut géofence" value={state.geofenceStatus} note={state.geofenceNote} tone={state.tone} /></section><section className={'installationLocationMap '+mapMode.toLowerCase()} aria-label="Carte de localisation de l’installation"><OpenStreetMapGeofence mapMode={mapMode} state={state} /><div className="installationLocationMapControls" role="group" aria-label="Type de carte">{(['Plan', 'Satellite'] as const).map(mode => <button type="button" className={mapMode === mode ? 'selected' : ''} onClick={() => setMapMode(mode)} key={mode}>{mode}</button>)}</div><MapLegend state={state} /></section>{state.events && <LocationEvents events={state.events} />}</main><aside className="installationLocationRail"><LocationSummary header={header} state={state} /><section className="installationLocationSimple"><h2>Lecture simple</h2><div><i><StateIcon size={25} /></i><span><b>{state.simpleTitle}</b><small>{state.simpleNote}</small></span></div></section><section className="installationLocationDetails"><h2>Détails géofence</h2>{details.map(({ icon: Icon, label, value, note, tone }) => <article className={tone ? `tone-${tone}` : ''} key={label}><Icon size={21} /><span>{label}</span><b>{value}<small>{note}</small></b></article>)}</section></aside></div>
  </section>
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof MapPin; label: string; value: string; note?: string; tone: LocationTone }) { return <article className={`tone-${tone}`}><i><Icon size={23} /></i><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article> }
function LocationSummary({ header, state }: { header: InstallationHeader; state: LocationState }) { return <section className="installationLocationSummary"><h2>Résumé</h2><dl><dt><UserRound size={17} />Client</dt><dd>{header.client}</dd><dt><Activity size={17} />Installation</dt><dd>{header.id}</dd><dt><House size={17} />Type</dt><dd>{header.site}</dd><dt><MapPin size={17} />Localisation</dt><dd>{header.location}</dd><dt><Activity size={17} />Statut global</dt><dd><b className={`tone-${state.tone}`}><i />{state.headerStatus}</b></dd></dl></section> }
function MapLegend({ state }: { state: LocationState }) { return <div className="installationLocationLegend">{state.tone === 'critical' && <span className="reference"><i />Installation (position autorisée)</span>}<span className="current"><i />{state.current ? 'Installation (position actuelle)' : 'Position actuelle (indisponible)'}</span><span className="radius"><i />{state.tone === 'unknown' ? 'Rayon estimé (non disponible)' : 'Rayon autorisé (100 m)'}</span></div> }
function LocationEvents({ events }: { events: LocationEvent[] }) { return <section className="installationLocationEvents"><header><h2>Événements de localisation</h2><button type="button">Voir tout l’historique <ChevronDown size={16} /></button></header>{events.map(event => <article className={`tone-${event.tone}`} key={event.title}><time><i />{event.time}<small>{event.date}</small></time><i className="eventIcon">{event.tone === 'critical' ? <MapPin size={20} /> : event.tone === 'unknown' ? <Signal size={20} /> : <ShieldCheck size={20} />}</i><span><b>{event.title}</b><small>{event.note}</small></span></article>)}</section> }

function OpenStreetMapGeofence({ mapMode, state }: { mapMode: 'Plan' | 'Satellite'; state: LocationState }) {
  const elementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [status, setStatus] = useState('Chargement de la carte…')
  useEffect(() => {
    let active = true
    loadLeaflet().then(L => {
      if (!active || !elementRef.current) return
      const focalPoint = state.current ?? state.reference
      const map = L.map(elementRef.current, { zoomControl: true, attributionControl: true }).setView(focalPoint, state.tone === 'critical' ? 14 : 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map)
      const marker = (tone: LocationTone, glyph: string) => L.divIcon({ className: `installationLocationMapPin tone-${tone}`, html: `<span><b>${glyph}</b></span>`, iconSize: [44, 50], iconAnchor: [22, 50] })
      const circleTone = state.tone === 'critical' ? '#e4404d' : state.tone === 'warning' ? '#ff5a00' : state.tone === 'unknown' ? '#75829a' : '#0ba143'
      const circleFill = state.tone === 'critical' ? '#ff8794' : state.tone === 'warning' ? '#ff9b63' : state.tone === 'unknown' ? '#cbd5e1' : '#44d475'
      L.circle(state.reference, { radius: state.radius, color: circleTone, weight: 2, dashArray: '6 5', fillColor: circleFill, fillOpacity: state.tone === 'unknown' ? .1 : .24 }).addTo(map)
      if (state.tone === 'unknown') L.marker(state.reference, { icon: marker('unknown', '?'), title: 'Position indisponible' }).addTo(map)
      if (state.tone === 'critical') L.marker(state.reference, { icon: marker('critical', '⌂'), title: 'Position autorisée' }).addTo(map)
      if (state.current) L.marker(state.current, { icon: marker(state.tone, '⌂'), title: 'Position actuelle' }).addTo(map)
      if (state.current && state.tone === 'critical') L.polyline([state.reference, state.current], { color: '#e4404d', weight: 2, dashArray: '6 5' }).addTo(map)
      mapRef.current = map
      window.setTimeout(() => active && map.invalidateSize({ animate: false }), 0)
      setStatus('Carte OpenStreetMap')
    }).catch(error => active && setStatus(error.message))
    return () => { active = false; mapRef.current?.remove(); mapRef.current = null }
  }, [state])
  useEffect(() => { mapRef.current?.getContainer().classList.toggle('mapSatelliteMode', mapMode === 'Satellite') }, [mapMode])
  return <><div ref={elementRef} className="installationOpenStreetMap" /><span className="installationLocationMapStatus">{status}</span></>
}
