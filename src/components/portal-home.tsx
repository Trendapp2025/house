'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Layers, FileSearch, ScanLine } from 'lucide-react';
import carmagnolaHero from '../../public/images/carmagnola-panorama.png';
import { PortalShell } from './portal-shell';
import { PortalCard } from './portal-card';
import { PurchaseMap } from './purchase-map';
import { ListingPhoto } from './listing-detail';
import { PropertyPhoto } from './property-card';
import { Badge, Button } from './ui';
import { catalogue } from '@/data/catalogue';
import { money } from '@/lib/repository';
import type { Market } from '@/types/real-estate';

const benefits = [
  { Icon: FileSearch, title: 'L’annuncio', text: 'Le informazioni dichiarate, in modo chiaro.' },
  { Icon: Layers, title: 'La zona', text: 'Servizi, dati territoriali e contesto.' },
  { Icon: ScanLine, title: 'Il valore', text: 'Confronto con il mercato quando i dati lo consentiranno.', future: true },
];

export function PortalHome() {
  const [market, setMarket] = useState<Market>('sale');
  const [query, setQuery] = useState('');
  const [max, setMax] = useState('');
  const [type, setType] = useState('');
  const [zone, setZone] = useState('');
  const router = useRouter();
  const listings = useMemo(() => catalogue.filter(l => l.market === market && (!zone || l.areaId === zone)), [market, zone]);
  // Catalogue presentation only: no invented publication dates or valuation ranking.
  const featured = useMemo(() => catalogue.filter(l => l.market === market)
    .sort((a, b) => Number(b.status === 'real') - Number(a.status === 'real') || Number(!!b.sponsored) - Number(!!a.sponsored))
    .slice(0, 4), [market]);
  const preview = catalogue.find(l => l.status === 'real');
  const route = market === 'sale' ? '/acquisto' : '/affitto';

  function changeMarket(value: Market) { setMarket(value); setMax(''); setZone(''); }

  return <PortalShell>
    <main id="contenuto" className="estate-home">
      <section className="estate-hero" aria-labelledby="hero-title">
        <Image className="estate-hero-image" src={carmagnolaHero} alt="Paesaggio di Carmagnola con le montagne e il Monviso"
          fill sizes="100vw" priority quality={85} placeholder="blur"/>
        <div className="estate-hero-shade"/>
        <div className="container estate-hero-content">
          <h1 id="hero-title">Trova la casa giusta<br/><em>a Carmagnola.</em></h1>
          <p>Cerca tra gli immobili disponibili e scopri più informazioni per scegliere meglio.</p>
        </div>
        <form className="container estate-search id-search" onSubmit={e => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (query) params.set('q', query);
          if (max) params.set('max', max);
          if (type) params.set('type', type);
          router.push(route + '?' + params.toString());
        }}>
          <div className="portal-tabs" aria-label="Tipo di ricerca">
            <button type="button" aria-pressed={market === 'sale'} onClick={() => changeMarket('sale')}>Acquista</button>
            <button type="button" aria-pressed={market === 'rent'} onClick={() => changeMarket('rent')}>Affitto</button>
          </div>
          <div className="id-search-fields">
            <label>Comune<select aria-label="Comune"><option>Carmagnola (TO)</option></select></label>
            <label>Via o zona<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Es. San Bernardo"/></label>
            <label>Tipologia<select value={type} onChange={e => setType(e.target.value)}><option value="">Tutte</option><option>Appartamento</option><option>Villa</option><option>Casa indipendente</option></select></label>
            <label>{market === 'sale' ? 'Prezzo massimo (€)' : 'Canone massimo (€/mese)'}<input type="number" min="0" value={max} onChange={e => setMax(e.target.value)} placeholder="Nessun limite"/></label>
            <Button>Cerca <ArrowRight size={18}/></Button>
          </div>
        </form>
      </section>

      <section className="portal-section container estate-listings">
        <div className="portal-section-heading">
          <div><h2>Ultimi annunci a Carmagnola</h2><p>{market === 'sale' ? 'Dal catalogo HouseID: fonte reale e proposte demo, sempre distinte.' : 'Catalogo affitti demo: queste proposte non sono offerte reali.'}</p></div>
          <Link className="outline-button" href={route}>Vedi tutti <ArrowRight size={18}/></Link>
        </div>
        <div className="portal-grid">{featured.map(l => <PortalCard listing={l} key={l.id}/>)}</div>
      </section>

      <section className="container estate-map-section" id="mappa">
        <div className="portal-section-heading"><div><h2>Esplora sulla mappa</h2><p>Visualizza gli immobili e il contesto della zona.</p></div>
          <Link className="outline-button" href={route}>Tutti i filtri <ArrowRight size={18}/></Link>
        </div>
        <div className="estate-map-layout">
          <PurchaseMap listings={listings} zone={zone} onZone={setZone} market={market}/>
          <aside className="estate-map-list" aria-label="Annunci nell’area selezionata">
            <h3>{zone ? 'Nella zona selezionata' : 'Da esplorare'}</h3>
            {listings.slice(0,3).map(l => <Link className="estate-map-item" key={l.id} href={'/immobili/'+l.id}>
              <div className="estate-map-photo">{l.preview ? <PropertyPhoto property={l.preview}/> : <ListingPhoto listing={l}/>}</div>
              <div><small>{l.status === 'demo' ? 'Annuncio demo' : 'Dati dell’annuncio'}</small><strong>€ {money(l.price)}{l.market === 'rent' && ' /mese'}</strong><span>{l.areaSqm} m² · {l.rooms} locali</span><span>{l.zoneName}</span></div>
            </Link>)}
          </aside>
        </div>
        {zone && <Button className="estate-zone-reset" variant="secondary" onClick={() => setZone('')}>Tutte le zone</Button>}
      </section>

      <section className="estate-value-section">
        <div className="container estate-value-grid">
          <div><p className="eyebrow">PIÙ INFORMAZIONI, SCELTE MIGLIORI</p>
            <h2>Non guardare solo il prezzo.<br/><em>Capiscilo.</em></h2>
            <p className="estate-value-intro">HouseID unisce le informazioni dell’annuncio ai dati territoriali per darti più contesto sulla zona e, in futuro, una stima del valore.</p>
            <div className="estate-benefits">{benefits.map(({Icon,title,text,future}) => <article key={title}><Icon size={22}/><div><h3>{title}</h3><p>{text}</p>{future && <Badge>In sviluppo</Badge>}</div></article>)}</div>
          </div>
          {preview && <article className="estate-preview" aria-label="Anteprima HouseID con annuncio esistente">
            <Link className="estate-preview-photo" href={'/immobili/'+preview.id}><ListingPhoto listing={preview}/></Link>
            <div className="estate-preview-copy"><Badge kind="declared">Dati dichiarati nell’annuncio</Badge>
              <h3><Link href={'/immobili/'+preview.id}>€ {money(preview.price)}</Link></h3><p>{preview.areaSqm} m² · {preview.rooms} locali · Carmagnola</p>
              <strong className="estate-preview-brand">HOUSEID</strong>
              <dl><div><dt>Prezzo richiesto</dt><dd>€ {money(preview.price)}</dd></div><div><dt>Stima HouseID</dt><dd>In sviluppo</dd></div><div><dt>Dati dell’annuncio</dt><dd>Disponibili</dd></div><div><dt>Contesto territoriale</dt><dd>Carmagnola · BDTRE</dd></div><div><dt>Dati di mercato</dt><dd>In preparazione</dd></div></dl>
              <small>Il contesto comunale non costituisce una verifica del singolo immobile.</small>
            </div>
          </article>}
        </div>
      </section>
    </main>
  </PortalShell>;
}
