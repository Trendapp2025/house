'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {catalogue} from '@/data/catalogue';
import {calculatePurchase,pricePerSqm,type FinancePreferences} from '@/lib/purchase-finance';
import {euro} from './purchase-simulator';
export function useCompare(){
 const [ids,setIds]=useState<string[]>([]);
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem('houseid-compare')??'[]');if(Array.isArray(raw))setIds(raw.filter(id=>catalogue.some(l=>l.id===id&&l.market==='sale')).slice(0,3));}catch{}},[]);
 function toggle(id:string){setIds(previous=>{const next=previous.includes(id)?previous.filter(x=>x!==id):previous.length<3?[...previous,id]:previous;try{localStorage.setItem('houseid-compare',JSON.stringify(next));}catch{}return next;});}
 return {ids,toggle};
}
export function CompareTray({ids,toggle,preferences}:{ids:string[];toggle:(id:string)=>void;preferences:FinancePreferences}){
 const [open,setOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 const selected=ids.map(id=>catalogue.find(l=>l.id===id)!).filter(Boolean);
 if(!selected.length)return null;
 return <><aside className="hd-compare-tray" aria-label="Immobili da confrontare"><strong>Confronta <small>{ids.length}/3</small></strong><div>{selected.map(l=><button key={l.id} onClick={()=>toggle(l.id)} aria-label={'Rimuovi dal confronto '+l.title}>{l.title} ×</button>)}</div><button className="hd-primary" disabled={ids.length<2} onClick={()=>setOpen(true)}>Vai al confronto</button>{ids.length<2&&<small>Aggiungi una seconda casa.</small>}</aside><dialog ref={dialog} className="hd-compare-dialog" onCancel={()=>setOpen(false)}><header><h2>Le case, a confronto</h2><button className="hd-secondary" onClick={()=>setOpen(false)}>Chiudi</button></header><p>Stesse preferenze personali, stessi dati e calcoli della scheda. Gli esempi restano identificati come demo.</p><div className="hd-comparison">{selected.map(l=>{const c=calculatePurchase(l,preferences);return <article key={l.id}><small>{l.status==='demo'?'ANNUNCIO DEMO':'DATI ANNUNCIO'}</small><h3>{l.title}</h3><dl className="hd-facts">{[['Prezzo',euro(l.price)],['Prezzo/m²',euro(pricePerSqm(l))],['Superficie',l.areaSqm+' m²'],['Locali / bagni',l.rooms+' / '+l.bathrooms],['Classe energetica',l.energyClass??'Non disponibile'],['Anticipo',c.valid?euro(Number(preferences.deposit)):'Da impostare'],['Tasso / durata',c.valid?preferences.rate+'% / '+preferences.years+' anni':'Da impostare'],['Mutuo necessario',euro(c.principal)],['Rata stimata',euro(c.payment)],['Agenzia · stima',c.agency===null?l.sellerType==='private'?'Non applicata':'Non disponibile':euro(c.agency)],['Notaio · stima',euro(c.notary)],['Liquidità iniziale · stima parziale',euro(c.liquidity)],['Condominio · dichiarato',l.condominiumMonthly===null?'Non disponibile':euro(l.condominiumMonthly)+'/mese'],['Planimetria',l.floorPlanUrl?'Disponibile, da verificare':'Non disponibile'],['Da verificare',l.id==='immobiliare-131431598'?'Corrispondenza APE e pianta, superfici, spese comuni':'Dati dimostrativi, documenti non disponibili']].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><Link href={'/immobili/'+l.id} onClick={()=>setOpen(false)}>Apri scheda →</Link></article>;})}</div><p className="hd-note">Importi esclusi imposte, eventuale IVA sulle commissioni e costi non quantificati. Le stime non sono preventivi.</p></dialog></>;
}
