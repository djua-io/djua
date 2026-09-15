import { useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  Battery,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock3,
  House,
  Lightbulb,
  MapPin,
  PanelTop,
  PlugZap,
  Radio,
  ShieldCheck,
  Signal,
  Sun,
  UserRound,
  Wrench,
} from 'lucide-react'
import './installation-integrity.css'

const components = [
  { icon: Sun, label: 'Panneaux solaires', expected: 'Connecté', current: 'Connecté', status: 'Connecté', detail: 'Production normale (358 W)' },
  { icon: Battery, label: 'Batterie', expected: 'Connecté', current: 'Connecté', status: 'Connecté', detail: 'En charge (25,4 V)' },
  { icon: Activity, label: 'Onduleur', expected: 'Connecté', current: 'Connecté', status: 'Actif', detail: 'Fonctionnement normal (221 V en sortie)' },
  { icon: PlugZap, label: 'Sortie AC / charge', expected: 'Connecté', current: 'Connecté', status: 'Actif', detail: 'Alimentation des charges (774 W)' },
  { icon: MapPin, label: 'GPS', expected: 'Connecté', current: 'Connecté', status: 'OK', detail: 'Position reçue (il y a 2 min)' },
  { icon: Signal, label: 'GSM', expected: 'Connecté', current: 'Connecté', status: 'OK', detail: 'Communication active (signal 4G)' },
]

const checks = [
  { icon: Sun, title: 'Solaire', values: [['42,6 V', 'Tension'], ['8,4 A', 'Courant'], ['358 W', 'Puissance']] },
  { icon: Battery, title: 'Batterie', values: [['25,4 V', 'Tension'], ['3,2 A', 'Courant'], ['En charge', 'État']] },
  { icon: Activity, title: 'Sortie AC', values: [['221 V', 'Tension'], ['3,5 A', 'Courant'], ['774 W', 'Puissance']] },
  { icon: MapPin, title: 'GPS', values: [['Position reçue', 'Position'], ['il y a 2 min', 'Dernière donnée']] },
  { icon: Signal, title: 'GSM', values: [['4G (bon signal)', 'Communication']] },
]

export function InstallationIntegrityPage() {
  const navigate = useNavigate()
  const { id = 'INS-00482' } = useParams()

  return <section className="workspacePage installationIntegrityPage">
    <header className="workspaceHeading installationIntegrityHeading">
      <div>
        <span><h1>Jean Kabeya</h1><b className="installationIntegrityOnline"><i />En ligne</b></span>
        <p>{id}<em>•</em>Maison individuelle<em>•</em>Gombe, Kinshasa<em>•</em>Dernière donnée reçue : il y a 2 min</p>
      </div>
      <div className="installationIntegrityActions">
        <button type="button"><CalendarDays size={17} />30 derniers jours<ChevronDown size={16} /></button>
        <button type="button" onClick={() => navigate('/interventions')}><Wrench size={16} />Créer une intervention</button>
      </div>
    </header>

    <nav className="installationTabs installationIntegrityTabs" aria-label="Navigation de l’installation">
      <button type="button" onClick={() => navigate(`/installations/${id}`)}>Vue d’ensemble</button>
      <button type="button">Énergie</button>
      <button type="button" className="active" aria-current="page">Intégrité du kit</button>
      <button type="button" onClick={() => navigate(`/installations/${id}/localisation`)}>Localisation</button>
      <button type="button">Alertes</button>
      <button type="button">Historique</button>
    </nav>

    <div className="installationIntegrityLayout">
      <div className="installationIntegrityMain" role="main">
        <section className="installationIntegrityMetrics" aria-label="État de l’intégrité du kit">
          <Metric icon={CheckCircle2} label="État du kit" value="Complet" note="Tous les composants présents et connectés" />
          <Metric icon={PanelTop} label="Composants requis" value="6 / 6 connectés" note="100 % des composants" />
          <Metric icon={Clock3} label="Dernière vérification" value="il y a 2 min" note="Vérification automatique" />
        </section>

        <section className="installationIntegrityComponents">
          <header><h2>État des composants requis</h2></header>
          <div className="installationIntegrityTable" role="table" aria-label="État des composants requis">
            <div className="installationIntegrityTableHead" role="row"><span>Composant</span><span>État attendu</span><span>État actuel</span><span>Statut</span><span>Détails</span><span /></div>
            {components.map(({ icon: Icon, label, expected, current, status, detail }) => <article role="row" key={label}>
              <span><i><Icon size={19} /></i><b>{label}</b></span><span>{expected}</span><span>{current}</span><span><em><i />{status}</em></span><span>{detail}</span><button type="button" aria-label={`Voir les détails de ${label}`}><ChevronRight size={18} /></button>
            </article>)}
          </div>
        </section>

        <section className="installationIntegrityTechnical">
          <header><h2>Vérifications techniques <small>Pour les techniciens</small></h2><button type="button">Voir plus de détails <ChevronDown size={16} /></button></header>
          <div>{checks.map(({ icon: Icon, title, values }) => <article key={title}><i><Icon size={18} /></i><span><b>{title}</b><div>{values.map(([value, label]) => <strong key={label}>{value}<small>{label}</small></strong>)}</div></span></article>)}</div>
          <footer><i><CircleCheck size={23} /></i><span><b>Aucune anomalie détectée</b><small>Aucune anomalie détectée sur l’intégrité du kit.</small></span></footer>
        </section>
      </div>

      <aside className="installationIntegrityRail">
        <section className="installationIntegritySummary"><h2>Résumé</h2><dl><dt><UserRound size={17} />Client</dt><dd>Jean Kabeya</dd><dt><PanelTop size={17} />Installation</dt><dd>{id}</dd><dt><House size={17} />Type</dt><dd>Maison individuelle</dd><dt><MapPin size={17} />Localisation</dt><dd>Gombe, Kinshasa</dd><dt><Activity size={17} />Statut global</dt><dd><b><i />En ligne</b></dd></dl></section>
        <section className="installationIntegritySimple"><h2>Lecture simple</h2><div><i><Sun size={26} /></i><span><b>Le kit est complet et fonctionne normalement</b><small>Tous les composants essentiels sont présents et connectés. L’installation communique correctement et ne présente pas d’anomalie sur son intégrité.</small></span></div></section>
        <section className="installationIntegrityAdvice"><i><Lightbulb size={26} /></i><span><h2>Interprétation Djua</h2><b>L’installation est structurellement complète.</b><p>Tous les éléments requis du kit sont détectés et connectés. L’installation dispose de ses 6 composants essentiels et communique normalement.</p></span></section>
      </aside>
    </div>
  </section>
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof CheckCircle2; label: string; value: string; note: string }) {
  return <article><i><Icon size={24} /></i><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article>
}
