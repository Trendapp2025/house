# HouseID Design System — Fase 4

## Fondamenti

`src/app/design-system.css` è il livello semantico condiviso, importato dopo gli stili esistenti. I componenti storici restano compatibili; nessun dato di dominio viene modificato dagli stili.

- Brand: primary #7C3AED, dark #5B21B6, light #A78BFA.
- Fondo #F7F5FF; superficie #FFFFFF; testo #17171C; testo secondario #5B6170.
- Token per bordo, muted, disabled, focus, hover, shadow, success, warning, danger, info.
- Scala spazi 4/8/12/16/24/32/48 px; raggi 8/16/24 px e pill; due ombre; container massimo 1280 px.
- Font di sistema locale, nessun caricamento esterno. Titoli gerarchici e corpo leggibile.
- Breakpoint 1100/800/560 px; compatibilità con quelli dei componenti dettaglio preesistenti (850/500).
- Viola per identità e selezione. Token prezzo distinti verde scuro/verde/giallo/arancione/rosso predisposti ma non attivati: nessuna classificazione calcolata.

## Componenti e stati

`ui.tsx`: Button primary/secondary/ghost, Badge (info/demo/declared/verified/derived/missing), IconButton con tooltip accessibile, StatePanel empty/loading/error, Skeleton, EstimatePlaceholder.

Componenti esistenti riutilizzati: PortalShell, PortalCard, PurchaseMap, SearchPanel, PropertyHeader, HouseIDRecap, PropertyInfoSections, PurchaseSimulator, CompareTray. Input/select nativi, tab di ricerca con tastiera, chip e controlli mappa condividono i token. Focus esplicito, contrasto, etichette testuali per provenienza e demo; reduced-motion rispettato. Non utilizzare il badge verified senza una verifica effettiva.

## Pagine

Homepage: hero “Trova casa. Capisci il prezzo.”, ricerca Comune/via/prezzo, vantaggi, mappa interattiva, dati territoriali, vetrina, stato futuro Estimate. Nessun numero di stima inventato.

Acquisto/Affitto: ricerca e filtri → mappa → conteggio → risultati. Filtri comprimibili su mobile, ordinamento e preferiti preservati. La ricerca homepage passa q e max. Il renderer MapLibre già presente è condiviso anche dagli affitti per usare un unico dataset filtrato tra mappa e risultati; il componente Leaflet storico resta nel repository, senza riscriverlo. Nessuna dipendenza aggiunta.

MapLibre: stile Positron OpenFreeMap, dati OpenStreetMap/OpenMapTiles, worker locale. Attribution preservata. Nessuna API key o servizio a pagamento. La disponibilità delle tile pubbliche dipende dal fornitore esterno. Coordinate e zone originali conservate; le posizioni di zona non sono presentate come indirizzi esatti. Selezione di un borgo distinta dall’apertura di un annuncio. Marker demo identificati testualmente. Cleanup mappa/observer/marker/popup mantenuto.

Scheda: fotografie e prezzo richiesto, caratteristiche, provenienza, riepilogo, simulatore e approfondimenti. APE/planimetria, esposizione, spese e confronto rimangono disponibili. Informazioni pubbliche territoriali non promosse a verifica dell’unità immobiliare.

La vecchia valutazione numerica demo negli strumenti di ricerca è sostituita da un esplicito stato “in sviluppo”. Le simulazioni di costi/mutuo esistenti sono conservate, con ipotesi e limiti già espliciti. HouseID Estimate non è implementato. Completezza dati e affidabilità sono concetti distinti.

## Dati e limiti

Nessun nuovo annuncio, prezzo, stima, coefficiente, dataset o modifica di schema. 15 record del catalogo originario (11 acquisto, 4 affitto), un annuncio da fonte reale; gli altri rimangono demo. Lo snapshot BDTRE della Fase 3A è informazione territoriale, non statistica di mercato. I conteggi homepage si riferiscono a quello snapshot e non sono una dashboard live.

Navigazione verso pagine esistenti o sezioni della homepage. Guide non ancora disponibili; Valuta casa porta allo stato informativo futuro. Il redesign non aggiunge autenticazione, pagamenti o backend per filtri.
