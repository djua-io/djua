import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Droplets, Lightbulb, Minus, Plus, Settings, X } from 'lucide-react'
import { Button, Page } from '../../../shared/ui'
import { SizingEnergySummary } from '../energy-summary/SizingEnergySummary'
import buildingProfileComfort from '../../../assets/building-profile-comfort.png'
import buildingCounterFloors from '../../../assets/building-counter-floors.png'
import buildingCounterHomes from '../../../assets/building-counter-homes.png'
import buildingProfileEssential from '../../../assets/building-profile-essential.png'
import buildingProfileStandard from '../../../assets/building-profile-standard.png'
import './building-sizing.css'

type ProfileId = 'essential' | 'standard' | 'comfort'
type CommonEquipmentId = 'lighting' | 'cctv' | 'pump' | 'elevator' | 'ventilation' | 'gate'

const profiles: Array<{ id: ProfileId; title: string; description: string; image: string; dailyKwh: number; peakKw: number; color: 'orange' | 'yellow' | 'green' }> = [
  { id: 'essential', title: 'Essentiel', description: 'Le minimum pour les besoins de base', image: buildingProfileEssential, dailyKwh: .95, peakKw: .55, color: 'orange' },
  { id: 'standard', title: 'Standard', description: 'Un bon niveau de confort au quotidien', image: buildingProfileStandard, dailyKwh: 1.55, peakKw: .95, color: 'yellow' },
  { id: 'comfort', title: 'Confort', description: 'Plus d’équipements pour un meilleur confort', image: buildingProfileComfort, dailyKwh: 2.65, peakKw: 1.75, color: 'green' },
]

const commonEquipment: Array<{ id: CommonEquipmentId; title: string; unit: string; icon: typeof Lightbulb; dailyKwh: number; peakKw: number }> = [
  { id: 'lighting', title: 'Éclairage commun', unit: 'point lumineux', icon: Lightbulb, dailyKwh: .07, peakKw: .012 },
  { id: 'cctv', title: 'Caméras / CCTV', unit: 'caméra', icon: Camera, dailyKwh: .12, peakKw: .02 },
  { id: 'pump', title: 'Pompe à eau', unit: 'pompe', icon: Droplets, dailyKwh: .7, peakKw: .55 },
  { id: 'elevator', title: 'Ascenseur', unit: 'ascenseur', icon: Settings, dailyKwh: 1.2, peakKw: 1.5 },
  { id: 'ventilation', title: 'Ventilation commune', unit: 'ventilateur', icon: Settings, dailyKwh: .18, peakKw: .04 },
  { id: 'gate', title: 'Portail automatique', unit: 'portail', icon: Settings, dailyKwh: .08, peakKw: .18 },
]

const clamp = (value: number, minimum: number, maximum = 99) => Math.min(maximum, Math.max(minimum, value))
const plural = (value: number, singular: string) => `${value} ${singular}${value === 1 ? '' : 's'}`

