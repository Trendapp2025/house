'use client';
import { useRef } from 'react';
import { Search, House, Map, ArrowRight } from 'lucide-react';
import type { SearchTab, Zone } from '@/types/real-estate';
const tabs = [{id:'search',label:'Cerca un immobile',Icon:Search},{id:'value',label:'Valuta la tua casa',Icon:House},{id:'explore',label:'Esplora la zona',Icon:Map}] as const;
interface Props {tab:SearchTab;setTab:(tab:SearchTab)=>void;query:string;setQuery:(q:string)=>void;onSearch:(query:string)=>void;zones:Zone[];area:string;setArea:(area:string)=>void;message:string}
export function SearchPanel({tab,setTab,query,setQuery,onSearch,zones,area,setArea,message}:Props){
 const refs = useRef<(HTMLButtonElement|null)[]>([]);
 return <section className="search-panel container" id="ricerca" aria-label="Ricerca HouseID">
   <div className="search-tabs" role="tablist" aria-label="Cosa vuoi fare?">{tabs.map(({id,label,Icon},index)=><button key={id} ref={node=>{refs.current[index]=node;}} role="tab" id={`tab-${id}`} aria-controls="search-content" aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;setTab(tabs[next].id);refs.current[next]?.focus();}}}><Icon size={22}/>{label}</button>)}</div>
   <div role="tabpanel" id="search-content" aria-labelledby={`tab-${tab}`}><form className="search-form" onSubmit={event=>{event.preventDefault();onSearch(query);}}>
     <label className="search-input"><Search/><span className="sr-only">Indirizzo o zona di Carmagnola</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tab==='explore'?'Cerca una zona di Carmagnola':'Inserisci un indirizzo (es. Via Poirino, Carmagnola)'} /></label>
     {tab==='value' && <label className="area-input"><span>Superficie</span><input aria-label="Superficie in metri quadrati" type="number" required min="10" max="2000" value={area} onChange={e=>setArea(e.target.value)}/><span>m²</span></label>}
     <button type="submit" className="primary-button">{tab==='search'?'Cerca':tab==='value'?'Valuta':'Esplora'}<ArrowRight size={21}/></button>
   </form>
   <div className="popular"><span>{tab==='value'?'Scegli la zona:':'Ricerche popolari:'}</span>{zones.slice(0,5).map(zone=><button key={zone.id} onClick={()=>{setQuery(zone.name);onSearch(zone.name);}}>{zone.name}</button>)}</div>
   <p className={`search-message ${message?'visible':''}`} role="status">{message}</p></div>
 </section>;
}
