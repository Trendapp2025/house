'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { Heart, ArrowUpRight } from 'lucide-react';
import type { PortalListing } from '@/data/catalogue';
import { ListingPhoto } from './listing-detail';
import { PropertyPhoto } from './property-card';
import { money } from '@/lib/repository';
export function PortalCard({listing}:{listing:PortalListing}){
 const [saved,setSaved]=useState(false);
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('houseid-favorites')??'[]').includes(listing.id));}catch{}},[listing.id]);
 function toggle(){try{const ids:string[]=JSON.parse(localStorage.getItem('houseid-favorites')??'[]');localStorage.setItem('houseid-favorites',JSON.stringify(saved?ids.filter(id=>id!==listing.id):[...new Set([...ids,listing.id])]));}catch{}setSaved(!saved);}
 return <article className="portal-card"><div className="portal-card-image"><Link href={'/immobili/'+listing.id} aria-label={'Apri '+listing.title}>{listing.preview?<PropertyPhoto property={listing.preview}/>:<ListingPhoto listing={listing}/>}</Link><span className="portal-badge">{listing.status==='real'?'Da Immobiliare.it':listing.sponsored?'Sponsorizzato · demo':'Annuncio demo'}</span><button aria-label={(saved?'Rimuovi dai':'Aggiungi ai')+' preferiti '+listing.title} aria-pressed={saved} onClick={toggle}><Heart size={18} fill={saved?'currentColor':'none'}/></button></div><div className="portal-card-copy"><p>{listing.zoneName} · Carmagnola</p><Link href={'/immobili/'+listing.id}><h3>{listing.title}</h3></Link><div className="portal-specs"><span>{listing.areaSqm} m²</span><span>{listing.rooms} locali</span><span>{listing.bathrooms} {listing.bathrooms===1?'bagno':'bagni'}</span></div><Link className="portal-price" href={'/immobili/'+listing.id}><strong>€ {money(listing.price)}{listing.market==='rent'&&<small> /mese</small>}</strong><ArrowUpRight size={22}/></Link></div></article>;
}