/** Collects the building configuration before appliance-level sizing begins. */
export function BuildingSizingPage() {
  const navigate = useNavigate()
  const [floors, setFloors] = useState(1)
  const [homes, setHomes] = useState(2)
  const [sameProfile, setSameProfile] = useState(false)
  const [singleProfile, setSingleProfile] = useState<ProfileId>('standard')
  const [distribution, setDistribution] = useState<Record<ProfileId, number>>({ essential: 0, standard: 2, comfort: 0 })
  const [commonEquipmentOpen, setCommonEquipmentOpen] = useState(false)
  const [commonEquipmentPickerOpen, setCommonEquipmentPickerOpen] = useState(false)
  const [commonEquipmentQuantities, setCommonEquipmentQuantities] = useState<Record<CommonEquipmentId, number>>({ lighting: 12, cctv: 8, pump: 2, elevator: 0, ventilation: 0, gate: 0 })
  const configuredHomes = Object.values(distribution).reduce((total, value) => total + value, 0)
  const difference = homes - configuredHomes
  const isComplete = difference === 0
  const energy = useMemo(() => {
    const housingDaily = profiles.reduce((total, profile) => total + distribution[profile.id] * profile.dailyKwh, 0)
    const housingPeak = profiles.reduce((total, profile) => total + distribution[profile.id] * profile.peakKw, 0)
    const commonDaily = commonEquipment.reduce((total, item) => total + commonEquipmentQuantities[item.id] * item.dailyKwh, 0)
    const commonPeak = commonEquipment.reduce((total, item) => total + commonEquipmentQuantities[item.id] * item.peakKw, 0)
    const daily = housingDaily + commonDaily
    const peak = housingPeak + commonPeak
    return { daily, peak, installed: peak * 1.28 }
  }, [commonEquipmentQuantities, distribution])

  const updateHomes = (value: number) => {
    const nextHomes = clamp(value, 1)
    setHomes(nextHomes)
    if (sameProfile) setDistribution({ essential: 0, standard: 0, comfort: 0, [singleProfile]: nextHomes })
    else setDistribution(current => {
      const essential = Math.min(current.essential, nextHomes)
      const comfort = Math.min(current.comfort, Math.max(0, nextHomes - essential))
      return { essential, comfort, standard: nextHomes - essential - comfort }
    })
  }
  const updateDistribution = (profile: Exclude<ProfileId, 'standard'>, value: number) => setDistribution(current => {
    const maximum = homes - current[profile === 'essential' ? 'comfort' : 'essential']
    const nextValue = clamp(value, 0, maximum)
    const next = { ...current, [profile]: nextValue }
    return { ...next, standard: homes - next.essential - next.comfort }
  })
  const adjustDistribution = (profile: Exclude<ProfileId, 'standard'>, amount: number) => updateDistribution(profile, distribution[profile] + amount)
  const selectProfileMode = (value: boolean) => {
    setSameProfile(value)
    if (value) setDistribution({ essential: 0, standard: 0, comfort: 0, [singleProfile]: homes })
    else setDistribution({ essential: 0, standard: homes, comfort: 0 })
  }
  const selectSingleProfile = (profile: ProfileId) => {
    setSingleProfile(profile)
    setDistribution({ essential: 0, standard: 0, comfort: 0, [profile]: homes })
  }
  const statusCopy = difference === 0
    ? 'Répartition complète'
    : difference > 0
      ? `Il manque ${plural(difference, 'logement')}`
      : `Excédent de ${plural(Math.abs(difference), 'logement')}`
  const selectedCommonEquipment = commonEquipment.filter(item => commonEquipmentQuantities[item.id] > 0)
  const updateCommonEquipment = (id: CommonEquipmentId, quantity: number) => setCommonEquipmentQuantities(current => ({ ...current, [id]: clamp(quantity, 0) }))

  return (
    <Page className="buildingSizingPage" title="Nouveau dimensionnement" sub="Répondez à quelques questions simples pour recommander un kit solaire.">
      <div className="buildingSizingLayout">
        <section className="buildingSizingCard" aria-labelledby="building-sizing-title">
          <h2 id="building-sizing-title">Parlez-nous du bâtiment</h2>

          <div className="buildingCounters">
            <Counter illustration={buildingCounterFloors} label="Nombre d’étages" value={floors} onChange={setFloors} minimum={1} />
            <Counter illustration={buildingCounterHomes} label="Nombre de logements" value={homes} onChange={updateHomes} minimum={1} />
          </div>

          <section className={`buildingCommonEquipment ${commonEquipmentOpen ? 'expanded' : 'collapsed'}`} aria-labelledby="common-equipment-title">
            <header>
              <i><Settings size={23} /></i><span><h3 id="common-equipment-title">Quels équipements communs faut-il aussi alimenter&nbsp;?</h3><p>Sélectionnez les éléments présents dans le bâtiment (plusieurs choix possibles).</p>{!commonEquipmentOpen && <small>{selectedCommonEquipment.length} éléments sélectionnés</small>}</span>
              <button type="button" className="buildingCommonEquipmentToggle" onClick={() => { setCommonEquipmentOpen(open => !open); setCommonEquipmentPickerOpen(false) }}><Plus size={17} />Ajouter des éléments{commonEquipmentOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
            </header>
            {commonEquipmentOpen && <div className="buildingCommonEquipmentBody"><div className="buildingCommonEquipmentSelected">{selectedCommonEquipment.map(item => <CommonEquipmentCard item={item} quantity={commonEquipmentQuantities[item.id]} onChange={value => updateCommonEquipment(item.id, value)} onRemove={() => updateCommonEquipment(item.id, 0)} key={item.id} />)}<button type="button" className="buildingCommonEquipmentAdd" onClick={() => setCommonEquipmentPickerOpen(open => !open)}><Plus size={24} /><b>Ajouter un élément</b><small>Éclairage, caméras, pompe, ascenseur, etc.</small></button></div>{commonEquipmentPickerOpen && <div className="buildingCommonEquipmentPicker" role="group" aria-label="Ajouter un équipement commun">{commonEquipment.filter(item => commonEquipmentQuantities[item.id] === 0).map(item => { const Icon = item.icon; return <button type="button" onClick={() => { updateCommonEquipment(item.id, 1); setCommonEquipmentPickerOpen(false) }} key={item.id}><Icon size={17} />{item.title}</button> })}</div>}</div>}
          </section>

          <fieldset className="buildingProfileQuestion">
            <legend>Les logements sont-ils tous similaires&nbsp;?</legend>
            <div>
              <label className={sameProfile ? 'selected' : ''}><input type="radio" name="building-profile-mode" checked={sameProfile} onChange={() => selectProfileMode(true)} /><span><b>Oui, même profil pour tous</b><small>Un seul type de logement dans le bâtiment</small></span></label>
              <label className={!sameProfile ? 'selected' : ''}><input type="radio" name="building-profile-mode" checked={!sameProfile} onChange={() => selectProfileMode(false)} /><span><b>Non, plusieurs profils</b><small>Différents types de logements dans le bâtiment</small></span></label>
            </div>
          </fieldset>

          {sameProfile ? <section className="buildingSingleProfile" aria-labelledby="single-profile-title">
            <div className="buildingSingleProfileHeading"><span><h3 id="single-profile-title">Quel profil correspond le mieux aux logements&nbsp;?</h3><p>Choisissez le niveau d’équipement le plus représentatif.</p></span></div>
            <div className="buildingSingleProfileChoices">
              {profiles.map(profile => <article aria-pressed={singleProfile === profile.id} className={singleProfile === profile.id ? 'selected' : ''} key={profile.id} onClick={() => selectSingleProfile(profile.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSingleProfile(profile.id) } }} role="button" tabIndex={0}><img src={profile.image} alt="" /><b>{profile.title}</b><small>{profile.description}</small><button type="button" className="buildingAdjustLink" onClick={event => { event.stopPropagation(); navigate(`/dimensionnements/nouveau/immeuble/profils/${profile.id}/appareils`) }}>Ajuster les équipements</button></article>)}
            </div>
            <aside><Lightbulb size={22} /><span>Tous les {homes} logements seront configurés avec le profil <b>{profiles.find(profile => profile.id === singleProfile)?.title}</b>.</span></aside>
          </section> : <>
            <section className="buildingProfiles">
              <h3>Répartition des logements</h3>
              <p>Indiquez combien de logements correspondent à chaque profil.</p>
              <div className="buildingProfileGrid">
                {profiles.map(profile => {
                  const isStandard = profile.id === 'standard'
                  const adjustableProfile = profile.id as Exclude<ProfileId, 'standard'>
                  const maximum = isStandard ? homes : homes - distribution[profile.id === 'essential' ? 'comfort' : 'essential']
                  return <article key={profile.id}>
                  <img src={profile.image} alt="" />
                  <b>{profile.title}</b><small>{profile.description}</small>
                  <div className="buildingCounterControl"><button type="button" aria-label={`Retirer un logement ${profile.title}`} onClick={() => !isStandard && adjustDistribution(adjustableProfile, -1)} disabled={isStandard || distribution[profile.id] === 0}><Minus size={18} /></button><input aria-label={`Nombre de logements ${profile.title}`} type="number" inputMode="numeric" min="0" max={maximum} value={distribution[profile.id]} readOnly={isStandard} onChange={event => !isStandard && updateDistribution(adjustableProfile, Number(event.target.value))} /><button type="button" aria-label={`Ajouter un logement ${profile.title}`} onClick={() => !isStandard && adjustDistribution(adjustableProfile, 1)} disabled={isStandard || distribution[profile.id] >= maximum}><Plus size={19} /></button></div>
                  <button type="button" className="buildingAdjustLink" onClick={() => navigate(`/dimensionnements/nouveau/immeuble/profils/${profile.id}/appareils`)}>Ajuster les équipements</button>
                </article>
                })}
              </div>
            </section>
            <div className={`buildingConfigurationStatus ${isComplete ? 'complete' : 'incomplete'}`} role="status">{isComplete ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}<span>Total configuré : <b>{configuredHomes} / {homes} logements</b></span><strong>{statusCopy}</strong></div>
          </>}
          <aside className="buildingSizingHint"><Lightbulb size={22} /><span>Djúa utilisera cette répartition pour estimer les besoins de l’ensemble du bâtiment.</span></aside>
          <footer><Button secondary onClick={() => navigate('/dimensionnements/nouveau')}><ArrowLeft size={17} />Retour</Button><Button disabled={!isComplete} onClick={() => navigate('/dimensionnements/nouveau/appareils')}>Continuer <ArrowRight size={18} /></Button></footer>
        </section>

        <SizingEnergySummary
          className="buildingEnergyRail"
          dailyConsumption={`${energy.daily.toFixed(1)} kWh`}
          installedPower={energy.installed.toFixed(1)}
          simultaneousPower={energy.peak.toFixed(1)}
          distributionTitle="Répartition des logements"
          distribution={profiles.map(profile => ({ label: profile.title, value: plural(distribution[profile.id], 'logement'), color: profile.color, weight: distribution[profile.id] }))}
          itemCount={{ label: 'Logements configurés', value: String(configuredHomes) }}
          advice={{ title: 'Estimation évolutive', description: 'Le résumé se met à jour selon le nombre de logements et leur niveau d’équipement.' }}
        />
      </div>
    </Page>
  )
}

