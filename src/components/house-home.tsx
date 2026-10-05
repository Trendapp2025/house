'use client';
import { useEffect, useRef, useState } from 'react';
import { House, MapPin, ChevronDown, Building2, ShieldCheck, BadgeEuro, ArrowRight, X, Menu } from 'lucide-react';
import { zones, properties } from '@/data/mock';
import { mockRepository, money, normalize } from '@/lib/repository';
import type { Market, Property, SearchTab } from '@/types/real-estate';
import { HomeIntro } from './home-intro';
import { MapPreview } from './map-preview';
import { SearchPanel } from './search-panel';
import { PropertyCard, PropertyPhoto } from './property-card';
const benefits = [{Icon:Building2,title:'Valori reali',text:'Dati di mercato aggiornati zona per zona'},{Icon:House,title:'Affitti e vendite',text:"Due mappe, un’unica visione del territorio"},{Icon:BadgeEuro,title:'Dati trasparenti',text:"Scopri la provenienza e l’affidabilità dei dati"},{Icon:ShieldCheck,title:'Decisioni migliori',text:'Più informazioni, meno incertezze'}];
export function HouseHome(){
 const [market,setMarket]=useState<Market>('sale');
 const [tab,setTab]=useState<SearchTab>('search');
 const [query,setQuery]=useState('');
 const [area,setArea]=useState('100');
 const [selectedZone,setSelectedZone]=useState<string|null>(null);
 const [results,setResults]=useState(properties);
 const [filtered,setFiltered]=useState(false);
 const [message,setMessage]=useState('');
 const [saved,setSaved]=useState<string[]>([]);
 const [modal,setModal]=useState<'login'|'pros'|Property|null>(null);
 const [menu,setMenu]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(modal)dialog.current?.showModal();else dialog.current?.close();},[modal]);
 const findZone=(text:string)=>zones.find(z=>normalize(z.name)===normalize(text))??zones.find(z=>normalize(text).length>1&&normalize(z.name).includes(normalize(text)))??zones.find(z=>z.id===properties.find(p=>normalize(text).length>1&&normalize(p.address).includes(normalize(text)))?.zoneId);
 async function search(text:string){
   const zone=findZone(text);
   if(tab==='search'){
     const found=await mockRepository.findProperties({market,query:text});setResults(found);setFiltered(Boolean(text.trim()));setSelectedZone(zone?.id??null);setMessage(`${found.length} ${found.length===1?'immobile trovato':'immobili trovati'} nei dati dimostrativi.`);
   } else if(!zone){setMessage('Scegli una delle zone disponibili qui sotto per esplorare i dati demo.');setSelectedZone(null);}
   else {setSelectedZone(zone.id);if(tab==='value'){const sqm=Number(area);if(!Number.isFinite(sqm)||sqm<10||sqm>2000){setMessage('Inserisci una superficie tra 10 e 2.000 m².');return;}setMessage(`${zone.name} · Stima dimostrativa: € ${money(sqm*(market==='sale'?zone.salePerSqm:zone.rentPerSqm))}${market==='rent'?' /mese':''} per ${sqm} m². Non è una perizia.`);}else{setMessage(`${zone.name} · ${money(market==='sale'?zone.salePerSqm:zone.rentPerSqm)} €/m²${market==='rent'?'/mese':''} · Valore medio dimostrativo.`);}}
 }
 function changeMarket(value:Market){setMarket(value);setMessage('');}
 function selectTab(value:SearchTab){setTab(value);setMessage('');}
 function jumpToValuation(){selectTab('value');setMenu(false);document.getElementById('ricerca')?.scrollIntoView({behavior:'smooth',block:'center'});}
 return <><a href="#ricerca" className="skip-link">Vai alla ricerca</a><header className="site-header"><div className="header-inner"><a className="brand" href="#" aria-label="HouseID home"><House size={33}/><span>HouseID</span></a><nav className={menu?'nav-links open':'nav-links'} aria-label="Navigazione principale"><a href="#come-funziona" onClick={()=>setMenu(false)}>Come funziona</a><button onClick={jumpToValuation}>Valuta casa</button><button onClick={()=>{setModal('pros');setMenu(false);}}>Per professionisti</button></nav><span className="location"><MapPin size={18}/>Carmagnola<ChevronDown size={16}/></span><button className="login" onClick={()=>setModal('login')}>Accedi</button><button className="mobile-menu" aria-label="Apri menu" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu/></button></div></header>
 <main><HomeIntro market={market} onMarketChange={changeMarket}/><MapPreview market={market} zones={zones}/>
 <SearchPanel tab={tab} setTab={selectTab} query={query} setQuery={setQuery} onSearch={search} zones={zones} area={area} setArea={setArea} message={message}/>
 <section className="benefits container" id="come-funziona" aria-label="I vantaggi di HouseID">{benefits.map(({Icon,title,text})=><div className="benefit" key={title}><span className="benefit-icon"><Icon/></span><div><h2>{title}</h2><p>{text}</p></div></div>)}</section>
 <section className="showcase" id="vetrina"><div className="container"><div className="showcase-heading"><div><p className="eyebrow">IN VETRINA</p><h2>{filtered?'Risultati della ricerca':market==='sale'?'Case da acquistare':'Case in affitto'}</h2><p>Annunci sponsorizzati dai nostri partner immobiliari</p></div><button className="outline-button" onClick={()=>{setQuery('');setResults(properties);setFiltered(false);setSelectedZone(null);setMessage('Stai visualizzando tutti i 4 immobili dimostrativi.');}}>Vedi tutti gli annunci<ArrowRight size={18}/></button></div>
 <div className="property-grid">{results.map(property=><PropertyCard key={property.id} property={property} market={market} saved={saved.includes(property.id)} onSave={()=>setSaved(current=>current.includes(property.id)?current.filter(id=>id!==property.id):[...current,property.id])} onOpen={()=>setModal(property)}/>)}</div>{results.length===0&&<div className="empty-state"><House/><h3>Nessun immobile in questa ricerca</h3><p>Prova con Carmagnola, Centro o una delle ricerche popolari.</p><button className="outline-button" onClick={()=>{setQuery('');setResults(properties);setFiltered(false);}}>Mostra tutti gli immobili demo</button></div>}
 <p className="demo-note">Prototipo HouseID · Annunci, immagini e valori a scopo dimostrativo. Le fonti di mercato reali saranno integrate in seguito.</p></div></section></main>
 <dialog ref={dialog} onCancel={()=>setModal(null)} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}} aria-labelledby="dialog-title"><button autoFocus className="dialog-close" aria-label="Chiudi" onClick={()=>setModal(null)}><X/></button>{typeof modal==='object'&&modal?<><PropertyPhoto property={modal}/><div className="dialog-body"><p className="eyebrow">ANNUNCIO DIMOSTRATIVO</p><h2 id="dialog-title">{modal.title}</h2><p>{modal.address}</p><strong className="dialog-price">€ {money(market==='sale'?modal.salePrice:modal.monthlyRent)}{market==='rent'?' /mese':''}</strong><p>{modal.area} m² · {modal.rooms} locali · {modal.bathrooms} bagni</p><p>Questa scheda usa dati di esempio. Contatti dell’agenzia e disponibilità reali saranno aggiunti con gli annunci verificati.</p></div></>:<div className="dialog-body"><House className="dialog-icon"/><h2 id="dialog-title">{modal==='login'?'Il tuo spazio HouseID':'HouseID per professionisti'}</h2><p>{modal==='login'?'In questa anteprima puoi esplorare le zone e selezionare i preferiti con il cuore. Registrazione e accesso saranno disponibili nella versione collegata ai dati reali.':'Gli spazi in vetrina sono pensati per le agenzie del territorio. In questa anteprima gli annunci sono dimostrativi; pubblicazione e gestione degli immobili saranno integrate in seguito.'}</p><button className="primary-button" onClick={()=>setModal(null)}>Continua a esplorare<ArrowRight size={18}/></button></div>}</dialog>
 </>;
}
