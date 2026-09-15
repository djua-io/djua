export type Appliance = { id: string; name: string; category: string; watts: number; hours: number; quantity: number; period: 'Jour'|'Nuit'|'Les deux'; slots?: {from:string;to:string}[]; brand?: string; detailLabel?: string; detail?: string; notes?: string; images?: string[] }

export type ApplianceCatalogEntry = Pick<Appliance, 'name' | 'category' | 'watts'>

/** The appliance catalogue is shared by every sizing flow, including common building loads. */
export const applianceCatalog: ApplianceCatalogEntry[] = [
  { name: 'Télévision', category: 'Multimédia', watts: 120 },
  { name: 'Ampoule LED', category: 'Éclairage', watts: 10 },
  { name: 'Réfrigérateur', category: 'Cuisine', watts: 120 },
  { name: 'Mixeur', category: 'Cuisine', watts: 500 },
  { name: 'Décodeur', category: 'Multimédia', watts: 20 },
  { name: 'Routeur Wi‑Fi', category: 'Multimédia', watts: 10 },
  { name: 'Ventilateur', category: 'Autres', watts: 45 },
  { name: 'Micro-ondes', category: 'Cuisine', watts: 1000 },
  { name: 'Lave-linge', category: 'Autres', watts: 500 },
  { name: 'Cuiseur de riz', category: 'Cuisine', watts: 700 },
  { name: 'Ordinateur portable', category: 'Multimédia', watts: 60 },
  { name: 'Fer à repasser', category: 'Autres', watts: 1100 },
  { name: 'Caméras / CCTV', category: 'Sécurité', watts: 20 },
  { name: 'Pompe à eau', category: 'Pompage', watts: 550 },
  { name: 'Ascenseur', category: 'Équipements communs', watts: 1500 },
  { name: 'Ventilation commune', category: 'Équipements communs', watts: 45 },
  { name: 'Portail automatique', category: 'Équipements communs', watts: 180 },
  { name: 'Éclairage de sécurité', category: 'Éclairage', watts: 15 },
]

/** Initial common loads for a building. Consumers must clone this array before editing it. */
export const commonBuildingApplianceDefaults: Appliance[] = [
  { id: 'building-common-lighting', name: 'Ampoule LED', category: 'Éclairage', watts: 10, hours: 7, quantity: 12, period: 'Jour' },
  { id: 'building-common-cctv', name: 'Caméras / CCTV', category: 'Sécurité', watts: 20, hours: 6, quantity: 8, period: 'Les deux' },
  { id: 'building-common-pump', name: 'Pompe à eau', category: 'Pompage', watts: 550, hours: 1.3, quantity: 2, period: 'Jour' },
]

export const copyCommonBuildingApplianceDefaults = () => commonBuildingApplianceDefaults.map(item => ({ ...item }))
export const seedAppliances: Appliance[] = [
  {id:'1',name:'Ampoule LED',category:'Éclairage',watts:10,hours:5,quantity:6,period:'Jour'},
  {id:'2',name:'Réfrigérateur',category:'Cuisine',watts:120,hours:12,quantity:1,period:'Les deux'},
  {id:'3',name:'Mixeur',category:'Cuisine',watts:500,hours:.2,quantity:1,period:'Jour'},
  {id:'4',name:'Télévision',category:'Multimédia',watts:120,hours:5,quantity:1,period:'Les deux'},
  {id:'5',name:'Décodeur',category:'Multimédia',watts:20,hours:5,quantity:1,period:'Les deux'},
  {id:'6',name:'Routeur Wi‑Fi',category:'Multimédia',watts:10,hours:24,quantity:1,period:'Les deux'},
  {id:'7',name:'Fer à repasser',category:'Autres',watts:1100,hours:1,quantity:1,period:'Jour'},
  {id:'8',name:'Ventilateur',category:'Autres',watts:45,hours:8,quantity:1,period:'Jour'},
  {id:'9',name:'Micro-ondes',category:'Cuisine',watts:1000,hours:.2,quantity:1,period:'Jour'},
  {id:'10',name:'Lave-linge',category:'Autres',watts:500,hours:.75,quantity:1,period:'Jour'},
  {id:'11',name:'Cuiseur de riz',category:'Cuisine',watts:700,hours:1,quantity:1,period:'Jour'},
  {id:'12',name:'Ordinateur portable',category:'Multimédia',watts:60,hours:5,quantity:1,period:'Les deux'}
]
export const dailyWh=(a: Appliance)=>a.watts*a.hours*a.quantity
export const sizing=(items: Appliance[])=>{const daily=items.reduce((n,a)=>n+dailyWh(a),0);const peak=items.reduce((n,a)=>n+a.watts*a.quantity,0)*.24;const night=items.reduce((n,a)=>n+(a.period==='Nuit'?dailyWh(a):a.period==='Les deux'?dailyWh(a)*.62:0),0);return {daily,peak,night,panelCount:4,battery:5,inverter:3,production:9.5}}
