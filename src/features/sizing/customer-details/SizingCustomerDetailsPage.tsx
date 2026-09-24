import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Phone, UserRound } from 'lucide-react'
import { Button, Page } from '../../../shared/ui'
import { browserStorage } from '../../../shared/lib/browser-storage'
import './customer-details.css'

type MapCoordinates = { lat: number; lng: number }

export type SizingCustomerContext = {
  firstName: string
  lastName: string
  phone: string
  address: string
  budget?: { amount: number; frequency: 'monthly' | 'total' }
  location: MapCoordinates
  locationLabel: string
}

export const SIZING_CUSTOMER_CONTEXT_KEY = 'djua-sizing-customer-context-v1'

let leafletPromise: Promise<any> | undefined

function loadLeaflet() {
  const existing = (window as Window & { L?: any }).L
  if (existing) return Promise.resolve(existing)
  if (leafletPromise) return leafletPromise
  if (!document.getElementById('leaflet-style')) {
    const stylesheet = document.createElement('link')
    stylesheet.id = 'leaflet-style'
    stylesheet.rel = 'stylesheet'
    stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(stylesheet)
  }
  leafletPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve((window as Window & { L?: any }).L)
    script.onerror = () => reject(new Error('La carte n’a pas pu être chargée.'))
    document.head.appendChild(script)
  })
  return leafletPromise
}

function LocationMap({ value, onChange }: { value: MapCoordinates; onChange: (point: MapCoordinates) => void }) {
  const elementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  const [status, setStatus] = useState('Chargement de la carte…')

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => {
    let active = true
    loadLeaflet().then(L => {
      if (!active || !elementRef.current) return
      const map = L.map(elementRef.current, { zoomControl: true }).setView([value.lat, value.lng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map)
      const marker = L.marker([value.lat, value.lng], { draggable: true, keyboard: true }).addTo(map)
      const select = (point: MapCoordinates) => onChangeRef.current({ lat: point.lat, lng: point.lng })
      map.on('click', (event: { latlng: MapCoordinates }) => select(event.latlng))
      marker.on('dragend', () => select(marker.getLatLng()))
      mapRef.current = map
      markerRef.current = marker
      setStatus('Cliquez sur la carte ou faites glisser le repère pour choisir le lieu exact.')
    }).catch(error => active && setStatus(error.message))
    return () => {
      active = false
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])
  useEffect(() => {
    markerRef.current?.setLatLng([value.lat, value.lng])
    mapRef.current?.panTo([value.lat, value.lng], { animate: true })
  }, [value.lat, value.lng])

  return <div className="sizingCustomerMap"><div className="openStreetMap" ref={elementRef} tabIndex={0} aria-label="Carte de localisation de l’installation" /><small>{status}</small></div>
}

/** Collects only the customer contact and exact installation point required before a quote is prepared. */
export function SizingCustomerDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const buildingFlow = new URLSearchParams(location.search).get('flow') === 'building'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [budget, setBudget] = useState('')
  const [budgetFrequency, setBudgetFrequency] = useState<'monthly' | 'total'>('monthly')
  const [point, setPoint] = useState<MapCoordinates>({ lat: -4.3276, lng: 15.3136 })

  const complete = Boolean(firstName.trim() && lastName.trim() && phone.trim())
  const backRoute = buildingFlow ? '/dimensionnements/nouveau/immeuble' : '/dimensionnements/nouveau/appareils'
  const installationLabel = buildingFlow ? 'Localisation du bâtiment' : 'Localisation de l’installation'
  const continueToRecommendation = () => {
    if (!complete) return
    const budgetAmount = Number(budget)
    const resolvedAddress = address.trim()
    browserStorage.set(SIZING_CUSTOMER_CONTEXT_KEY, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: resolvedAddress,
      ...(budgetAmount > 0 ? { budget: { amount: budgetAmount, frequency: budgetFrequency } } : {}),
      location: point,
      locationLabel: resolvedAddress || `Position sélectionnée : ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    })
    navigate(`/dimensionnements/nouveau/recommandation${buildingFlow ? '?flow=building' : ''}`)
  }

  return <Page className="sizingCustomerDetailsPage" title="Coordonnées du client" sub="Avant de préparer le devis, renseignez le contact du client et choisissez le lieu exact de l’installation.">
    <div className="sizingCustomerDetailsLayout">
      <section className="sizingCustomerDetailsCard">
        <header><span><h2>Client et lieu d’installation</h2><p>Ces informations seront reprises dans le devis et aideront l’équipe d’installation.</p></span></header>
        <section className="sizingCustomerContactSection" aria-labelledby="customer-contact-title">
          <h3 id="customer-contact-title"><UserRound size={19} />Contact du client</h3>
          <div className="sizingCustomerContactGrid">
            <label>Nom <em>*</em><input value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="family-name" /></label>
            <label>Postnom <em>*</em><input value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="given-name" /></label>
            <label>Numéro de téléphone <em>*</em><span className="sizingCustomerPhone"><Phone size={17} /><input value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Ex. : +243 81 234 5678" /></span></label>
            <label className="sizingCustomerBudgetField">Budget indicatif <small>facultatif</small><span className="sizingCustomerBudgetControl"><input value={budget} onChange={event => setBudget(event.target.value)} inputMode="decimal" type="number" min="0" placeholder="Ex. : 120" /><select aria-label="Type de budget" value={budgetFrequency} onChange={event => setBudgetFrequency(event.target.value as 'monthly' | 'total')}><option value="monthly">par mois</option><option value="total">au total</option></select><b>$</b></span><small>Montant que le client envisage de consacrer au système.</small></label>
          </div>
        </section>
        <section className="sizingCustomerLocationSection" aria-labelledby="customer-location-title">
          <header><span><h3 id="customer-location-title"><MapPin size={19} />{installationLabel}</h3><p>Placez le repère sur l’emplacement où le système sera installé.</p></span></header>
          <label className="sizingCustomerAddressField">Adresse ou repère <small>facultatif</small><input value={address} onChange={event => setAddress(event.target.value)} autoComplete="street-address" placeholder="Ex. : Avenue Kasa-Vubu, Gombe, Kinshasa" /><small>Ajoutez l’adresse, le quartier ou un point de repère pour faciliter l’intervention.</small></label>
          <LocationMap value={point} onChange={setPoint} />
          <p className="sizingCustomerCoordinates"><MapPin size={16} />Position sélectionnée : <b>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</b></p>
        </section>
        <footer><Button secondary onClick={() => navigate(backRoute)}><ArrowLeft size={17} />Retour aux besoins</Button><Button disabled={!complete} onClick={continueToRecommendation}>Voir la recommandation <ArrowRight size={18} /></Button></footer>
      </section>
      <aside className="sizingCustomerDetailsAside"><MapPin size={23} /><h2>Pourquoi localiser l’installation&nbsp;?</h2><p>Le point sur la carte permet de préparer l’intervention et de retrouver facilement le site lorsque le devis est accepté.</p></aside>
    </div>
  </Page>
}
