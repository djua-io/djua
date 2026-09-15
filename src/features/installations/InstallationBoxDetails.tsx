import { Battery, Copy, Cpu, MapPin, Signal, Sun, Zap } from 'lucide-react'
import { getInstallationBox, getInstallationHeader } from '../../domain/installations'
import './installation-box-details.css'

type InstallationBoxDetailsProps = {
  installationId: string
}

export function InstallationBoxDetails({ installationId }: InstallationBoxDetailsProps) {
  const installation = getInstallationHeader(installationId)
  const box = getInstallationBox(installationId)
  const isOffline = installation.connection === 'offline'
  const sensors = [
    [Sun, 'Entrée panneaux', isOffline ? 'Données indisponibles' : 'Fonctionnelle'],
    [Battery, 'Entrée batterie', installationId === 'INS-00841' ? 'À vérifier' : isOffline ? 'Données indisponibles' : 'Fonctionnelle'],
    [Zap, 'Capteur AC', isOffline ? 'Données indisponibles' : 'Fonctionnel'],
    [MapPin, 'GPS', isOffline ? 'Dernière position connue' : 'Position valide'],
    [Signal, 'GSM', isOffline ? 'Hors ligne' : 'Connecté (4G)'],
  ] as const

  return <section className="installationCard installationBoxDetails" aria-labelledby="installation-box-title">
    <header>
      <span><i><Cpu size={20} /></i><span><h2 id="installation-box-title">Boîtier Djua</h2><p>Boîtier associé à cette installation.</p></span></span>
      <b className={isOffline ? 'offline' : 'online'}><i />{isOffline ? 'Hors ligne' : 'Actif'}</b>
    </header>
    <div className="installationBoxDetailGrid">
      <dl>
        <dt>ID du boîtier</dt><dd>{box.id}<button type="button" aria-label={`Copier l’identifiant ${box.id}`}><Copy size={14} /></button></dd>
        <dt>Modèle</dt><dd>{box.model}</dd>
        <dt>Version du firmware</dt><dd>{box.firmware}</dd>
        <dt>Numéro de série</dt><dd>{box.serialNumber}</dd>
        <dt>Date d’enregistrement</dt><dd>{box.registeredAt}</dd>
        <dt>Emplacement</dt><dd>{box.note}</dd>
      </dl>
      <section className="installationBoxSensors" aria-label="Capteurs et connectivité">
        <h3>Capteurs et connectivité</h3>
        <p>État des signaux envoyés par le boîtier.</p>
        {sensors.map(([Icon, label, value]) => <span key={label}><Icon size={17} /><b>{label}</b><em className={value === 'À vérifier' || value === 'Hors ligne' ? 'warning' : ''}><i />{value}</em></span>)}
      </section>
    </div>
  </section>
}
