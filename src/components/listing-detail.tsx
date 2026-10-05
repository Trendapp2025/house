'use client';
import { CostSummary } from './cost-summary';
import { PurchaseInsights } from './purchase-insights';
import { SolarExposure } from './solar-exposure';
import { useEffect, useRef, useState } from 'react';
import { House, X, MapPin, Maximize, BedDouble, Bath, Check, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import type { SaleListing } from '@/types/listing';
import { money } from '@/lib/repository';
export function ListingPhoto({listing}:{listing:SaleListing}) {
  return listing.photos.length ? <img className="listing-real-photo" src={listing.photos[0].src} alt={listing.photos[0].alt}/> : <div className="listing-photo-empty"><House aria-hidden="true"/><span>Foto dell’immobile da aggiungere</span></div>;
}
export function ListingDetail({listing,onClose,embedded=false,market='sale'}:{listing:SaleListing|null;onClose:()=>void;embedded?:boolean;market?:'sale'|'rent'}){
 const ref=useRef<HTMLDialogElement>(null);
 const [planOpen,setPlanOpen]=useState(false);
 const [planError,setPlanError]=useState(false);
 useEffect(()=>{setPlanOpen(false);setPlanError(false);},[listing]);
 useEffect(()=>{if(listing&&!embedded){ref.current?.showModal();ref.current?.scrollTo(0,0);}else ref.current?.close();},[listing,embedded]);
 const missing='Da specificare';
 const content=<> 
 {listing&&<>{!embedded&&<div className="listing-detail-bar"><button autoFocus onClick={onClose}><ArrowLeft size={18}/>Torna alla zona</button><button aria-label="Chiudi scheda immobile" onClick={onClose}><X/></button></div>}
 <div className="listing-detail-content">
 <div className="listing-detail-top"><div><p className="eyebrow">{market==='sale'?'ACQUISTO':'AFFITTO'} · {listing.status==='demo'?'ANNUNCIO DIMOSTRATIVO':market==='sale'?'IMMOBILE IN VENDITA':'IMMOBILE IN AFFITTO'}</p><h2 id="listing-detail-title">{listing.title}</h2><p className="listing-location"><MapPin size={16}/>{listing.location.label}</p></div><div className="listing-price">€ {money(listing.price)}{market==='rent'&&' /mese'}<span>€ {money(Math.round(listing.price/listing.areaSqm))}/m²{market==='rent'&&'/mese'}</span></div></div>
 {listing.status==='demo'&&<p className="listing-demo-banner">Scheda di esempio: questo immobile non è un’offerta reale. Prezzo e caratteristiche sono dimostrativi.</p>}
 {listing.status==='real'&&<p className="listing-demo-banner">Dati e fotografie da <a href={listing.sourceUrl??undefined} target="_blank" rel="noopener noreferrer">Immobiliare.it · Immobiliare Castello</a>. Disponibilità e prezzo da confermare con l’inserzionista.</p>}
 <ListingPhoto listing={listing}/>
 {listing.photos.length>1&&<div className="listing-gallery">{listing.photos.slice(1).map(photo=><img src={photo.src} alt={photo.alt} key={photo.src}/>)}</div>}
 <div className="listing-summary"><span><Maximize/>{listing.areaSqm} m²</span><span><BedDouble/>{listing.rooms} locali</span><span><Bath/>{listing.bathrooms} {listing.bathrooms===1?'bagno':'bagni'}</span></div>
 <section><h3>Descrizione</h3><p>{listing.description}</p></section>
 <section><h3>Caratteristiche dell’immobile</h3><dl className="listing-facts">{[['Tipologia',listing.propertyType],['Stato',listing.condition],['Piano',listing.floor],['Piani dell’edificio',listing.totalFloors??missing],['Ascensore',listing.lift===null?missing:listing.lift?'Sì':'No'],['Anno di costruzione',listing.yearBuilt??missing]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><ul className="listing-features">{listing.features.map(feature=><li key={feature}><Check size={16}/>{feature}</li>)}</ul></section>
 <section><h3>Energia e costi</h3><dl className="listing-facts">{[['Classe energetica',listing.energyClass??missing],['Consumo energetico',listing.energyConsumptionLabel??(listing.energyConsumption===null?missing:`${money(listing.energyConsumption)} kWh/m² anno`) ],['Riscaldamento',listing.heating??missing],['Spese condominiali',listing.condominiumMonthly===null?missing:`€ ${money(listing.condominiumMonthly)}/mese`],['Disponibilità',listing.availability??missing]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
 {listing.id==='immobiliare-131431598'&&<><PurchaseInsights listing={listing}/><SolarExposure/></>}
 <section><h3>Posizione e planimetria</h3><p>{listing.location.label}. {listing.location.precision==='zone'?'La posizione sulla mappa indica la zona, non l’indirizzo dell’immobile.':''}</p>{listing.floorPlanUrl?<div className="listing-plan"><button type="button" className="outline-button" aria-expanded={planOpen} aria-controls="listing-floor-plan" onClick={()=>setPlanOpen(!planOpen)}>{planOpen?'Chiudi la planimetria':'Apri la planimetria'}</button>{planOpen&&<div id="listing-floor-plan">{planError?<p role="status">La planimetria non è disponibile al momento. Puoi chiudere questo riquadro e continuare a consultare l’annuncio.</p>:<img src={listing.floorPlanUrl} alt="Planimetria del primo piano dell’immobile" onError={()=>setPlanError(true)}/>}</div>}</div>:<p className="listing-pending"><ImageIcon size={18}/>Planimetria non ancora disponibile</p>}</section>
 <section><h3>Contatti e informazioni sull’annuncio</h3>{listing.contact?<><p>{listing.contact.name}</p><div className="listing-contact-links">{listing.contact.phone&&<a href={`tel:${listing.contact.phone}`}>{listing.contact.phone}</a>}{listing.contact.email&&<a href={`mailto:${listing.contact.email}`}>{listing.contact.email}</a>}</div></>:<p>I contatti del proprietario o dell’agenzia saranno disponibili quando inseriremo l’annuncio reale.</p>}{listing.sourceUrl&&<a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">Vedi l’annuncio originale</a>}{listing.updatedAt&&<p>Ultimo aggiornamento: {listing.updatedAt}</p>}</section>
 {listing.id==='immobiliare-131431598'&&<CostSummary/>}
 </div></>}
 </>;
 return embedded?<article className="listing-detail embedded-detail">{content}</article>:<dialog className="listing-detail" ref={ref} aria-labelledby="listing-detail-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{content}</dialog>;
}
