'use client';
import { Heart, Maximize, BedDouble, Bath, ArrowRight } from 'lucide-react';
import type { Market, Property } from '@/types/real-estate';
import { money } from '@/lib/repository';
export function PropertyPhoto({property}:{property:Property}) {
  // The supplied reference is reused as a CSS image sprite without altering the source.
  return <div role="img" aria-label={property.imageAlt} className={`property-photo photo-${property.imageIndex}`} />;
}
export function PropertyCard({property,market,saved,onSave,onOpen}:{property:Property;market:Market;saved:boolean;onSave:()=>void;onOpen:()=>void}) {
 return <article className="property-card"><div className="photo-wrap"><button className="photo-open" onClick={onOpen} aria-label={`Apri ${property.title}`}><PropertyPhoto property={property}/></button>{property.sponsored&&<span className="sponsored">Sponsorizzato</span>}<button className={`save-button ${saved?'saved':''}`} onClick={onSave} aria-label={`${saved?'Rimuovi dai':'Aggiungi ai'} preferiti ${property.title}`} aria-pressed={saved}><Heart fill={saved?'currentColor':'none'}/></button></div><div className="property-content"><button className="property-title" onClick={onOpen}><strong>€ {money(market==='sale'?property.salePrice:property.monthlyRent)}{market==='rent'&&<small> /mese</small>}</strong><h3>{property.title}</h3></button><p>{property.address}</p><div className="property-specs"><span><Maximize/>{property.area} m²</span><span><BedDouble/>{property.rooms} locali</span><span><Bath/>{property.bathrooms} {property.bathrooms===1?'bagno':'bagni'}</span></div></div><button className="partner" onClick={onOpen}>Agenzia Partner<ArrowRight size={18}/></button></article>;
}
