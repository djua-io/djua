import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock3, Lightbulb, ListChecks, MapPin } from 'lucide-react'
import { Button, Page } from '../../../shared/ui'
import sizingProjectBusiness from '../../../assets/sizing-project-business.png'
import sizingProjectHouse from '../../../assets/sizing-project-house.png'
import sizingProjectResidence from '../../../assets/sizing-project-residence.png'
import './sizing-project-type.css'

type SizingProjectType = 'home' | 'residence' | 'business'

const projectTypes: Array<{
  id: SizingProjectType
  title: string
  description: string
  illustration: string
}> = [
  {
    id: 'home',
    title: 'Maison individuelle',
    description: 'Pour une maison ou une villa. Vous renseignerez les appareils du foyer et leurs horaires d’utilisation.',
    illustration: sizingProjectHouse,
  },
  {
    id: 'residence',
    title: 'Immeuble / résidence',
    description: 'Pour un bâtiment de plusieurs logements. Prévoyez les équipements communs et le nombre de logements.',
    illustration: sizingProjectResidence,
  },
  {
    id: 'business',
    title: 'Commerce / entreprise',
    description: 'Pour une boutique, un bureau ou une activité. Identifiez les équipements essentiels et les heures d’ouverture.',
    illustration: sizingProjectBusiness,
  },
]

const previewPoints = [
  {
    title: 'Les appareils à couvrir',
    description: 'Notez, même approximativement, les appareils que le client souhaite alimenter.',
    icon: ListChecks,
  },
  {
    title: 'Les habitudes d’utilisation',
    description: 'Demandez quand les appareils sont généralement utilisés, surtout le soir et la nuit.',
    icon: Clock3,
  },
  {
    title: 'Le lieu du projet',
    description: 'L’adresse ou le quartier aide à préparer une recommandation adaptée au site.',
    icon: MapPin,
  },
]

/** First step of a new sizing flow. The current appliance flow is reused for homes. */
export function SizingProjectTypePage() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<SizingProjectType>('home')
  const canContinue = selectedType !== 'business'

  const continueSizing = () => {
    navigate(selectedType === 'residence'
      ? '/dimensionnements/nouveau/immeuble'
      : '/dimensionnements/nouveau/appareils')
  }

  return (
    <Page
      className="sizingProjectTypePage"
      title="Préparer un nouveau devis"
      sub="Choisissez le projet du client : Djúa vous guidera ensuite pour recueillir les besoins et préparer une recommandation claire."
    >
      <div className="sizingProjectTypeLayout">
        <section className="sizingProjectTypeCard" aria-labelledby="sizing-project-type-title">
          <header>
            <h2 id="sizing-project-type-title">Quel projet souhaitez-vous dimensionner&nbsp;?</h2>
          </header>

          <div className="sizingProjectTypeChoices">
            {projectTypes.map(({ id, title, description, illustration }) => {
              const selected = selectedType === id

              return (
                <button
                  type="button"
                  className={selected ? 'selected' : ''}
                  aria-pressed={selected}
                  key={id}
                  onClick={() => setSelectedType(id)}
                >
                  <img className="sizingProjectTypeIllustration" src={illustration} alt="" />
                  <b>{title}</b>
                  <small>{description}</small>
                </button>
              )
            })}
          </div>

          <aside className="sizingProjectTypeHint">
            <Lightbulb size={22} />
            <span>
              <b>Djúa adaptera les questions à la situation du client.</b>
              <small>Commencez avec les informations disponibles : vous pourrez les compléter avec le client.</small>
            </span>
          </aside>

          {selectedType && !canContinue && (
            <p className="sizingProjectTypeUnavailable" role="status">
              Le parcours commerce sera bientôt disponible. Pour l’instant, vous pouvez préparer un devis pour une maison individuelle ou un immeuble / une résidence.
            </p>
          )}

          <footer>
            <Button secondary onClick={() => navigate('/devis')}>Annuler</Button>
            <Button disabled={!canContinue} onClick={continueSizing}>
              Continuer vers les besoins <ArrowRight size={18} />
            </Button>
          </footer>
        </section>

        <aside className="sizingProjectTypePreview" aria-label="Informations à préparer">
          <h2>Préparez l’échange avec le client</h2>
          {previewPoints.map(({ title, description, icon: Icon }) => (
            <article key={title}>
              <i><Icon size={22} /></i>
              <span><b>{title}</b><small>{description}</small></span>
            </article>
          ))}
        </aside>
      </div>
    </Page>
  )
}
