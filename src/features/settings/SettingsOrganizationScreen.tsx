import { useState, type ElementType } from 'react'
import { Building2, Info, Pencil, Settings } from 'lucide-react'
import './settings-organization.css'

type SettingsNavigationItem = [string, ElementType]

type SettingsOrganizationScreenProps = {
  navItems: SettingsNavigationItem[]
  section: string
  onSelect: (section: string) => void
}

const organisationDetails = [
  ['Adresse', 'Avenue du Haut Commandement, Gombe, Kinshasa, RDC'],
  ['Site web', 'https://www.orange.com'],
  ['Téléphone', '+243 81 23 45 678'],
  ['Adresse e-mail', 'contact@orange-energie.cd'],
] as const

export function SettingsOrganizationScreen({ navItems, section, onSelect }: SettingsOrganizationScreenProps) {
  const [editing, setEditing] = useState(false)
  const [language, setLanguage] = useState('Français')
  const [dateFormat, setDateFormat] = useState('31/08/2026')
  const [country, setCountry] = useState('République démocratique du Congo')
  const [timezone, setTimezone] = useState('Africa/Kinshasa (UTC+1)')

  return <section className="workspacePage settingsPage">
    <header><h1>Paramètres</h1><p>Gérez votre organisation, les utilisateurs et les règles de fonctionnement de Djua.</p></header>
    <div className="settingsLayout">
      <aside className="settingsNav"><small>ESPACE DE TRAVAIL</small><div className="settingsOrgMark"><i>OE</i><span><b>Orange Énergie</b><em>Organisation</em></span></div><nav>{navItems.map(([label, Icon]) => <button type="button" className={section === label ? 'active' : ''} onClick={() => onSelect(label)} key={label}><Icon size={19} />{label}</button>)}</nav></aside>
      <main className="settingsMain settingsOrganizationMain">
        <header><span><h2>Organisation</h2><p>Informations générales de votre espace de travail.</p></span><button type="button" className="workspacePrimaryAction" onClick={() => setEditing(value => !value)}><Pencil size={16} />{editing ? 'Enregistrer' : 'Modifier'}</button></header>
        <section className="settingsCard settingsOrganizationGeneral"><header><Building2 size={22} /><h3>Informations générales</h3></header><dl>
          <div><dt>Nom de l’organisation</dt><dd>{editing ? <input defaultValue="Orange Énergie" /> : 'Orange Énergie'}</dd></div>
          <div><dt>Pays</dt><dd>{editing ? <select value={country} onChange={event => setCountry(event.target.value)}><option>République démocratique du Congo</option></select> : country}</dd></div>
          <div><dt>Fuseau horaire</dt><dd>{editing ? <select value={timezone} onChange={event => setTimezone(event.target.value)}><option>Africa/Kinshasa (UTC+1)</option></select> : timezone}</dd></div>
          {organisationDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{editing ? <input type={label === 'Téléphone' ? 'tel' : label === 'Adresse e-mail' ? 'email' : undefined} defaultValue={value} /> : value}</dd></div>)}
        </dl></section>
        <section className="settingsCard settingsOrganizationPreferences"><header><Settings size={22} /><span><h3>Préférences de l’organisation</h3><p>Paramètres appliqués à tous les utilisateurs.</p></span></header><div><label>Langue de l’interface<select value={language} onChange={event => setLanguage(event.target.value)}><option>Français</option><option>English</option></select></label><label>Format de date<select value={dateFormat} onChange={event => setDateFormat(event.target.value)}><option>31/08/2026</option><option>08/31/2026</option></select></label></div><p><Info size={18} />Ces préférences s’appliquent à tous les utilisateurs de votre organisation.</p></section>
      </main>
      <aside className="settingsRail settingsOrganizationRail"><section><header><Info size={22} /><h3>Informations légales</h3></header><dl><dt>Raison sociale</dt><dd>Orange Énergie RDC</dd><dt>N° d’enregistrement</dt><dd>CD/KIN/RCCM/20-B-01234</dd><dt>N° d’identification fiscale</dt><dd>A1234567Z</dd></dl></section><section className="settingsAdvice"><Info size={24} /><span><h3>Conseil Djua</h3><p>Gardez les coordonnées de votre organisation à jour afin que les documents commerciaux restent exacts.</p></span></section></aside>
    </div>
  </section>
}
