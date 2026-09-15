export type InstallationConnection = 'online' | 'offline'

export type InstallationHeader = {
  id: string
  client: string
  site: string
  location: string
  lastData: string
  connectionLabel: string
  connection: InstallationConnection
}

export type InstallationBox = {
  id: string
  firmware: string
  serialNumber: string
  model: string
  registeredAt: string
  note: string
}

const installationHeaders: Record<string, InstallationHeader> = {
  'INS-00482': { id: 'INS-00482', client: 'Jean Kabeya', site: 'Maison individuelle', location: 'Gombe, Kinshasa', lastData: 'il y a 2 min', connectionLabel: 'Active', connection: 'online' },
  'INS-00841': { id: 'INS-00841', client: 'Kivu Market SARL', site: 'Commerce', location: 'Gombe, Kinshasa', lastData: 'il y a 2 min', connectionLabel: 'Active', connection: 'online' },
  'INS-00912': { id: 'INS-00912', client: 'Sarah Ilunga', site: 'Maison individuelle', location: 'Ngaliema, Kinshasa', lastData: 'il y a 3 min', connectionLabel: 'Hors ligne', connection: 'offline' },
  'INS-01024': { id: 'INS-01024', client: 'École La Source', site: 'École', location: 'Kintambo, Kinshasa', lastData: 'il y a plus de 24 h', connectionLabel: 'Hors ligne', connection: 'offline' },
  'INS-01108': { id: 'INS-01108', client: 'Martin Paluku', site: 'Maison individuelle', location: 'Limete, Kinshasa', lastData: 'il y a 4 h', connectionLabel: 'Active', connection: 'online' },
}

const fallbackHeader = installationHeaders['INS-00482']

export function getInstallationHeader(id: string): InstallationHeader {
  return installationHeaders[id] ?? { ...fallbackHeader, id }
}

const installationBoxes: Record<string, InstallationBox> = {
  'INS-00482': { id: 'DJB-00482', firmware: 'v2.3.1', serialNumber: 'SN2483928471', model: 'Djua Box v1', registeredAt: '12/03/2025', note: 'Boîtier installé sur le toit principal.' },
  'INS-00841': { id: 'DJB-00841', firmware: 'v2.3.1', serialNumber: 'SN2483928841', model: 'Djua Box v1', registeredAt: '03/06/2025', note: 'Boîtier installé dans le local technique.' },
  'INS-00912': { id: 'DJB-00912', firmware: 'v2.2.8', serialNumber: 'SN2483928912', model: 'Djua Box v1', registeredAt: '16/07/2025', note: 'Boîtier installé près du tableau électrique.' },
  'INS-01024': { id: 'DJB-01024', firmware: 'v2.3.0', serialNumber: 'SN2483929024', model: 'Djua Box v1', registeredAt: '05/08/2025', note: 'Boîtier installé dans le bureau de maintenance.' },
  'INS-01108': { id: 'DJB-01108', firmware: 'v2.3.1', serialNumber: 'SN2483929108', model: 'Djua Box v1', registeredAt: '20/08/2025', note: 'Boîtier installé sur le toit principal.' },
}

export function getInstallationBox(installationId: string): InstallationBox {
  return installationBoxes[installationId] ?? installationBoxes['INS-00482']
}
