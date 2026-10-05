'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, LocateFixed, ArrowRight } from 'lucide-react';
import type * as Leaflet from 'leaflet';
import type { Market, Zone } from '@/types/real-estate';
import type { SaleListing } from '@/types/listing';
import { getZoneListing } from '@/data/zone-listings';
import { catalogue } from '@/data/catalogue';
import { ListingDetail, ListingPhoto } from './listing-detail';
import { money } from '@/lib/repository';
interface MapProps { market: Market; zones: Zone[] }
export function MapPreview({market,zones}: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const api = useRef<typeof Leaflet | null>(null);
  const popup=useRef<Leaflet.Popup|null>(null);
  const [popupHost,setPopupHost]=useState<HTMLDivElement|null>(null);
  const [selectedArea,setSelectedArea]=useState<string|null>(null);
  const [listingOpen,setListingOpen]=useState(false);
  const [detail,setDetail]=useState<SaleListing|null>(null);
  const selectedListing=selectedArea?(market==='sale'?getZoneListing(selectedArea):catalogue.find(l=>l.market==='rent'&&l.areaId===selectedArea)):undefined;
  const [ready,setReady] = useState(false);
  const [error,setError] = useState(false);
  const [zoom,setZoom] = useState(13);
  function selectArea(id:string|null){
    map.current?.closePopup();
    setListingOpen(false);
    setSelectedArea(id);
    const zone=zones.find(zone=>zone.id===id);
    if(zone)map.current?.setView([zone.center[1],zone.center[0]],15,{animate:false});
  }
  function recenter(){
    if(!map.current || !api.current)return;
    const width=map.current.getSize().x;
    map.current.fitBounds(api.current.latLngBounds(zones.map(z=>[z.center[1],z.center[0]])),{paddingTopLeft:[35,125],paddingBottomRight:[width>850?120:75,90],maxZoom:14,animate:false});
    if(map.current.getZoom()<13)map.current.setZoom(13,{animate:false});
  }
  useEffect(()=>{
    let cancelled=false;
    let observer:ResizeObserver|undefined;
    void import('leaflet').then(L=>{
      if(cancelled || !container.current)return;
      api.current=L;
      const instance=L.map(container.current,{zoomControl:false,scrollWheelZoom:false,minZoom:10,maxZoom:19,attributionControl:true});
      map.current=instance; recenter();
      const host=document.createElement('div');
      L.DomEvent.disableClickPropagation(host);L.DomEvent.disableScrollPropagation(host);
      popup.current=L.popup({className:'zone-listing-popup',maxWidth:280,minWidth:220,autoPanPaddingTopLeft:[16,125],autoPanPaddingBottomRight:[85,105],closeButton:true}).setContent(host);
      instance.on('popupclose',()=>setListingOpen(false));
      setPopupHost(host);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).on('tileerror',()=>setError(true)).on('tileload',()=>setError(false)).addTo(instance);
      instance.on('zoomend',()=>setZoom(instance.getZoom()));
      observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(container.current);
      setReady(true);
    }).catch(()=>setError(true));
    return ()=>{cancelled=true;observer?.disconnect();map.current?.remove();map.current=null;popup.current=null;};
    // The map is created once; market and selected area only update its layers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(!ready||!map.current||!api.current)return;
    const L=api.current;
    const labels=L.layerGroup();
    zones.forEach(zone=>{
      const name=document.createElement('button');
      name.textContent=zone.name;
      {
        name.setAttribute('type','button');
        name.setAttribute('aria-label','Scegli zona '+zone.name);
        name.setAttribute('aria-pressed',String(zone.id===selectedArea));
        L.DomEvent.disableClickPropagation(name);
        name.addEventListener('click',()=>selectArea(zone.id));
      }
      L.circleMarker([zone.center[1],zone.center[0]],{
        radius:3,color:'#fff',weight:2,fillColor:'#173e3b',fillOpacity:1,interactive:false,
      }).bindTooltip(name,{permanent:true,direction:'top',offset:[0,-3],className:'borough-name',opacity:1,interactive:true}).addTo(labels);
    });
    labels.addTo(map.current);
    return ()=>{labels.remove();};
  },[ready,zones,market,selectedArea]);
  useEffect(()=>{
    if(!ready||!map.current||!api.current||!selectedListing)return;
    const L=api.current;
    const zone=zones.find(zone=>zone.id===selectedArea);
    if(!zone)return;
    // Offset the demo listing badge in screen pixels, without inventing an address.
    const markerLabel=selectedListing.status==='real'?'€ '+money(selectedListing.price):'Annuncio demo';
    const icon=L.divIcon({className:'property-map-marker',html:'<span>⌂ '+markerLabel+'</span>',iconSize:[144,40],iconAnchor:[72,-28],popupAnchor:[0,30]});
    const marker=L.marker([zone.center[1],zone.center[0]],{icon,title:'Apri annuncio di '+zone.name,alt:'Apri annuncio di '+zone.name,keyboard:true}).addTo(map.current);
    marker.on('click',()=>setListingOpen(true));
    return ()=>{marker.remove();};
  },[ready,market,selectedArea,selectedListing,zones]);
  useEffect(()=>{
    if(!ready||!map.current||!popup.current)return;
    if(!selectedListing||!listingOpen){map.current.closePopup();return;}
    const [lng,lat]=zones.find(zone=>zone.id===selectedArea)?.center??selectedListing.location.coordinates;
    popup.current.setLatLng([lat,lng]).openOn(map.current);popup.current.update();
  },[ready,market,selectedListing,selectedArea,zones,listingOpen]);
  useEffect(()=>{if(market!=='sale'){setSelectedArea(null);setListingOpen(false);setDetail(null);}},[market]);
  return <section id="mappa-immobili" className="map-hero real-map-hero map-workspace container" aria-label={market==='sale'?'Acquisti: mappa di Carmagnola':'Affitti: mappa di Carmagnola'}>
    <div ref={container} className="real-map" aria-label="Cartografia OpenStreetMap di Carmagnola" />
    {<div className="zone-picker"><label htmlFor="map-zone">1. Scegli una zona</label><select id="map-zone" value={selectedArea??''} onChange={event=>selectArea(event.target.value||null)}><option value="">Scegli un borgo o clicca sul nome</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select><p role="status">{selectedListing?'2. Clicca sul segnaposto dell’immobile · posizione indicativa':selectedArea?'Nessun annuncio in questa zona':'Seleziona una zona per vedere l’immobile'}</p></div>}
    {popupHost&&selectedListing&&createPortal(<article className="zone-listing-preview"><ListingPhoto listing={selectedListing}/><div><p className="zone-popup-caption">{selectedListing.zoneName} · {selectedListing.status==='real'?'Annuncio da Immobiliare.it':'1 annuncio demo'}</p><strong>€ {money(selectedListing.price)}{market==='rent'&&' /mese'}</strong><h3>{selectedListing.title}</h3><p className="zone-popup-specs">{selectedListing.areaSqm} m² · {selectedListing.rooms} locali · {selectedListing.bathrooms} {selectedListing.bathrooms===1?'bagno':'bagni'}</p><button onClick={()=>setDetail(selectedListing)}>Vedi l’immobile<ArrowRight size={16}/></button></div></article>,popupHost)}
    <ListingDetail market={market} listing={detail} onClose={()=>setDetail(null)}/>
    <div className="map-controls"><button aria-label="Aumenta zoom" disabled={!ready||zoom>=19} onClick={()=>map.current?.zoomIn()}><Plus/></button><button aria-label="Riduci zoom" disabled={!ready||zoom<=10} onClick={()=>map.current?.zoomOut()}><Minus/></button><button aria-label="Ricentra su Carmagnola" disabled={!ready} onClick={recenter}><LocateFixed/></button></div>
    <span className="map-disclaimer">Località indicate da punti · confini non disponibili</span>
    {error&&<p className="map-error" role="status">Impossibile caricare alcune parti della mappa. Controlla la connessione e ricarica la pagina.</p>}
    {!ready&&!error&&<p className="map-loading" role="status">Caricamento mappa di Carmagnola…</p>}
  </section>;
}
