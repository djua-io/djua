import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams} from 'react-router-dom'
import * as I from 'lucide-react'
import {Appliance, dailyWh, sizing} from './domain/sizing'
import {plans} from './domain/financing'
import solarKit from './assets/solar-kit.png'
import applianceSprite from './assets/appliance-sprite.png'
import solarPanelsProduct from './assets/solar-panels-product.png'
import batteryProduct from './assets/battery-product.png'
import inverterProduct from './assets/inverter-product.png'
import installationServiceKit from './assets/installation-service-kit.png'
import solarCableKit from './assets/solar-cable-kit.png'
import solarMountingKit from './assets/solar-mounting-kit.png'
import siteCommerce from './assets/site-commerce.png'
import siteOffice from './assets/site-office.png'
import siteWorkshop from './assets/site-workshop.png'
import siteSchool from './assets/site-school.png'
import './styles.css'
import './form-fixes.css'

type Status='Brouillon'|'Finalisé'|'Partagé'|'Accepté'|'Refusé'|'Expiré'
type Quote={status:Status,payment:'cash'|'plan',plan:number,activities:string[]}
type SizingProject={customerName:string;locationName:string;locationType:string;city:string;address:string;company:boolean}
const store={get:<T,>(k:string,d:T):T=>{try{return JSON.parse(localStorage.getItem(k)||'') as T}catch{return d}},set:(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v))}
const projectKey=(id?:string)=>`djua-project-${id||'jean'}`
const defaultProject=(id?:string):SizingProject=>id==='kivu'?{customerName:'Kivu Market SARL',locationName:'Kivu Market — Gombe',locationType:'Commerce',city:'Kinshasa, RDC',address:'Avenue des Huileries, Gombe',company:true}:{customerName:'Jean Kabeya',locationName:'Maison de Jean Kabeya',locationType:'Maison individuelle',city:'Kinshasa, RDC',address:'Avenue de la Révolution, Gombe',company:false}
type QuoteDirectoryEntry={id:string;date:string;client:string;type:string;city:string;address:string;phone:string;email:string;amount:number;payment:string;monthly:string;status:Status;action:string;actionCopy:string;tone:string}
const quoteDirectory:Record<string,QuoteDirectoryEntry>={
  'OE-2026-00847':{id:'OE-2026-00847',date:'28 août 2026',client:'Jean Kabeya',type:'Maison individuelle',city:'Kinshasa, RDC',address:'Avenue de la Révolution, Gombe',phone:'+243 81 234 5678',email:'jean.kabeya@email.com',amount:3480,payment:'24 mois',monthly:'145 $ / mois',status:'Partagé',action:'Relancer aujourd’hui',actionCopy:'Sans réponse depuis 4 jours',tone:'urgent'},
  'OE-2026-00851':{id:'OE-2026-00851',date:'29 août 2026',client:'Kivu Market SARL',type:'Entreprise',city:'Kinshasa, RDC',address:'Avenue des Huileries, Gombe',phone:'+243 89 443 2109',email:'contact@kivumarket.cd',amount:8750,payment:'Comptant',monthly:'Paiement unique',status:'Partagé',action:'Relance e-mail prévue',actionCopy:'Réponse attendue aujourd’hui',tone:'urgent'},
  'OE-2026-00852':{id:'OE-2026-00852',date:'30 août 2026',client:'Sarah Ilunga',type:'Maison individuelle',city:'Kinshasa, RDC',address:'Quartier Ma Campagne, Kinshasa',phone:'+243 82 510 7732',email:'sarah.ilunga@email.com',amount:2150,payment:'Comptant',monthly:'Paiement unique',status:'Brouillon',action:'Terminer le devis',actionCopy:'À finaliser avant envoi',tone:''},
  'OE-2026-00839':{id:'OE-2026-00839',date:'25 août 2026',client:'Martin Paluku',type:'Maison individuelle',city:'Kinshasa, RDC',address:'Avenue Nguma, Gombe',phone:'+243 99 102 4456',email:'martin.paluku@email.com',amount:4200,payment:'24 mois',monthly:'175 $ / mois',status:'Accepté',action:'Créer le dossier',actionCopy:'Passer à l’installation',tone:'urgent'},
  'OE-2026-00838':{id:'OE-2026-00838',date:'22 août 2026',client:'Clinique Bondeko',type:'Entreprise',city:'Kinshasa, RDC',address:'Boulevard du 30 Juin, Kinshasa',phone:'+243 81 660 2388',email:'contact@cliniquebondeko.cd',amount:6300,payment:'24 mois',monthly:'263 $ / mois',status:'Finalisé',action:'Envoyer au client',actionCopy:'Prêt à être partagé',tone:''}
  ,'OE-2026-00833':{id:'OE-2026-00833',date:'21 août 2026',client:'Patrick Mbuyi',type:'Maison individuelle',city:'Kinshasa, RDC',address:'Avenue Kasa-Vubu, Lingwala',phone:'+243 82 340 1902',email:'patrick.mbuyi@email.com',amount:5600,payment:'Comptant',monthly:'Paiement unique',status:'Refusé',action:'Archiver le devis',actionCopy:'Refus confirmé le 21 août',tone:''}
  ,'OE-2026-00824':{id:'OE-2026-00824',date:'18 août 2026',client:'École Horizon',type:'Établissement scolaire',city:'Kinshasa, RDC',address:'Avenue de la Paix, Ngaliema',phone:'+243 85 774 0123',email:'direction@ecolehorizon.cd',amount:3900,payment:'24 mois',monthly:'163 $ / mois',status:'Expiré',action:'Renouveler le devis',actionCopy:'Validité expirée le 18 août',tone:''}
}
const names:Record<string,React.ElementType>={"Tableau de bord":I.LayoutDashboard,"Clients":I.UsersRound,"Devis":I.Calculator,"Parc solaire":I.SolarPanel,"Interventions":I.Wrench,"Produits":I.Lightbulb,"Rapports":I.Image,"Paramètres":I.Settings}
const nav=[['Tableau de bord','/dashboard'],['Devis','/devis'],['Parc solaire','/installations'],['Produits','/produits'],['Rapports','/rapports'],['Paramètres','/parametres']]
function Layout({children}:{children:React.ReactNode}){
  const {pathname}=useLocation();
  const navigate=useNavigate();
  const isSizingFlow=pathname.startsWith('/dimensionnements/');
  const sizingId=pathname.split('/')[2]||'jean';
  const isRecommendation=pathname.endsWith('/recommandation');
  const project={...defaultProject(sizingId),...store.get<SizingProject>(projectKey(sizingId),{} as SizingProject)};
  const goBack=()=>{if(!isSizingFlow){navigate(-1);return}if(pathname.endsWith('/appareils')){navigate(`/dimensionnements/${sizingId}/${sizingId==='kivu'?'site':'logement'}`);return}if(pathname.endsWith('/recommandation')){navigate(`/dimensionnements/${sizingId}/appareils`);return}if(pathname.endsWith('/site')||pathname.endsWith('/logement')){navigate('/dimensionnements/nouveau/client');return}navigate('/devis')};
  const isQuoteList=pathname==='/devis';
  const isQuoteDetail=/^\/devis\/[^/]+$/.test(pathname);
  const isInstallationDetail=/^\/installations\/[^/]+$/.test(pathname);
  const isProductCreate=pathname==='/produits/nouveau';
  const isProductDetail=/^\/produits\/[^/]+$/.test(pathname)&&!isProductCreate;
  return <div className="shell"><aside><Link to="/dashboard" className="brand shopBrand"><i>S</i><span>Shop Victoire</span></Link><Link to="/dimensionnements/nouveau/client" className="newQuote"><I.Plus size={17}/> Nouveau devis <I.ChevronDown size={16}/></Link><nav>{nav.map(([n,p])=>{const Icon=names[n];return <NavLink to={p} key={p} className={({isActive})=>isActive?'active':''}><Icon size={18}/>{n}</NavLink>})}</nav><div className="sidebarFooter"><button type="button" className="profile" aria-label="Compte de Chris M."><span className="avatar"><I.UserRound size={18}/></span><span><b>Chris M.</b><small>Commercial</small></span><I.ChevronDown size={16}/></button><button type="button" className="help"><I.CircleHelp size={18}/><span><b>Besoin d’aide ?</b><small>Consultez notre centre d’aide</small></span></button></div></aside><main><header className={'quotesHeader '+(isRecommendation?'recommendationHeader':'')}>{isInstallationDetail?<button className="plain installationBackHeader" onClick={()=>navigate('/installations')}><I.ArrowLeft size={19}/><span>Retour au parc</span></button>:isProductCreate||isProductDetail?<button className="plain installationBackHeader" onClick={()=>navigate('/produits')}><I.ArrowLeft size={19}/><span>Retour au catalogue</span></button>:(isSizingFlow&&!isQuoteList)||isQuoteDetail?<button className="plain headerBack" aria-label={isQuoteDetail?'Retour à la liste des devis':'Retour'} onClick={isQuoteDetail?()=>navigate('/devis'):goBack}><I.ArrowLeft size={19}/></button>:null}{isSizingFlow&&!isRecommendation&&<Badge text="Brouillon"/>}<span className="spacer"/><label className="globalSearch"><I.Search size={17}/><input placeholder="Rechercher un client, un devis…"/><kbd>⌘ K</kbd></label><button className="headerBell" aria-label="Notifications"><I.Bell size={19}/><i/></button></header>{children}</main></div>
}
function Button({children,onClick,secondary=false,disabled=false}:{children:React.ReactNode,onClick?:()=>void,secondary?:boolean,disabled?:boolean}){return <button type={onClick?'button':undefined} disabled={disabled} onClick={onClick} className={secondary?'button secondary':'button'}>{children}</button>}
type ExportFormat='pdf'|'excel'|'csv'
const csvCell=(value:string)=>`"${value.replace(/"/g,'""')}"`
function downloadFile(filename:string,content:string,type:string){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),0)}
function downloadPdf(filename:string,title:string,columns:string[],rows:string[][]){const clean=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ').replace(/[\\()]/g,'\\$&');const lines=[title,columns.join(' | '),...rows.map(row=>row.join(' | '))].map(clean);const stream=['BT','/F1 12 Tf','40 800 Td',...lines.flatMap((line,index)=>[index?'0 -18 Td':'',`(${line}) Tj`]).filter(Boolean),'ET'].join('\n');const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;downloadFile(filename,pdf,'application/pdf')}
function ExportMenu({title,fileName,columns,rows}:{title:string,fileName:string,columns:string[],rows:string[][]}){const [open,setOpen]=useState(false);const menuRef=useRef<HTMLDivElement>(null);useEffect(()=>{const close=(event:MouseEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);const exportRows=(format:ExportFormat)=>{const csv='\ufeff'+[columns,...rows].map(row=>row.map(csvCell).join(',')).join('\n');if(format==='pdf')downloadPdf(`${fileName}.pdf`,title,columns,rows);else downloadFile(`${fileName}.${format==='excel'?'xls':'csv'}`,csv,format==='excel'?'application/vnd.ms-excel;charset=utf-8':'text/csv;charset=utf-8');setOpen(false)};return <div className="exportMenu" ref={menuRef}><button type="button" className="workspaceAction" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><I.Download size={16}/>Exporter<I.ChevronDown size={15}/></button>{open&&<div className="exportMenuList" role="menu"><button type="button" role="menuitem" onClick={()=>exportRows('pdf')}><I.FileText size={16}/>PDF</button><button type="button" role="menuitem" onClick={()=>exportRows('excel')}><I.FileSpreadsheet size={16}/>Excel</button><button type="button" role="menuitem" onClick={()=>exportRows('csv')}><I.FileDown size={16}/>CSV</button></div>}</div>}
function fmt(n:number){return n>=1000?`${(n/1000).toFixed(2)} kWh`:`${Math.round(n)} Wh`}
function kinshasaDateKey(){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Kinshasa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}`}
function addDateKeyDays(value:string,days:number){const date=new Date(value+'T12:00:00');date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function useData(){const [items,setItems]=useState<Appliance[]>(()=>store.get<Appliance[]>('djua-items',[]));const [quote,setQuote]=useState<Quote>(()=>store.get('djua-quote',{status:'Brouillon',payment:'plan',plan:24,activities:['Devis créé depuis le dimensionnement']}));useEffect(()=>store.set('djua-items',items),[items]);useEffect(()=>store.set('djua-quote',quote),[quote]);return {items,setItems,quote,setQuote}}
function Dashboard(){const metrics:{label:string;value:string|number;icon:React.ElementType}[]=[{label:'Dimensionnements',value:12,icon:I.Calculator},{label:'Devis partagés',value:8,icon:I.FileText},{label:'À relancer',value:3,icon:I.MessageCircle},{label:'Revenu potentiel',value:'13 920 $',icon:I.TrendingUp}];return <Page title="Bonjour Chris 👋" sub="Voici ce qui se passe aujourd'hui."><div className="metrics">{metrics.map(({label,value,icon:Icon})=><div className="metric" key={label}><Icon/><small>{label}</small><strong>{value}</strong><em>+12% ce mois</em></div>)}</div><div className="grid two"><Card title="À relancer aujourd'hui"><p>Jean Kabeya · Devis OE-2026-00847</p><Button>Relancer sur WhatsApp</Button></Card><Card title="Activité récente"><p>Devis envoyé à Jean Kabeya</p><p>Dimensionnement Kivu Market calculé</p></Card></div></Page>}
function Page({title,sub,children,hideTitle=false}:{title:string,sub?:string,children:React.ReactNode,hideTitle?:boolean}){return <section className="page">{!hideTitle&&<h1>{title}</h1>}{sub&&<p className="muted">{sub}</p>}{children}</section>}
function Card({title,children,className='' }:{title?:string,children:React.ReactNode,className?:string}){return <section className={'card '+className}>{title&&<h3>{title}</h3>}{children}</section>}

type MapCoordinates={lat:number;lng:number}
let leafletPromise:Promise<any>|undefined
function loadLeaflet(){
  const existing=(window as Window & {L?:any}).L
  if(existing)return Promise.resolve(existing)
  if(leafletPromise)return leafletPromise
  if(!document.getElementById('leaflet-style')){
    const stylesheet=document.createElement('link')
    stylesheet.id='leaflet-style'
    stylesheet.rel='stylesheet'
    stylesheet.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(stylesheet)
  }
  leafletPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script')
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async=true
    script.onload=()=>resolve((window as Window & {L?:any}).L)
    script.onerror=()=>reject(new Error('La carte n’a pas pu être chargée.'))
    document.head.appendChild(script)
  })
  return leafletPromise
}
function OpenStreetMapSelector({value,onChange,id='location-map',large=false}:{value:MapCoordinates,onChange:(coordinates:MapCoordinates)=>void;id?:string;large?:boolean}){
  const elementRef=useRef<HTMLDivElement>(null)
  const mapRef=useRef<any>(null)
  const markerRef=useRef<any>(null)
  const [status,setStatus]=useState('Chargement de la carte…')
  useEffect(()=>{
    let active=true
    loadLeaflet().then(L=>{
      if(!active||!elementRef.current)return
      const map=L.map(elementRef.current,{zoomControl:true}).setView([value.lat,value.lng],15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map)
      const marker=L.marker([value.lat,value.lng],{draggable:true,keyboard:true}).addTo(map)
      const select=(point:{lat:number;lng:number})=>onChange({lat:point.lat,lng:point.lng})
      map.on('click',(event:any)=>select(event.latlng))
      marker.on('dragend',()=>select(marker.getLatLng()))
      mapRef.current=map
      markerRef.current=marker
      setStatus('Cliquez sur la carte ou faites glisser le repère pour choisir l’emplacement exact.')
    }).catch(error=>active&&setStatus(error.message))
    return ()=>{active=false;mapRef.current?.remove();mapRef.current=null;markerRef.current=null}
  },[])
  useEffect(()=>{
    markerRef.current?.setLatLng([value.lat,value.lng])
    mapRef.current?.panTo([value.lat,value.lng],{animate:true})
  },[value.lat,value.lng])
  return <div className={'mapInteractive '+(large?'largeMap':'')}><div className="openStreetMap" id={id} ref={elementRef} tabIndex={0}/><small>{status}</small></div>
}
type NominatimResult={place_id:number;display_name:string;lat:string;lon:string}
function MapPickerDialog({value,onClose,onConfirm}:{value:MapCoordinates;onClose:()=>void;onConfirm:(coordinates:MapCoordinates)=>void}){
  const [draft,setDraft]=useState(value)
  const [query,setQuery]=useState('')
  const [results,setResults]=useState<NominatimResult[]>([])
  const [searchStatus,setSearchStatus]=useState('')
  const searchAddresses=async()=>{
    if(!query.trim())return
    setSearchStatus('Recherche…')
    try{
      const response=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query.trim())}`)
      if(!response.ok)throw new Error('Recherche indisponible')
      const matches=await response.json() as NominatimResult[]
      setResults(matches)
      setSearchStatus(matches.length?`${matches.length} résultat${matches.length>1?'s':''} trouvé${matches.length>1?'s':''}`:'Aucun résultat pour cette adresse.')
    }catch{setSearchStatus('La recherche d’adresse est momentanément indisponible.')}
  }
  return <div className="mapDialogBackdrop" role="presentation" onMouseDown={event=>event.currentTarget===event.target&&onClose()}>
    <section className="mapDialog" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title">
      <header><div><h2 id="map-dialog-title">Choisir un emplacement</h2><p>Recherchez une adresse ou cliquez directement sur la carte.</p></div><button className="icon" aria-label="Fermer la carte" onClick={onClose}><I.X size={20}/></button></header>
      <div className="mapSearch">
        <I.Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>event.key==='Enter'&&searchAddresses()} placeholder="Ex. : Avenue des Huileries, Kinshasa"/>
        <button className="button" type="button" onClick={searchAddresses}>Rechercher</button>
      </div>
      {(searchStatus||results.length>0)&&<div className="mapSearchResults"><small>{searchStatus}</small>{results.map(result=><button key={result.place_id} type="button" onClick={()=>{setDraft({lat:Number(result.lat),lng:Number(result.lon)});setQuery(result.display_name);setResults([]);setSearchStatus('Emplacement positionné sur la carte.')}}><I.MapPin size={16}/><span>{result.display_name}</span></button>)}</div>}
      <OpenStreetMapSelector id="location-map-dialog" value={draft} onChange={setDraft} large/>
      <footer><span><I.MapPin size={16}/> {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</span><div><Button secondary onClick={onClose}>Annuler</Button><Button onClick={()=>onConfirm(draft)}>Valider l’emplacement</Button></div></footer>
    </section>
  </div>
}
function Dimensionnements(){const nav=useNavigate();return <Page title="Dimensionnements" sub="Gérez les besoins énergétiques et les systèmes recommandés."><div className="toolbar"><div className="search">⌕ Rechercher un client ou un projet…</div><Button onClick={()=>nav('/dimensionnements/nouveau')}>＋ Nouveau devis</Button></div><Card><table><thead><tr><th>Projet</th><th>Client</th><th>Consommation</th><th>Statut</th><th></th></tr></thead><tbody><tr><td><b>Maison de Jean Kabeya</b><small>DIM-2026-00124</small></td><td>Jean Kabeya</td><td>3.84 kWh / jour</td><td><Badge text="Calculé"/></td><td><Button secondary onClick={()=>nav('/dimensionnements/jean/appareils')}>Ouvrir</Button></td></tr><tr><td><b>Kivu Market — Gombe</b><small>Brouillon</small></td><td>Kivu Market SARL</td><td>—</td><td><Badge text="Brouillon"/></td><td>…</td></tr></tbody></table></Card></Page>}
function Badge({text}:{text:string}){return <span className={'badge '+text.toLowerCase()}>{text}</span>}
function Progress({step,labels=['Client','Logement','Appareils']}:{step:number,labels?:string[]}){return <div className="progress">{labels.map((x,i)=><div className={i+1<step?'complete':i+1===step?'current':''} key={x}><b>{i+1<step?<I.Check size={16}/>:i+1}</b><span>{x}<small>{i+1===step?'En cours':i+1<step?'Terminé':'À faire'}</small></span></div>)}</div>}
function NewSizing(){const nav=useNavigate();const [selected,setSelected]=useState('Jean Kabeya');const clients=[['Jean Kabeya','+243 81 234 5678','Kinshasa, Gombe','JK'],['Sarah Ilunga','+243 97 456 7890','Kinshasa, Ngaliema','SI'],['Martin Paluku','+243 81 654 3210','Kinshasa, Barumbu','MP'],['Aline Tshibangu','+243 90 123 4567','Kinshasa, Kintambo','AT'],["Benoît N’Kulu",'+243 99 876 5432','Kinshasa, Limete','BN']];return <Page title="Nouveau devis"><div className="split sizingStart"><div><Progress step={1}/><section className="startCard"><div className="startTitle"><h2>Pour qui réalisez-vous ce dimensionnement ?</h2><p>Recherchez un client existant ou créez-en un nouveau.</p></div><div className="startSearch"><I.Search size={18}/><input placeholder="Rechercher par nom, téléphone ou e-mail…"/></div><div className="selectionColumns"><div className="recentClients"><h3>Clients récents</h3>{clients.map(([name,phone,place,initials])=><button onClick={()=>{setSelected(name);if(name==='Jean Kabeya')nav('/dimensionnements/jean/logement')}} className={selected===name?'selected':''} key={name}><span className="radio">{selected===name&&<I.CircleDot size={16}/>}</span><i className={'initials initials-'+initials}>{initials}</i><span><b>{name}</b><small>{phone}　•　{place}</small></span><I.ChevronRight size={18}/></button>)}<Button secondary><I.UsersRound size={16}/> Voir tous les clients</Button></div><div className="orDivider"><span>OU</span></div><div className="createClient"><h3>Nouveau client</h3><p>Créez rapidement un nouveau client pour commencer le dimensionnement.</p><div className="clientIllustration"><I.ClipboardList size={78}/><I.UserRound size={23}/></div><Button secondary onClick={()=>nav('/dimensionnements/nouveau/client')}><I.UserRoundPlus size={17}/> Créer un nouveau client</Button></div></div></section><div className="dataSecurity"><I.ShieldCheck size={24}/><span><b>Vos données sont en sécurité</b><small>Toutes les informations sont confidentielles et utilisées uniquement pour vous aider à dimensionner le meilleur système.</small></span></div></div><Summary/></div></Page>}
function PhoneInput({value}:{value:string}){return <div className="phoneInput"><span className="countryCode">🇨🇩　+243</span><input defaultValue={value}/></div>}
function ClientForm(){
  const nav=useNavigate();
  const [company,setCompany]=useState(false);
  const [firstName,setFirstName]=useState('Jean');
  const [lastName,setLastName]=useState('Kabeya');
  const [companyName,setCompanyName]=useState('Kivu Market SARL');
  const fullName=`${firstName} ${lastName}`.trim();
  const startSizing=()=>{const id=company?'kivu':'jean';const personOrCompany=company?companyName.trim()||'Nouvelle entreprise':fullName||'Nouveau client';const project={...defaultProject(id),customerName:personOrCompany,locationName:company?`${personOrCompany} — Gombe`:`Maison de ${personOrCompany}`};store.set(projectKey(id),project);store.set('djua-items',[]);nav(company?'/dimensionnements/kivu/site':'/dimensionnements/jean/logement')};
  const identityFields=(title:string)=><section className="formSection"><h3><I.FileText size={17}/> {title}</h3><div className="form identityGrid"><label>Type de pièce<select defaultValue="Carte d’électeur"><option>Carte d’électeur</option><option>Passeport</option><option>Autre</option></select></label><label>Numéro de la pièce<input placeholder="Ex. : 01-123456"/></label><label>Délivrée à<input placeholder="Ex. : Kinshasa"/></label><label>Date de délivrance<input type="date"/></label></div></section>;
  const address=null;
  return <section className="page clientCreation"><div className="split"><div><Progress step={1} labels={company?['Entreprise','Site','Appareils']:['Client','Logement','Appareils']}/><section className="clientFormCard"><button className="backLink" onClick={()=>nav('/dimensionnements/nouveau')}><I.ArrowLeft size={16}/> Retour</button><h2>Créer un nouveau client</h2><p className="muted">{company?"Enregistrez l’entreprise et son représentant légal.":"Enregistrez les informations d’identité et de contact du client."}</p><h3 className="fieldHeading">Type de client</h3><div className="customerToggle"><button className={!company?'selected':''} onClick={()=>setCompany(false)}><span className="customerOption"><I.UserRound size={19}/><span>Particulier</span>{!company&&<I.CheckCircle2 className="customerCheck" size={18}/>}</span></button><button className={company?'selected':''} onClick={()=>setCompany(true)}><span className="customerOption"><I.Building2 size={19}/><span>Entreprise</span>{company&&<I.CheckCircle2 className="customerCheck" size={18}/>}</span></button></div>{company?<React.Fragment key="company"><section className="formSection"><h3><I.Building2 size={17}/> Informations de l’entreprise</h3><div className="form companyDetails"><label>Dénomination / raison sociale <em>*</em><input value={companyName} onChange={event=>setCompanyName(event.target.value)}/></label><label>Type d’organisation<select defaultValue="Entreprise / Commerce"><option>Entreprise / Commerce</option><option>Association</option><option>Institution</option></select></label><label>RCCM<input placeholder="Ex. : CD/KIN/RCCM/24-B…"/></label><label>Identification nationale<input placeholder="Ex. : ID.NAT. 01-…"/></label></div></section><section className="formSection"><h3><I.UserRound size={17}/> Représentant légal</h3><div className="form representativeGrid"><label>Prénom <em>*</em><input defaultValue="Patrick"/></label><label>Nom <em>*</em><input defaultValue="Ilunga"/></label><label>Qualité / fonction <em>*</em><select defaultValue="Gérant"><option>Gérant</option><option>Directeur</option><option>Responsable</option></select></label><label>Téléphone portable <em>*</em><PhoneInput value="97 123 4567"/></label><label>Autre numéro<input placeholder="Optionnel"/></label><label>Adresse e-mail<input defaultValue="patrick@kivumarket.cd"/></label></div></section>{identityFields("Pièce d’identité du représentant")}{address}</React.Fragment>:<React.Fragment key="personal"><section className="formSection"><h3><I.UserRound size={17}/> Informations personnelles</h3><div className="form personalDetails"><label>Prénom <em>*</em><input value={firstName} onChange={event=>setFirstName(event.target.value)}/></label><label>Nom <em>*</em><input value={lastName} onChange={event=>setLastName(event.target.value)}/></label><label>Lieu de naissance<input placeholder="Ex. : Kinshasa"/></label><label>Date de naissance<input type="date"/></label><label>Nationalité<select defaultValue="Congolaise"><option>Congolaise</option><option>Autre</option></select></label></div></section><section className="formSection"><h3><I.Phone size={17}/> Coordonnées</h3><div className="form contactDetails"><label>Numéro de téléphone <em>*</em><PhoneInput value="81 234 5678"/></label><label>Autre numéro<input placeholder="Optionnel"/></label><label>Adresse e-mail<input defaultValue="jean.kabeya@email.com"/></label><label>Référence client<input placeholder="Optionnel"/></label></div></section>{identityFields("Pièce d’identité")}{address}</React.Fragment>}<div className="formActions"><Button secondary onClick={()=>nav('/dimensionnements/nouveau')}>Annuler</Button><Button onClick={startSizing}>Créer et continuer <I.ArrowRight size={16}/></Button></div></section><div className="dataSecurity"><I.ShieldCheck size={24}/><span><b>Vos données sont en sécurité</b><small>Toutes les informations sont confidentielles et utilisées uniquement pour vous aider à dimensionner le meilleur système.</small></span></div></div><ClientCreationSidebar company={company} customerName={company?companyName:fullName}/></div></section>}
