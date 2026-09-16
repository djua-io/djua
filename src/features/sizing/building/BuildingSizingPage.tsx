import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Lightbulb, Minus, Plus, X } from 'lucide-react'
import { Appliance, commonBuildingAppliancesForFloors, sizing } from '../../../domain/sizing'
import { Button, Page } from '../../../shared/ui'
import { SizingEnergySummary } from '../energy-summary/SizingEnergySummary'
import buildingProfileComfort from '../../../assets/building-profile-comfort.png'
import buildingCounterFloors from '../../../assets/building-counter-floors.png'
import buildingCounterHomes from '../../../assets/building-counter-homes.png'
import buildingProfileEssential from '../../../assets/building-profile-essential.png'
import buildingProfileStandard from '../../../assets/building-profile-standard.png'
import { browserStorage } from '../../../shared/lib/browser-storage'
import { ApplianceVisual } from '../appliances/ApplianceVisual'
import './building-sizing.css'

type ProfileId = 'essential' | 'standard' | 'comfort'

const profiles: Array<{ id: ProfileId; title: string; description: string; image: string; dailyKwh: number; peakKw: number; color: 'orange' | 'yellow' | 'green' }> = [
  { id: 'essential', title: 'Essentiel', description: 'Le minimum pour les besoins de base', image: buildingProfileEssential, dailyKwh: .95, peakKw: .55, color: 'orange' },
  { id: 'standard', title: 'Standard', description: 'Un bon niveau de confort au quotidien', image: buildingProfileStandard, dailyKwh: 1.55, peakKw: .95, color: 'yellow' },
  { id: 'comfort', title: 'Confort', description: 'Plus d’équipements pour un meilleur confort', image: buildingProfileComfort, dailyKwh: 2.65, peakKw: 1.75, color: 'green' },
]

