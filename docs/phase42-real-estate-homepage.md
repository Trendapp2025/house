# Phase 4.2 — real estate first homepage

## Ambito
Homepage e supporto minimo alla ricerca. Nessuna modifica a DB, migration, Supabase, BDTRE, pipeline, provenance, API, dominio, dataset o comparabili. Nessun Estimate Engine.

## Asset
`public/images/carmagnola-panorama.png`: copia integra del file fornito dall’utente `Winter Countryside Mountain Panorama.png`, 1983×793 px, 2.100.256 byte. Nessun ridimensionamento del file originale, ritocco, testo o badge aggiunto alla fotografia.

Next Image usa import statico, fill, sizes=100vw, priority, quality=85 e placeholder blur. La hero ha altezza riservata (540 px desktop, 560 tablet; immagine 360 px e form in flusso su mobile). Object-fit cover mantiene le proporzioni e object-position conserva il Monviso al centro. I contenitori sono dimensionati prima del caricamento per evitare shift indotto dall’immagine. Nessuno spostamento visibile rilevato nei controlli; non è una misura di CLS sul traffico reale.

Rimosso il flag globale images.unoptimized: la hero è l’unico utilizzo di next/image; le immagini esistenti del catalogo continuano a usare i renderer precedenti. Endpoint optimizer verificato HTTP 200, image/webp, 182.434 byte alla richiesta w=2048/q=85; originale preservato.

## Struttura
Header esistente HouseID / Acquista / Affitto, più compatto soltanto sulla homepage. Hero fotografica full-width con titolo e una frase. Search card sovrapposta: Comune, via/zona, tipologia, prezzo, Cerca. Parametri q/max preservati; nuovo type consentito soltanto per tipologie già supportate e collegato al filtro preesistente in MarketPage.

Seguono quattro card del catalogo, mappa MapLibre/OpenFreeMap e mini-lista sul desktop ampio. Su schermi più stretti resta la mappa completa con reset zona esterno sempre disponibile. Nessuna modifica a coordinate, marker, popup o logica di sovrapposizione.

In fondo, presentazione HouseID con tre elementi brevi e piccola scheda costruita sull’annuncio reale già nel catalogo. Il contesto BDTRE è esplicitamente comunale, non verifica o associazione all’unità immobiliare. Stima in sviluppo, dati mercato in preparazione: nessun numero calcolato o inventato. La vetrina conserva l’ordine di presentazione reale/demo senza inventare date di pubblicazione.

## Verifiche
- TypeScript passato.
- Test: 18 dominio, 13 infrastruttura, 5 BDTRE unitari, suite finanziaria: tutti passati.
- Build Next passata (21 pagine generate).
- Test di integrazione DB con scritture non rieseguiti: rispettato il vincolo di non modificare Supabase.
- Build produzione: HTTP 200 su homepage, Acquisto, Affitto, scheda reale, /api/health. Health: ok, database reachable, PostGIS available (sola lettura).
- Browser: ricerca q/max/type, 1 risultato San Bernardo/Appartamento/200000; marker/popup e scheda; Affitto e filtro canone; selezione e reset zone; homepage 390/768/1280 px, immagine responsive, ordine sezioni e assenza overflow. Console senza errori rilevati.
- Screenshot desktop/mobile in docs/screenshots/phase42.
- Controllo secrets prima del push; .env.local e raw ignorati.

Limiti preesistenti: catalogo prevalentemente demo e coordinate di zona indicative; fotografie degli annunci e cartografia dipendono dai fornitori esterni. La nuova hero è locale. Nessuna fase successiva avviata.
