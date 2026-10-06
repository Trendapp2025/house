'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Layers, FileSearch, ScanLine } from 'lucide-react';
import { PortalShell } from './portal-shell';
import { PortalCard } from './portal-card';
import { PurchaseMap } from './purchase-map';
import { Badge, Button } from './ui';
import { catalogue } from '@/data/catalogue';
import type { Market } from '@/types/real-estate';

const benefits = [
  { Icon: FileSearch, title: 'Annuncio', text: 'Informazioni dichiarate chiaramente riconoscibili.' },
  { Icon: Layers, title: 'Territorio', text: 'Dati pubblici e contesto della zona.' },
  { Icon: ScanLine, title: 'HouseID Estimate', text: 'Analisi del prezzo quando il motore sarà disponibile.' },
];

export function PortalHome() {
  const [market, setMarket] = useState<Market>('sale');
  const [query, setQuery] = useState('');
  const [max, setMax] = useState('');
  const [zone, setZone] = useState('');
  const router = useRouter();
  const listings = useMemo(() => catalogue.filter(l => l.market === market && (!zone || l.areaId === zone)), [market, zone]);
  const featured = useMemo(() => catalogue.filter(l => l.market === market)
    .sort((a, b) => Number(b.status === 'real') - Number(a.status === 'real') || Number(!!b.sponsored) - Number(!!a.sponsored))
    .slice(0, 4), [market]);
  const route = market === 'sale' ? '/acquisto' : '/affitto';

  function changeMarket(value: Market) { setMarket(value); setMax(''); setZone(''); }

  return <PortalShell>
    <main id="contenuto" className="product-home">
      <section className="id-hero">
        <div className="container id-hero-grid">
          <div className="id-hero-copy">
            <Badge><MapPin size={14}/>Si parte da Carmagnola</Badge>
            <h1>Trova casa.<br/><em>Capisci il prezzo.</em></h1>
            <p className="id-hero-description">Cerca immobili a Carmagnola e scopri più informazioni per scegliere meglio.</p>
          </div>
          <figure className="id-hero-photo">
            <img src="/images/houseid-editorial-living-room.png" width={1536} height={1024}
              alt="Interno luminoso con soggiorno e grandi finestre, immagine illustrativa generata con AI" fetchPriority="high"/>
            <figcaption>Immagine illustrativa · AI</figcaption>
          </figure>
        </div>
        <form className="container id-search" onSubmit={e => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (query) params.set('q', query);
          if (max) params.set('max', max);
          router.push(route + '?' + params.toString());
        }}>
          <div className="portal-tabs" aria-label="Tipo di ricerca">
            <button type="button" aria-pressed={market === 'sale'} onClick={() => changeMarket('sale')}>Acquista</button>
            <button type="button" aria-pressed={market === 'rent'} onClick={() => changeMarket('rent')}>Affitto</button>
          </div>
          <div className="id-search-fields">
            <label>Comune<select aria-label="Comune"><option>Carmagnola (TO)</option></select></label>
            <label className="id-search-query">Via o zona<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Es. San Bernardo"/></label>
            <label>{market === 'sale' ? 'Prezzo massimo (€)' : 'Canone massimo (€/mese)'}<input type="number" min="0" value={max} onChange={e => setMax(e.target.value)} placeholder="Nessun limite"/></label>
            <Button>Cerca <ArrowRight size={18}/></Button>
          </div>
        </form>
      </section>

      <div className="id-product-sections">
        <section className="container id-map-section" id="mappa">
          <div className="portal-section-heading">
            <div><h2>Esplora Carmagnola</h2><p>Scegli una zona, poi apri un annuncio.</p></div>
            <Link className="outline-button" href={route}>Tutti i filtri <ArrowRight size={18}/></Link>
          </div>
          <PurchaseMap listings={listings} zone={zone} onZone={setZone} market={market}/>
          {zone && <Button variant="secondary" onClick={() => setZone('')}>Mostra tutte le zone</Button>}
        </section>
        <section className="portal-section container id-featured">
          <div className="portal-section-heading">
            <div><h2>{market === 'sale' ? 'Immobili in evidenza' : 'In affitto a Carmagnola'}</h2>
              <p>{market === 'sale' ? 'Annunci da fonte reale e proposte demo, sempre distinti.' : 'Proposte demo: non sono offerte reali.'}</p></div>
            <Link className="outline-button" href={route}>Vedi tutti <ArrowRight size={18}/></Link>
          </div>
          <div className="portal-grid">{featured.map(l => <PortalCard listing={l} key={l.id}/>)}</div>
        </section>
      </div>

      <section className="container id-why" aria-labelledby="why-title">
        <h2 id="why-title">Perché HouseID</h2>
        <div className="id-benefits">{benefits.map(({Icon, title, text}) => <article key={title}>
          <Icon size={23}/><div><h3>{title}</h3><p>{text}</p></div>
        </article>)}</div>
      </section>
      <section className="container id-estimate-teaser" id="estimate" aria-labelledby="estimate-teaser-title">
        <ScanLine size={28}/><div><Badge>HouseID Estimate · In sviluppo</Badge>
          <h2 id="estimate-teaser-title">Non fermarti al prezzo richiesto.</h2>
          <p>Stiamo costruendo un sistema che confronterà il prezzo dell’annuncio con i dati del mercato locale.</p>
        </div>
      </section>
    </main>
  </PortalShell>;
}
