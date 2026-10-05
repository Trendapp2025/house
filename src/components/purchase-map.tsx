'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { Map as GLMap, Marker, Popup } from 'maplibre-gl';
import type { PortalListing } from '@/data/catalogue';
import { zones } from '@/data/mock';
import { money } from '@/lib/repository';
import { ListingPhoto } from './listing-detail';
import { PropertyPhoto } from './property-card';
import { IconButton } from './ui';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

export function PurchaseMap({listings,zone,onZone,market='sale'}:{market?:'sale'|'rent';listings:PortalListing[];zone:string;onZone:(id:string)=>void}) {
 const container=useRef<HTMLDivElement>(null), map=useRef<GLMap|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(false);
 const [selection,setSelection]=useState<PortalListing|null>(null),[host,setHost]=useState<HTMLDivElement|null>(null);
 const callbacks=useRef(onZone);callbacks.current=onZone;
 const popup=useRef<Popup|null>(null);
 function recenter(){map.current?.fitBounds([[7.681,44.820],[7.785,44.883]],{padding:65,duration:500});}
 useEffect(()=>{
  let disposed=false;let observer:ResizeObserver|undefined;const labels:Marker[]=[];
  void import('maplibre-gl').then(({Map,Marker,setWorkerUrl})=>{
   if(disposed||!container.current)return;
   setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
   const instance=new Map({container:container.current,style:'https://tiles.openfreemap.org/styles/positron',center:[7.72,44.85],zoom:12.8,minZoom:10,maxZoom:18,attributionControl:{compact:true}});
   map.current=instance;
   instance.on('error',()=>{if(!disposed)setError(true);});
   instance.on('load',()=>{
    if(disposed)return;
    instance.getStyle().layers.forEach(layer=>{if(layer.id.toLowerCase().includes('poi'))instance.setLayoutProperty(layer.id,'visibility','none');});
    setReady(true);setError(false);recenter();
   });
   zones.forEach(z=>{const el=document.createElement('button');el.className='purchase-zone-label';el.textContent=z.name;el.setAttribute('aria-label','Scegli zona '+z.name);el.onclick=()=>callbacks.current(z.id);labels.push(new Marker({element:el,offset:[0,-32]}).setLngLat(z.center).addTo(instance));});
   observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
  }).catch(()=>{if(!disposed)setError(true);});
  return()=>{disposed=true;observer?.disconnect();labels.forEach(m=>m.remove());popup.current?.remove();map.current?.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  container.current?.querySelectorAll<HTMLButtonElement>('.purchase-zone-label').forEach(el=>el.setAttribute('aria-pressed',String(el.textContent===zones.find(z=>z.id===zone)?.name)));
  const z=zones.find(z=>z.id===zone);
  if(z)map.current.easeTo({center:z.center,zoom:14.2,duration:500});else recenter();
 },[zone,ready]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  let disposed=false;const markers:Marker[]=[];
  void import('maplibre-gl').then(({Marker})=>{
   if(disposed||!map.current)return;
   const counts=new Map<string,number>();
   listings.forEach(l=>{
    const key=l.location.coordinates.join(',');const index=counts.get(key)??0;counts.set(key,index+1);
    const el=document.createElement('button');el.className='purchase-price-marker'+(l.status==='demo'?' is-demo':'');el.dataset.listingId=l.id;el.textContent='€'+money(l.price)+(l.market==='rent'?'/mese':'');el.setAttribute('aria-label',`Apri ${l.title}, € ${money(l.price)}${l.status==='demo'?', demo':''}`);
    el.onclick=e=>{e.stopPropagation();setSelection(l);};
    // Stack shared zone positions in screen pixels; never invent new coordinates.
    markers.push(new Marker({element:el,offset:[0,index*42]}).setLngLat(l.location.coordinates).addTo(map.current!));
   });
  });
  return()=>{disposed=true;markers.forEach(m=>m.remove());};
 },[listings,ready]);
 useEffect(()=>{container.current?.querySelectorAll<HTMLButtonElement>('.purchase-price-marker').forEach(el=>{el.classList.toggle('is-selected',el.dataset.listingId===selection?.id);el.setAttribute('aria-pressed',String(el.dataset.listingId===selection?.id));});},[selection]);
 useEffect(()=>{if(selection&&!listings.some(l=>l.id===selection.id))setSelection(null);},[listings,selection]);
 useEffect(()=>{
  if(!selection||!map.current)return;
  let disposed=false;let current:Popup|undefined;
  void import('maplibre-gl').then(({Popup})=>{
   if(disposed||!map.current)return;
   const element=document.createElement('div');setHost(element);
   map.current.easeTo({center:selection.location.coordinates,offset:[0,155],duration:350});
   current=new Popup({anchor:'bottom',maxWidth:'290px',offset:24,closeOnClick:false,className:'purchase-popup'}).setLngLat(selection.location.coordinates).setDOMContent(element).addTo(map.current);
   current.getElement().querySelector('button.maplibregl-popup-close-button')?.setAttribute('aria-label','Chiudi anteprima');
   current.on('close',()=>{if(!disposed)setSelection(null);});popup.current=current;
  });
  return()=>{disposed=true;current?.remove();setHost(null);};
 },[selection]);
 return <section className="purchase-map container" aria-label={market==='sale'?'Immobili in vendita sulla mappa di Carmagnola':'Immobili in affitto sulla mappa di Carmagnola'}><div className="purchase-map-canvas" ref={container}/><div className="purchase-map-caption" hidden={!!selection}><strong>Carmagnola</strong><span>{listings.length} {listings.length===1?'immobile':'immobili'} · clicca un prezzo</span></div><div className="purchase-map-controls"><IconButton label="Aumenta zoom" disabled={!ready} onClick={()=>map.current?.zoomIn()}><Plus size={20}/></IconButton><IconButton label="Riduci zoom" disabled={!ready} onClick={()=>map.current?.zoomOut()}><Minus size={20}/></IconButton><IconButton label="Ricentra su Carmagnola" disabled={!ready} onClick={recenter}><LocateFixed size={20}/></IconButton></div><span className="purchase-map-note">Posizioni indicative di zona · annunci demo indicati</span>{!ready&&!error&&<p className="purchase-map-message">Caricamento mappa…</p>}{error&&<p className="purchase-map-message" role="status">Cartografia non disponibile. Gli annunci restano consultabili sotto la mappa.</p>}{host&&selection&&createPortal(<article className="purchase-mini-card"><div className="purchase-mini-photo">{selection.preview?<PropertyPhoto property={selection.preview}/>:<ListingPhoto listing={selection}/>}</div><div className="purchase-mini-copy"><small>{selection.status==='demo'?'ANNUNCIO DEMO':'FONTE REALE · DATI DICHIARATI'} · {selection.zoneName}</small><strong>€ {money(selection.price)}{selection.market==='rent'&&<small> /mese</small>}</strong><h3>{selection.title}</h3><p>{selection.propertyType}</p><p>{selection.areaSqm} m² · {selection.rooms} locali · {selection.bathrooms} {selection.bathrooms===1?'bagno':'bagni'}</p><Link href={'/immobili/'+selection.id}>Vedi scheda immobile →</Link></div></article>,host)}</section>;
}
