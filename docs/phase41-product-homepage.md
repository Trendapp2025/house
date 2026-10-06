# Phase 4.1 — product-first homepage

Base: main, Fase 4 (9d54761). Ambito: presentazione homepage, navigazione condivisa, colori UI della scheda. Nessun cambiamento a database, migration, BDTRE/import, provenance domain, repository dati, API health o dataset.

## UX
- Header: HouseID, Acquista, Affitto. Nessun link a funzioni future.
- Hero: titolo, una frase, foto editoriale; ricerca integrata con gli stessi parametri q e max.
- Desktop/tablet: mappa → immobili in evidenza. Mobile: immobili → mappa. Nessuna duplicazione dei componenti/dati.
- Dopo gli immobili: tre elementi brevi “Perché HouseID” e piccolo teaser Estimate.
- Rimossi card Metodo HouseID, blocco conteggi BDTRE e grande placeholder Estimate dalla homepage. EstimatePlaceholder rimane nel codice per uso futuro. Nessuna stima o metrica inventata.
- I colori blu del solo blocco UI dettaglio in globals.css sono sostituiti da token esistenti: brand viola, testi neutri, bordi/superfici/ombre semantici. Nessuna sostituzione dei colori semantici di energia, esposizione o future valutazioni prezzo.

## Asset hero
`public/images/houseid-editorial-living-room.png` (1536×1024) generato con lo strumento imagegen il 6 ottobre 2026 per questa fase. Immagine editoriale fotorealistica di soggiorno luminoso; non rappresenta un immobile del catalogo, né un indirizzo o un’offerta. Didascalia visibile “Immagine illustrativa · AI” e alt esplicito. Asset locale versionato, nessuna dipendenza da URL fotografici esterni per la hero. Il file originale generato è preservato; nessuna fotografia di annuncio è stata alterata.

## Immobili simili
L’ordinamento esistente per tipologia e prossimità del prezzo richiesto serve esclusivamente alla navigazione UI. NON è il sistema di comparabili HouseID Estimate. La prossimità del prezzo richiesto NON deve essere utilizzata come evidenza futura di valutazione. Commento tecnico aggiunto presso il calcolo; algoritmo immutato.

## Verifica
- TypeScript: passato.
- Test dominio: 18/18.
- Suite finanziaria: passata.
- Test infrastruttura: 13/13.
- Test BDTRE unitari: 5/5.
- Build Next: passata, 21 pagine generate.
- Nessuna esecuzione dei test di integrazione sul database reale: questa fase non accede a Supabase.
- Browser: homepage desktop/tablet/mobile, ricerca q/max verso Acquisto, marker/popup/scheda, affitto/filtri, navigazione e console. Nessun overflow pagina rilevato. Screenshot desktop e mobile in docs/screenshots/phase41.

I limiti preesistenti del catalogo (demo, localizzazione indicativa, fotografie/tile remote degli annunci) rimangono espliciti. Nessuna Fase 3B o implementazione Estimate Engine.
