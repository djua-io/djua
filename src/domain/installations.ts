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
