export type Appliance = { id: string; name: string; category: string; watts: number; hours: number; quantity: number; period: 'Jour'|'Nuit'|'Les deux'; slots?: {from:string;to:string}[]; brand?: string; detailLabel?: string; detail?: string; notes?: string; images?: string[] }

export type ApplianceVisualKey = 'bulb' | 'fridge' | 'blender' | 'tv' | 'decoder' | 'router' | 'fan' | 'microwave' | 'washer' | 'rice-cooker' | 'laptop' | 'iron' | 'cctv' | 'pump' | 'elevator' | 'gate' | 'safety-light'

export type ApplianceCatalogEntry = Pick<Appliance, 'name' | 'category' | 'watts'> & { visual: ApplianceVisualKey }

/** The appliance catalogue is shared by every sizing flow, including common building loads. */
export const applianceCatalog: ApplianceCatalogEntry[] = [
  { name: 'Télévision', category: 'Multimédia', watts: 120, visual: 'tv' },
  { name: 'Ampoule LED', category: 'Éclairage', watts: 10, visual: 'bulb' },
  { name: 'Réfrigérateur', category: 'Cuisine', watts: 120, visual: 'fridge' },
  { name: 'Mixeur', category: 'Cuisine', watts: 500, visual: 'blender' },
  { name: 'Décodeur', category: 'Multimédia', watts: 20, visual: 'decoder' },
  { name: 'Routeur Wi‑Fi', category: 'Multimédia', watts: 10, visual: 'router' },
  { name: 'Ventilateur', category: 'Autres', watts: 45, visual: 'fan' },
  { name: 'Micro-ondes', category: 'Cuisine', watts: 1000, visual: 'microwave' },
  { name: 'Lave-linge', category: 'Autres', watts: 500, visual: 'washer' },
  { name: 'Cuiseur de riz', category: 'Cuisine', watts: 700, visual: 'rice-cooker' },
  { name: 'Ordinateur portable', category: 'Multimédia', watts: 60, visual: 'laptop' },
  { name: 'Fer à repasser', category: 'Autres', watts: 1100, visual: 'iron' },
  { name: 'Caméras / CCTV', category: 'Sécurité', watts: 20, visual: 'cctv' },
  { name: 'Pompe à eau', category: 'Pompage', watts: 550, visual: 'pump' },
  { name: 'Ascenseur', category: 'Équipements communs', watts: 1500, visual: 'elevator' },
  { name: 'Ventilation commune', category: 'Équipements communs', watts: 45, visual: 'fan' },
  { name: 'Portail automatique', category: 'Équipements communs', watts: 180, visual: 'gate' },
  { name: 'Éclairage de sécurité', category: 'Éclairage', watts: 15, visual: 'safety-light' },
]

export const applianceByName = (name: string) => applianceCatalog.find(appliance => appliance.name === name)

export const applianceFromCatalog = (id: string, name: string, hours: number, quantity: number, period: Appliance['period']): Appliance => {
  const appliance = applianceByName(name)
  if (!appliance) throw new Error(`Unknown appliance: ${name}`)
  return { id, name, category: appliance.category, watts: appliance.watts, hours, quantity, period }
}

/** Initial common loads for a building. Consumers must clone this array before editing it. */
export const commonBuildingApplianceDefaults: Appliance[] = [
  applianceFromCatalog('building-common-lighting', 'Ampoule LED', 7, 12, 'Jour'),
  applianceFromCatalog('building-common-cctv', 'Caméras / CCTV', 6, 8, 'Les deux'),
  applianceFromCatalog('building-common-pump', 'Pompe à eau', 1.3, 2, 'Jour'),
]

export const copyCommonBuildingApplianceDefaults = () => commonBuildingApplianceDefaults.map(item => ({ ...item }))
export const seedAppliances: Appliance[] = [
  applianceFromCatalog('1', 'Ampoule LED', 5, 6, 'Jour'),
  applianceFromCatalog('2', 'Réfrigérateur', 12, 1, 'Les deux'),
  applianceFromCatalog('3', 'Mixeur', .2, 1, 'Jour'),
  applianceFromCatalog('4', 'Télévision', 5, 1, 'Les deux'),
  applianceFromCatalog('5', 'Décodeur', 5, 1, 'Les deux'),
  applianceFromCatalog('6', 'Routeur Wi‑Fi', 24, 1, 'Les deux'),
  applianceFromCatalog('7', 'Fer à repasser', 1, 1, 'Jour'),
  applianceFromCatalog('8', 'Ventilateur', 8, 1, 'Jour'),
  applianceFromCatalog('9', 'Micro-ondes', .2, 1, 'Jour'),
  applianceFromCatalog('10', 'Lave-linge', .75, 1, 'Jour'),
  applianceFromCatalog('11', 'Cuiseur de riz', 1, 1, 'Jour'),
  applianceFromCatalog('12', 'Ordinateur portable', 5, 1, 'Les deux')
]
export const dailyWh=(a: Appliance)=>a.watts*a.hours*a.quantity
export const sizing=(items: Appliance[])=>{const daily=items.reduce((n,a)=>n+dailyWh(a),0);const peak=items.reduce((n,a)=>n+a.watts*a.quantity,0)*.24;const night=items.reduce((n,a)=>n+(a.period==='Nuit'?dailyWh(a):a.period==='Les deux'?dailyWh(a)*.62:0),0);return {daily,peak,night,panelCount:4,battery:5,inverter:3,production:9.5}}
