export type Appliance = { id: string; name: string; category: string; watts: number; hours: number; quantity: number; period: 'Jour'|'Nuit'|'Les deux' }
export const seedAppliances: Appliance[] = [
  {id:'1',name:'Ampoule LED',category:'Éclairage',watts:10,hours:5,quantity:6,period:'Jour'},
  {id:'2',name:'Réfrigérateur',category:'Cuisine',watts:120,hours:12,quantity:1,period:'Les deux'},
  {id:'3',name:'Mixeur',category:'Cuisine',watts:500,hours:.2,quantity:1,period:'Jour'},
  {id:'4',name:'Télévision',category:'Multimédia',watts:120,hours:5,quantity:1,period:'Les deux'},
  {id:'5',name:'Décodeur',category:'Multimédia',watts:20,hours:5,quantity:1,period:'Les deux'},
  {id:'6',name:'Routeur Wi‑Fi',category:'Multimédia',watts:10,hours:24,quantity:1,period:'Les deux'},
  {id:'7',name:'Fer à repasser',category:'Autres',watts:1100,hours:1,quantity:1,period:'Jour'}
]
export const dailyWh=(a: Appliance)=>a.watts*a.hours*a.quantity
export const sizing=(items: Appliance[])=>{const daily=items.reduce((n,a)=>n+dailyWh(a),0);const peak=items.reduce((n,a)=>n+a.watts*a.quantity,0)*.24;const night=items.reduce((n,a)=>n+(a.period==='Nuit'?dailyWh(a):a.period==='Les deux'?dailyWh(a)*.62:0),0);return {daily,peak,night,panelCount:4,battery:5,inverter:3,production:9.5}}
