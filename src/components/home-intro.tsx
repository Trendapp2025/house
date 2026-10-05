'use client';
import { Building2, House, ArrowRight } from 'lucide-react';
import type { Market } from '@/types/real-estate';

export function HomeIntro({market,onMarketChange}:{market:Market;onMarketChange:(market:Market)=>void}) {
  return <section className="home-intro container" aria-labelledby="houseid-title">
    <div className="intro-heading">
      <h1 id="houseid-title">HOUSEID</h1>
      <div className="intro-description"><p>La tua guida per cercare casa e conoscere il mercato immobiliare di Carmagnola.</p><p>Per acquistare, scegli una zona sulla mappa, apri l’annuncio e scopri tutti i dettagli dell’immobile. Clicca sul nome di un borgo o usa il selettore per esplorare gli annunci.</p></div>
    </div>
    <div className="market-choices" role="group" aria-label="Scegli tra acquisti e affitti">
      <button className={market==='sale'?'market-choice active':'market-choice'} aria-pressed={market==='sale'} aria-controls="mappa-immobili vetrina" onClick={()=>onMarketChange('sale')}><House/><span><strong>Acquisti</strong><small>Esplora le zone e trova una casa da comprare</small></span><ArrowRight className="choice-arrow"/></button>
      <button className={market==='rent'?'market-choice active':'market-choice'} aria-pressed={market==='rent'} aria-controls="mappa-immobili vetrina" onClick={()=>onMarketChange('rent')}><Building2/><span><strong>Affitti</strong><small>Confronta le zone e cerca una casa in affitto</small></span><ArrowRight className="choice-arrow"/></button>
    </div>
    <p className="intro-demo">Anteprima con annunci dimostrativi e una scheda da Immobiliare.it a San Bernardo. I punti identificano le località, non i loro confini.</p>
  </section>;
}