function Housing(){const nav=useNavigate();const {id}=useParams();const company=id==='kivu';const [locationType,setLocationType]=useState(company?'Commerce':'Maison individuelle');const [customType,setCustomType]=useState('');const personTypes=[['Maison individuelle',I.House],['Appartement',I.Building2],['Autre logement',I.House]] as [string,React.ElementType][];const companyTypes=[['Commerce',I.Store],['Bureau',I.Building2],['Atelier / Usine',I.Factory],['École',I.GraduationCap],['Santé',I.Cross],['Autre type de site',I.Building2]] as [string,React.ElementType][];const options=company?companyTypes:personTypes;const customOption=company?'Autre type de site':'Autre logement';const customerName=company?'Kivu Market SARL':'Jean Kabeya';const locationLabel=company?'Site':'Logement';const address=company?'Avenue des Huileries, Gombe':'Avenue de la Révolution, Gombe';const detailLabel=locationType==='Appartement'?'Niveau':locationType==='Maison individuelle'?'Nombre de pièces':'Nombre de niveaux';const detailValues=locationType==='Appartement'?['1er niveau','2e niveau','3e niveau','4e niveau']:locationType==='Maison individuelle'?['1 pièce','2 pièces','3 pièces','4 pièces','5 pièces et plus']:['1 niveau','2 niveaux','3 niveaux et plus'];const mapLocation=<div className="mapLocation"><div className="mapPreview"><I.MapPin size={36}/><span>Kinshasa</span></div><aside><div><i><I.MapPin size={19}/></i><span><b>Localisation sélectionnée</b><small>{address}<br/>Kinshasa, RDC</small></span></div><Button secondary><I.Pencil size={16}/> Modifier sur la carte</Button></aside></div>;return <Page title="Nouveau devis"><div className="split locationStep"><div><Progress step={2} labels={company?['Entreprise','Site','Appareils']:['Client','Logement','Appareils']}/><section className="locationCard"><h2>{locationLabel} à dimensionner</h2><p className="muted">Où le système solaire sera-t-il installé ?</p><div className="createdClient"><i>{company?<I.Building2 size={21}/>:<I.UserRound size={21}/>}</i><span><b>{customerName}</b><small>Client créé avec succès</small></span><I.Check size={19}/></div><h3 className="locationSectionTitle">Type de {company?'site':'logement'} <em>*</em></h3><div className={'locationTypes '+(company?'siteTypes':'homeTypes')}>{options.map(([label,Icon])=>label===customOption&&locationType===label?<label className="otherTypeButton selected" key={label}><Icon size={27}/><input aria-label={'Précisez le type de '+(company?'site':'logement')} autoFocus value={customType} onChange={event=>setCustomType(event.target.value)} placeholder={company?'Ex. : Église, hôtel, restaurant…':'Ex. : Villa, résidence, immeuble…'}/><i><I.CircleDot size={17}/></i></label>:<button className={locationType===label?'selected':''} key={label} onClick={()=>setLocationType(label)}><Icon size={27}/><b>{label}</b><i>{locationType===label&&<I.CircleDot size={17}/>}</i></button>)}</div>{company?<><h3 className="locationSectionTitle">Informations du site</h3><div className="locationFields companyLocationFields"><label>Nom du site <em>*</em><input defaultValue="Kivu Market — Gombe"/><small>Ex. : Boutique Gombe, Entrepôt Limete, Agence Matete…</small></label><label>Ville / Commune <em>*</em><select defaultValue="Kinshasa / Gombe"><option>Kinshasa / Gombe</option></select></label><label>Adresse / Quartier <em>*</em><input defaultValue={address}/></label></div><label className="locationReference">Repère <span>(optionnel)</span><input placeholder="Ex. : En face de la station Total, à côté de…"/></label>{mapLocation}</>:<><h3 className="locationSectionTitle">Informations du logement</h3><div className="locationFields homeNameFields"><label>Nom du logement <I.Info size={14}/><input defaultValue="Maison de Jean Kabeya"/><small>Ce nom vous permettra d’identifier facilement ce logement.</small></label><label>{detailLabel} <span>(optionnel)</span><select defaultValue={detailValues[0]}>{detailValues.map(value=><option key={value}>{value}</option>)}</select></label></div><div className="locationFields addressFields"><label>Ville / Commune <em>*</em><select defaultValue="Kinshasa / Gombe"><option>Kinshasa / Gombe</option></select></label><label>Quartier / Adresse <em>*</em><input defaultValue={address}/></label><label>Repère <span>(optionnel)</span><input placeholder="Ex. : En face de l'école…"/></label></div>{mapLocation}</>}<div className="locationActions"><Button secondary onClick={()=>nav('/dimensionnements/nouveau/client')}><I.ArrowLeft size={16}/> Retour</Button><Button onClick={()=>nav('/dimensionnements/'+(company?'kivu':'jean')+'/appareils')}>Continuer vers les appareils <I.ArrowRight size={16}/></Button></div></section></div><LocationSummary company={company} customerName={customerName}/></div></Page>}
function LocationSummary({company,customerName}:{company:boolean,customerName:string}){
  const clientType=company?'Entreprise / Commerce':'Maison individuelle'
  const contactName=company?'Patrick Ilunga':'Jean Kabeya'
  const contactRole=company?'Gérant':'Client'
  const address=company?'Avenue des Huileries, Gombe':'Avenue de la Révolution, Gombe'
  return <aside className="summary locationSummary">
    <section className="card clientContextCard">
      <h3><I.Building2 size={18}/> Client en cours</h3>
      <div className="contextClient"><i><I.Building2 size={21}/></i><span><b>{customerName}</b><small>{clientType}</small></span></div>
      <div className="contextDetails">
        <div><I.UserRound size={18}/><span><b>Contact principal</b><small>{contactName} · {contactRole}<br/>+243 97 123 4567<br/>{company?'patrick@kivumarket.cd':'jean.kabeya@email.com'}</small></span></div>
        <div><I.MapPin size={18}/><span><b>Adresse</b><small>{address}<br/>Kinshasa, RDC</small></span></div>
      </div>
      <button className="contextLink"><I.UserRound size={15}/> Voir la fiche client <I.ArrowRight size={15}/></button>
    </section>
    <section className="card profileCompleteness">
      <div className="profileHeading"><h3>Complétude du profil</h3><b>80%</b></div>
      <div className="profileProgress"><i/></div>
      <ul>
        <li className="complete"><I.CheckCircle2 size={16}/> {company?'Nom de l’entreprise':'Nom du client'}</li>
        <li className="complete"><I.CheckCircle2 size={16}/> {company?'Type d’organisation':'Type de logement'}</li>
        <li className="complete"><I.CheckCircle2 size={16}/> Contact principal</li>
        <li className="complete"><I.CheckCircle2 size={16}/> Téléphone</li>
        <li><I.Circle size={16}/> Adresse complète</li>
      </ul>
      <p>Il reste 1 information utile pour un dossier plus complet.</p>
    </section>
    <section className="card nextStepCard">
      <i><I.ListChecks size={19}/></i><span><b>Prochaine étape</b><strong>Ajouter les appareils</strong><small>Indiquez les appareils qui seront utilisés sur ce site pour calculer un système solaire adapté.</small></span>
    </section>
    <div className="advice"><I.Lightbulb size={22}/><span><b>Conseil Djúa</b><p>{company?'Le numéro du contact principal vous permettra de le joindre facilement au sujet de ce site.':"Une adresse précise permet d’ajuster la recommandation selon l’ensoleillement de la zone."}</p></span></div>
  </aside>
}
function ClientCreationSidebar({company,customerName}:{company:boolean;customerName:string}){
  const initialDetails=company?{organization:'Entreprise / Commerce',firstName:'Patrick',lastName:'Ilunga',role:'Gérant',phone:'97 123 4567',email:'patrick@kivumarket.cd',city:'Kinshasa',neighborhood:'Gombe',street:'Avenue de la Révolution'}:{organization:'Particulier',firstName:'Jean',lastName:'Kabeya',role:'',phone:'81 234 5678',email:'jean.kabeya@email.com',city:'Kinshasa',neighborhood:'Gombe',street:'Avenue de la Révolution'}
  const [details,setDetails]=useState(initialDetails)
  useEffect(()=>{
    const card=document.querySelector<HTMLElement>('.clientFormCard')
    if(!card)return
    const valueFor=(prefix:string)=>{
      const label=[...card.querySelectorAll('label')].find(item=>item.textContent?.trim().startsWith(prefix))
      const control=label?.querySelector<HTMLInputElement|HTMLSelectElement>('input, select')
      return control?.value.trim()||''
    }
    const sync=()=>setDetails({
      organization:company?valueFor('Type d’organisation'):'Particulier',
      firstName:company?valueFor('Prénom'):customerName.trim().split(' ')[0]||'',
      lastName:company?valueFor('Nom '):customerName.trim().split(' ').slice(1).join(' '),
      role:company?valueFor('Qualité / fonction'):'',
      phone:valueFor('Numéro de téléphone'),
      email:valueFor('Adresse e-mail'),
      city:'',
      neighborhood:'',
      street:''
    })
    sync()
    card.addEventListener('input',sync)
    card.addEventListener('change',sync)
    return ()=>{card.removeEventListener('input',sync);card.removeEventListener('change',sync)}
  },[company,customerName])
  const hasIdentity=Boolean(customerName.trim())
  const name=customerName.trim()||(company?'Nouvelle entreprise':'Nouveau client')
  const type=details.organization||(company?'Type d’organisation à renseigner':'Particulier')
  const contact=[details.firstName,details.lastName].filter(Boolean).join(' ')
  const address=[details.street,details.neighborhood,details.city].filter(Boolean).join(', ')
  const checks=[
    {label:company?'Nom de l’entreprise':'Nom du client',complete:hasIdentity},
    {label:company?'Type d’organisation':'Type de client',complete:Boolean(details.organization)},
    {label:'Contact principal',complete:Boolean(contact)},
    {label:'Téléphone',complete:Boolean(details.phone)},
    {label:'Adresse complète',complete:Boolean(details.city&&details.neighborhood&&details.street)}
  ]
  const completion=Math.round(checks.filter(check=>check.complete).length/checks.length*100)
  const remaining=checks.length-checks.filter(check=>check.complete).length
  const nextTitle=company?'Configurer le site':'Configurer le logement'
  return <aside className="summary clientCreationSidebar">
    <section className="card clientContextCard">
      <h3><I.Building2 size={18}/> Client en cours</h3>
      <div className="contextClient"><i>{company?<I.Building2 size={21}/>:<I.UserRound size={21}/>}</i><span><b>{name}</b><small>{type}</small></span></div>
      <div className="contextDetails">
        <div><I.UserRound size={18}/><span><b>Contact principal</b><small>{contact||'—'}{company&&details.role&&' · '+details.role}<br/>{details.phone?'+243 '+details.phone:'—'}<br/>{details.email||'—'}</small></span></div>
        <div><I.MapPin size={18}/><span><b>Adresse</b><small>{address||'À configurer à l’étape suivante'}</small></span></div>
      </div>
    </section>
    <section className="card profileCompleteness">
      <div className="profileHeading"><h3>Complétude du profil</h3><b>{completion}%</b></div>
      <div className="profileProgress"><i style={{width:completion+'%'}}/></div>
      <ul>
        {checks.map(check=><li className={check.complete?'complete':''} key={check.label}>{check.complete?<I.CheckCircle2 size={16}/>:<I.Circle size={16}/>} {check.label}</li>)}
      </ul>
      <p>{remaining?'Il reste '+remaining+' information'+(remaining>1?'s':'')+' utile'+(remaining>1?'s':'')+' pour un dossier plus complet.':'Le profil est complet.'}</p>
    </section>
    <section className="card nextStepCard"><i><I.MapPinned size={19}/></i><span><b>Prochaine étape</b><strong>{nextTitle}</strong><small>Vous indiquerez où sera installé le système solaire pour poursuivre le dimensionnement.</small></span></section>
    <div className="advice"><I.Lightbulb size={22}/><span><b>Conseil Djúa</b><p>{company?'Le téléphone du contact principal permettra de le joindre facilement au sujet du projet.':'Des informations complètes permettront une recommandation plus précise.'}</p></span></div>
  </aside>
}
function Summary({mode='empty'}:{mode?:'empty'|'client'|'enterprise'}){const isEnterprise=mode==='enterprise';const label=isEnterprise?'Entreprise':'Client';const site=isEnterprise?'Site':'Logement';const rows=[{icon:isEnterprise?I.Building2:I.UserRound,label,value:mode==='empty'?'Non sélectionné':'En cours de création'},{icon:I.House,label:site,value:'Non sélectionné'},{icon:I.ListChecks,label:'Appareils',value:'0 appareil'},{icon:I.Zap,label:'Consommation estimée',value:'—'},{icon:I.Gauge,label:'Puissance simultanée estimée',value:'—'},{icon:I.PanelTop,label:'Système recommandé',value:'—'}];return <aside className="summary"><Card title="Résumé du dimensionnement"><div className="summaryRows">{rows.map(({icon:Icon,label,value},i)=><div className={(i===3?'summaryDivide ':'')+(i===0&&mode!=='empty'?'inCreation':'')} key={label}><i><Icon size={21}/></i><span><b>{label}</b><small>{value}</small></span></div>)}</div></Card><div className="advice"><I.Lightbulb size={22}/><span><b>Conseil Djúa</b><p>{mode==='empty'?'Sélectionnez un client pour personnaliser la recommandation selon ses besoins.':'Plus les informations sont complètes, plus la recommandation sera précise.'}</p></span></div></aside>}
const categoryIcons:Record<string,React.ElementType>={'Éclairage':I.Lightbulb,'Cuisine':I.CookingPot,'Multimédia':I.Monitor,'Climatisation':I.Snowflake,'Pompage':I.Droplets,'Autres':I.Wrench}
const deviceIcons:Record<string,React.ElementType>={'Ampoule LED':I.Lightbulb,'Réfrigérateur':I.Refrigerator,'Mixeur':I.Blend,'Télévision':I.Tv,'Décodeur':I.Router,'Routeur Wi‑Fi':I.Router,'Fer à repasser':I.Plug,'Routeur':I.Router,'Ventilateur':I.Fan,'Micro-ondes':I.Microwave,'Lave-linge':I.WashingMachine,'Cuiseur de riz':I.CookingPot,'Ordinateur portable':I.Laptop}
const applianceSpriteClass:Record<string,string>={'Ampoule LED':'sprite-bulb','Réfrigérateur':'sprite-fridge','Mixeur':'sprite-blender','Télévision':'sprite-tv','Décodeur':'sprite-decoder','Routeur Wi‑Fi':'sprite-router','Routeur':'sprite-router','Ventilateur':'sprite-fan','Micro-ondes':'sprite-microwave','Lave-linge':'sprite-washer','Cuiseur de riz':'sprite-rice','Ordinateur portable':'sprite-laptop','Fer à repasser':'sprite-iron'}
function ApplianceThumbnail({name,variant='row'}:{name:string,variant?:'row'|'compact'|'preview'}){const Icon=deviceIcons[name]||I.Plug;const sprite=applianceSpriteClass[name];return sprite?<div className={`applianceThumbnail ${variant} ${sprite}`} style={{backgroundImage:`url(${applianceSprite})`}} role="img" aria-label={name}/>:<div className={'deviceicon '+(variant==='preview'?'big':'')}><Icon size={variant==='preview'?45:27}/></div>}
function Appliances(){
  const nav=useNavigate();
  const {id}=useParams();
  const project={...defaultProject(id),...store.get<SizingProject>(projectKey(id),defaultProject(id))};
  const {items,setItems}=useData();
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Appliance|null>(null);
  const [search,setSearch]=useState('');
  const s=sizing(items);
  const filtered=items.filter(item=>item.name.toLowerCase().includes(search.toLowerCase()));
  const count=items.reduce((total,item)=>total+item.quantity,0);
  return <Page title="Appareils" hideTitle><div className="applianceHeading"><div><h1>{project.company?project.customerName:project.locationName} <button className="plain"><I.Pencil size={16}/></button></h1><p>{project.company?`${project.locationName}　•　${project.locationType}　•　${project.address}`:`${project.locationType}　•　${project.address}`}</p></div><div className="applianceStats"><span><I.ListChecks size={18}/><b>{count} appareil{count!==1?'s':''}</b></span><span><I.Clock3 size={18}/><b>{fmt(s.daily)} / jour</b><small>Consommation quotidienne</small></span></div></div><div className="work applianceWork"><div><section className="applianceCard"><div className="applianceToolbar"><h2>Appareils</h2><div><div className="search"><I.Search size={18}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Rechercher un appareil"/></div><Button onClick={()=>setOpen(true)}><I.Plus size={17}/> Ajouter un appareil</Button><button className="icon"><I.SlidersHorizontal size={19}/></button></div></div><div className="applianceRows">{items.length===0?<div className="emptyApplianceState"><i><I.Plug size={30}/></i><h3>Ajoutez votre premier appareil</h3><p>Renseignez les appareils qui seront utilisés sur ce site pour calculer un système solaire adapté.</p><Button onClick={()=>setOpen(true)}><I.Plus size={16}/> Ajouter un appareil</Button></div>:<>{filtered.map(item=>{return <div className="applianceRow" key={item.id}><ApplianceThumbnail name={item.name}/><span className="applianceName"><b>{item.name}</b><small>{item.watts} W　•　{item.hours} h/jour　•　{item.period}</small></span><Stepper value={item.quantity} set={value=>setItems(items.map(current=>current.id===item.id?{...current,quantity:value}:current))}/><span className="applianceUsage"><b>{item.watts} W <small>/ unité</small></b><small>{fmt(dailyWh(item))}/jour</small></span><button className="plain editAppliance" aria-label={'Modifier '+item.name} onClick={()=>setEditing(item)}><I.Pencil size={17}/></button><button className="plain removeAppliance" aria-label={'Supprimer '+item.name} onClick={()=>setItems(items.filter(current=>current.id!==item.id))}><I.Trash2 size={18}/></button></div>})}{filtered.length===0&&<p className="emptyAppliances">Aucun appareil ne correspond à votre recherche.</p>}</>}</div></section><section className="applianceTotal"><div><b>Total</b><small>{count} appareil{count!==1?'s':''}</small></div><div><strong>{fmt(s.daily)} / jour</strong><small>Puissance simultanée estimée : <b>{(s.peak/1000).toFixed(2)} kW</b></small></div></section><div className="applianceStepActions"><Button secondary onClick={()=>nav(`/dimensionnements/${id||'jean'}/${project.company?'site':'logement'}`)}><I.ArrowLeft size={16}/> Retour</Button><Button disabled={items.length===0} onClick={()=>nav(`/dimensionnements/${id||'jean'}/recommandation`)}>Calculer le système recommandé <I.ArrowRight size={17}/></Button></div></div><Energy s={s} items={items}/></div>{open&&<AddAppliance close={()=>setOpen(false)} save={item=>setItems([...items,item])}/>} {editing&&<AddAppliance initial={editing} close={()=>setEditing(null)} save={item=>{setItems(items.map(current=>current.id===item.id?item:current));setEditing(null)}}/>}</Page>}
function Stepper({value,set}:{value:number,set:(v:number)=>void}){return <div className="stepper"><button onClick={()=>set(Math.max(1,value-1))}>−</button><b>{value}</b><button onClick={()=>set(value+1)}>＋</button></div>}
function Energy({s,items}:{s:ReturnType<typeof sizing>,items:Appliance[]}){const count=items.reduce((total,item)=>total+item.quantity,0);return <aside className="energy applianceEnergy"><Card title="Résumé énergétique"><div className="energyChart"><small>Consommation quotidienne</small><strong>{fmt(s.daily)}<em> / jour</em></strong><svg viewBox="0 0 220 72" aria-hidden="true"><defs><linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff5a00" stopOpacity=".22"/><stop offset="1" stopColor="#ff5a00" stopOpacity="0"/></linearGradient></defs><path d="M4 62 L36 58 L70 52 L100 45 L132 38 L162 26 L194 9 L216 5 L216 68 L4 68 Z" fill="url(#energyFill)"/><polyline points="4,62 36,58 70,52 100,45 132,38 162,26 194,9 216,5" fill="none" stroke="#ff5a00" strokeWidth="2"/>{[4,36,70,100,132,162,194,216].map((x,index)=><circle cx={x} cy={[62,58,52,45,38,26,9,5][index]} r="2.5" fill="#ff5a00" key={x}/>)}</svg></div><div className="energyMetric"><small>Puissance installée</small><strong>{(s.peak*1.34/1000).toFixed(2)} <em>kW</em></strong></div><div className="energyMetric"><small>Puissance simultanée estimée <I.Info size={13}/></small><strong>{(s.peak/1000).toFixed(2)} <em>kW</em></strong></div><div className="usageDistribution"><small>Répartition d’utilisation</small><div><i></i><span><b><em></em> Jour (6h – 18h)</b><strong>38%</strong><b><em></em> Nuit (18h – 6h)</b><strong>62%</strong></span></div></div><div className="energyDevices"><span><small>Appareils</small><strong>{count}</strong></span><button>Voir la liste complète <I.ArrowRight size={16}/></button></div></Card><div className="advice"><I.Lightbulb size={22}/><span><b>Conseil Djúa</b><p>Ajoutez les appareils manquants ou ajustez les heures d’utilisation pour obtenir un dimensionnement précis.</p></span></div></aside>}
function AddAppliance({close,save,initial}:{close:()=>void,save:(a:Appliance)=>void,initial?:Appliance}){
  const options=[{name:'Télévision',watts:120},{name:'Ampoule LED',watts:10},{name:'Réfrigérateur',watts:120},{name:'Mixeur',watts:500},{name:'Décodeur',watts:20},{name:'Routeur Wi‑Fi',watts:10},{name:'Ventilateur',watts:45},{name:'Micro-ondes',watts:1000},{name:'Lave-linge',watts:500},{name:'Cuiseur de riz',watts:700},{name:'Ordinateur portable',watts:60},{name:'Fer à repasser',watts:1100}];
  const initialSlots=initial?.slots||[{from:initial?.period==='Nuit'?'18:00':'08:00',to:`${String(Math.min(23,(initial?.period==='Nuit'?18:8)+(initial?.hours||5))).padStart(2,'0')}:00`}];
  const [name,setName]=useState(initial?.name||''),[deviceQuery,setDeviceQuery]=useState(initial?.name||''),[deviceMenuOpen,setDeviceMenuOpen]=useState(false),[watts,setWatts]=useState(initial?.watts||120),[quantity,setQuantity]=useState(initial?.quantity||1),[slots,setSlots]=useState(initialSlots),[measurement,setMeasurement]=useState<'watts'|'voltage'>('watts'),[voltage,setVoltage]=useState(220),[current,setCurrent]=useState(1),[brand,setBrand]=useState(initial?.brand||''),[detail,setDetail]=useState(initial?.detail||''),[notes,setNotes]=useState(initial?.notes||''),[notesOpen,setNotesOpen]=useState(Boolean(initial?.notes)),[images,setImages]=useState<string[]>(initial?.images||[]);
  const category=name==='Ampoule LED'?'Éclairage':['Réfrigérateur','Mixeur','Micro-ondes','Cuiseur de riz'].includes(name)?'Cuisine':['Ventilateur','Lave-linge','Fer à repasser'].includes(name)?'Autres':'Multimédia';
  const applianceDetails:Record<string,{label:string;options:string[]}>={
    'Télévision':{label:"Taille d’écran",options:['21″','32″','43″','55″','65″ et plus']},
    'Ampoule LED':{label:"Type d’ampoule",options:['Standard','Spot','Tube']},
    'Réfrigérateur':{label:'Type de réfrigérateur',options:['Simple porte','Double porte','Congélateur en haut','Side by side']},
    'Mixeur':{label:'Type de mixeur',options:['Blender','Mixeur plongeant','Robot de cuisine']},
    'Routeur Wi‑Fi':{label:'Norme Wi‑Fi',options:['Wi‑Fi 4','Wi‑Fi 5','Wi‑Fi 6']},
    'Ventilateur':{label:'Type de ventilateur',options:['Sur pied','De table','Plafond']},
    'Micro-ondes':{label:'Capacité',options:['20 L','25 L','30 L et plus']},
    'Lave-linge':{label:'Capacité',options:['5 kg','7 kg','10 kg et plus']},
    'Cuiseur de riz':{label:'Capacité',options:['1 L','1,8 L','3 L et plus']},
    'Ordinateur portable':{label:"Taille d’écran",options:['11″','13″','15″','17″']},
    'Fer à repasser':{label:'Détail de l’appareil',options:[]}
  };
  const selectedDevice=options.find(option=>option.name===name);
  const metadata=applianceDetails[name]||{label:'Détail de l’appareil',options:[]};
  const devicePickerRef=useRef<HTMLDivElement>(null);
  const imageInputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{const closePicker=(event:MouseEvent)=>{if(devicePickerRef.current&&!devicePickerRef.current.contains(event.target as Node))setDeviceMenuOpen(false)};document.addEventListener('mousedown',closePicker);return()=>document.removeEventListener('mousedown',closePicker)},[]);
  const normaliseSearch=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const matchingOptions=options.filter(option=>normaliseSearch(option.name).includes(normaliseSearch(deviceQuery)));
  const selectDevice=(next:{name:string;watts:number})=>{setName(next.name);setDeviceQuery(next.name);setWatts(next.watts);setDetail('');setDeviceMenuOpen(false)};
  const updateDeviceQuery=(value:string)=>{setDeviceQuery(value);setName(value);setDetail('');setDeviceMenuOpen(true);const exact=options.find(option=>normaliseSearch(option.name)===normaliseSearch(value));if(exact)setWatts(exact.watts)};
  const addImages=(files:FileList|null)=>Array.from(files||[]).filter(file=>file.type.startsWith('image/')).slice(0,4-images.length).forEach(file=>{const reader=new FileReader();reader.onload=()=>setImages(current=>current.length<4?[...current,String(reader.result)]:current);reader.readAsDataURL(file)});
  const timeToMinutes=(value:string)=>{const match=value.trim().match(/^(\d{1,2})(?:[:h](\d{1,2}))?$/i);return match?Number(match[1])*60+Number(match[2]||0):0};
  const normaliseTime=(value:string)=>{const compact=value.trim().replace(/^([0-2]?\d)(\d{2})$/,'$1:$2').replace('h',':');const match=compact.match(/^(\d{1,2})(?::(\d{1,2}))?$/);if(!match)return value;const hour=Math.min(23,Math.max(0,Number(match[1]))),minute=Math.min(59,Math.max(0,Number(match[2]||0)));return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`};
  const hours=slots.reduce((total,slot)=>Math.max(0,total+(timeToMinutes(slot.to)-timeToMinutes(slot.from))/60),0);
  const period:Appliance['period']=slots.some(slot=>Number(slot.from.slice(0,2))<6||Number(slot.to.slice(0,2))>18)?(slots.some(slot=>Number(slot.from.slice(0,2))>=6&&Number(slot.from.slice(0,2))<18)?'Les deux':'Nuit'):'Jour';
  const effectiveWatts=measurement==='voltage'?Math.max(0,Math.round(voltage*current)):watts;
  const updateSlot=(index:number,key:'from'|'to',value:string)=>setSlots(slots.map((slot,current)=>current===index?{...slot,[key]:value}:slot));
  return <div className="overlay"><div className="modal applianceModal referenceModal">
    <div className="referenceModalHeader"><div><h1>{initial?'Modifier l’appareil':'Ajouter un appareil'}</h1><p>{initial?'Mettez à jour les caractéristiques et l’utilisation de cet appareil.':'Renseignez les caractéristiques et l’utilisation de l’appareil.'}</p></div><button className="close" aria-label="Fermer" onClick={close}><I.X size={23}/></button></div>
    <div className="referenceModalBody"><div className="referenceModalTop">
      <div className="referenceModalMain">
        <section className="modalTopDetails">
          <div className="deviceForm">
            <label>Quel appareil ajoutez-vous ?<div className="devicePicker" ref={devicePickerRef}><div className="deviceSelect searchableDeviceSelect">{selectedDevice?<ApplianceThumbnail name={name} variant="compact"/>:<I.Search className="deviceSearchIcon" size={19}/>}<input role="combobox" aria-expanded={deviceMenuOpen} aria-controls="appliance-options" aria-autocomplete="list" value={deviceQuery} onChange={event=>updateDeviceQuery(event.target.value)} onFocus={()=>setDeviceMenuOpen(true)} onBlur={()=>setDeviceMenuOpen(false)} onKeyDown={event=>{if(event.key==='Escape')setDeviceMenuOpen(false)}} placeholder="Rechercher ou saisir un appareil"/><button type="button" className="plain" aria-label="Afficher les appareils" onMouseDown={event=>event.preventDefault()} onClick={()=>setDeviceMenuOpen(!deviceMenuOpen)}><I.ChevronDown size={18}/></button></div>{deviceMenuOpen&&<div id="appliance-options" className="deviceOptions" role="listbox">{matchingOptions.length?matchingOptions.map(option=><button type="button" role="option" aria-selected={option.name===name} key={option.name} onMouseDown={event=>event.preventDefault()} onClick={()=>selectDevice(option)}><ApplianceThumbnail name={option.name} variant="compact"/><span>{option.name}</span></button>):<span className="noDeviceMatch">Aucun appareil correspondant — utilisez ce nom personnalisé.</span>}</div>}</div></label>
            <div className="applianceMetadata"><label>Marque<input value={brand} onChange={event=>setBrand(event.target.value)} placeholder="Ex. : Samsung"/></label><label>{metadata.label}<select disabled={!metadata.options.length} value={detail} onChange={event=>setDetail(event.target.value)}><option value="">{metadata.options.length?'Sélectionnez une option':'Non applicable à cet appareil'}</option>{metadata.options.map(option=><option key={option}>{option}</option>)}</select></label></div>
            <div className="appliancePhotos"><div><b>Photos de l’appareil <span>(optionnel)</span></b><small>Ajoutez jusqu’à 4 photos pour faciliter son identification.</small></div><input ref={imageInputRef} className="deviceImageInput" type="file" accept="image/*" multiple onChange={event=>{addImages(event.target.files);event.currentTarget.value=''}}/><button type="button" className="addAppliancePhotos" onClick={()=>imageInputRef.current?.click()} disabled={images.length>=4}><I.ImagePlus size={17}/> Ajouter des photos</button>{images.length>0&&<div className="devicePhotoPreviews">{images.map((image,index)=><div key={image}><img src={image} alt={`Photo ${index+1} de l’appareil`}/><button type="button" aria-label={`Supprimer la photo ${index+1}`} onClick={()=>setImages(current=>current.filter((_,photoIndex)=>photoIndex!==index))}><I.X size={13}/></button></div>)}</div>}</div>
            <div className="quantityLine"><div><b>Quantité</b><Stepper value={quantity} set={setQuantity}/></div><span>pièce(s)</span></div>
          </div>
          <div className={'preview appliancePreview '+(!selectedDevice?'emptyPreview':'')}>{selectedDevice?<><ApplianceThumbnail name={name} variant="preview"/><div className="previewTitle"><h2>{name}</h2><span>× {quantity}</span></div><p>{effectiveWatts} W / unité</p><p>{hours.toFixed(hours%1?1:0)} h / jour</p><hr/><small>Consommation estimée</small><strong>{fmt(effectiveWatts*hours*quantity)} / jour</strong></>:<><div className="emptyPreviewSpace"/><div className="previewTitle"><h2>—</h2><span>× 0</span></div><p>0 W / unité</p><p>0 h / jour</p><hr/><small>Consommation estimée</small><strong>0 Wh / jour</strong></>}</div>
        </section>
      </div></div>
      <section className="electricalSection"><h3>Caractéristiques électriques</h3><p>Renseignez la puissance de l’appareil.</p><div className="toggle"><button type="button" onClick={()=>setMeasurement('watts')} className={measurement==='watts'?'selected':''}><I.Zap size={17}/> Puissance en Watts (W)</button><button type="button" onClick={()=>setMeasurement('voltage')} className={measurement==='voltage'?'selected':''}><I.Gauge size={17}/> Tension (V) et courant (A)</button></div>{measurement==='watts'?<><label>Puissance<div className="powerInput"><input type="number" min="1" value={watts} onChange={event=>setWatts(Math.max(1,+event.target.value))}/><span>W</span></div></label>{name&&<div className="suggestedValue">Valeur suggérée pour une {name.toLowerCase()} <I.Info size={14}/></div>}</>:<div className="voltageCurrentFields"><label>Tension<div className="powerInput"><input aria-label="Tension en volts" type="number" min="0" value={voltage} onChange={event=>setVoltage(Math.max(0,+event.target.value))}/><span>V</span></div></label><label>Courant<div className="powerInput"><input aria-label="Courant en ampères" type="number" min="0" step="0.1" value={current} onChange={event=>setCurrent(Math.max(0,+event.target.value))}/><span>A</span></div></label><div className="calculatedPower">Puissance calculée <strong>{effectiveWatts} W</strong></div></div>}<div className="powerHelp"><I.Lightbulb size={22}/><span><b>Vous ne connaissez pas<br/>la puissance exacte ?</b><p>Vérifiez l’étiquette de l’appareil<br/>ou son manuel d’utilisation.</p></span></div></section>
        <section className="usageSection"><h3>Utilisation quotidienne</h3><p>Indiquez les créneaux d’utilisation de cet appareil.</p><div className="usageLayout"><div><b>Créneaux d’utilisation</b>{slots.map((slot,index)=><div className="timeSlot referenceTimeSlot" key={index}><input className="timeTextField" aria-label={`Début du créneau ${index+1}`} inputMode="numeric" placeholder="08:00" value={slot.from} onChange={event=>updateSlot(index,'from',event.target.value)} onBlur={event=>updateSlot(index,'from',normaliseTime(event.target.value))}/><span className="timeConnector">à</span><input className="timeTextField" aria-label={`Fin du créneau ${index+1}`} inputMode="numeric" placeholder="13:00" value={slot.to} onChange={event=>updateSlot(index,'to',event.target.value)} onBlur={event=>updateSlot(index,'to',normaliseTime(event.target.value))}/>{slots.length>1&&<button className="plain removeSlot" aria-label="Supprimer ce créneau" onClick={()=>setSlots(slots.filter((_,current)=>current!==index))}><I.Trash2 size={16}/></button>}</div>)}<div className="slotSummary"><button type="button" className="addSlot" onClick={()=>setSlots([...slots,{from:'15:00',to:'21:00'}])}><I.Plus size={15}/> Ajouter un créneau</button><span><b>{hours.toFixed(hours%1?1:0)} h</b> / jour</span></div></div></div><button type="button" className="notesToggle" aria-expanded={notesOpen} onClick={()=>setNotesOpen(!notesOpen)}>{notesOpen?<I.ChevronUp size={16}/>:<I.ChevronDown size={16}/>} Ajouter des notes (optionnel)</button>{notesOpen&&<label className="applianceNotes">Informations complémentaires<textarea value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Ex. : modèle, état de l’appareil ou toute information utile…"/></label>}</section>
    </div>
    <footer><Button secondary onClick={close}>Annuler</Button><Button disabled={!name.trim()} onClick={()=>{save({id:initial?.id||crypto.randomUUID(),name,category,watts:effectiveWatts,hours,quantity,period,slots,brand,detailLabel:metadata.label,detail,notes,images});close()}}>{initial?'Enregistrer les modifications':'Ajouter l’appareil'}</Button></footer>
  </div></div>
}
function Recommendation(){
  const nav=useNavigate();
  const {id}=useParams();
  const {items,quote,setQuote}=useData();
  const s=sizing(items);
  const project={...defaultProject(id),...store.get<SizingProject>(projectKey(id),{} as SizingProject)};
  const [configuration,setConfiguration]=useState('solar-first');
  const [tab,setTab]=useState<'why'|'technical'>('why');
  const [paymentMode,setPaymentMode]=useState<'cash'|'installments'>(quote.payment==='cash'?'cash':'installments');
  const [selectedPlanMonths,setSelectedPlanMonths]=useState(quote.plan);
  const applianceCount=items.reduce((count,item)=>count+item.quantity,0);
  const dailyKwh=(s.daily/1000).toFixed(2);
  const peakKw=(s.peak/1000).toFixed(2);
  const demandDaily=Math.max(s.daily/1000,.8);
  const demandPeak=Math.max(s.peak/1000,.6);
  const roundTo=(value:number,step:number)=>Math.ceil(value/step)*step;
  const number=(value:number)=>value.toLocaleString('fr-FR',{maximumFractionDigits:1}).replace(/\u202f/g,' ');
  const sourceModes=[
    {id:'grid-first',icon:I.Plug,title:'Solaire complémentaire',subtitle:'Le réseau est la source principale.',solarShare:35,backupDays:.25,gridRole:'Source principale',gridCopy:'Le solaire réduit la facture en journée.',inverterFactor:.8},
    {id:'solar-only',icon:I.SunMedium,title:'Solaire autonome',subtitle:'Le solaire est votre seule source d’énergie.',solarShare:100,backupDays:1,gridRole:'Hors réseau',gridCopy:'Toute l’énergie est produite et stockée sur place.',inverterFactor:1.2},
    {id:'solar-first',icon:I.SolarPanel,title:'Solaire prioritaire',subtitle:'Le solaire alimente d’abord, le réseau prend le relais.',solarShare:80,backupDays:.6,gridRole:'Réseau de secours',gridCopy:'Le réseau couvre les pointes et les jours moins ensoleillés.',inverterFactor:1}
  ];
  const configurations=sourceModes.map(mode=>{
    const solarEnergy=demandDaily*1.35*(mode.solarShare/100);
    const panelQuantity=Math.max(1,Math.ceil(solarEnergy/(.6*5.1*.78)));
    const solarKw=panelQuantity*.6;
    const batteryCapacity=roundTo(Math.max(1,demandDaily*mode.backupDays/.8),.5);
    const inverterKva=roundTo(Math.max(1.5,demandPeak*1.25*mode.inverterFactor),.5);
    const dailyProduction=solarKw*5.1*.78;
    const panelCost=panelQuantity*320;
    const batteryCost=Math.ceil(batteryCapacity/5)*950;
    const inverterCost=inverterKva<=2?420:inverterKva<=3?600:780;
    const priceNumber=panelCost+batteryCost+inverterCost+250;
    const autonomyLabel=mode.backupDays<1?`≈ ${Math.round(mode.backupDays*24)} h`:`≈ ${number(mode.backupDays)} jour${mode.backupDays>1?'s':''}`;
    return {...mode,solar:`${number(solarKw)} kWc`,battery:`${number(batteryCapacity)} kWh`,inverter:`${number(inverterKva)} kVA`,autonomy:`Réserve ${autonomyLabel}`,target:autonomyLabel,priceNumber,price:`${number(priceNumber)} $`,production:`≈ ${number(dailyProduction)} kWh / jour`,energy:`${number(solarEnergy)} kWh / jour`,panels:{value:`${panelQuantity} × 600 W`,details:`Couvre environ ${mode.solarShare} % de vos besoins`,tag:'Monocristallin'},storage:{value:`${number(batteryCapacity)} kWh LiFePO₄`,details:`Réserve utile pour ${autonomyLabel.replace('≈ ','')}`,tag:'48 V'},converter:{value:`${number(inverterKva)} kVA / 48 V`,details:'Protège vos appareils et gère les sources',tag:mode.gridRole}};
  });
  const selectedConfiguration=configurations.find(option=>option.id===configuration)??configurations[2];
  const equipment=[
    {icon:I.SunMedium, title:'Panneaux solaires', image:solarPanelsProduct, alt:'Panneaux solaires', tone:'sun', ...selectedConfiguration.panels},
    {icon:I.BatteryCharging, title:'Batterie', image:batteryProduct, alt:'Batterie solaire', tone:'battery', ...selectedConfiguration.storage},
    {icon:I.Activity, title:'Onduleur', image:inverterProduct, alt:'Onduleur solaire', tone:'inverter', ...selectedConfiguration.converter}
  ];
  const financedPlans=plans.map(plan=>{const total=Math.round(selectedConfiguration.priceNumber*plan.total/2850);const initialPayment=Math.round(total*.1);return {...plan,total,initialPayment,monthly:(total-initialPayment)/plan.months}});
  const selectedPlan=financedPlans.find(plan=>plan.months===selectedPlanMonths)??financedPlans[1];
  const money=(value:number)=>`${value.toLocaleString('fr-FR',{minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).replace(/\u202f/g,' ')} $`;
  const metrics=[
    {icon:I.Zap, title:'Production solaire estimée', value:selectedConfiguration.production, copy:'En moyenne annuelle', tone:'orange'},
    {icon:I.SunMedium, title:'Part solaire', value:`${selectedConfiguration.solarShare} %`, copy:'De vos besoins quotidiens', tone:'green'},
    {icon:I.BatteryCharging, title:'Réserve batterie', value:selectedConfiguration.target, copy:'En cas de coupure ou de faible soleil', tone:'green'},
    {icon:I.Plug, title:'Rôle du réseau', value:selectedConfiguration.gridRole, copy:selectedConfiguration.gridCopy, tone:'slate'}
  ];
  const title=project.company?project.customerName:project.locationName;
  return <section className="page recommendationPage">
    <div className="recommendationHeading">
      <div><h1>Système recommandé <span className="recommendationBadge">Recommandé par Djúa</span></h1><p>Basé sur {applianceCount} appareils　•　{dailyKwh} kWh/jour　•　{project.city}</p></div>
    </div>
    <div className="recommendationLayout">
      <div className="recommendationMain">
        <section className="recommendationCard configurationCard">
          <h2>Choisir le rôle de chaque source d’énergie</h2>
          <div className="configurationOptions">{configurations.map(({id:optionId,icon:Icon,title:optionTitle,subtitle,solar,battery,inverter,autonomy})=><button type="button" key={optionId} onClick={()=>setConfiguration(optionId)} className={'configurationOption '+(configuration===optionId?'selected':'')}>
            <span className="configurationTop"><i><Icon size={18}/></i><b>{optionTitle}</b></span>{configuration===optionId&&<I.CheckCircle2 className="configurationCheck" size={20}/>}<small>{subtitle}</small><strong><span>{solar}</span><span>{battery}</span><span>{inverter}</span></strong><em>{autonomy}</em>
          </button>)}</div>
        </section>
        <section className="recommendationCard compositionCard">
          <h2>Composition du système recommandé</h2>
          <div className="compositionGrid">{equipment.map(({icon:Icon,title:equipmentTitle,image,alt,value,details,tag,tone})=><div key={equipmentTitle} className="equipmentCard">
            <span className={'equipmentIcon '+tone}><Icon size={22}/></span><b>{equipmentTitle}</b><div className="equipmentProduct"><span className={'equipmentSketch '+tone}><img src={image} alt={alt}/></span><span><strong>{value}</strong><small>{details}</small><em>{tag}</em></span></div>
          </div>)}</div>
        </section>
        <section className="systemMetrics">{metrics.map(({icon:Icon,title:metricTitle,value,copy,tone})=><div key={metricTitle}><i className={tone}><Icon size={27}/></i><span><small>{metricTitle}</small><strong>{value}</strong><em>{copy}</em></span></div>)}</section>
        <section className="recommendationCard detailsCard">
          <div className="detailsTabs"><button className={tab==='why'?'active':''} onClick={()=>setTab('why')}>Pourquoi cette configuration ?</button><button className={tab==='technical'?'active':''} onClick={()=>setTab('technical')}>Détails techniques</button></div>
          {tab==='why'?<div className="detailsContent"><div className="calculationSummary"><h3>Résumé du calcul</h3><dl><div><dt>Consommation quotidienne (client)</dt><dd>{dailyKwh} kWh</dd></div><div><dt>Part couverte par le solaire</dt><dd>{selectedConfiguration.solarShare} %</dd></div><div><dt>Rôle du réseau électrique</dt><dd>{selectedConfiguration.gridRole}</dd></div><div><dt>Pertes et marge de sécurité</dt><dd>+ 35 %</dd></div><div><dt>Énergie solaire à produire</dt><dd>{selectedConfiguration.energy}</dd></div><div><dt>Irradiation solaire utilisée (PSH)</dt><dd>5.1 h / jour</dd></div><div><dt>Puissance solaire proposée</dt><dd>{selectedConfiguration.solar}</dd></div></dl></div><div className="knowMore"><I.Lightbulb size={22}/><div><h3>Bon à savoir</h3><p>{selectedConfiguration.gridCopy} Cette option prévoit une réserve d’environ {selectedConfiguration.target} pour vos usages essentiels.</p></div></div></div>:<div className="technicalDetails"><div><I.SolarPanel/><b>{selectedConfiguration.solar} de panneaux solaires</b><small>Dimensionnés pour couvrir environ {selectedConfiguration.solarShare} % de votre consommation à {project.city}.</small></div><div><I.BatteryFull/><b>{selectedConfiguration.battery} de stockage LiFePO₄</b><small>Réserve utile estimée à {selectedConfiguration.target} selon le mode choisi.</small></div><div><I.Power/><b>Onduleur hybride {selectedConfiguration.inverter}</b><small>{selectedConfiguration.gridCopy}</small></div></div>}
        </section>
      </div>
      <aside className="recommendationRail">
        <section className="railCard energySummary"><div className="railTitle"><h2>Résumé énergétique</h2><button onClick={()=>nav(`/dimensionnements/${id||'jean'}/appareils`)}><span>Modifier</span><I.Pencil size={14}/></button></div><dl><div><dt>Consommation quotidienne</dt><dd>{dailyKwh} kWh / jour</dd></div><div><dt>Puissance simultanée</dt><dd>{peakKw} kW</dd></div><div><dt>Mode d’alimentation</dt><dd>{selectedConfiguration.title}</dd></div><div><dt>Rôle du réseau</dt><dd>{selectedConfiguration.gridRole}</dd></div><div><dt>Réserve cible</dt><dd>{selectedConfiguration.target}</dd></div></dl></section>
        <section className="railCard paymentMethod">
          <h2>Mode de paiement</h2>
          <div className="paymentTabs"><button className={paymentMode==='cash'?'active':''} onClick={()=>{setPaymentMode('cash');setQuote({...quote,payment:'cash'})}}>Comptant</button><button className={paymentMode==='installments'?'active':''} onClick={()=>{setPaymentMode('installments');setQuote({...quote,payment:'plan'})}}>Paiement échelonné</button></div>
          {paymentMode==='cash'?<div className="cashPayment"><div className="paymentHeading"><i><I.CreditCard size={20}/></i><h3>Paiement comptant</h3></div><div className="paymentPrice"><span>Prix du système</span><b>{selectedConfiguration.price}</b></div><hr/><div className="paymentTotal"><span>Total à payer<small>Paiement unique</small></span><strong>{selectedConfiguration.price}</strong></div><p>Le client règle la totalité du montant en un seul paiement.</p><ul><li><I.Check size={14}/> Aucun paiement mensuel</li><li><I.Check size={14}/> Aucun coût de financement</li></ul></div>:<div className="installmentPayment"><p>Choisissez une durée</p><div className="durationOptions">{financedPlans.map(plan=>{const isSelected=selectedPlanMonths===plan.months;return <button key={plan.months} className={isSelected?'selected':''} onClick={()=>{setSelectedPlanMonths(plan.months);setQuote({...quote,payment:'plan',plan:plan.months})}}><span className="durationTitle"><i>{isSelected?<I.CheckCircle2 size={17}/>:<I.Circle size={17}/>}</i>{plan.months} mois {plan.months===24&&<em>Populaire</em>}</span><strong>{money(plan.monthly)} / mois</strong><small>Total à payer : {money(plan.total)}</small><small>Paiement initial : {money(plan.initialPayment)} (10 %)</small></button>})}</div><div className="paymentPlanDetail"><h3>Détail du plan sélectionné ({selectedPlan.months} mois)</h3><dl><div><dt>Paiement initial (aujourd’hui)</dt><dd>{money(selectedPlan.initialPayment)}</dd></div><div><dt>Puis {selectedPlan.months} mensualités de</dt><dd>{money(selectedPlan.monthly)} / mois</dd></div><div><dt>Prochaine échéance</dt><dd>28 sept. 2026</dd></div></dl><hr/><div className="planCost"><span>Coût du paiement échelonné</span><b>{money(selectedPlan.total-selectedConfiguration.priceNumber)}</b></div><div className="paymentTotal"><span>Total à payer sur {selectedPlan.months} mois</span><strong>{money(selectedPlan.total)}</strong></div></div></div>}
        </section>
        <div className="recommendationQuoteActions"><Button secondary><I.Bookmark size={16}/> Enregistrer comme brouillon</Button><Button onClick={()=>nav('/devis/oe-2026-00847/edit')}>Générer le devis <I.ArrowRight size={18}/></Button></div>
      </aside>
    </div>
  </section>
}
function Product({icon,title,text}:{icon:string,title:string,text:string}){const Icon=icon==='☀️'?I.SunMedium:icon==='🔋'?I.BatteryCharging:I.Power;return <div className="product"><i><Icon size={25}/></i><b>{title}</b><small>{text}</small></div>}
const equipment=[['☀️','Panneau solaire 600 W','Monocristallin',4,320],['🔋','Batterie LiFePO₄ 5 kWh','48 V · Énergie utile 4 kWh',1,950],['▣','Onduleur hybride 3 kVA','48 V · Puissance continue 2.4 kW',1,420]]
function QuoteEdit(){
  const nav=useNavigate();
  const {quote,items}=useData();
  const plan=plans.find(item=>item.months===quote.plan)!;
  const applianceCount=items.reduce((total,item)=>total+item.quantity,0)||12;
  const dailyConsumption=items.length?fmt(sizing(items).daily):'3.84 kWh';
  const quoteItems=[
    {name:'Panneaux solaires', detail:'Jinko Solar · Monocristallin · 600 W', reason:'Produisent l’électricité pour vos usages quotidiens.', badge:'Performance élevée', image:solarPanelsProduct, quantity:4, unit:320, total:1280},
    {name:'Batterie', detail:'Pylontech · LiFePO₄ · 5 kWh', reason:'Stocke l’énergie pour alimenter la maison le soir et la nuit.', badge:'Longue durée de vie', image:batteryProduct, quantity:1, unit:950, total:950},
    {name:'Onduleur', detail:'Deye · Hybride · 3 kVA', reason:'Alimente vos appareils avec une énergie stable et adaptée.', badge:'Haute fiabilité', image:inverterProduct, quantity:1, unit:420, total:420}
  ];
  const services=[
    {name:'Installation et mise en service', reason:'Installation, raccordement et vérification par un technicien.', image:installationServiceKit, price:150},
    {name:'Câbles et connectique', reason:'Relient les équipements de façon sûre et durable.', image:solarCableKit, price:30},
    {name:'Structure de fixation', reason:'Maintient les panneaux solidement fixés sur le toit.', image:solarMountingKit, price:20}
  ];
  const displayTotal=quote.payment==='cash'?2850:plan.total;
  const initialPayment=Math.round(plan.total*.1);
  const monthlyPayment=(plan.total-initialPayment)/plan.months;
  const paymentMoney=(value:number)=>`${value.toLocaleString('fr-FR',{minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).replace(/\u202f/g,' ')} $`;
  return <section className="page quoteEditPage">
    <div className="quoteEditWorkspace">
      <div className="quoteEditMain">
        <div className="quoteEditDocumentHeader docHeader"><div className="orangeLogo">Orange <b>Énergie</b></div><b>DEVIS N° OE-2026-00847<br/><Badge text="Brouillon"/></b></div>
        <div className="quoteEditClientLine clientline"><div className="quoteEditMetaItem"><i><I.UserRound size={17}/></i><span><small>Client</small><b>Jean Kabeya</b><em>Maison individuelle · Kinshasa, RDC</em></span></div><div className="quoteEditMetaItem"><i><I.BriefcaseBusiness size={17}/></i><span><small>Préparé par</small><b>Chris M.</b><em>Commercial</em></span></div><div className="quoteEditMetaItem"><i><I.CalendarDays size={17}/></i><span><small>Date du devis</small><b>28 août 2026</b></span></div><div className="quoteEditMetaItem"><i><I.Clock3 size={17}/></i><span><small>Validité du devis</small><b>28 sept. 2026</b><em>30 jours</em></span></div></div>
        <section className="quoteEditCard quoteDetailTable"><div className="quoteDetailTableHead"><span>Élément</span><span>Détails</span><span>Qté</span><span>Prix unitaire</span><span>Total</span></div>{quoteItems.map(item=><div className="quoteDetailProductRow" key={item.name}><span className="quoteDetailProduct"><img src={item.image} alt=""/><span><b>{item.name}</b><small>{item.detail}</small></span></span><span className="quoteItemReason"><Badge text={item.badge}/><small>{item.reason}</small></span><span>{item.quantity}</span><span>{item.unit} $</span><strong>{item.total.toLocaleString('fr-FR')} $</strong></div>)}{services.map(({name,reason,image,price})=><div className="quoteDetailServiceRow" key={name}><span><img src={image} alt=""/>{name}</span><span className="quoteItemReason"><small>{reason}</small></span><span></span><span>forfait</span><strong>{price} $</strong></div>)}<div className="quoteDetailTotal"><span>TOTAL DU SYSTÈME</span><strong>2 850 $</strong></div></section>
        <section className="quoteRecallCard"><h2>Rappel du système recommandé</h2><div className="quoteRecallContent"><div className="quoteRecallVisual"><img src={solarKit} alt="Système solaire recommandé"/></div><div className="quoteRecallBenefits"><div><i><I.ShieldCheck size={22}/></i><b>Énergie fiable</b><small>Pour tous vos appareils essentiels</small></div><div><i><I.BatteryCharging size={22}/></i><b>Autonomie</b><small>≈ 1 jour<br/>Même sans soleil</small></div><div><i><I.ChartNoAxesCombined size={22}/></i><b>Évolutif</b><small>Vous pourrez ajouter plus tard</small></div><div><i><I.BadgeCheck size={22}/></i><b>Garantie</b><small>Jusqu’à 10 ans<br/>sur les équipements</small></div></div></div></section>
        <div className="quoteAdvisor"><I.Lightbulb size={22}/><span><b>Conseil Djúa</b><p>Ce système couvre confortablement vos besoins actuels. Vous pourrez toujours ajouter des équipements plus tard si nécessaire.</p></span></div>
      </div>
      <aside className="quoteEditRail">
        <section className="quoteRailCard"><h2>Résumé du dimensionnement</h2><div className="quoteClient"><i><I.UserRound size={20}/></i><span><b>Jean Kabeya</b><small>Maison individuelle · Kinshasa, RDC</small></span></div><dl className="quoteSizingRows"><div><dt><I.ListChecks size={16}/> Appareils</dt><dd>{applianceCount} appareils</dd></div><div><dt><I.Zap size={16}/> Consommation estimée</dt><dd>{dailyConsumption} / jour</dd></div><div><dt><I.SolarPanel size={16}/> Système recommandé</dt><dd>2.4 kWc · 5 kWh</dd></div></dl></section>
        <section className="quoteRailCard"><h2>Mode de paiement</h2>{quote.payment==='cash'?<div className="quoteCash"><div><i><I.CreditCard size={18}/></i><b>Paiement comptant</b></div><p>Le client règle la totalité du montant en un seul paiement.</p><strong>Total à payer <span>2 850 $</span></strong></div>:<div className="quoteChosenPlan"><div className="quoteChosenPlanHeading"><i><I.CalendarClock size={19}/></i><span><b>Paiement échelonné</b><small>Choix effectué lors de la recommandation</small></span></div><dl><div><dt>Durée choisie</dt><dd>{plan.months} mois</dd></div><div><dt>Paiement initial (10 %)</dt><dd>{paymentMoney(initialPayment)}</dd></div><div><dt>Mensualité</dt><dd>{paymentMoney(monthlyPayment)} / mois</dd></div><div><dt>Coût du financement</dt><dd>{(plan.total-2850).toLocaleString('fr-FR')} $</dd></div></dl><strong>Total à payer <span>{plan.total.toLocaleString('fr-FR')} $</span></strong></div>}</section>
        <section className="quoteRailCard quoteActionsCard"><h2>Actions</h2><div className="quoteActionButtons"><Button><I.Download size={16}/> Télécharger le devis (PDF)</Button><Button secondary><I.Printer size={16}/> Imprimer</Button><Button secondary><I.Share2 size={16}/> Partager au client</Button><Button secondary><I.Mail size={16}/> Envoyer par email</Button></div></section>
        <div className="quoteEditActions"><Button onClick={()=>nav('/devis')}><I.Save size={16}/> Enregistrer le devis et quitter</Button></div>
        <small className="quotePriceNote">Les prix sont indicatifs et peuvent changer. Total sélectionné : {displayTotal.toLocaleString('fr-FR')} $.</small>
      </aside>
    </div>
  </section>
}
function Payment({quote,setQuote,plan}:{quote:Quote,setQuote:(q:Quote)=>void,plan:{months:number,monthly:number,total:number}}){return <aside className="payment"><Card title="Résumé du devis"><b>Jean Kabeya</b><p>Kinshasa, RDC · Maison individuelle</p><hr/><p>Matériel <b>2 650 $</b></p><p>Installation <b>150 $</b></p><p>Accessoires <b>50 $</b></p><h2>Prix du système <strong className="orange">2 850 $</strong></h2></Card><Card title="Mode de paiement"><div className="toggle"><button className={quote.payment==='cash'?'selected':''} onClick={()=>setQuote({...quote,payment:'cash'})}>Comptant</button><button className={quote.payment==='plan'?'selected':''} onClick={()=>setQuote({...quote,payment:'plan'})}>Paiement échelonné</button></div>{quote.payment==='cash'?<div className="cash"><h2>💳 Paiement comptant</h2><p>Prix du système <b>2 850 $</b></p><hr/><h2>Total à payer <strong>2 850 $</strong></h2><p>Paiement unique</p></div>:<><p>Choisissez une durée</p>{plans.map(p=><button className={'plan '+(quote.plan===p.months?'selected':'')} onClick={()=>setQuote({...quote,plan:p.months})} key={p.months}>◯　<b>{p.months} mois</b>{p.months===24&&<Badge text="Populaire"/>}<strong>{p.monthly} $ / mois</strong><small>Total à payer : {p.total} $</small></button>)}<div className="planDetail"><b>Paiement échelonné · {plan.months} mois</b><p>Premier paiement (aujourd’hui) <strong>{plan.monthly} $</strong></p><p>Puis {plan.months-1} mensualités de <strong>{plan.monthly} $ / mois</strong></p><p>Prochaine échéance <strong>28 sept. 2026</strong></p><hr/><p>Coût du paiement échelonné <strong>{plan.total-2850} $</strong></p><h2>Total à payer <strong className="orange">{plan.total} $</strong></h2></div></>}</Card></aside>}
function QuotePreview(){const nav=useNavigate();const {quote,setQuote}=useData();const plan=plans.find(x=>x.months===quote.plan)!;return <Page title="Devis généré" sub="Ce devis est prêt à être partagé avec le client."><div className="quotePreview"><Card className="document"><div className="docHeader"><div className="orangeLogo">Orange <b>Énergie</b></div><b>DEVIS N° OE-2026-00847<br/><Badge text="Prêt"/></b></div><div className="clientline">👤 <b>Jean Kabeya<small>Maison individuelle<br/>Kinshasa, RDC</small></b><span>▣ Date du devis<br/><b>28 août 2026</b></span><span>◷ Validité du devis<br/><b>28 sept. 2026 (30 jours)</b></span></div><div className="solution"><h3>Votre solution solaire</h3><div className="equipment">{equipment.map(e=><Product key={e[1]} icon={e[0] as string} title={String(e[3])+' '+String(e[1]).replace('Panneau solaire 600 W','panneaux solaires')} text={String(e[2])}/>)}</div><b>⚡ Autonomie estimée<br/><strong>≈ 1 jour</strong></b></div><QuoteTable/><h2 className="sum">TOTAL DU SYSTÈME <strong>2 850 $</strong></h2></Card><aside><Card title="Actions"><Button>▧ Télécharger le devis (PDF)</Button><Button secondary>▣ Imprimer</Button><Button secondary>⌘ Partager au client</Button><Button secondary>✉ Envoyer par email</Button></Card><Card title="Mode de paiement">{quote.payment==='cash'?<h2>Paiement comptant<br/><strong className="orange">2 850 $</strong></h2>:<div className="planDetail"><b>📅 Paiement échelonné</b><p>Durée <strong>{plan.months} mois</strong></p><p>Mensualité <strong>{plan.monthly} $ / mois</strong></p><p>Premier paiement <strong>{plan.monthly} $</strong></p><p>Coût du paiement échelonné <strong>{plan.total-2850} $</strong></p><h2>Total à payer <strong className="orange">{plan.total} $</strong></h2></div>}</Card><Card title="Prochaine étape"><p>Finalisez ce devis pour l'enregistrer définitivement et le transmettre au client.</p><Button onClick={()=>{setQuote({...quote,status:'Finalisé',activities:[...quote.activities,'Devis finalisé']});nav('/devis/oe-2026-00847/share')}}>✓ Finaliser le devis</Button><Button secondary onClick={()=>nav('/devis/oe-2026-00847/edit')}>Retourner à l'édition</Button></Card></aside></div></Page>}
function QuoteTable(){return <table className="quotetable"><thead><tr><th>Élément</th><th>Détails</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody>{equipment.map(e=><tr key={e[1]}><td>{e[0]}　<b>{e[1]}</b><small>{e[2]}</small></td><td><Badge text="Performance élevée"/></td><td>{e[3]}</td><td>{e[4]} $</td><td><b>{(e[3] as number)*(e[4] as number)} $</b></td></tr>)}{[['Installation et mise en service',150],['Câbles et connectique',30],['Structure de fixation',20]].map(x=><tr key={x[0]}><td>🔧　{x[0]}</td><td></td><td>1</td><td>forfait</td><td><b>{x[1]} $</b></td></tr>)}</tbody></table>}
function Share(){const nav=useNavigate();const {quote,setQuote}=useData();const share=(what:string)=>{setQuote({...quote,status:'Partagé',activities:[...quote.activities,what]});nav('/devis/oe-2026-00847')};return <Page title="✓ Devis finalisé avec succès !" sub="Le devis est enregistré définitivement et prêt à être partagé avec le client."><div className="work"><div><h2>Partagez ce devis avec votre client</h2><p className="muted">Choisissez le canal qui vous convient le mieux.</p><div className="shareCards"><button className="whatsapp" onClick={()=>share('Devis envoyé par WhatsApp')}><i>◉</i><b>WhatsApp <Badge text="Recommandé"/><small>Envoyer le devis au client via WhatsApp<br/>+243 81 234 5678</small></b><strong>Envoyer sur WhatsApp　→</strong></button><button onClick={()=>share('Devis envoyé par e-mail')}><i>✉</i><b>E-mail<small>Envoyer le devis par e-mail<br/>jean.kabeya@email.com</small></b><span>Envoyer par e-mail　›</span></button><button onClick={()=>share('Lien du devis copié')}><i>🔗</i><b>Copier le lien<small>Partager un lien sécurisé du devis</small></b><span>Copier le lien　⧉</span></button><button><i>▧</i><b>Télécharger le PDF<small>Pour impression ou partage</small></b><span>Télécharger le PDF</span></button></div><div className="advice">💡 Le client pourra consulter le devis et nous contacter pour toute question.</div></div><QuoteSummary quote={quote}/></div></Page>}
function QuoteSummary({quote}:{quote:Quote}){const p=plans.find(x=>x.months===quote.plan)!;return <aside className="payment"><Card title="Résumé du devis"><img className="quoteSolarKit" src={solarKit} alt="Équipements solaires"/><p>4 panneaux solaires (600 W)</p><p>1 batterie (5 kWh)</p><p>1 onduleur hybride (3 kVA)</p><hr/><h3>Total du système　2 850 $</h3></Card><Card title="Paiement"><div className="planDetail"><b>{quote.payment==='cash'?'💳 Paiement comptant':'📅 Paiement échelonné'}</b>{quote.payment==='plan'&&<><p>{p.months} mois · {p.monthly} $ / mois</p><p>Coût du paiement échelonné <strong>{p.total-2850} $</strong></p><h2>Total à payer <strong className="orange">{p.total} $</strong></h2></>}</div></Card></aside>}
function QuoteRowActions({status,onOpen}:{status:Status;onOpen:()=>void}){
  const [open,setOpen]=useState(false);
  const actions:Record<Status,{label:string;icon:React.ElementType}[]>={
    Brouillon:[{label:'Reprendre le devis',icon:I.FilePenLine},{label:'Voir le récapitulatif',icon:I.ClipboardList}],
    Finalisé:[{label:'Envoyer au client',icon:I.Send},{label:'Voir le devis',icon:I.Eye},{label:'Dupliquer le devis',icon:I.Copy}],
    Partagé:[{label:'Relancer le client',icon:I.MessageCircle},{label:'Envoyer un e-mail',icon:I.Mail},{label:'Voir le suivi',icon:I.Eye}],
    Accepté:[{label:'Créer le dossier',icon:I.FolderOpen},{label:'Planifier l’installation',icon:I.CalendarDays},{label:'Voir le suivi',icon:I.Eye}],
    Refusé:[{label:'Voir le retour client',icon:I.MessageSquareMore},{label:'Planifier une relance',icon:I.CalendarClock},{label:'Dupliquer le devis',icon:I.Copy}],
    Expiré:[{label:'Mettre à jour le devis',icon:I.RefreshCw},{label:'Dupliquer le devis',icon:I.Copy},{label:'Voir les détails',icon:I.Eye}]
  };
  return <span className="quoteRowActions" onClick={event=>event.stopPropagation()}><button type="button" className="quoteRowActionsTrigger" aria-label="Actions du devis" aria-expanded={open} onClick={()=>setOpen(current=>!current)}><I.MoreHorizontal size={19}/></button>{open&&<div className="quoteRowActionsMenu" role="menu">{actions[status].map(({label,icon:Icon})=><button type="button" role="menuitem" key={label} onClick={()=>{setOpen(false);onOpen()}}><Icon size={16}/>{label}</button>)}</div>}</span>
}
function QuoteList(){
  const nav=useNavigate();
  const {quote}=useData();
  const [search,setSearch]=useState('');
  const [activeFilter,setActiveFilter]=useState('Tous (24)');
  const [followUpsOpen,setFollowUpsOpen]=useState(false);
  const total=quote.payment==='plan'?plans.find(plan=>plan.months===quote.plan)!.total:3480;
  const filters=['Tous (24)','Brouillon (5)','Finalisé (3)','Partagé (8)','Accepté (8)','Refusé (1)','Expiré (1)'];
  const quotes=[
    {id:'OE-2026-00847',date:'28 août 2026',client:'Jean Kabeya',type:'Particulier',amount:total,payment:'24 mois',monthly:'145 $/mois',status:quote.status==='Brouillon'?'Partagé':quote.status,action:'Relancer aujourd’hui',actionCopy:'Sans réponse depuis 4 jours',tone:'urgent'},
    {id:'OE-2026-00851',date:'29 août 2026',client:'Kivu Market SARL',type:'Entreprise',amount:8750,payment:'Comptant',monthly:'',status:'Partagé',action:'Relance e-mail prévue',actionCopy:'',tone:''},
    {id:'OE-2026-00852',date:'30 août 2026',client:'Sarah Ilunga',type:'Particulier',amount:2150,payment:'Comptant',monthly:'',status:'Brouillon',action:'Terminer le devis',actionCopy:'',tone:''},
    {id:'OE-2026-00839',date:'25 août 2026',client:'Martin Paluku',type:'Particulier',amount:4200,payment:'24 mois',monthly:'175 $/mois',status:'Accepté',action:'Créer le dossier',actionCopy:'Passer à l’installation',tone:'urgent'},
    {id:'OE-2026-00838',date:'22 août 2026',client:'Clinique Bondeko',type:'Entreprise',amount:6300,payment:'24 mois',monthly:'263 $/mois',status:'Finalisé',action:'Envoyer au client',actionCopy:'',tone:''},
    {id:'OE-2026-00833',date:'21 août 2026',client:'Patrick Mbuyi',type:'Particulier',amount:5600,payment:'Comptant',monthly:'',status:'Refusé',action:'Archiver le devis',actionCopy:'Refus confirmé le 21 août',tone:''},
    {id:'OE-2026-00824',date:'18 août 2026',client:'École Horizon',type:'Établissement',amount:3900,payment:'24 mois',monthly:'163 $/mois',status:'Expiré',action:'Renouveler le devis',actionCopy:'Validité expirée le 18 août',tone:''}
  ];
  const filterStatus=activeFilter.split(' ')[0];
  const visibleQuotes=quotes.filter(item=>`${item.id} ${item.client}`.toLowerCase().includes(search.toLowerCase())&&(filterStatus==='Tous'||item.status===filterStatus));
  const money=(value:number)=>`${value.toLocaleString('fr-FR').replace(/\u202f/g,' ')} $`;
  return <section className="page workspacePage quoteListPage">
    <header className="workspaceHeading workspacePageHeader quoteListIntro"><div><h1>Devis</h1><p>Suivez vos propositions commerciales et les clients à relancer.</p></div><div className="workspaceActions"><ExportMenu title="Liste des devis" fileName="liste-des-devis" columns={['N° devis','Client','Type','Montant','Paiement','Statut','Date']} rows={quotes.map(item=>[item.id,item.client,item.type,money(item.amount),item.payment,item.status,item.date])}/><button type="button" className="workspacePrimaryAction" onClick={()=>nav('/dimensionnements/nouveau/client')}><I.Plus size={17}/>Nouveau devis</button></div></header>
    <section className="quoteMetricGrid">
      <article className="quoteMetricCard pipelineMetric"><div className="metricHeading"><i className="orange"><I.FileText size={22}/></i><span><small>Devis en cours</small><b>24</b></span><em><I.TrendingUp size={14}/> +12%</em></div><div className="metricFoot"><span>Propositions actives</span><b>5 brouillons à terminer</b></div><div className="metricTrack"><i style={{width:'72%'}}/></div></article>
      <article className="quoteMetricCard followMetric"><div className="metricHeading"><i className="orange"><I.BellRing size={22}/></i><span><small>À relancer</small><b>6</b></span><em><I.Clock3 size={14}/> Priorité</em></div><div className="metricFoot"><span>2 relances prévues aujourd’hui</span><b>Réponse attendue</b></div><div className="metricTrack"><i style={{width:'38%'}}/></div></article>
      <article className="quoteMetricCard acceptedMetric"><div className="metricHeading"><i className="green"><I.CheckCircle2 size={22}/></i><span><small>Acceptés</small><b>8</b></span><em><I.Sparkles size={14}/> Ce mois-ci</em></div><div className="metricFoot"><span>Taux d’acceptation</span><b>33 %</b></div><div className="metricTrack"><i style={{width:'33%'}}/></div></article>
      <article className="quoteMetricCard valueMetric"><div className="metricHeading"><i className="blue"><I.BarChart3 size={22}/></i><span><small>Valeur en attente</small><b>18 450 $</b></span><em><I.CircleDollarSign size={14}/> À suivre</em></div><div className="metricFoot"><span>Montants des devis actifs</span><b>24 opportunités</b></div><div className="metricTrack"><i style={{width:'64%'}}/></div></article>
    </section>
    <section className={'followUpPanel '+(followUpsOpen?'open':'collapsed')}>
      <header><button type="button" className="followUpToggle" onClick={()=>setFollowUpsOpen(current=>!current)} aria-expanded={followUpsOpen}><i><I.Bell size={23}/></i><span><h2>À relancer aujourd’hui</h2><p>Reprenez contact avec les clients qui attendent une réponse.</p></span><I.ChevronDown className="followUpChevron" size={19}/></button><div><button type="button" className="viewAll">Voir tout</button><b>2 actions</b></div></header>
      {followUpsOpen&&<div className="followUpRows">
        <div className="followUpRow"><i className="followAvatar person"><I.UserRound size={22}/></i><span><b>Jean Kabeya <em>À relancer</em></b><small>Devis OE-2026-00847 · {money(total)}</small><small>Aucune réponse depuis 4 jours · WhatsApp</small></span><div className="followUpActions"><Button secondary onClick={()=>nav('/devis/oe-2026-00847')}><I.MessageCircle size={18}/> Relancer sur WhatsApp</Button><Button secondary><I.Phone size={18}/> Appeler</Button><button type="button" className="moreAction"><I.MoreHorizontal size={20}/></button></div></div>
        <div className="followUpRow"><i className="followAvatar company"><I.Building2 size={22}/></i><span><b>Kivu Market SARL</b><small>Devis OE-2026-00851 · 8 750 $</small><small>Relance prévue aujourd’hui · E-mail</small></span><div className="followUpActions"><Button secondary><I.Mail size={18}/> Envoyer un e-mail</Button><Button secondary><I.Search size={18}/> Voir le suivi</Button><button type="button" className="moreAction"><I.MoreHorizontal size={20}/></button></div></div>
      </div>}
    </section>
    <section className="allQuotesPanel">
      <div className="allQuotesTop"><h2>Tous les devis</h2><div><button type="button" className="ownerFilter"><I.UserRound size={16}/> Mes devis <I.ChevronDown size={15}/></button><label className="quoteSearch"><I.Search size={17}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Rechercher un devis, client, numéro…"/></label></div></div>
      <div className="quoteTabs">{filters.map(filter=><button type="button" className={activeFilter===filter?'active':''} onClick={()=>setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
      <div className="quoteDataTable"><div className="quoteDataHeader"><span><input aria-label="Sélectionner tous les devis" type="checkbox"/></span><span>Devis</span><span>Client</span><span>Montant</span><span>Paiement</span><span>Statut</span><span>Prochaine action</span><span>Date <I.ArrowDown size={14}/></span><span><I.MoreHorizontal size={18}/></span></div>{visibleQuotes.map(item=><div className="quoteDataRow" role="link" tabIndex={0} key={item.id} onClick={()=>nav('/devis/'+item.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();nav('/devis/'+item.id)}}}><span onClick={event=>event.stopPropagation()}><input aria-label={`Sélectionner ${item.id}`} type="checkbox"/></span><span><b>{item.id}</b><small>{item.date}</small></span><span><b>{item.client}</b><small>{item.type}</small></span><strong>{money(item.amount)}</strong><span>{item.payment}<small>{item.monthly}</small></span><span><em className={'quoteStatus '+item.status.toLowerCase()}>{item.status}</em></span><span className={item.tone}><b>{item.action}</b><small>{item.actionCopy}</small></span><span>{item.date}</span><QuoteRowActions status={item.status as Status} onOpen={()=>nav('/devis/'+item.id)}/></div>)}</div>
      <footer><small>Affichage de {visibleQuotes.length} devis sur 24</small><div className="pagination"><button type="button"><I.ChevronLeft size={17}/></button><button type="button" className="active">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button type="button">5</button><button type="button"><I.ChevronRight size={17}/></button></div></footer>
    </section>
  </section>
}
function Tracking(){
  const {quote,setQuote}=useData();
  const {id='OE-2026-00847'}=useParams();
  const baseQuote=quoteDirectory[id]||quoteDirectory['OE-2026-00847'];
  const detail={...baseQuote,status:id==='OE-2026-00847'?(quote.status==='Brouillon'?'Partagé':quote.status):baseQuote.status,amount:id==='OE-2026-00847'?(quote.payment==='plan'?plans.find(plan=>plan.months===quote.plan)!.total:2850):baseQuote.amount};
  const [tab,setTab]=useState('Suivi du devis');
  const [relance,setRelance]=useState('Dans 3 jours');
  const [channel,setChannel]=useState('WhatsApp');
  const [note,setNote]=useState('Revenir vers lui après discussion avec sa femme');
  const [decision,setDecision]=useState<QuoteDecision>(()=>detail.status==='Accepté'?'accepted':detail.status==='Refusé'?'refused':'pending');
  useEffect(()=>setDecision(detail.status==='Accepté'?'accepted':detail.status==='Refusé'?'refused':'pending'),[id,detail.status]);
  const add=(activity:string)=>setQuote({...quote,activities:[...quote.activities,activity]});
  const updateDecision=(next:QuoteDecision)=>{setDecision(next);if(id==='OE-2026-00847'&&next!=='pending')setQuote({...quote,status:next==='accepted'?'Accepté':'Refusé',activities:[...quote.activities,`Devis ${next==='accepted'?'accepté':'refusé'} par le client`]})};
  const decisionLabel=decision==='pending'?detail.status:{accepted:'Accepté',refused:'Refusé'}[decision];
  return <section className="quoteDetailPage"><div className="quoteDetailWorkspace"><div className="quoteDetailMain"><div className="quoteDetailTitle"><h1>Devis {detail.id} <Badge text={decisionLabel}/></h1><p>Créé par Chris M.　•　{detail.date} à 11:40</p></div><section className="detailMetaCard"><div className="detailClient"><i><I.UserRound size={25}/></i><span><b>{detail.client}</b><small>{detail.type}<br/>{detail.city}</small></span></div><div><i><I.CalendarDays size={22}/></i><span><small>Date du devis</small><b>{detail.date}</b></span></div><div><i><I.CalendarDays size={22}/></i><span><small>Validité du devis</small><b>28 sept. 2026 (30 jours)</b></span></div><div className="detailAmount"><span><small>Montant total</small><b>{detail.amount.toLocaleString('fr-FR')} $</b><em>{detail.payment} · {detail.monthly}</em></span></div></section><div className="detailTabs">{['Suivi du devis','Détails du devis'].map(item=><button type="button" key={item} onClick={()=>setTab(item)} className={tab===item?'active':''}>{item}</button>)}</div>{tab==='Suivi du devis'?<>{decision==='accepted'?<AcceptedQuoteFollowup detail={detail}/>:detail.status==='Brouillon'?<DraftQuoteFollowup detail={detail} onReview={()=>setTab('Détails du devis')}/>:detail.status==='Refusé'||detail.status==='Expiré'?<ClosedQuoteFollowup detail={detail}/>:<section className="followWorkspace"><form className="relancePlan" onSubmit={event=>{event.preventDefault();add(`Relance planifiée : ${relance} via ${channel}`)}}><h2>Planifier une relance</h2><p>Quand souhaitez-vous relancer {detail.client} ?</p>{['Demain','Dans 3 jours','Dans 1 semaine','Choisir une date'].map(option=><label key={option}><input type="radio" name="relance" checked={relance===option} onChange={()=>setRelance(option)}/>{option}{option==='Choisir une date'&&<input className="relanceDate" type="date" onClick={event=>event.stopPropagation()}/>}</label>)}<div className="relanceChannel"><span>Canal</span>{['WhatsApp','Appel','E-mail'].map(option=><label key={option}><input type="radio" name="canal" checked={channel===option} onChange={()=>setChannel(option)}/>{option}</label>)}</div><label className="relanceNote">Note (facultatif)<textarea value={note} onChange={event=>setNote(event.target.value)}/></label><Button><I.CalendarDays size={16}/> Planifier</Button></form><div className="clientFollow"><div className="followWorkspaceTitle"><i><I.MessageCircle size={23}/></i><span><h2>Relance client</h2><p><Badge text="À relancer"/> {detail.client} attend votre réponse</p></span></div><div className="followCallout"><p>Le client n'a pas répondu depuis 4 jours.</p><p>Une relance peut être utile pour faire avancer le projet.</p></div><div className="clientFollowActions"><Button onClick={()=>add(`Relance WhatsApp envoyée à ${detail.client}`)}><I.MessageCircle size={17}/> WhatsApp</Button><Button secondary onClick={()=>add('Appel client — Intéressé, souhaite réfléchir')}><I.Phone size={17}/> Appeler</Button><Button secondary onClick={()=>add(`E-mail envoyé à ${detail.client}`)}><I.Mail size={17}/> E-mail</Button><Button secondary><I.CalendarDays size={17}/> Planifier une relance</Button></div></div></section>}</>:<QuoteDetailAlternate tab={tab}/>}</div><aside className="quoteDetailRail">{detail.status==='Brouillon'?<DraftQuoteStatus/>:detail.status==='Refusé'||detail.status==='Expiré'?<ClosedQuoteStatus detail={detail}/>:decision==='accepted'?null:<QuoteDecisionPanel decision={decision} onDecision={updateDecision}/>}<section className="detailRailCard quoteProducts"><h2>Résumé du devis</h2><div><span>4 panneaux solaires<br/>(600 W)</span><img src={solarPanelsProduct} alt="Panneaux solaires"/></div><div><span>1 batterie (5 kWh)</span><img src={batteryProduct} alt="Batterie solaire"/></div><div><span>1 onduleur hybride (3 kVA)</span><img src={inverterProduct} alt="Onduleur hybride"/></div><p>Services et accessoires inclus</p><strong>Total du système <b>2 850 $</b></strong></section><DetailPayment detail={detail}/><DetailClientInformation detail={detail}/></aside></div></section>
}
type QuoteDecision = 'pending'|'accepted'|'refused';
function AcceptedQuoteFollowup({detail}:{detail:QuoteDirectoryEntry}){
  const summary=[
    {icon:I.CheckCircle2,label:'Décision client',value:'Accepté',detail:`${detail.client} a confirmé à 14:20`,tone:'green'},
    {icon:I.SolarPanel,label:'Système validé',value:'2,4 kWc · 5 kWh · 3 kVA',detail:'4 panneaux, batterie et onduleur hybride',tone:'orange'},
    {icon:I.CalendarClock,label:'Paiement retenu',value:detail.payment,detail:detail.monthly,tone:'blue'},
    {icon:I.MapPin,label:'Site d’installation',value:detail.city,detail:detail.address,tone:'purple'}
  ];
  return <section className="acceptedQuoteFollowup"><header><h2>Prêt pour l’installation</h2><p>Les informations essentielles pour organiser la mise en service.</p></header><div className="acceptedOperationalSummary">{summary.map(({icon:Icon,label,value,detail,tone})=><article key={label}><i className={tone}><Icon size={19}/></i><span><small>{label}</small><b>{value}</b><em>{detail}</em></span></article>)}</div><section className="acceptedConfirmation"><i><I.Check size={25}/></i><div><h2>Le devis a été accepté !</h2><p>Le client est prêt à passer à l’installation. Vous pouvez maintenant créer le dossier et planifier l’installation.</p><div><Button><I.FolderOpen size={18}/> Créer le dossier</Button><Button secondary><I.CalendarDays size={18}/> Planifier l’installation</Button></div></div></section><div className="acceptedNote"><I.ClipboardList size={19}/><span><b>Bon à savoir</b><small>Vous pouvez créer le dossier d’installation pour ce client et planifier les prochaines étapes.</small></span></div></section>
}
function DraftQuoteFollowup({detail,onReview}:{detail:QuoteDirectoryEntry;onReview:()=>void}){
  const steps=[
    {icon:I.UserRound,label:'Client renseigné',value:detail.client,detail:`${detail.phone} · ${detail.email}`,complete:true},
    {icon:I.MapPin,label:'Site configuré',value:detail.city,detail:detail.address,complete:true},
    {icon:I.SolarPanel,label:'Système enregistré',value:`${detail.amount.toLocaleString('fr-FR')} $`,detail:`Paiement ${detail.payment.toLowerCase()} sélectionné`,complete:true},
    {icon:I.FileCheck2,label:'Finalisation du devis',value:'À terminer',detail:'Vérifiez les équipements avant de partager le devis',complete:false}
  ];
  return <section className="draftQuoteFollowup"><header><i><I.FilePenLine size={23}/></i><span><h2>Brouillon à terminer</h2><p>Votre travail est enregistré. Reprenez là où vous vous êtes arrêté.</p></span></header><div className="draftSteps">{steps.map(({icon:Icon,label,value,detail:stepDetail,complete})=><article key={label}><i className={complete?'complete':''}>{complete?<I.Check size={16}/>:<Icon size={17}/>}</i><span><small>{label}</small><b>{value}</b><em>{stepDetail}</em></span></article>)}</div><section className="draftNextStep"><i><I.ArrowRight size={21}/></i><div><h2>Prochaine étape : finaliser le devis</h2><p>Vérifiez la configuration, puis finalisez le devis pour pouvoir l’envoyer au client.</p><Button onClick={onReview}>Reprendre le devis <I.ArrowRight size={17}/></Button></div></section></section>
}
function DraftQuoteStatus(){
  return <section className="draftQuoteStatus"><i><I.FilePenLine size={22}/></i><div><h2>Brouillon en cours</h2><p>Dernière étape enregistrée</p><b>Finaliser le devis</b><small>Les informations client et le site sont déjà renseignés.</small></div></section>
}
function ClosedQuoteFollowup({detail}:{detail:QuoteDirectoryEntry}){
  const refused=detail.status==='Refusé';
  const entries=refused?[
    {icon:I.XCircle,label:'Décision du client',value:'Devis refusé',detail:'Retour reçu le 21 août 2026',tone:'red'},
    {icon:I.MessageSquareMore,label:'Motif communiqué',value:'Budget à revoir',detail:'Le client souhaite reporter son projet',tone:'orange'},
    {icon:I.CalendarClock,label:'Relance suggérée',value:'Dans 30 jours',detail:'Reprendre contact avec une proposition adaptée',tone:'blue'}
  ]:[
    {icon:I.Hourglass,label:'Validité du devis',value:'Expirée',detail:'La période de 30 jours est terminée',tone:'grey'},
    {icon:I.CalendarX2,label:'Date d’expiration',value:'18 août 2026',detail:'Le prix et la disponibilité doivent être confirmés',tone:'orange'},
    {icon:I.RefreshCw,label:'Action suggérée',value:'Mettre à jour le devis',detail:'Recalculer les équipements et conditions actuelles',tone:'blue'}
  ];
  return <section className={'closedQuoteFollowup '+(refused?'refused':'expired')}><header><i>{refused?<I.XCircle size={23}/>:<I.Hourglass size={23}/>}</i><span><h2>{refused?'Devis refusé':'Devis expiré'}</h2><p>{refused?'Cette proposition n’a pas été retenue par le client.':'Cette proposition n’est plus valide et doit être actualisée.'}</p></span></header><div className="closedQuoteSummary">{entries.map(({icon:Icon,label,value,detail:entryDetail,tone})=><article key={label}><i className={tone}><Icon size={19}/></i><span><small>{label}</small><b>{value}</b><em>{entryDetail}</em></span></article>)}</div><section className="closedQuoteNext"><i>{refused?<I.MessageCircle size={21}/>:<I.RefreshCw size={21}/>}</i><div><h2>{refused?'Garder le lien avec le client':'Renouveler la proposition'}</h2><p>{refused?'Vous pourrez reprendre contact lorsque le budget du client sera disponible.':'Mettez à jour le système et les prix avant d’envoyer une nouvelle version.'}</p><Button secondary>{refused?'Planifier une relance':'Mettre à jour le devis'} <I.ArrowRight size={17}/></Button></div></section></section>
}
function ClosedQuoteStatus({detail}:{detail:QuoteDirectoryEntry}){
  const refused=detail.status==='Refusé';
  return <section className={'closedQuoteStatus '+(refused?'refused':'expired')}><i>{refused?<I.XCircle size={22}/>:<I.Hourglass size={22}/>}</i><div><h2>{refused?'Devis refusé':'Devis expiré'}</h2><p>{refused?'Le client a décliné cette proposition.':'La validité de cette proposition est terminée.'}</p><b>{refused?'Relance suggérée dans 30 jours':'Mise à jour nécessaire'}</b></div></section>
}
function DetailPayment({detail}:{detail:QuoteDirectoryEntry}){
  const isCash=detail.payment==='Comptant';
  const amount=detail.amount.toLocaleString('fr-FR');
  return <section className="detailRailCard detailPayment"><h2>Paiement</h2><div className="paymentDetailHighlight"><i><I.CalendarClock size={23}/></i><span><b>{isCash?'Paiement comptant':'Paiement échelonné'}</b><small>{isCash?'Paiement unique':`${detail.payment} · ${detail.monthly}`}</small></span></div><dl>{isCash?<div><dt>Montant à régler</dt><dd>{amount} $</dd></div>:<><div><dt>Premier paiement (aujourd’hui)</dt><dd>{detail.monthly.split(' /')[0]}</dd></div><div><dt>Mensualités restantes</dt><dd>{detail.monthly}</dd></div><div><dt>Prochaine échéance</dt><dd>28 sept. 2026</dd></div></>}</dl><hr/><strong>{isCash?'Total à régler':'Total à payer'} <b>{amount} $</b></strong></section>
}
function DetailClientInformation({detail}:{detail:QuoteDirectoryEntry}){
  return <section className="detailRailCard clientInformation"><h2>Informations client</h2><p><I.Phone size={17}/><span>{detail.phone}</span></p><p><I.Mail size={17}/><span>{detail.email}</span></p><p><I.Home size={17}/><span>{detail.address}<br/>{detail.city}</span></p></section>
}
function QuoteDecisionPanel({decision,onDecision}:{decision:QuoteDecision;onDecision:(decision:QuoteDecision)=>void}){
  const message=decision==='pending'?'En attente de la réponse du client.':decision==='accepted'?'Le client a accepté ce devis.':'Le client a refusé ce devis.';
  return <section className="quoteDecisionPanel"><div><h2>Prochaine étape</h2><p>{message}</p></div><div className="quoteDecisionActions"><button type="button" className={'accept '+(decision==='accepted'?'selected':'')} onClick={()=>onDecision('accepted')}><I.Check size={20}/><span><b>Marquer comme accepté</b><small>Le client a accepté le devis</small></span></button><button type="button" className={'refuse '+(decision==='refused'?'selected':'')} onClick={()=>onDecision('refused')}><I.X size={20}/><span><b>Marquer comme refusé</b><small>Le client a refusé le devis</small></span></button></div></section>
}
function QuoteDetailTable(){
  const rows=[
    {image:solarPanelsProduct,name:'Panneaux solaires',meta:'Jinko Solar · Monocristallin · 600 W',badge:'Performance élevée',reason:'Produisent l’électricité pour vos usages quotidiens.',quantity:'4',unit:'320 $',total:'1 280 $'},
    {image:batteryProduct,name:'Batterie',meta:'Pylontech · LiFePO₄ · 5 kWh',badge:'Longue durée de vie',reason:'Stocke l’énergie pour alimenter la maison le soir et la nuit.',quantity:'1',unit:'950 $',total:'950 $'},
    {image:inverterProduct,name:'Onduleur',meta:'Deye · Hybride · 3 kVA',badge:'Haute fiabilité',reason:'Alimente vos appareils avec une énergie stable et adaptée.',quantity:'1',unit:'420 $',total:'420 $'},
    {image:installationServiceKit,name:'Installation et mise en service',meta:'',badge:'',reason:'Installation, raccordement et vérification par un technicien.',quantity:'',unit:'forfait',total:'150 $'},
    {image:solarCableKit,name:'Câbles et connectique',meta:'',badge:'',reason:'Relient les équipements de façon sûre et durable.',quantity:'',unit:'forfait',total:'30 $'},
    {image:solarMountingKit,name:'Structure de fixation',meta:'',badge:'',reason:'Maintient les panneaux solidement fixés sur le toit.',quantity:'',unit:'forfait',total:'20 $'}
  ];
  return <section className="detailQuoteTable"><div className="detailQuoteTableHeader"><span>Élément</span><span>Détails</span><span>Qté</span><span>Prix unitaire</span><span>Total</span></div>{rows.map(row=><div className="detailQuoteTableRow" key={row.name}><span className="detailQuoteItem"><img src={row.image} alt=""/><span><b>{row.name}</b>{row.meta&&<small>{row.meta}</small>}</span></span><span className="detailQuoteReason">{row.badge&&<em>{row.badge}</em>}<small>{row.reason}</small></span><span>{row.quantity}</span><span>{row.unit}</span><strong>{row.total}</strong></div>)}<div className="detailQuoteTableTotal"><span>TOTAL DU SYSTÈME</span><b>2 850 $</b></div></section>
}
function QuoteDetailAlternate({tab}:{tab:string}){
  if(tab==='Détails du devis')return <QuoteDetailTable/>;
  return <section className="detailAlternate"><h2>{tab}</h2><p>{tab==='Documents'?'Le devis PDF et les documents de partage seront disponibles ici.':'Retrouvez l’ensemble des échanges et actions réalisés sur ce devis.'}</p></section>
}
type ParkStatus='normal'|'watch'|'critical'
const parkInstallations=[
  {id:'INS-00482',client:'Jean Kabeya',site:'Maison individuelle',location:'Gombe',production:'Normale',consumption:'Normale',boxPosition:'À vérifier',positionNeedsCheck:true,boxIntegrity:'À vérifier',integrityNeedsCheck:true,global:'Critique',last:'Il y a 7 h',status:'critical' as ParkStatus},
  {id:'INS-00841',client:'Kivu Market SARL',site:'Commerce',location:'Gombe',production:'Plus faible',consumption:'Normale',boxPosition:'Confirmée',positionNeedsCheck:false,boxIntegrity:'Intact',integrityNeedsCheck:false,global:'À surveiller',last:'Il y a 15 min',status:'watch' as ParkStatus},
  {id:'INS-00912',client:'Sarah Ilunga',site:'Maison individuelle',location:'Ngaliema',production:'Normale',consumption:'Plus élevée',boxPosition:'Confirmée',positionNeedsCheck:false,boxIntegrity:'Intact',integrityNeedsCheck:false,global:'À surveiller',last:'Il y a 1 h',status:'watch' as ParkStatus},
  {id:'INS-01024',client:'École La Source',site:'École',location:'Kintambo',production:'Normale',consumption:'Normale',boxPosition:'Confirmée',positionNeedsCheck:false,boxIntegrity:'Scellé intact',integrityNeedsCheck:false,global:'Critique',last:'Il y a 2 h',status:'critical' as ParkStatus},
  {id:'INS-01108',client:'Martin Paluku',site:'Maison individuelle',location:'Limete',production:'Normale',consumption:'Plus faible',boxPosition:'Confirmée',positionNeedsCheck:false,boxIntegrity:'Intact',integrityNeedsCheck:false,global:'À surveiller',last:'Il y a 4 h',status:'watch' as ParkStatus}
]
type ParkInstallation=typeof parkInstallations[number]
const parkAlerts=[
  {id:'INS-00482',name:'Jean Kabeya',place:'Gombe',tag:'Hors ligne',detail:'Aucune communication depuis 7h 42min',time:'Il y a 2 h',tone:'critical'},
  {id:'INS-00841',name:'Kivu Market SARL',place:'Gombe',tag:'Production faible',detail:'Production 42 % inférieure à la normale',time:'Il y a 3 h',tone:'watch'},
  {id:'INS-00912',name:'Sarah Ilunga',place:'Ngaliema',tag:'Consommation élevée',detail:'Consommation 65 % supérieure à la normale',time:'Il y a 5 h',tone:'watch'},
  {id:'INS-01024',name:'École La Source',place:'Kintambo',tag:'Tension batterie basse',detail:'Tension batterie sous le seuil depuis 1h 20min',time:'Il y a 6 h',tone:'critical'}
]
const parkMarkers=[['24%','63%','normal'],['29%','39%','normal'],['35%','30%','watch'],['38%','47%','normal'],['43%','62%','watch'],['47%','22%','muted'],['51%','48%','critical'],['54%','63%','normal'],['58%','39%','normal'],['62%','53%','normal'],['66%','29%','normal'],['70%','59%','critical'],['74%','38%','watch'],['79%','47%','normal'],['84%','60%','muted'],['88%','42%','critical'],['91%','66%','normal']] as const
function ParkPill({text,kind}:{text:string,kind:'normal'|'watch'|'critical'|'offline'|'high'|'low'|'online'|'secure'}){
  const Icon=kind==='secure'?I.ShieldCheck:kind==='normal'?I.Sun:kind==='online'?I.Wifi:kind==='offline'?I.Radio:kind==='critical'?I.CircleAlert:kind==='high'?I.ArrowUp:kind==='low'?I.ArrowDown:I.TriangleAlert
  return <span className={'parkPill '+kind}><Icon size={13}/>{text}</span>
}
const drcProvinces=[
  {name:'Bas-Uélé',center:[3.9900,24.9040],zoom:8},{name:'Équateur',center:[0.0486,18.2603],zoom:8},{name:'Haut-Katanga',center:[-11.6670,27.4794],zoom:8},{name:'Haut-Lomami',center:[-8.6580,26.4000],zoom:8},{name:'Haut-Uélé',center:[3.6000,28.3000],zoom:8},{name:'Ituri',center:[1.5592,30.2522],zoom:8},{name:'Kasaï',center:[-6.4270,20.7990],zoom:8},{name:'Kasaï-Central',center:[-5.8962,22.4166],zoom:8},{name:'Kasaï-Oriental',center:[-6.1500,23.6000],zoom:8},{name:'Kinshasa',center:[-4.3317,15.3136],zoom:11},{name:'Kongo Central',center:[-5.8386,13.4631],zoom:8},{name:'Kwango',center:[-6.2000,18.6000],zoom:8},{name:'Kwilu',center:[-4.9000,18.7000],zoom:8},{name:'Lomami',center:[-6.2800,24.6500],zoom:8},{name:'Lualaba',center:[-10.7148,25.4667],zoom:8},{name:'Mai-Ndombe',center:[-2.6500,18.4200],zoom:8},{name:'Maniema',center:[-3.0700,26.0400],zoom:8},{name:'Mongala',center:[2.1600,21.4900],zoom:8},{name:'Nord-Kivu',center:[-1.6792,29.2228],zoom:8},{name:'Nord-Ubangi',center:[3.8500,20.1000],zoom:8},{name:'Sankuru',center:[-3.0000,23.2000],zoom:8},{name:'Sud-Kivu',center:[-2.5083,28.8608],zoom:8},{name:'Sud-Ubangi',center:[3.1100,18.8300],zoom:8},{name:'Tanganyika',center:[-6.1000,29.5000],zoom:8},{name:'Tshopo',center:[0.5153,25.1910],zoom:8},{name:'Tshuapa',center:[-0.7000,21.1000],zoom:8}
] as const
const parkMapLocations=[
  {name:'Jean Kabeya',province:'Kinshasa',lat:-4.3222,lng:15.3042,tone:'critical'},{name:'Kivu Market SARL',province:'Kinshasa',lat:-4.3331,lng:15.3205,tone:'watch'},{name:'Sarah Ilunga',province:'Kinshasa',lat:-4.3441,lng:15.2954,tone:'normal'},{name:'Martin Paluku',province:'Kinshasa',lat:-4.3054,lng:15.3337,tone:'normal'},
  {name:'Centre de santé Ngaliema',province:'Kinshasa',lat:-4.3196,lng:15.2818,tone:'muted'},
  {name:'Boma Logistique',province:'Kongo Central',lat:-5.8504,lng:13.0509,tone:'watch'},{name:'Station Matadi',province:'Kongo Central',lat:-5.8295,lng:13.4555,tone:'normal'},
  {name:'Atelier Lubumbashi',province:'Haut-Katanga',lat:-11.6670,lng:27.4794,tone:'critical'},{name:'Commerce Kolwezi',province:'Lualaba',lat:-10.7148,lng:25.4667,tone:'normal'},
  {name:'Maison Goma',province:'Nord-Kivu',lat:-1.6792,lng:29.2228,tone:'watch'},{name:'École Bukavu',province:'Sud-Kivu',lat:-2.5083,lng:28.8608,tone:'normal'},
  {name:'Centre Bunia',province:'Ituri',lat:1.5592,lng:30.2522,tone:'critical'},{name:'Hôpital Kisangani',province:'Tshopo',lat:0.5153,lng:25.1910,tone:'normal'},
  {name:'Mbandaka Hôtel',province:'Équateur',lat:0.0486,lng:18.2603,tone:'watch'},{name:'École Kananga',province:'Kasaï-Central',lat:-5.8962,lng:22.4166,tone:'normal'}
]
function parkMarkerColor(tone:string){return tone==='critical'?'#e51a2d':tone==='watch'?'#ff7900':tone==='muted'?'#94a3b8':'#08a75d'}
function drawParkMapMarkers(L:any,layer:any,statusFilter:string){
  const selectedTone=statusFilter==='En bon état'?'normal':statusFilter==='À surveiller'?'watch':statusFilter==='Critique'?'critical':statusFilter==='Données indisponibles'?'muted':undefined
  layer.clearLayers()
  parkMapLocations.filter(location=>!selectedTone||location.tone===selectedTone).forEach(location=>{
    L.circleMarker([location.lat,location.lng],{radius:7,weight:2,color:'#fff',fillColor:parkMarkerColor(location.tone),fillOpacity:1}).bindTooltip(`${location.name} · ${location.province}`).addTo(layer)
  })
}
function getParkLegendCounts(province:string,statusFilter:string){
  const provinceIndex=Math.max(0,drcProvinces.findIndex(item=>item.name===province))
  const base=province==='Kinshasa'
    ? {normal:4041,watch:187,critical:58,muted:43}
    : {normal:102+((provinceIndex*83)%307),watch:8+((provinceIndex*7)%31),critical:3+((provinceIndex*5)%14),muted:3+((provinceIndex*3)%12)}
  const activeTone=statusFilter==='En bon état'?'normal':statusFilter==='À surveiller'?'watch':statusFilter==='Critique'?'critical':statusFilter==='Données indisponibles'?'muted':undefined
  return activeTone?{normal:activeTone==='normal'?base.normal:0,watch:activeTone==='watch'?base.watch:0,critical:activeTone==='critical'?base.critical:0,muted:activeTone==='muted'?base.muted:0}:base
}
function ParcOpenStreetMap({province,statusFilter,expanded=false}:{province:string;statusFilter:string;expanded?:boolean}){
  const elementRef=useRef<HTMLDivElement>(null)
  const mapRef=useRef<any>(null)
  const markerLayerRef=useRef<any>(null)
  const [status,setStatus]=useState('')
  useEffect(()=>{
    let active=true
    loadLeaflet().then(L=>{
      if(!active||!elementRef.current)return
      const map=L.map(elementRef.current,{zoomControl:false,attributionControl:true}).setView([-4.3317,15.3136],11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map)
      L.control.zoom({position:'bottomright'}).addTo(map)
      const markerLayer=L.layerGroup().addTo(map)
      markerLayerRef.current=markerLayer
      drawParkMapMarkers(L,markerLayer,statusFilter)
      mapRef.current=map
      requestAnimationFrame(()=>map.invalidateSize({pan:false}))
      setStatus('')
    }).catch(()=>active&&setStatus('La carte OpenStreetMap est momentanément indisponible.'))
    return ()=>{active=false;mapRef.current?.remove();mapRef.current=null}
  },[])
  useEffect(()=>{
    const selected=drcProvinces.find(item=>item.name===province)
    if(selected&&mapRef.current)requestAnimationFrame(()=>{
      mapRef.current?.invalidateSize({pan:false})
      mapRef.current?.setView(selected.center,selected.zoom,{animate:true})
    })
  },[province,expanded])
  useEffect(()=>{
    const L=(window as Window & {L?:any}).L
    if(L&&markerLayerRef.current)drawParkMapMarkers(L,markerLayerRef.current,statusFilter)
  },[statusFilter])
  const legendCounts=getParkLegendCounts(province,statusFilter)
  return <div className="parkOpenStreetMapWrap"><div className="parkOpenStreetMap" ref={elementRef} aria-label={'Carte OpenStreetMap — '+province}/><div className="parkMapLegend" aria-live="polite"><span><i className="normal"/>En bon état <b>{legendCounts.normal.toLocaleString('fr-FR')}</b></span><span><i className="watch"/>À surveiller <b>{legendCounts.watch.toLocaleString('fr-FR')}</b></span><span><i className="critical"/>Critique <b>{legendCounts.critical.toLocaleString('fr-FR')}</b></span><span><i className="muted"/>Données indisponibles <b>{legendCounts.muted.toLocaleString('fr-FR')}</b></span></div>{status&&<small className="parkMapStatus">{status}</small>}</div>
}
function InstallationAddDialog({onClose,onAdd}:{onClose:()=>void,onAdd:(draft:{client:string;site:string;location:string})=>void}){const [draft,setDraft]=useState({client:'',site:'Maison individuelle',location:'Kinshasa'});return <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="new-installation-title"><form className="modal installationAddDialog" onSubmit={event=>{event.preventDefault();if(draft.client.trim())onAdd(draft)}}><button type="button" className="close" aria-label="Fermer" onClick={onClose}>×</button><h2 id="new-installation-title">Ajouter une installation</h2><p>Renseignez les informations essentielles pour l’ajouter au parc solaire.</p><div className="form"><label>Client<input required value={draft.client} onChange={event=>setDraft(current=>({...current,client:event.target.value}))} placeholder="Nom du client ou de l’entreprise"/></label><label>Type de site<select value={draft.site} onChange={event=>setDraft(current=>({...current,site:event.target.value}))}><option>Maison individuelle</option><option>Commerce</option><option>École</option></select></label><label>Localisation<input required value={draft.location} onChange={event=>setDraft(current=>({...current,location:event.target.value}))} placeholder="Commune ou quartier"/></label></div><footer><Button secondary onClick={onClose}>Annuler</Button><Button><I.Plus size={16}/>Ajouter l’installation</Button></footer></form></div>}
function ParcSolaire(){
  const navigate=useNavigate()
  const [query,setQuery]=useState('')
  const [mapQuery,setMapQuery]=useState('')
  const [statusFilter,setStatusFilter]=useState('Tous les statuts')
  const [province,setProvince]=useState('Kinshasa')
  const [mapFullscreen,setMapFullscreen]=useState(false)
  const [installations,setInstallations]=useState<ParkInstallation[]>(parkInstallations)
  const [addingInstallation,setAddingInstallation]=useState(false)
  const [period,setPeriod]=useState('30 derniers jours')
  const [periodMenuOpen,setPeriodMenuOpen]=useState(false)
  const periodFilterRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!mapFullscreen)return
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    return ()=>{document.body.style.overflow=previousOverflow}
  },[mapFullscreen])
  useEffect(()=>{
    if(!periodMenuOpen)return
    const close=(event:MouseEvent)=>{if(periodFilterRef.current&&!periodFilterRef.current.contains(event.target as Node))setPeriodMenuOpen(false)}
    document.addEventListener('mousedown',close)
    return ()=>document.removeEventListener('mousedown',close)
  },[periodMenuOpen])
  const filtered=installations.filter(item=>`${item.id} ${item.client} ${item.site} ${item.location}`.toLowerCase().includes(query.toLowerCase()))
  const installationCount=4281+installations.length
  const periodMetrics:{[key:string]:[string,string,string]}={"Aujourd’hui":['4 041','17','5'],'7 derniers jours':['4 035','71','21'],'30 derniers jours':['4 041','187','58'],'90 derniers jours':['4 018','416','122']}
  const [healthy,watch,critical]=periodMetrics[period]
  const metrics=[{label:'Installations',value:installationCount.toLocaleString('fr-FR'),icon:I.Box,tone:'neutral'},{label:'En bon état (en ligne)',value:healthy,icon:I.Wifi,tone:'good'},{label:'À surveiller',value:watch,icon:I.TriangleAlert,tone:'watch'},{label:'Critique',value:critical,icon:I.CircleAlert,tone:'critical'}]
  return <section className="workspacePage parcSolarPage">
    {addingInstallation&&<InstallationAddDialog onClose={()=>setAddingInstallation(false)} onAdd={draft=>{setInstallations(current=>[{id:`INS-${String(1200+current.length).padStart(5,'0')}`,client:draft.client,site:draft.site,location:draft.location,production:'Normale',consumption:'Normale',boxPosition:'Confirmée',positionNeedsCheck:false,boxIntegrity:'Intact',integrityNeedsCheck:false,global:'En bon état',last:'À l’instant',status:'normal'},...current]);setAddingInstallation(false)}}/>}
    <div className="workspaceHeading parcSolarHead"><div><h1>Parc solaire</h1><p>Vue d’ensemble de toutes vos installations connectées.</p></div><div className="workspaceActions parcSolarActions"><div className="parcPeriodFilter" ref={periodFilterRef}><button className="parcDateRange" type="button" aria-haspopup="listbox" aria-expanded={periodMenuOpen} onClick={()=>setPeriodMenuOpen(open=>!open)}><I.CalendarDays size={17}/>{period}<I.ChevronDown size={16}/></button>{periodMenuOpen&&<div className="parcPeriodMenu" role="listbox" aria-label="Période affichée">{['Aujourd’hui','7 derniers jours','30 derniers jours','90 derniers jours'].map(option=><button type="button" role="option" aria-selected={period===option} className={period===option?'selected':''} key={option} onClick={()=>{setPeriod(option);setPeriodMenuOpen(false)}}>{option}{period===option&&<I.Check size={16}/>}</button>)}</div>}</div><ExportMenu title="Liste des installations" fileName="liste-des-installations" columns={['Installation','Client','Site','Localisation','Production','Consommation','État global','Dernière donnée']} rows={installations.map(item=>[item.id,item.client,item.site,item.location,item.production,item.consumption,item.global,item.last])}/><button type="button" className="workspacePrimaryAction" onClick={()=>setAddingInstallation(true)}><I.Plus size={17}/>Ajouter une installation</button></div></div>
    <section className="parcMetricGrid" aria-label="Indicateurs du parc solaire">{metrics.map(({label,value,icon:Icon,tone})=><article className={'parcMetric '+tone} key={label}><i><Icon size={25}/></i><span><small>{label}</small><strong>{value}</strong></span></article>)}</section>
    <section className="parcOverviewGrid">
      <section className={'parkMapCard'+(mapFullscreen?' mapFullscreen':'')}><header className="parkMapHeader"><h2>Carte du parc</h2><div className="parkMapFilters"><label><I.Search size={16}/><input value={mapQuery} onChange={event=>setMapQuery(event.target.value)} placeholder="Rechercher une zone, une ville…"/></label><select aria-label="Province de la RDC" value={province} onChange={event=>setProvince(event.target.value)}>{drcProvinces.map(item=><option key={item.name}>{item.name}</option>)}</select><select aria-label="Statut" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option>Tous les statuts</option><option>En bon état</option><option>À surveiller</option><option>Critique</option><option>Données indisponibles</option></select><button aria-label={mapFullscreen?'Réduire la carte':'Agrandir la carte'} onClick={()=>setMapFullscreen(value=>!value)}>{mapFullscreen?<I.Minimize2 size={17}/>:<I.Maximize2 size={17}/>}</button></div></header><ParcOpenStreetMap province={province} statusFilter={statusFilter} expanded={mapFullscreen}/></section>
      <section className="recentAlerts"><header><h2>Alertes récentes</h2><button>Voir tout</button></header><div className="parkAlertList">{parkAlerts.map(alert=>{const Icon=alert.tone==='critical'?I.CircleAlert:I.TriangleAlert;return <article className={'parkAlert '+alert.tone} key={alert.id} onClick={()=>navigate('/installations/'+alert.id)}><i><Icon size={19}/></i><div className="parkAlertBody"><div className="parkAlertMeta"><span><b>{alert.id}</b><em>{alert.tag}</em></span></div><small>{alert.name} · {alert.place}</small><p>{alert.detail}</p></div><time>{alert.time}</time><button className="parkAlertAction" aria-label={'Ouvrir l’alerte '+alert.id} onClick={event=>{event.stopPropagation();navigate('/installations/'+alert.id)}}><I.ChevronRight size={18}/></button></article>})}</div></section>
    </section>
    <section className="parcInstallationsPanel"><header><h2>Toutes les installations <span>(4 286)</span></h2><div><label className="parcTableSearch"><I.Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher une installation…"/></label><button className="parcOutlineButton"><I.SlidersHorizontal size={16}/>Filtres</button><button className="parcOutlineButton"><I.Download size={16}/>Exporter</button></div></header><div className="parcTableScroll"><div className="parcInstallTable"><div className="parcInstallHead"><span><input aria-label="Sélectionner toutes les installations" type="checkbox"/></span><span>Installation</span><span>Client / Site</span><span>Production<br/>vs. habitude</span><span>Consommation<br/>vs. habitude</span><span>Position<br/>du boîtier</span><span>Intégrité<br/>du boîtier</span><span>État global</span><span>Dernière donnée</span><span>Actions</span></div>{filtered.map(item=><div className="parcInstallRow isClickable" key={item.id} role="link" tabIndex={0} onClick={()=>navigate('/installations/'+item.id)} onKeyDown={event=>{if(event.key==='Enter')navigate('/installations/'+item.id)}}><span><input aria-label={'Sélectionner '+item.id} type="checkbox" onClick={event=>event.stopPropagation()}/></span><b>{item.id}</b><span><b>{item.client}</b><small>{item.site}</small></span><span><ParkPill text={item.production} kind={item.production==='Normale'?'normal':'low'}/></span><span><ParkPill text={item.consumption} kind={item.consumption==='Normale'?'normal':'high'}/></span><span><ParkPill text={item.boxPosition} kind={item.positionNeedsCheck?'watch':'secure'}/></span><span><ParkPill text={item.boxIntegrity} kind={item.integrityNeedsCheck?'watch':'secure'}/></span><span><ParkPill text={item.global} kind={item.status}/></span><span>{item.last}</span><button className="parkMoreButton" aria-label={'Actions pour '+item.id} onClick={event=>event.stopPropagation()}><I.Ellipsis size={19}/></button></div>)}</div></div><footer><span>Affichage de {filtered.length} sur 4 286 installations</span><nav aria-label="Pagination"><button><I.ChevronLeft size={17}/></button><button className="current">1</button><button>2</button><button>3</button><button>4</button><button>5</button><span>…</span><button>858</button><button><I.ChevronRight size={17}/></button></nav></footer></section>
  </section>
}
function InstallationDetail(){
  const {id}=useParams()
  const navigate=useNavigate()
  const installation=parkInstallations.find(item=>item.id===id)||parkInstallations[0]
  const [period,setPeriod]=useState('30 derniers jours')
  const [periodMenuOpen,setPeriodMenuOpen]=useState(false)
  const dateFilterRef=useRef<HTMLDivElement>(null)
  const [todayKey,setTodayKey]=useState(kinshasaDateKey)
  const [chartStartDate,setChartStartDate]=useState(()=>addDateKeyDays(todayKey,-29))
  const [chartEndDate,setChartEndDate]=useState(todayKey)
  const [draftStartDate,setDraftStartDate]=useState(()=>addDateKeyDays(todayKey,-29))
  const [draftEndDate,setDraftEndDate]=useState(todayKey)
  const [calendarMonth,setCalendarMonth]=useState(()=>addDateKeyDays(todayKey,-29).slice(0,7)+'-01')
  const [chartCustomRange,setChartCustomRange]=useState(false)
  const [chartPickerOpen,setChartPickerOpen]=useState(false)
  const chartDateRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!periodMenuOpen)return
    const closeMenu=(event:MouseEvent)=>{if(!dateFilterRef.current?.contains(event.target as Node))setPeriodMenuOpen(false)}
    document.addEventListener('mousedown',closeMenu)
    return ()=>document.removeEventListener('mousedown',closeMenu)
  },[periodMenuOpen])
  useEffect(()=>{
    if(!chartPickerOpen)return
    const closePicker=(event:MouseEvent)=>{if(!chartDateRef.current?.contains(event.target as Node))setChartPickerOpen(false)}
    document.addEventListener('mousedown',closePicker)
    return ()=>document.removeEventListener('mousedown',closePicker)
  },[chartPickerOpen])
  useEffect(()=>{const refreshToday=()=>setTodayKey(value=>{const current=kinshasaDateKey();return value===current?value:current});const timer=window.setInterval(refreshToday,60000);return ()=>window.clearInterval(timer)},[])
  useEffect(()=>{if(chartCustomRange)return;const days=period==='Aujourd’hui'?1:period==='7 derniers jours'?7:period==='90 derniers jours'?90:30;setChartEndDate(todayKey);setChartStartDate(addDateKeyDays(todayKey,-(days-1)))},[todayKey,period,chartCustomRange])
  const productionLow=installation.production==='Plus faible'
  const consumptionHigh=installation.consumption==='Plus élevée'
  const consumptionLow=installation.consumption==='Plus faible'
  const positionNeedsCheck=installation.positionNeedsCheck
  const integrityNeedsCheck=installation.integrityNeedsCheck
  const communicationOffline=installation.status==='critical'&&(positionNeedsCheck||integrityNeedsCheck)
  const needsAttention=productionLow||consumptionHigh||consumptionLow||positionNeedsCheck||integrityNeedsCheck||installation.status==='critical'
  const periodDetails:{[key:string]:{productionLabel:string;productionValue:string}}={
    'Aujourd’hui':{productionLabel:'Aujourd’hui',productionValue:installation.production==='Normale'?'4,8 kWh':'3,1 kWh'},
    '7 derniers jours':{productionLabel:'7 derniers jours',productionValue:installation.production==='Normale'?'33,6 kWh':'21,7 kWh'},
    '30 derniers jours':{productionLabel:'30 derniers jours',productionValue:installation.production==='Normale'?'142,8 kWh':'93,4 kWh'},
    '90 derniers jours':{productionLabel:'90 derniers jours',productionValue:installation.production==='Normale'?'428,5 kWh':'280,2 kWh'}
  }
  const selectedPeriod=periodDetails[period]
  const getPeriodDays=(value:string)=>value==='Aujourd’hui'?1:value==='7 derniers jours'?7:value==='90 derniers jours'?90:30
  const dateFromKey=(value:string)=>new Date(value+'T12:00:00')
  const dateKey=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`
  const addDays=(value:string,days:number)=>{const next=dateFromKey(value);next.setDate(next.getDate()+days);return dateKey(next)}
  const setPeriodRange=(value:string)=>{const days=getPeriodDays(value);setPeriod(value);setChartEndDate(todayKey);setChartStartDate(addDays(todayKey,-(days-1)));setChartCustomRange(false);setPeriodMenuOpen(false)}
  const lastCalendarMonth=useMemo(()=>{const date=dateFromKey(todayKey);date.setMonth(date.getMonth()-1);return dateKey(new Date(date.getFullYear(),date.getMonth(),1))},[todayKey])
  const openChartPicker=()=>{setDraftStartDate(chartStartDate);setDraftEndDate(chartEndDate);setCalendarMonth(chartStartDate.slice(0,7)+'-01'>lastCalendarMonth?lastCalendarMonth:chartStartDate.slice(0,7)+'-01');setChartPickerOpen(true)}
  const chooseChartDate=(value:string)=>{if(value>todayKey)return;if(!draftStartDate||draftEndDate){setDraftStartDate(value);setDraftEndDate('');return}if(value<draftStartDate){setDraftStartDate(value);return}if(value>draftStartDate)setDraftEndDate(value)}
  const applyChartRange=()=>{if(!draftStartDate||!draftEndDate||draftEndDate>todayKey)return;setChartStartDate(draftStartDate);setChartEndDate(draftEndDate);setChartCustomRange(true);setChartPickerOpen(false)}
  const moveCalendarMonth=(direction:number)=>setCalendarMonth(value=>{const next=dateFromKey(value);next.setMonth(next.getMonth()+direction);const nextKey=dateKey(new Date(next.getFullYear(),next.getMonth(),1));return direction>0&&nextKey>lastCalendarMonth?value:nextKey})
  const calendarMonths=useMemo(()=>{const first=dateFromKey(calendarMonth);const second=new Date(first);second.setMonth(second.getMonth()+1);return [first,second]},[calendarMonth])
  const monthDays=(month:Date):Array<string|null>=>[...Array((new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7).fill(null),...Array.from({length:new Date(month.getFullYear(),month.getMonth()+1,0).getDate()},(_,index)=>dateKey(new Date(month.getFullYear(),month.getMonth(),index+1)))]
  const chartRangeDays=Math.round((dateFromKey(chartEndDate).getTime()-dateFromKey(chartStartDate).getTime())/86400000)+1
  const chartDateLabel=useMemo(()=>{
    const start=dateFromKey(chartStartDate)
    const end=dateFromKey(chartEndDate)
    const format=(date:Date,withYear=true)=>new Intl.DateTimeFormat('fr-FR',withYear?{day:'numeric',month:'short',year:'numeric'}:{day:'numeric',month:'short'}).format(date)
    return !chartCustomRange&&chartRangeDays===1?'Aujourd’hui, '+format(end):format(start,false)+' – '+format(end)
  },[chartStartDate,chartEndDate,chartCustomRange,chartRangeDays])
  const canAdvanceChart=chartEndDate<todayKey
  const shiftChartPeriod=(direction:number)=>{if(direction>0&&!canAdvanceChart)return;setChartStartDate(value=>addDays(value,direction*chartRangeDays));setChartEndDate(value=>addDays(value,direction*chartRangeDays))}
  const currentProduction=productionLow?'214 W':'358 W'
  const currentConsumption=consumptionHigh?'780 W':consumptionLow?'180 W':'358 W'
  const productionPillKind=productionLow?'low':'normal'
  const consumptionPillKind=consumptionHigh?'high':consumptionLow?'low':'normal'
  const communicationLabel=communicationOffline?'Hors ligne':'Active'
  const communicationPillKind=communicationOffline?'offline':'online'
  const locationLabel=positionNeedsCheck||integrityNeedsCheck?'À vérifier':'Confirmée'
  const locationPillKind=positionNeedsCheck||integrityNeedsCheck?'watch':'secure'
  const attentionItems=[
    productionLow&&'La production solaire est inférieure à l’habitude.',
    consumptionHigh&&'La consommation est supérieure à l’habitude.',
    consumptionLow&&'La consommation est inférieure à l’habitude.',
    communicationOffline&&'L’installation ne communique plus.',
    positionNeedsCheck&&'La position du boîtier doit être vérifiée.',
    integrityNeedsCheck&&'L’intégrité du boîtier doit être vérifiée.',
    installation.status==='critical'&&!communicationOffline&&'Un état critique a été signalé pour cette installation.'
  ].filter(Boolean) as string[]
  const normalItems=[
    !productionLow&&'La production solaire est conforme à l’habitude.',
    !consumptionHigh&&!consumptionLow&&'La consommation reste dans sa plage habituelle.',
    !communicationOffline&&'La communication GSM est active.',
    !positionNeedsCheck&&!integrityNeedsCheck&&'La position et l’intégrité du boîtier sont confirmées.'
  ].filter(Boolean) as string[]
  const alerts=[
    productionLow&&{icon:I.Sun,tone:'watch',title:'Production plus faible que d’habitude',detail:'Production : 214 W (habituel : 358 W)',time:'Il y a 15 min'},
    consumptionHigh&&{icon:I.BarChart3,tone:'watch',title:'Consommation plus élevée que d’habitude',detail:'Consommation : 780 W (habituel : 320 W)',time:'Il y a 12 min'},
    consumptionLow&&{icon:I.BarChart3,tone:'watch',title:'Consommation plus faible que d’habitude',detail:'Consommation : 180 W (habituel : 320 W)',time:'Il y a 20 min'},
    communicationOffline&&{icon:I.Radio,tone:'critical',title:'Installation hors ligne',detail:'Aucune communication récente avec le boîtier',time:installation.last},
    positionNeedsCheck&&{icon:I.MapPin,tone:'watch',title:'Position du boîtier à vérifier',detail:'La position doit être confirmée sur site',time:'Aujourd’hui à 06:18'},
    integrityNeedsCheck&&{icon:I.ShieldAlert,tone:'watch',title:'Intégrité du boîtier à vérifier',detail:'Une vérification du boîtier est recommandée',time:'Aujourd’hui à 06:18'},
    installation.status==='critical'&&!communicationOffline&&{icon:I.CircleAlert,tone:'critical',title:'État critique détecté',detail:'Une intervention est recommandée.',time:'Il y a 12 min'},
    !communicationOffline&&{icon:I.Wifi,tone:'normal',title:'Dernière donnée reçue',detail:'L’installation communique normalement',time:installation.last},
    !positionNeedsCheck&&!integrityNeedsCheck&&{icon:I.MapPin,tone:'normal',title:'Boîtier vérifié',detail:'Position confirmée et intégrité intacte',time:'Aujourd’hui à 06:18'}
  ].filter(Boolean) as {icon:React.ElementType;tone:'normal'|'watch'|'critical';title:string;detail:string;time:string}[]
  const Metric=({icon:Icon,title,kind,pill,pillKind,children}:{icon:React.ElementType;title:string;kind:'normal'|'watch'|'online'|'secure'|'critical';pill:string;pillKind:'normal'|'watch'|'critical'|'offline'|'high'|'low'|'online'|'secure';children:React.ReactNode})=><article className={'installationMetric '+kind}><i><Icon size={25}/></i><div><header><b>{title}</b><ParkPill text={pill} kind={pillKind}/></header>{children}</div></article>
  return <section className="workspacePage installationDetailPage">
    <header className="workspaceHeading installationDetailHead"><div><span><h1>{installation.client}</h1><ParkPill text={communicationLabel} kind={communicationPillKind}/></span><p>{installation.id}<b>•</b>{installation.site}<b>•</b>{installation.location}, Kinshasa<b>•</b>Dernière donnée reçue : {installation.last}</p></div><div><div className="installationDateFilter" ref={dateFilterRef}><button className="parcDateRange" type="button" aria-haspopup="listbox" aria-expanded={periodMenuOpen} onClick={()=>setPeriodMenuOpen(open=>!open)}><I.CalendarDays size={17}/>{period}<I.ChevronDown size={16}/></button>{periodMenuOpen&&<div className="installationDateMenu" role="listbox" aria-label="Période affichée">{Object.keys(periodDetails).map(option=><button type="button" role="option" aria-selected={period===option} className={period===option?'selected':''} key={option} onClick={()=>setPeriodRange(option)}>{option}{period===option&&<I.Check size={16}/>}</button>)}</div>}</div><button className="installationPrimaryAction" onClick={()=>navigate('/interventions')}><I.Wrench size={16}/>Créer une intervention</button></div></header>
    <nav className="installationTabs"><button className="active">Vue d’ensemble</button><button>Énergie</button><button>Localisation</button><button>Alertes</button><button>Historique</button></nav>
    <section className="installationMetricGrid">
      <Metric icon={I.Sun} title="Production solaire" kind={productionLow?'watch':'normal'} pill={installation.production} pillKind={productionPillKind}><div className="twoValues"><span><small>{selectedPeriod.productionLabel}</small><b>{selectedPeriod.productionValue}</b></span><span><small>Actuellement</small><b>{currentProduction}</b></span></div></Metric>
      <Metric icon={I.BarChart3} title="Consommation" kind={consumptionHigh||consumptionLow?'watch':'normal'} pill={installation.consumption} pillKind={consumptionPillKind}><div className="twoValues"><span><small>Habituellement</small><b>320 W</b></span><span><small>Actuellement</small><b>{currentConsumption}</b></span></div></Metric>
      <Metric icon={I.Wifi} title="Communication" kind={communicationOffline?'critical':'online'} pill={communicationLabel} pillKind={communicationPillKind}><div className="twoValues"><span><small>Réseau GSM</small><b>{communicationOffline?'déconnecté':'connecté'}</b></span><span><small>Dernière donnée</small><b>{installation.last}</b></span></div></Metric>
      <Metric icon={I.MapPin} title="Boîtier & localisation" kind={positionNeedsCheck||integrityNeedsCheck?'watch':'secure'} pill={locationLabel} pillKind={locationPillKind}><div className="twoValues"><span><small>Position</small><b>{installation.boxPosition}</b></span><span><small>Intégrité</small><b>{installation.boxIntegrity}</b></span></div></Metric>
    </section>
    <section className="installationDetailGrid">
      <div className="installationMainColumn">
        <section className="installationCard energyChart"><header><h2>{chartCustomRange?'Période personnalisée':period==='Aujourd’hui'?'Aujourd’hui':period} vs habituel</h2><div className="chartDateControl" ref={chartDateRef}><button className="chartDateShift" type="button" aria-label="Période précédente" onClick={()=>shiftChartPeriod(-1)}><I.ChevronLeft size={16}/></button><button className="chartDateDisplay" type="button" aria-haspopup="dialog" aria-expanded={chartPickerOpen} onClick={openChartPicker}><I.CalendarDays size={16}/>{chartDateLabel}</button><button className="chartDateShift" type="button" aria-label="Période suivante" disabled={!canAdvanceChart} onClick={()=>shiftChartPeriod(1)}><I.ChevronRight size={16}/></button>{chartPickerOpen&&<div className="chartDatePicker" role="dialog" aria-label="Choisir une période"><div className="chartPickerHeader"><div><b>Choisir une période</b><small>Sélectionnez une date de début et de fin</small></div><div><button type="button" aria-label="Mois précédent" onClick={()=>moveCalendarMonth(-1)}><I.ChevronLeft size={16}/></button><button type="button" aria-label="Mois suivant" disabled={calendarMonth>=lastCalendarMonth} onClick={()=>moveCalendarMonth(1)}><I.ChevronRight size={16}/></button></div></div><div className="chartCalendarMonths">{calendarMonths.map(month=>{const label=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(month);return <section key={dateKey(month)}><h3>{label}</h3><div className="chartWeekdays">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(day=><span key={day}>{day}</span>)}</div><div className="chartCalendarDays">{monthDays(month).map((date,index)=>date?<button type="button" key={date} aria-label={date} disabled={date>todayKey} className={['date',date>todayKey&&'future',date===draftStartDate&&'start',date===draftEndDate&&'end',draftStartDate&&draftEndDate&&date>draftStartDate&&date<draftEndDate&&'inRange'].filter(Boolean).join(' ')} onClick={()=>chooseChartDate(date)}>{Number(date.slice(-2))}</button>:<span key={'blank-'+index}/>)}</div></section>})}</div><div className="chartRangeSummary"><I.CalendarRange size={15}/>{draftStartDate&&draftEndDate?`${new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(dateFromKey(draftStartDate))} – ${new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(dateFromKey(draftEndDate))}`:'Sélectionnez la date de fin'}</div><footer><button type="button" onClick={()=>setChartPickerOpen(false)}>Annuler</button><button type="button" className="apply" disabled={!draftStartDate||!draftEndDate||draftEndDate>todayKey} onClick={applyChartRange}>Appliquer</button></footer></div>}</div></header><div className="chartFrame"><svg viewBox="0 0 800 210" role="img" aria-label={'Comparaison de la production et de la consommation — '+period}><g className="chartGrid">{[20,62,104,146,188].map(y=><line key={y} x1="44" x2="790" y1={y} y2={y}/>)}</g><polyline className="chartProduction" points="44,186 120,186 178,184 230,177 280,151 326,105 370,69 414,45 460,38 500,58 540,98 583,145 630,174 700,184 790,186"/><polyline className="chartProduction average" points="44,187 175,187 250,178 326,126 400,89 460,78 510,92 583,139 650,178 790,187"/><polyline className="chartConsumption" points="44,154 106,161 168,153 228,159 300,151 370,160 440,148 500,133 552,125 605,116 650,84 696,69 730,76 760,108 790,127"/><polyline className="chartConsumption average" points="44,173 175,172 260,160 370,166 480,154 580,150 650,137 710,126 790,155"/></svg><div className="chartAxis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div></div><footer><span className="prod">Production aujourd’hui</span><span className="prod dashed">Production habituelle</span><span className="cons">Consommation aujourd’hui</span><span className="cons dashed">Consommation habituelle</span></footer></section>
        <section className="installationCard technicalCard"><header><h2><I.Gauge size={19}/>Mesures techniques <em className="technicalScope"><I.Activity size={13}/>Diagnostic</em></h2><button>Tout afficher<I.ChevronUp size={16}/></button></header><div>{[{title:'Solaire',icon:I.Sun,values:[['42,6 V','Tension'],['8,4 A','Courant'],[currentProduction,'Puissance']]},{title:'Batterie',icon:I.Battery,values:[[installation.status==='critical'?'22,1 V':'25,4 V','Tension'],['3,2 A','Courant'],[installation.status==='critical'?'À vérifier':'En décharge','État']]},{title:'Sortie AC',icon:I.Activity,values:[['221 V','Tension'],['3,5 A','Courant'],[currentConsumption,'Puissance']]},{title:'GPS / GSM',icon:I.Radio,values:[[installation.boxPosition,'Position'],[communicationOffline?'Hors ligne':installation.last,'Dernière transmission']]}].map(({title,icon:Icon,values})=><article key={title}><i><Icon size={16}/></i><div><b>{title}</b><span>{values.map(([value,label])=><strong key={label}>{value}<small>{label}</small></strong>)}</span></div></article>)}</div></section>
        <section className="installationCard insightCard"><h2>Ce qui se passe sur cette installation</h2><div><article className="insight good"><I.Sun size={28}/><span><b>Ce qui fonctionne</b><p>{normalItems.length?normalItems.join(' '):'Aucun indicateur ne se situe actuellement dans la plage habituelle.'}</p></span></article><article className="insight warning"><I.CircleAlert size={28}/><span><b>{needsAttention?'Ce qui nécessite votre attention':'Aucun point d’attention'}</b><p>{needsAttention?attentionItems.join(' ')+' Nous vous recommandons de vérifier avec le client.':'Aucun point critique n’est à signaler pour le moment.'}</p></span></article></div></section>
      </div>
      <aside className="installationRail">
        <section className="installationCard installationSummary"><header><h2>Résumé installation</h2></header><dl><dt><I.UserRound size={15}/>Client</dt><dd>{installation.client}</dd><dt><I.House size={15}/>N° installation</dt><dd>{installation.id}</dd><dt><I.SolarPanel size={15}/>Type</dt><dd>{installation.site}</dd><dt><I.MapPin size={15}/>Localisation</dt><dd>{installation.location}, Kinshasa</dd><dt><I.Radio size={15}/>Communication</dt><dd><ParkPill text={communicationLabel} kind={communicationPillKind}/></dd><dt><I.MapPin size={15}/>Position boîtier</dt><dd><ParkPill text={installation.boxPosition} kind={positionNeedsCheck?'watch':'secure'}/></dd><dt><I.ShieldCheck size={15}/>Intégrité boîtier</dt><dd><ParkPill text={installation.boxIntegrity} kind={integrityNeedsCheck?'watch':'secure'}/></dd><dt><I.Sparkles size={15}/>Statut global</dt><dd><ParkPill text={installation.global} kind={installation.status}/></dd><dt><I.CalendarDays size={15}/>Dernière donnée</dt><dd>{installation.last}</dd></dl></section>
        <section className="installationCard installationAlerts"><header><h2>Alertes récentes</h2><button>Voir tout</button></header>{alerts.map(({icon:Icon,tone,title,detail,time})=><article key={title}><i className={tone}><Icon size={18}/></i><span><b>{title}</b><small>{detail}</small></span><time>{time}</time></article>)}</section>
        <section className="installationCard quickActions"><h2>Actions rapides</h2><button className="primary"><I.Wrench size={17}/>Créer une intervention</button><button><I.History size={17}/>Voir l’historique complet</button></section>
      </aside>
    </section>
  </section>
}
type CatalogueCategory='Tous'|'Panneaux solaires'|'Batteries'|'Onduleurs'|'Accessoires'
type CatalogueProduct={name:string;brand:string;category:Exclude<CatalogueCategory,'Tous'>;power:string;detail:string;price:string;image:string;active:boolean;used:boolean}
const catalogueProducts:CatalogueProduct[]=[
  {name:'Panneau solaire 600 W',brand:'Orange Solar · PS600',category:'Panneaux solaires',power:'600 W',detail:'Monocristallin',price:'320 $',image:solarPanelsProduct,active:true,used:true},
  {name:'Panneau solaire 450 W',brand:'SolarTech · ST450',category:'Panneaux solaires',power:'450 W',detail:'Monocristallin',price:'245 $',image:solarPanelsProduct,active:true,used:true},
  {name:'Panneau solaire 550 W',brand:'Jinko · JKM550',category:'Panneaux solaires',power:'550 W',detail:'Monocristallin',price:'280 $',image:solarPanelsProduct,active:true,used:false},
  {name:'Batterie LiFePO4 5 kWh',brand:'Orange Energy · B5',category:'Batteries',power:'5 kWh',detail:'48 V · LiFePO₄',price:'950 $',image:batteryProduct,active:true,used:true},
  {name:'Batterie LiFePO4 2,5 kWh',brand:'PylonTech · US2000C',category:'Batteries',power:'2,5 kWh',detail:'48 V · LiFePO₄',price:'620 $',image:batteryProduct,active:true,used:true},
  {name:'Batterie GEL 5 kWh',brand:'Victron · GEL4850',category:'Batteries',power:'5 kWh',detail:'48 V · GEL',price:'700 $',image:batteryProduct,active:false,used:false},
  {name:'Onduleur hybride 3 kVA',brand:'Deye · SUN-3K',category:'Onduleurs',power:'3 kVA',detail:'48 V · Hybride',price:'420 $',image:inverterProduct,active:true,used:true},
  {name:'Onduleur hybride 5 kVA',brand:'Growatt · SPH5000',category:'Onduleurs',power:'5 kVA',detail:'48 V · Hybride',price:'680 $',image:inverterProduct,active:true,used:true},
  {name:'Onduleur off-grid 2 kVA',brand:'Must · PV20',category:'Onduleurs',power:'2 kVA',detail:'24 V · Off-grid',price:'320 $',image:inverterProduct,active:true,used:false},
  {name:'Kit de câblage solaire',brand:'Solar Access · SC10',category:'Accessoires',power:'10 m',detail:'Câble 4 mm²',price:'45 $',image:solarCableKit,active:true,used:false}
] as const
type CatalogueProductState=Pick<CatalogueProduct,'active'|'used'>
const catalogueProductStateKey='djua-catalogue-product-state'
const getCatalogueProducts=():CatalogueProduct[]=>{
  const states=store.get<Record<string,Partial<CatalogueProductState>>>(catalogueProductStateKey,{})
  return [...catalogueProducts,...store.get<CatalogueProduct[]>('djua-catalogue-products',[])].map(product=>({...product,...states[product.name]}))
}
const setCatalogueProductState=(name:string,changes:Partial<CatalogueProductState>)=>{
  const states=store.get<Record<string,Partial<CatalogueProductState>>>(catalogueProductStateKey,{})
  store.set(catalogueProductStateKey,{...states,[name]:{...states[name],...changes}})
}
const catalogueCategories:{label:CatalogueCategory;count:number;icon:React.ElementType}[]=[{label:'Tous',count:24,icon:I.Grid2X2},{label:'Panneaux solaires',count:8,icon:I.Sun},{label:'Batteries',count:6,icon:I.Battery},{label:'Onduleurs',count:7,icon:I.Activity},{label:'Accessoires',count:3,icon:I.Box}]
type ProductField={id:string;label:string;value:string;unit?:string;options?:string[]}
type ProductProfile={title:string;hint:string;icon:React.ElementType;image:string;name:string;brand:string;reference:string;price:string;technical:ProductField[];advanced:ProductField[];advice:string;completeness:number}
const productProfiles:Record<Exclude<CatalogueCategory,'Tous'>,ProductProfile>={
  'Panneaux solaires':{title:'Panneau solaire',hint:'Modules photovoltaïques',icon:I.Sun,image:solarPanelsProduct,name:'Panneau solaire 600 W',brand:'Orange Solar',reference:'PS600',price:'320',technical:[{id:'power',label:'Puissance nominale (W)',value:'600',unit:'W'},{id:'technology',label:'Technologie',value:'Monocristallin',options:['Monocristallin','Polycristallin']},{id:'warranty',label:'Garantie',value:'10',unit:'ans'}],advanced:[{id:'voltage',label:'Tension nominale (V)',value:'41,5',unit:'V'},{id:'current',label:'Courant max (A)',value:'14,5',unit:'A'}],advice:'Pour un panneau solaire, les informations les plus importantes sont la puissance nominale, la technologie et le prix de vente.',completeness:78},
  'Batteries':{title:'Batterie',hint:"Stockage d’énergie",icon:I.Battery,image:batteryProduct,name:'Batterie LiFePO₄ 5 kWh',brand:'Orange Energy',reference:'B5',price:'950',technical:[{id:'capacity',label:'Capacité',value:'5',unit:'kWh'},{id:'voltage',label:'Tension nominale',value:'48',unit:'V'},{id:'technology',label:'Technologie',value:'LiFePO₄',options:['LiFePO₄','GEL','AGM']},{id:'warranty',label:'Garantie',value:'5',unit:'ans'}],advanced:[{id:'ampHours',label:'Capacité (Ah)',value:'100',unit:'Ah'},{id:'depth',label:'Profondeur de décharge recommandée',value:'80',unit:'%'}],advice:'Pour une batterie, les informations les plus importantes sont la capacité, la tension nominale et la technologie.',completeness:82},
  'Onduleurs':{title:'Onduleur',hint:'Conversion DC / AC',icon:I.Activity,image:inverterProduct,name:'Onduleur hybride 3 kVA',brand:'Orange Energy',reference:'SUN-3K',price:'420',technical:[{id:'power',label:'Puissance nominale',value:'3',unit:'kVA'},{id:'batteryVoltage',label:'Tension batterie',value:'48',unit:'V'},{id:'type',label:'Type',value:'Hybride',options:['Hybride','Off-grid','On-grid']},{id:'warranty',label:'Garantie',value:'5',unit:'ans'}],advanced:[{id:'acOutput',label:'Tension de sortie AC',value:'220',unit:'V'},{id:'peak',label:'Puissance de crête',value:'6000',unit:'W'}],advice:'Pour un onduleur, les informations les plus importantes sont la puissance nominale, la tension batterie et le type.',completeness:82},
  'Accessoires':{title:'Accessoire',hint:'Câbles, fixations, etc.',icon:I.Box,image:solarCableKit,name:'Kit de câblage solaire',brand:'Orange Access',reference:'SC10',price:'45',technical:[{id:'type',label:"Type d’accessoire",value:'Câblage',options:['Câblage','Connecteur','Fixation']},{id:'length',label:'Longueur',value:'10',unit:'m'},{id:'section',label:'Section',value:'4',unit:'mm²'},{id:'warranty',label:'Garantie',value:'1',unit:'an'}],advanced:[{id:'compatibility',label:'Compatibilité système',value:'12/24/48 V',options:['12/24/48 V','24/48 V']},{id:'use',label:'Utilisation',value:'Intérieur / extérieur',options:['Intérieur / extérieur','Intérieur']}],advice:'Pour un accessoire, les informations les plus importantes sont le type, les dimensions et la compatibilité système.',completeness:82}
}
const profileValues=(fields:ProductField[])=>Object.fromEntries(fields.map(field=>[field.id,field.value])) as Record<string,string>
function CatalogueCategoryPill({category}:{category:Exclude<CatalogueCategory,'Tous'>}){const Icon=category==='Panneaux solaires'?I.Sun:category==='Batteries'?I.Battery:category==='Onduleurs'?I.Activity:I.Box;return <span className={'catalogueCategoryPill '+(category==='Panneaux solaires'?'solar':category==='Batteries'?'battery':category==='Onduleurs'?'inverter':'accessory')}><Icon size={13}/>{category==='Panneaux solaires'?'Panneau solaire':category.slice(0,-1)}</span>}
function ProductsCatalogue(){
  const navigate=useNavigate()
  const [products,setProducts]=useState<CatalogueProduct[]>(getCatalogueProducts)
  const [category,setCategory]=useState<CatalogueCategory>('Tous')
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState('Tous')
  const [usage,setUsage]=useState('Tous')
  const [sort,setSort]=useState('Nom (A → Z)')
  const [openAction,setOpenAction]=useState<string|null>(null)
  const [enabled,setEnabled]=useState(()=>Object.fromEntries(products.map((product,index)=>[index,product.used])))
  const visibleProducts=products.filter(product=>{
    const matchesCategory=category==='Tous'||product.category===category
    const matchesQuery=`${product.name} ${product.brand}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus=status==='Tous'||(status==='Actif'?product.active:!product.active)
    const matchesUsage=usage==='Tous'||(usage==='Utilisés'?enabled[products.indexOf(product)]:!enabled[products.indexOf(product)])
    return matchesCategory&&matchesQuery&&matchesStatus&&matchesUsage
  })
  const sortedProducts=[...visibleProducts].sort((first,second)=>sort==='Prix croissant'?Number.parseFloat(first.price)-Number.parseFloat(second.price):sort==='Prix décroissant'?Number.parseFloat(second.price)-Number.parseFloat(first.price):first.name.localeCompare(second.name,'fr'))
  const toggleProductStatus=(target:CatalogueProduct)=>{const active=!target.active;setCatalogueProductState(target.name,{active});setProducts(current=>current.map(product=>product.name===target.name?{...product,active}:product));setOpenAction(null)}
  const duplicateProduct=(target:CatalogueProduct)=>{const duplicate={...target,name:`${target.name} — copie`};setProducts(current=>[...current,duplicate]);setEnabled(current=>({...current,[products.length]:Boolean(enabled[products.indexOf(target)])}));setOpenAction(null)}
  const removeProduct=(target:CatalogueProduct)=>{if(!window.confirm(`Supprimer « ${target.name} » du catalogue ?`))return;setProducts(current=>current.filter(product=>product!==target));setOpenAction(null)}
  return <section className="workspacePage cataloguePage">
    <header className="workspaceHeading catalogueHead"><div><h1>Catalogue de produits</h1><p>Gérez les équipements utilisés par Djúa pour construire les recommandations.</p></div><div><button className="catalogueImport"><I.Upload size={17}/>Importer (CSV)</button><button type="button" className="catalogueAdd" onClick={()=>navigate('/produits/nouveau')}><I.Plus size={18}/>Ajouter un produit</button></div></header>
    <div className="catalogueLayout">
      <div className="catalogueMain">
        <nav className="catalogueCategories" aria-label="Catégories de produits">{catalogueCategories.map(({label,count,icon:Icon})=><button type="button" key={label} className={category===label?'active':''} onClick={()=>setCategory(label)}><i><Icon size={19}/></i><b>{label}</b><span>{count}</span></button>)}</nav>
        <div className="catalogueFilters"><label><I.Search size={19}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher un produit, une marque…"/></label><select aria-label="Statut du produit" value={status} onChange={event=>setStatus(event.target.value)}><option>Tous</option><option>Actif</option><option>Inactif</option></select><select aria-label="Utilisation dans les recommandations" value={usage} onChange={event=>setUsage(event.target.value)}><option>Tous</option><option>Utilisés</option><option>Non utilisés</option></select><select aria-label="Trier les produits" value={sort} onChange={event=>setSort(event.target.value)}><option>Nom (A → Z)</option><option>Prix croissant</option><option>Prix décroissant</option></select></div>
        <section className="catalogueTableWrap"><table className="catalogueTable"><thead><tr><th><input type="checkbox" aria-label="Sélectionner tous les produits"/></th><th>Produit</th><th>Catégorie</th><th>Caractéristiques clés</th><th>Prix (USD)</th><th>Statut</th><th>Utilisé pour les<br/>recommandations</th><th>Actions</th></tr></thead><tbody>{sortedProducts.map(product=>{const index=products.indexOf(product);const menuOpen=openAction===product.name;return <tr key={product.name} className="catalogueClickableRow" onClick={event=>{if((event.target as HTMLElement).closest('input,button,label'))return;navigate('/produits/'+encodeURIComponent(product.name))}}><td><input type="checkbox" aria-label={'Sélectionner '+product.name}/></td><td><button type="button" className="catalogueOpenProduct" onClick={()=>navigate('/produits/'+encodeURIComponent(product.name))} aria-label={'Voir '+product.name}><span className="catalogueProduct"><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.brand}</small></span></span></button></td><td><CatalogueCategoryPill category={product.category}/></td><td><span className="catalogueSpecs"><b>{product.power}</b><small>{product.detail}</small></span></td><td><b>{product.price}</b></td><td><span className={'catalogueStatus '+(product.active?'active':'inactive')}><i/>{product.active?'Actif':'Inactif'}</span></td><td><label className="catalogueSwitch"><input type="checkbox" checked={Boolean(enabled[index])} onChange={()=>setEnabled(current=>({...current,[index]:!current[index]}))} aria-label={'Utiliser '+product.name+' pour les recommandations'}/><i/></label></td><td className="catalogueActionCell"><button type="button" className="catalogueMore" aria-label={'Actions pour '+product.name} aria-expanded={menuOpen} onClick={()=>setOpenAction(current=>current===product.name?null:product.name)}><I.MoreHorizontal size={20}/></button>{menuOpen&&<div className="catalogueActionMenu" role="menu" aria-label={'Actions pour '+product.name}><button type="button" role="menuitem" onClick={()=>navigate('/produits/'+encodeURIComponent(product.name))}><I.Eye size={15}/>Voir le détail</button><button type="button" role="menuitem" onClick={()=>toggleProductStatus(product)}><I.Power size={15}/>{product.active?'Désactiver':'Activer'}</button><button type="button" role="menuitem" onClick={()=>duplicateProduct(product)}><I.Copy size={15}/>Dupliquer</button><button type="button" role="menuitem" className="danger" onClick={()=>removeProduct(product)}><I.Trash2 size={15}/>Supprimer</button></div>}</td></tr>})}</tbody></table>{visibleProducts.length===0&&<p className="catalogueEmpty">Aucun produit ne correspond à ces filtres.</p>}<footer><span>Affichage de {visibleProducts.length} sur {products.length} produits</span><nav aria-label="Pagination"><button><I.ChevronLeft size={17}/></button><button className="current">1</button><button>2</button><button>3</button><button><I.ChevronRight size={17}/></button></nav></footer></section>
      </div>
      <aside className="catalogueRail"><section><header><h2>État du catalogue</h2></header>{catalogueCategories.slice(1).map(({label,count,icon:Icon})=><article className="catalogueHealth" key={label}><i><Icon size={21}/></i><span><b>{label}</b><small>{count} produits</small></span><I.CheckCircle2 size={21}/></article>)}<article className="catalogueIncomplete"><I.TriangleAlert size={25}/><span><b>2 produits incomplets</b><p>Certaines caractéristiques manquent. Ces produits ne seront pas utilisés dans les recommandations.</p></span><I.ChevronRight size={18}/></article></section><section><header><h2>Produits les plus utilisés</h2><small>30 derniers jours</small></header>{catalogueProducts.slice(0,5).map((product,index)=><article className="cataloguePopular" key={product.name}><em>{index+1}</em><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.brand}</small></span><strong>{[56,42,38,27,19][index]} utilisations</strong></article>)}</section><section className="catalogueHelp"><I.BookOpen size={25}/><span><b>Besoin d’aide ?</b><p>Découvrez comment bien renseigner vos produits dans notre guide.</p><button>Voir le guide <I.ExternalLink size={14}/></button></span></section></aside>
    </div>
  </section>
}
function ProductDetail(){
  const navigate=useNavigate()
  const {id}=useParams()
  const product=getCatalogueProducts().find(item=>item.name===decodeURIComponent(id||''))||catalogueProducts[0]
  const [active,setActive]=useState(product.active)
  const [used,setUsed]=useState(product.used)
  const [tab,setTab]=useState('Vue d’ensemble')
  useEffect(()=>{setActive(product.active);setUsed(product.used)},[product.name,product.active,product.used])
  const toggleProductStatus=()=>{const next=!active;setActive(next);setCatalogueProductState(product.name,{active:next})}
  const [brand,reference]=product.brand.split(' · ')
  const [technicalVoltage,technicalType]=product.detail.split(' · ')
  const categoryLabel=product.category==='Panneaux solaires'?'Panneau solaire':product.category.slice(0,-1)
  const profile=productProfiles[product.category]
  const SummaryIcon=profile.icon
  const categoryDetails={
    'Panneaux solaires':{metrics:[{icon:I.Zap,label:'Puissance nominale',value:product.power},{icon:I.Settings,label:'Technologie',value:product.detail},{icon:I.Tag,label:'Prix de vente',value:product.price},{icon:I.ShieldCheck,label:'Garantie',value:'10 ans'}],technical:[['Puissance nominale',product.power],['Tension nominale','41,5 V'],['Rendement','21,4 %'],['Technologie',product.detail],['Courant max','14,5 A'],['Poids','31 kg']],advice:'Les produits complets et actifs sont prioritaires dans les recommandations de Djúa. Veillez à maintenir vos informations à jour pour maximiser leur visibilité auprès de vos clients.',usage:'56 recommandations'},
    'Batteries':{metrics:[{icon:I.Battery,label:'Capacité',value:product.power},{icon:I.Zap,label:'Tension nominale',value:technicalVoltage||'48 V'},{icon:I.Settings,label:'Technologie',value:technicalType||'LiFePO₄'},{icon:I.ShieldCheck,label:'Garantie',value:'5 ans'}],technical:[['Capacité',product.power],['Tension nominale',technicalVoltage||'48 V'],['Technologie',technicalType||'LiFePO₄'],['Capacité (Ah)','100 Ah'],['Profondeur de décharge recommandée','80 %'],['Poids','45 kg']],advice:'Les produits de batteries doivent avoir des informations complètes sur la capacité, la tension et la technologie. Veillez à maintenir ces informations à jour pour maximiser leur visibilité auprès de vos clients.',usage:'42 recommandations'},
    'Onduleurs':{metrics:[{icon:I.Zap,label:'Puissance nominale',value:product.power},{icon:I.Battery,label:'Tension batterie',value:technicalVoltage||'48 V'},{icon:I.Settings,label:'Type',value:technicalType||'Hybride'},{icon:I.ShieldCheck,label:'Garantie',value:'5 ans'}],technical:[['Puissance nominale',product.power],['Tension batterie',technicalVoltage||'48 V'],['Type',technicalType||'Hybride'],['Tension de sortie AC','220 V'],['Puissance de crête','6000 W'],['Poids','18 kg']],advice:'Les onduleurs doivent avoir des informations complètes sur la puissance nominale, la tension batterie et le type. Veillez à maintenir ces informations à jour pour maximiser leur visibilité auprès de vos clients.',usage:'38 recommandations'},
    'Accessoires':{metrics:[{icon:I.Settings,label:"Type d’accessoire",value:'Câblage'},{icon:I.Ruler,label:'Longueur',value:'10 m'},{icon:I.Layers,label:'Section',value:'4 mm²'},{icon:I.ShieldCheck,label:'Garantie',value:'1 an'}],technical:[["Type d’accessoire",'Câblage'],['Longueur','10 m'],['Section','4 mm²'],['Compatibilité système','12/24/48 V'],['Utilisation','Intérieur / extérieur'],['Poids','2 kg']],advice:'Les produits accessoires doivent avoir des informations complètes sur leur type, leurs dimensions et leur compatibilité système. Veillez à maintenir ces informations à jour pour maximiser leur visibilité auprès de vos clients.',usage:'19 recommandations'}
  }[product.category]
  const renderDetails=tab==='Vue d’ensemble'||tab==='Caractéristiques techniques'
  const renderUsage=tab==='Vue d’ensemble'||tab==='Utilisation dans Djúa'
  return <section className="workspacePage productDetailPage">
    <header className="productDetailHead"><div><h1>{product.name}</h1><p>{brand}　•　{reference}<span className={'catalogueStatus '+(active?'active':'inactive')}><i/>{active?'Actif':'Inactif'}</span><label className="productDetailSwitch"><span className="catalogueSwitch"><input type="checkbox" checked={used} onChange={()=>setUsed(value=>!value)}/><i/></span>Utilisé pour les recommandations</label></p></div><div><Button secondary onClick={()=>navigate('/produits/nouveau')}><I.Pencil size={16}/>Modifier</Button><button type="button" className={'productDeactivate '+(!active?'activate':'')} onClick={toggleProductStatus}><I.Power size={17}/>{active?'Désactiver':'Activer'}</button></div></header>
    <div className="productDetailLayout"><main><section className="productHero"><img src={product.image} alt={product.name}/><div>{categoryDetails.metrics.map(({icon:Icon,label,value})=><article key={label}><Icon size={22}/><span><small>{label}</small><b>{value}</b></span></article>)}</div></section><nav className="productDetailTabs">{['Vue d’ensemble','Caractéristiques techniques','Utilisation dans Djúa','Historique'].map(item=><button type="button" key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}>{item}</button>)}</nav>{tab==='Historique'?<section className="productDetailCard productHistory"><header><I.History size={22}/><h2>Historique</h2></header><article><I.FileText size={18}/><span><b>Ajouté au catalogue</b><small>Il y a 1 jour</small></span></article><article><I.Eye size={18}/><span><b>Consulté aujourd’hui</b><small>Il y a 3 heures</small></span></article></section>:<>{tab==='Vue d’ensemble'&&<section className="productDetailCard"><header><I.FileText size={22}/><h2>Informations générales</h2></header><div className="productDetailData"><span><small>Nom du produit</small><b>{product.name}</b></span><span><small>Marque</small><b>{brand}</b></span><span><small>Référence / Modèle</small><b>{reference}</b></span><span><small>SKU</small><b>OE-{reference}</b></span><span><small>Catégorie</small><b>{categoryLabel}</b></span><span><small>Prix de vente</small><b>{product.price}</b></span></div></section>}{renderDetails&&<section className="productDetailCard"><header><I.Settings size={22}/><h2>Caractéristiques techniques</h2></header><div className="productDetailData">{categoryDetails.technical.map(([label,value])=><span key={label}><small>{label}</small><b>{value}</b></span>)}</div><button type="button" className="productAdvancedButton"><I.ChevronDown size={17}/>Voir les caractéristiques avancées</button></section>}{renderUsage&&<section className="productDetailCard productDetailUsage"><header><I.BarChart3 size={22}/><h2>Utilisation dans Djúa</h2></header><div className="productDetailData"><span><small>Utilisé pour les recommandations</small><b><I.CheckCircle2 size={17}/>Oui</b></span><span><small>Statut du produit</small><b><I.CheckCircle2 size={17}/>{active?'Actif':'Inactif'}</b></span><span><small>Complétude des données</small><b className="productComplete">100 %</b></span><span><small>Utilisé dans</small><b>{categoryDetails.usage}</b></span><span><small>Dernière utilisation</small><b>Aujourd’hui</b></span></div><p><I.Info size={18}/>Seuls les produits actifs et complets sont proposés par Djúa dans les recommandations.</p></section>}</>}</main><aside className="productDetailRail"><section className="productDetailSummary"><header><SummaryIcon size={22}/><h2>Résumé du produit</h2></header><dl><dt>Catégorie</dt><dd>{categoryLabel}</dd><dt>Marque</dt><dd>{brand}</dd><dt>Référence</dt><dd>{reference}</dd><dt>Prix de vente</dt><dd>{product.price}</dd><dt>Statut</dt><dd><span className={'catalogueStatus '+(active?'active':'inactive')}><i/>{active?'Actif':'Inactif'}</span></dd><dt>Utilisé pour les recommandations</dt><dd><span className="catalogueSwitch"><input type="checkbox" checked={used} readOnly/><i/></span> Oui</dd></dl></section><section className="productDetailState"><header><I.Database size={22}/><h2>État du produit</h2><button type="button">Voir les détails</button></header><div><i><span/></i><strong>100 %</strong></div>{['Informations générales','Caractéristiques principales','Caractéristiques avancées','Utilisation dans Djúa'].map((item,index)=><p key={item}><I.CheckCircle2 size={18}/>{item}<small>{index===0?'5/5':index===1?`${categoryDetails.metrics.length}/${categoryDetails.metrics.length}`:index===2?'2/2':'2/2'}</small></p>)}</section><section className="productDetailRecent"><header><I.Clock3 size={22}/><h2>Utilisation récente</h2></header><p><I.UsersRound size={18}/><span>Recommandé pour Maison de Jean Kabeya</span><small>Il y a 2 heures</small></p><p><I.FileText size={18}/><span>Ajouté au devis OE-2026-00847</span><small>Il y a 1 jour</small></p><p><I.Eye size={18}/><span>Consulté aujourd’hui</span><small>Il y a 3 heures</small></p></section><section className="productDetailAdvice"><I.Lightbulb size={24}/><span><h2>Conseil Djúa</h2><p>{categoryDetails.advice}</p></span></section></aside></div>
  </section>
}
function Simple({title}:{title:string}){return <Page title={title} sub="Module de démonstration"><Card><h2>{title}</h2><p className="muted">Cet espace est prêt pour la démonstration. Les données principales se trouvent dans les parcours Dimensionnements et Devis.</p></Card></Page>}
function Settings(){const reset=()=>{if(confirm('Réinitialiser toutes les données de démonstration ?')){localStorage.clear();location.href='/dashboard'}};return <Page title="Paramètres"><Card title="Données de démonstration"><p>Restaurez le scénario initial pour rejouer la démonstration avec Jean Kabeya.</p><Button onClick={reset}>Réinitialiser les données de démonstration</Button></Card></Page>}
function ProductCreate(){
  const navigate=useNavigate()
  const [category,setCategory]=useState<Exclude<CatalogueCategory,'Tous'>>('Panneaux solaires')
  const initialProfile=productProfiles['Panneaux solaires']
  const [name,setName]=useState(initialProfile.name)
  const [brand,setBrand]=useState(initialProfile.brand)
  const [reference,setReference]=useState(initialProfile.reference)
  const [price,setPrice]=useState(initialProfile.price)
  const [technicalValues,setTechnicalValues]=useState(()=>profileValues(initialProfile.technical))
  const [advancedValues,setAdvancedValues]=useState(()=>profileValues(initialProfile.advanced))
  const [active,setActive]=useState(true)
  const [used,setUsed]=useState(true)
  const selection=productProfiles[category]
  const SelectedIcon=selection.icon
  const completeness=selection.completeness
  const selectCategory=(next:Exclude<CatalogueCategory,'Tous'>)=>{const profile=productProfiles[next];setCategory(next);setName(profile.name);setBrand(profile.brand);setReference(profile.reference);setPrice(profile.price);setTechnicalValues(profileValues(profile.technical));setAdvancedValues(profileValues(profile.advanced))}
  const updateTechnical=(id:string,value:string)=>setTechnicalValues(current=>({...current,[id]:value}))
  const updateAdvanced=(id:string,value:string)=>setAdvancedValues(current=>({...current,[id]:value}))
  const saveProduct=()=>{const mainSpec=selection.technical[0];const detailSpec=selection.technical.find(field=>field.options);const product:CatalogueProduct={name:name.trim(),brand:`${brand.trim()} · ${reference.trim()}`,category,power:`${technicalValues[mainSpec.id]}${mainSpec.unit?` ${mainSpec.unit}`:''}`,detail:detailSpec?technicalValues[detailSpec.id]:selection.title,price:`${price} $`,image:selection.image,active,used};store.set('djua-catalogue-products',[product,...store.get<CatalogueProduct[]>('djua-catalogue-products',[])]);navigate('/produits')}
  return <div className="productEntryScroll"><section className="workspacePage productCreatePage">
    <form onSubmit={event=>{event.preventDefault();saveProduct()}}>
      <header className="productCreateHead"><div><h1>Ajouter un produit</h1><p>Ajoutez un produit qui sera utilisé par Djúa pour construire les recommandations.</p></div></header>
      <div className="productCreateLayout">
        <div className="productCreateForm">
          <section className="productFormCard"><header><i>1</i><span><h2>Catégorie du produit</h2><p>Sélectionnez la catégorie à laquelle appartient ce produit.</p></span></header><div className="productCategoryChoices">{(Object.keys(productProfiles) as Exclude<CatalogueCategory,'Tous'>[]).map(key=>{const info=productProfiles[key];const Icon=info.icon;return <button type="button" className={category===key?'selected':''} key={key} onClick={()=>selectCategory(key)}><i><Icon size={23}/></i><span><b>{info.title}</b><small>{info.hint}</small></span>{category===key?<I.CheckCircle2 size={18}/>:<I.Circle size={18}/>}</button>})}</div></section>
          <section className="productFormCard"><header><i>2</i><span><h2>Informations générales</h2><p>Renseignez les informations principales du produit.</p></span></header><div className="productGeneralLayout"><div className="productFields"><label>Nom du produit <b>*</b><input required value={name} onChange={event=>setName(event.target.value)}/></label><label>Marque <b>*</b><input required value={brand} onChange={event=>setBrand(event.target.value)}/></label><label>Référence / Modèle <b>*</b><input required value={reference} onChange={event=>setReference(event.target.value)}/></label><label>Prix de vente (USD) <b>*</b><span className="productUnitField"><input required inputMode="decimal" value={price} onChange={event=>setPrice(event.target.value)}/><em>USD</em></span></label><label>SKU <small>(optionnel)</small><input placeholder="Ex. OS-PS600"/></label></div><aside className="productImageUpload"><div><img src={selection.image} alt="Aperçu du produit"/></div></aside></div></section>
          <section className="productFormCard"><header><i>3</i><span><h2>Caractéristiques techniques</h2><p>Renseignez les caractéristiques techniques principales de ce {selection.title.toLowerCase()}.</p></span></header><div className={'productTechFields '+(selection.technical.length===4?'four':'')}>{selection.technical.map(field=><label key={field.id}>{field.label} <b>*</b>{field.options?<select value={technicalValues[field.id]} onChange={event=>updateTechnical(field.id,event.target.value)}>{field.options.map(option=><option key={option}>{option}</option>)}</select>:<span className="productUnitField"><input required inputMode="decimal" value={technicalValues[field.id]} onChange={event=>updateTechnical(field.id,event.target.value)}/><em>{field.unit}</em></span>}</label>)}</div><details className="productAdvanced" open={category!=='Panneaux solaires'}><summary><I.ChevronDown size={17}/><span><b>Caractéristiques avancées</b> <small>(optionnel)</small><em>Informations complémentaires pour affiner les recommandations.</em></span></summary><div>{selection.advanced.map(field=><label key={field.id}>{field.label}{field.options?<select value={advancedValues[field.id]} onChange={event=>updateAdvanced(field.id,event.target.value)}>{field.options.map(option=><option key={option}>{option}</option>)}</select>:<span className="productUnitField"><input inputMode="decimal" value={advancedValues[field.id]} onChange={event=>updateAdvanced(field.id,event.target.value)}/><em>{field.unit}</em></span>}</label>)}</div></details></section>
          <section className="productFormCard productUsageCard"><header><i>4</i><span><h2>Utilisation dans Djúa</h2><p>Définissez comment ce produit sera utilisé dans la plateforme.</p></span></header><div><label className="productUsageSwitch"><span><b>Utiliser pour les recommandations</b><small>Ce produit pourra être proposé dans les recommandations Djúa.</small></span><span className="catalogueSwitch"><input type="checkbox" checked={used} onChange={()=>setUsed(value=>!value)}/><i/></span></label><label className="productStatusField"><b>Statut du produit</b><span className={'productStatusSelect '+(active?'active':'inactive')}><i aria-hidden="true"/><select value={active?'Actif':'Inactif'} onChange={event=>setActive(event.target.value==='Actif')}><option>Actif</option><option>Inactif</option></select></span><small>Les produits inactifs ne sont pas proposés dans les recommandations.</small></label></div><p className="productFormWarning"><I.TriangleAlert size={18}/><span><b>Les produits incomplets ne seront pas utilisés dans les recommandations.</b> Assurez-vous de renseigner les informations essentielles avant d’enregistrer ce produit.</span></p></section>
        <footer className="productCreateActions productCreateFooter"><Button secondary onClick={()=>navigate('/produits')}>Annuler</Button><Button><I.Save size={16}/>Enregistrer le produit</Button></footer></div>
        <aside className="productCreateRail"><section className="productPreview"><header><SelectedIcon size={20}/><h2>Résumé du produit</h2></header><img src={selection.image} alt=""/><dl><dt>Catégorie</dt><dd>{selection.title}</dd><dt>Nom</dt><dd>{name||'—'}</dd><dt>Marque</dt><dd>{brand||'—'}</dd><dt>Référence</dt><dd>{reference||'—'}</dd><dt>Prix de vente</dt><dd>{price?`${price} $`:'—'}</dd><dt>Statut</dt><dd><span className={'catalogueStatus '+(active?'active':'inactive')}><i/>{active?'Actif':'Inactif'}</span></dd><dt>Utilisé pour les recommandations</dt><dd><span className="catalogueSwitch"><input type="checkbox" checked={used} readOnly/><i/></span></dd></dl><button type="button" onClick={()=>navigate('/produits')}><I.ExternalLink size={15}/>Voir le produit après enregistrement</button></section><section className="productCompleteness"><header><I.Lightbulb size={20}/><h2>Complétude</h2><strong>{completeness} %</strong></header><div><i><span style={{width:`${completeness}%`}}/></i></div><ul><li><I.CheckCircle2 size={16}/>Informations générales <b>5/5</b></li><li><I.CheckCircle2 size={16}/>Caractéristiques principales <b>{selection.technical.length}/{selection.technical.length}</b></li><li><I.CheckCircle2 size={16}/>Caractéristiques avancées <b>{selection.advanced.length}/{selection.advanced.length}</b></li><li><I.CheckCircle2 size={16}/>Utilisation dans Djúa <b>2/2</b></li></ul></section><section className="productAdvice"><I.Lightbulb size={22}/><span><h2>Conseil Djúa</h2><p>{selection.advice}</p><p>Seuls les produits complets sont utilisés dans les recommandations afin de garantir des résultats fiables.</p></span></section></aside>
      </div>
    </form>
  </section></div>
}
function App(){return <Layout><Routes><Route path="/" element={<Dashboard/>}/><Route path="/dashboard" element={<Dashboard/>}/><Route path="/dimensionnements" element={<Dimensionnements/>}/><Route path="/dimensionnements/nouveau" element={<Navigate to="/devis" replace/>}/><Route path="/dimensionnements/nouveau/client" element={<ClientForm/>}/><Route path="/dimensionnements/:id/logement" element={<DynamicHousing/>}/><Route path="/dimensionnements/:id/site" element={<DynamicHousing/>}/><Route path="/dimensionnements/:id/appareils" element={<Appliances/>}/><Route path="/dimensionnements/:id/recommandation" element={<Recommendation/>}/><Route path="/devis" element={<QuoteList/>}/><Route path="/devis/:id/edit" element={<QuoteEdit/>}/><Route path="/devis/:id/preview" element={<QuotePreview/>}/><Route path="/devis/:id/share" element={<Share/>}/><Route path="/devis/:id" element={<Tracking/>}/><Route path="/installations" element={<ParcSolaire/>}/><Route path="/installations/:id" element={<InstallationDetail/>}/><Route path="/produits" element={<ProductsCatalogue/>}/><Route path="/produits/nouveau" element={<ProductCreate/>}/><Route path="/produits/:id" element={<ProductDetail/>}/><Route path="/parametres" element={<Settings/>}/>{['/clients','/interventions','/rapports'].map(x=><Route key={x} path={x} element={<Simple title={x.slice(1)[0].toUpperCase()+x.slice(2)}/>}/>)}</Routes></Layout>}
function DynamicHousing(){
  const nav=useNavigate();
  const {id}=useParams();
  const company=id==='kivu';
  const project={...defaultProject(id),...store.get<SizingProject>(projectKey(id),defaultProject(id))};
  const [locationType,setLocationType]=useState(project.locationType);
  const [customType,setCustomType]=useState('');
  const [locationName,setLocationName]=useState(project.locationName);
  const [address,setAddress]=useState(project.address);
  const [city,setCity]=useState(project.city);
  const [coordinates,setCoordinates]=useState<MapCoordinates>({lat:-4.3276,lng:15.3136});
  const [locationNote,setLocationNote]=useState('');
  const [mapDialogOpen,setMapDialogOpen]=useState(false);
  const lookupRef=useRef(0);
  const locationLabel=company?'Site':'Logement';
  const customOption=company?'Autre type de site':'Autre logement';
  const personTypes:[string,React.ElementType,string?][]=[['Maison individuelle',I.House],['Appartement',I.Building2],['Autre logement',I.House]];
  const companyTypes:[string,React.ElementType,string?][]=[['Commerce',I.Store,siteCommerce],['Bureau',I.Building2,siteOffice],['Atelier / Usine',I.Factory,siteWorkshop],['École',I.GraduationCap,siteSchool],['Santé',I.Cross,siteOffice],['Autre type de site',I.Building2,siteCommerce]];
  const options=company?companyTypes:personTypes;
  const detailLabel=locationType==='Appartement'?'Niveau':locationType==='Maison individuelle'?'Nombre de pièces':'Nombre de niveaux';
  const detailValues=locationType==='Appartement'?['1er niveau','2e niveau','3e niveau','4e niveau']:locationType==='Maison individuelle'?['1 pièce','2 pièces','3 pièces','4 pièces','5 pièces et plus']:['1 niveau','2 niveaux','3 niveaux et plus'];
  const chooseMapPoint=useCallback(async(point:MapCoordinates)=>{
    setCoordinates(point);
    const request=++lookupRef.current;
    setLocationNote('Recherche de l’adresse…');
    try{
      const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${point.lat}&lon=${point.lng}`);
      if(!response.ok)throw new Error('Adresse indisponible');
      const result=await response.json();
      if(request!==lookupRef.current)return;
      const details=result.address||{};
      const selectedAddress=[details.house_number,details.road||details.pedestrian||details.neighbourhood].filter(Boolean).join(' ');
      const selectedCity=details.city||details.town||details.village||details.county||details.state;
      if(selectedAddress)setAddress(selectedAddress);
      if(selectedCity)setCity(selectedCity);
      setLocationNote(result.display_name||'Emplacement sélectionné');
    }catch{
      if(request===lookupRef.current)setLocationNote(`Coordonnées : ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    }
  },[]);
  const continueToAppliances=()=>{const resolvedType=locationType===customOption&&customType.trim()?customType.trim():locationType;store.set(projectKey(id),{...project,locationName:locationName.trim()||project.locationName,locationType:resolvedType,address:address.trim()||project.address,city:city.trim()||project.city});nav(`/dimensionnements/${id||'jean'}/appareils`)};
  return <Page title="Nouveau devis">
    <div className="split locationStep">
      <div>
        <Progress step={2} labels={company?['Entreprise','Site','Appareils']:['Client','Logement','Appareils']}/>
        <section className="locationCard">
          <h2>{locationLabel} à dimensionner</h2>
          <p className="muted">Où le système solaire sera-t-il installé ?</p>
          <div className="createdClient"><i>{company?<I.Building2 size={21}/>:<I.UserRound size={21}/>}</i><span><b>{project.customerName}</b><small>Client créé avec succès</small></span><I.Check size={19}/></div>
          <h3 className="locationSectionTitle">Type de {company?'site':'logement'} <em>*</em></h3>
          <div className={'locationTypes '+(company?'siteTypes':'homeTypes')}>
            {options.map(([label,Icon,image])=>{
              const visual=image?<img className="siteTypeThumbnail" src={image} alt=""/>:<Icon size={27}/>
              return label===customOption&&locationType===label
                ?<label className="otherTypeButton selected" key={label}>{visual}<input aria-label={'Précisez le type de '+locationLabel.toLowerCase()} autoFocus value={customType} onChange={event=>setCustomType(event.target.value)} placeholder={company?'Ex. : Église, hôtel, restaurant…':'Ex. : Villa, résidence, immeuble…'}/><i><I.CircleDot size={17}/></i></label>
                :<button className={locationType===label?'selected':''} key={label} onClick={()=>setLocationType(label)}>{visual}<b>{label}</b><i>{locationType===label&&<I.CircleDot size={17}/>}</i></button>
            })}
          </div>
          <h3 className="locationSectionTitle">Informations du {company?'site':'logement'}</h3>
          <div className={'locationFields '+(company?'companyLocationFields':'homeNameFields')}>
            <label>Nom du {company?'site':'logement'} <em>*</em><input value={locationName} onChange={event=>setLocationName(event.target.value)}/><small>{company?'Ex. : Boutique Gombe, Entrepôt Limete, Agence Matete…':'Ce nom permet d’identifier facilement ce logement.'}</small></label>
            {!company&&<label>{detailLabel} <span>(optionnel)</span><select defaultValue={detailValues[0]}>{detailValues.map(value=><option key={value}>{value}</option>)}</select></label>}
            <label>Ville / commune <em>*</em><input value={city} onChange={event=>setCity(event.target.value)}/></label>
          </div>
          <div className="locationFields addressFields">
            <label>Adresse / quartier <em>*</em><input value={address} onChange={event=>setAddress(event.target.value)}/></label>
            <label>Repère <span>(optionnel)</span><input placeholder={company?'Ex. : En face de la station Total':'Ex. : Près de l’école, à côté de…'}/></label>
          </div>
          <div className="mapLocation">
            <OpenStreetMapSelector value={coordinates} onChange={chooseMapPoint}/>
            <aside>
              <div><i><I.MapPin size={19}/></i><span><b>Localisation sélectionnée</b><small>{address}<br/>{city}<br/><em>{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</em></small></span></div>
              <Button secondary onClick={()=>setMapDialogOpen(true)}><I.Pencil size={16}/> Ajuster sur la carte</Button>
            </aside>
          </div>
          {mapDialogOpen&&<MapPickerDialog value={coordinates} onClose={()=>setMapDialogOpen(false)} onConfirm={point=>{chooseMapPoint(point);setMapDialogOpen(false)}}/>}
          <div className="locationActions"><Button secondary onClick={()=>nav('/dimensionnements/nouveau/client')}><I.ArrowLeft size={16}/> Retour</Button><Button onClick={continueToAppliances}>Continuer vers les appareils <I.ArrowRight size={16}/></Button></div>
        </section>
      </div>
      <LocationSummary company={company} customerName={project.customerName}/>
    </div>
  </Page>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>)