function CommonEquipmentCard({ item, quantity, onChange, onRemove }: { item: typeof commonEquipment[number]; quantity: number; onChange: (value: number) => void; onRemove: () => void }) {
  const Icon = item.icon
  return <article className="buildingCommonEquipmentItem"><button type="button" className="buildingCommonEquipmentRemove" aria-label={`Retirer ${item.title}`} onClick={onRemove}><X size={15} /></button><i><Icon size={27} /></i><span><b>{item.title}</b><div><button type="button" aria-label={`Retirer un ${item.unit}`} onClick={() => onChange(quantity - 1)}><Minus size={14} /></button><strong>× {quantity}</strong><button type="button" aria-label={`Ajouter un ${item.unit}`} onClick={() => onChange(quantity + 1)}><Plus size={14} /></button></div></span></article>
}

function Counter({ illustration, label, value, onChange, minimum }: { illustration: string; label: string; value: number; onChange: (value: number) => void; minimum: number }) {
  return <article><i><img src={illustration} alt="" /></i><span><b>{label}</b><small>Ajustez selon le projet</small><div className="buildingCounterControl"><button type="button" aria-label={`Diminuer ${label}`} onClick={() => onChange(clamp(value - 1, minimum))} disabled={value <= minimum}><Minus size={21} /></button><input aria-label={label} type="number" inputMode="numeric" min={minimum} max="99" value={value} onChange={event => onChange(clamp(Number(event.target.value), minimum))} /><button type="button" aria-label={`Augmenter ${label}`} onClick={() => onChange(clamp(value + 1, minimum))}><Plus size={22} /></button></div></span></article>
}