const commonBuildingAppliancesKey = 'djua-building-common-appliances-v2'
const commonEquipmentLabels: Record<string, string> = { 'Ampoule LED': 'Éclairage commun' }

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
  const [commonAppliances, setCommonAppliances] = useState<Appliance[]>(() => browserStorage.get(commonBuildingAppliancesKey, commonBuildingAppliancesForFloors(1)))
  const [commonEquipmentOpen, setCommonEquipmentOpen] = useState(false)
  useEffect(() => browserStorage.set(commonBuildingAppliancesKey, commonAppliances), [commonAppliances])
  const configuredHomes = Object.values(distribution).reduce((total, value) => total + value, 0)
  const difference = homes - configuredHomes
  const isComplete = difference === 0
  const energy = useMemo(() => {
    const housingDaily = profiles.reduce((total, profile) => total + distribution[profile.id] * profile.dailyKwh, 0)
    const housingPeak = profiles.reduce((total, profile) => total + distribution[profile.id] * profile.peakKw, 0)
    const commonSizing = sizing(commonAppliances)
    const commonDaily = commonSizing.daily / 1000
    const commonPeak = commonSizing.peak / 1000
    const daily = housingDaily + commonDaily
    const peak = housingPeak + commonPeak
    return { daily, peak, installed: peak * 1.28 }
  }, [commonAppliances, distribution])

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
  const updateFloors = (value: number) => {
    const nextFloors = clamp(value, 1)
    setFloors(nextFloors)
    setCommonAppliances(current => current.map(item => {
      if (item.id === 'building-common-lighting') return { ...item, quantity: nextFloors * 3 }
      if (item.id === 'building-common-cctv') return { ...item, quantity: nextFloors * 2 }
      return item
    }))
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
  const continueToRecommendation = () => {
    const housingLoads = profiles
      .filter(profile => distribution[profile.id] > 0)
      .map(profile => {
        const watts = Math.round((profile.peakKw * 1000) / .24)
        return {
          id: `building-profile-${profile.id}`,
          name: `Logement ${profile.title}`,
          category: 'Logement',
          watts,
          hours: Number((profile.dailyKwh * 1000 / watts).toFixed(2)),
          quantity: distribution[profile.id],
          period: 'Les deux' as const,
        }
      })
    browserStorage.set('djua-items', [...commonAppliances.map(item => ({ ...item })), ...housingLoads])
    browserStorage.set('djua-building-sizing-config', { floors, homes, sameProfile, singleProfile, distribution, commonAppliances })
    navigate('/dimensionnements/nouveau/coordonnees?flow=building')
  }
  return (
    <Page className="buildingSizingPage" title="Dimensionner un immeuble / une résidence" sub="Décrivez le bâtiment, les logements et les équipements partagés afin de préparer une recommandation simple à présenter au client.">
      <div className="buildingSizingLayout">
        <section className="buildingSizingCard" aria-labelledby="building-sizing-title">
          <h2 id="building-sizing-title">Décrivez le bâtiment</h2>

          <div className="buildingCounters">
            <Counter illustration={buildingCounterFloors} label="Nombre d’étages" value={floors} onChange={updateFloors} minimum={1} />
            <Counter illustration={buildingCounterHomes} label="Nombre de logements" value={homes} onChange={updateHomes} minimum={1} />
          </div>

          <section className="buildingCommonEquipment" aria-labelledby="common-equipment-title">
            <header>
              <span><h3 id="common-equipment-title">Équipements communs à couvrir</h3><p>{commonEquipmentOpen ? 'Ajoutez les usages partagés que le système doit alimenter, par exemple l’éclairage des communs, les caméras ou la pompe.' : `${plural(commonAppliances.length, 'équipement')} commun${commonAppliances.length > 1 ? 's' : ''} inclus dans l’estimation`}</p></span>
              <div className="buildingCommonEquipmentActions"><button type="button" className="buildingCommonEquipmentToggle" onClick={() => navigate('/dimensionnements/nouveau/appareils?scope=common')}><Plus size={17} />Gérer les équipements</button><button type="button" className="buildingCommonEquipmentCollapse" aria-expanded={commonEquipmentOpen} aria-label={commonEquipmentOpen ? 'Réduire les équipements communs' : 'Afficher les équipements communs'} onClick={() => setCommonEquipmentOpen(open => !open)}>{commonEquipmentOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button></div>
            </header>
            {commonEquipmentOpen && <div className="buildingCommonEquipmentBody"><div className="buildingCommonEquipmentSelected">{commonAppliances.map(item => <CommonEquipmentCard item={item} onRemove={() => setCommonAppliances(current => current.filter(candidate => candidate.id !== item.id))} key={item.id} />)}</div></div>}
          </section>

          <fieldset className="buildingProfileQuestion">
            <legend>Les logements ont-ils le même niveau d’équipement&nbsp;?</legend>
            <div>
              <label className={sameProfile ? 'selected' : ''}><input type="radio" name="building-profile-mode" checked={sameProfile} onChange={() => selectProfileMode(true)} /><span><b>Oui, un profil pour tous</b><small>Les logements ont des besoins comparables</small></span></label>
              <label className={!sameProfile ? 'selected' : ''}><input type="radio" name="building-profile-mode" checked={!sameProfile} onChange={() => selectProfileMode(false)} /><span><b>Non, plusieurs profils</b><small>Répartissez les logements selon leur niveau d’équipement</small></span></label>
            </div>
          </fieldset>

          {sameProfile ? <section className="buildingSingleProfile" aria-labelledby="single-profile-title">
            <div className="buildingSingleProfileHeading"><span><h3 id="single-profile-title">Quel profil représente le mieux les logements&nbsp;?</h3><p>Choisissez avec le client le niveau d’équipement le plus courant dans le bâtiment.</p></span></div>
            <div className="buildingSingleProfileChoices">
              {profiles.map(profile => <article aria-pressed={singleProfile === profile.id} className={singleProfile === profile.id ? 'selected' : ''} key={profile.id} onClick={() => selectSingleProfile(profile.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSingleProfile(profile.id) } }} role="button" tabIndex={0}><img src={profile.image} alt="" /><b>{profile.title}</b><small>{profile.description}</small><button type="button" className="buildingAdjustLink" onClick={event => { event.stopPropagation(); navigate(`/dimensionnements/nouveau/immeuble/profils/${profile.id}/appareils`) }}>Ajuster les équipements</button></article>)}
            </div>
            <aside><Lightbulb size={22} /><span>L’estimation appliquera le profil <b>{profiles.find(profile => profile.id === singleProfile)?.title}</b> aux {homes} logements.</span></aside>
          </section> : <>
            <section className="buildingProfiles">
              <h3>Répartissez les logements par profil</h3>
              <p>Avec le client, indiquez combien de logements correspondent à chaque niveau d’équipement.</p>
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
          <aside className="buildingSizingHint"><Lightbulb size={22} /><span>Djúa utilisera ces informations pour estimer les besoins du bâtiment et préparer une recommandation à partager avec le client.</span></aside>
          <footer><Button secondary onClick={() => navigate('/dimensionnements/nouveau')}><ArrowLeft size={17} />Changer de type de projet</Button><Button disabled={!isComplete} onClick={continueToRecommendation}>Continuer <ArrowRight size={18} /></Button></footer>
        </section>

        <SizingEnergySummary
          className="buildingEnergyRail"
          dailyConsumption={`${energy.daily.toFixed(1)} kWh`}
          installedPower={energy.installed.toFixed(1)}
          simultaneousPower={energy.peak.toFixed(1)}
          distributionTitle="Répartition des logements"
          distribution={profiles.map(profile => ({ label: profile.title, value: plural(distribution[profile.id], 'logement'), color: profile.color, weight: distribution[profile.id] }))}
          itemCount={{ label: 'Logements configurés', value: String(configuredHomes) }}
          advice={{ title: 'Estimation en direct', description: 'Ce résumé évolue avec le nombre de logements, leur profil et les équipements communs sélectionnés.' }}
        />
      </div>
    </Page>
  )
}

function CommonEquipmentCard({ item, onRemove }: { item: Appliance; onRemove: () => void }) {
  const label = commonEquipmentLabels[item.name] || item.name
  return <article className="buildingCommonEquipmentItem"><button type="button" className="buildingCommonEquipmentRemove" aria-label={`Retirer ${label}`} onClick={onRemove}><X size={15} /></button><ApplianceVisual name={item.name} variant="card" className="buildingCommonApplianceVisual" /><span><b>{label}</b><strong>× {item.quantity}</strong></span></article>
}

function Counter({ illustration, label, value, onChange, minimum }: { illustration: string; label: string; value: number; onChange: (value: number) => void; minimum: number }) {
  return <article><i><img src={illustration} alt="" /></i><span><b>{label}</b><small>{label === 'Nombre d’étages' ? 'Comptez les niveaux à alimenter' : 'Comptez les logements à couvrir'}</small><div className="buildingCounterControl"><button type="button" aria-label={`Diminuer ${label}`} onClick={() => onChange(clamp(value - 1, minimum))} disabled={value <= minimum}><Minus size={21} /></button><input aria-label={label} type="number" inputMode="numeric" min={minimum} max="99" value={value} onChange={event => onChange(clamp(Number(event.target.value), minimum))} /><button type="button" aria-label={`Augmenter ${label}`} onClick={() => onChange(clamp(value + 1, minimum))}><Plus size={22} /></button></div></span></article>
}
