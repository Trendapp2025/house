# HouseID

Homepage responsive realizzata da zero con Next.js App Router, React, TypeScript e Tailwind CSS 4, seguendo l'immagine fornita. Nessuna chiave API necessaria.

## Avvio

Richiede Node.js 20.9 o successivo.

```sh
npm install
npm run dev
```

Aprire l'indirizzo locale stampato dal server. `npm run build` prepara l'app Next.js in `.next/`; `npm start` avvia la versione di produzione. `npm run typecheck` verifica i tipi. Dalla Fase 2 serve un runtime Node per il backend: `out/` è un eventuale vecchio artefatto statico. Per database, migrazioni e test leggere [infrastruttura dati](docs/data-infrastructure.md).

## Struttura

- `src/components/house-home.tsx`: composizione homepage e stato condiviso.
- `src/components/map-preview.tsx`: renderer isolato Leaflet della mappa reale; zoom, ricentratura, heatmap e selezione zona.
- `src/components/search-panel.tsx`: ricerca, valutazione dimostrativa ed esplorazione, con tab accessibili.
- `src/components/property-card.tsx`: card riutilizzabili e foto tratte dal riferimento.
- `src/data/mock.ts`: tutti i prezzi, gli immobili e le zone di esempio.
- `src/types/real-estate.ts`: contratti per immobili, zone, geometrie e repository.
- `src/lib/repository.ts`: adapter dati da sostituire con API reali.
- `src/app/globals.css`: Tailwind e stile responsive, con variabili colore condivise.

## Integrazioni future

1. Sostituire `mockRepository` con un adapter HTTP, mantenendo il contratto `PropertyRepository`; i dati iniziali oggi sono importati dai mock. Aggiungere caricamento, errore e cancellazione richieste quando il repository diventerà remoto.
2. Estendere il renderer Leaflet `MapPreview` con GeoJSON. Le coordinate `center` provengono dai place node OpenStreetMap; le posizioni `preview` appartengono solo al layout mock. `geometry` è volutamente `null`: caricare poligoni GeoJSON ufficiali, verificare coordinate e sistema di riferimento, senza trattare la grafica demo come cartografia reale.
3. Integrare geocoding e ricerca indirizzi. La ricerca attuale cerca parole presenti negli indirizzi e nelle zone dei quattro annunci demo.
4. Per le fonti di mercato associare origine, licenza, data aggiornamento e intervalli di prezzo. L'affitto della heatmap è espresso in €/m²/mese; gli annunci in €/mese. La stima è solo superficie × valore medio mock.
5. Il runtime backend Next.js è predisposto: scegliere un hosting server compatibile e configurare PostgreSQL/PostGIS tramite DATABASE_URL. Le chiavi private restano sul server; la UI usa ancora il catalogo legacy.

## Limiti della demo

Mappa reale OpenStreetMap, prezzi inventati, quattro immobili inventati disponibili in entrambe le modalità per dimostrare il toggle. Non sono quotazioni, perizie o annunci reali. I preferiti durano nella sessione corrente. Accesso e area professionisti mostrano pannelli informativi, senza account né invio dati. I benefici riprendono il riferimento e descrivono il prodotto previsto, non fonti già connesse.

## Immagini

`public/reference.png` è una copia inalterata dell'immagine fornita dall'utente. Le quattro foto vengono visualizzate tramite ritagli CSS della stessa immagine; quando disponibili, sostituirle con immagini singole autorizzate. `public/map-background.png` è uno sfondo illustrativo non più utilizzato, creato con lo strumento integrato ImageGen a partire dal riferimento; non è una mappa satellitare reale.

Prompt dell'asset: «Extract and expand the reference’s dark satellite terrain into a wide clean illustrative map, with town center-right and agricultural fields throughout. Remove all typography, controls, pricing, heatmap, website sections, and cards; reconstruct terrain beneath them.»

## Mappa reale (aggiornamento)

Il renderer attivo ora usa Leaflet 1.9.4 e le tile standard OpenStreetMap (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`). Lo sfondo generato non viene più mostrato. Sono disponibili trascinamento, zoom, ricentratura e toggle heatmap. Rotella disabilitata per non intrappolare lo scorrimento della pagina; zoom con pulsanti, tastiera e pinch.

Le coordinate dei centri abitati sono state recuperate da Overpass/OpenStreetMap il 25 settembre 2026: Carmagnola 63629114, San Bernardo 2819141926, San Michele e Grato 4316086264, Salsasio 4316086265, Tuninetti 4456500909, San Giovanni 4459307785. I prezzi sono inventati. I cerchi colorati rappresentano soltanto intensità dimostrative intorno ai punti, non confini geografici o zone OMI. Integrare i poligoni reali nel layer Leaflet GeoJSON in seguito.

L'attribuzione OSM è visibile sulla mappa. La consultazione richiede Internet. Nessun prefetch/offline download; rispettare la policy tile OSM e scegliere un provider adeguato al traffico quando si passerà dalla demo al servizio pubblico: https://operations.osmfoundation.org/policies/tiles/.


## Mappa dei prezzi per aree

La visualizzazione attuale usa sette poligoni GeoJSON contigui definiti in `src/data/heatmap.ts`: un centro rosso e sei settori esterni verso i borghi, colorati per fasce qualitative dal rosso al verde. I bordi sono visibili; non sono presenti riquadri o prezzi numerici sulla mappa. Confini e classi sono solo dimostrativi, non delimitazioni ufficiali delle frazioni o zone OMI. La legenda indica prezzi relativi, non temperature. I poligoni potranno essere sostituiti da GeoJSON ufficiale e valori reali senza cambiare il renderer Leaflet. La stessa simulazione è usata per vendita e affitto.

## Percorso Acquisti: zona → annuncio → scheda

Solo nella modalità acquisto i sette poligoni sono selezionabili con clic, tastiera o elenco. Una selezione evidenzia l’area e apre un solo popup Leaflet; cambiare area sostituisce il popup. Il pulsante «Vedi l’immobile» apre una scheda completa in dialogo, con ritorno alla zona. Passando ad Affitti la selezione e il popup vengono rimossi. La sezione sponsorizzata sottostante rimane invariata e usa i dati originari.

- `src/types/listing.ts`: contratto della scheda completa.
- `src/data/zone-listings.ts`: un esempio per ciascun ID di area, separato dagli sponsorizzati.
- `src/components/listing-detail.tsx`: foto, descrizione, caratteristiche, energia, costi, posizione, planimetria e contatti.

Per inserire la casa reale sostituire l'esempio della zona corretta, impostare `status: 'real'` solo dopo aver ricevuto dati reali, rimuovere testi/caratteristiche inventati, compilare foto e contatti forniti e mantenere null i campi sconosciuti. Specificare se il punto geografico è preciso (`address`) o indicativo (`zone`). Nessun indirizzo o contatto reale è stato inventato. Gli altri esempi restano contrassegnati come demo; nessun annuncio in affitto viene generato da questi dati.
