# Dominio immobiliare — Fase 1

Il dominio in `src/domain/property` convive con SaleListing/PortalListing. La UI continua a usare il catalogo attuale; gli adapter puri costituiscono il punto di migrazione futuro.

## Entità e valori mancanti

- **Property** rappresenta l'immobile fisico, con ID interno, riferimento Address, GeoLocation e gruppi di caratteristiche. Non contiene il prezzo richiesto.
- **Listing** rappresenta l'offerta commerciale, collega propertyId e conserva askingPrice, mercato, fonte e contenuti dell'annuncio. Asking price non è estimated value e non deve diventare un input del futuro motore.
- **Address** separa comune, codici, strada, civico e identificatori esterni. Il dominio generale non impone Carmagnola.
- **GeoLocation** conserva precisione, metodo e provenienza. Tutti i record attuali hanno precisione zone: non identificano un edificio.
- `null` significa sconosciuto; `false` significa assenza conosciuta; `0` resta un valore distinto da null. La mancanza di “Terrazzo” non prova che il terrazzo non esista.

Le superfici commerciale, utile, catastale e riscaldata sono indipendenti. Il vecchio areaSqm, privo di semantica certa, viene conservato in unspecifiedSurfaceSqm: nessuna conversione automatica. Anche piano, condizione e tipologia ambigui restano null, conservando l'input originale.

## Provenienza e osservazioni

`src/domain/provenance/types.ts` distingue listing_declared, user_provided, public_source, external_provider, houseid_calculated, houseid_estimated, demo e unknown. Provenance contiene fonte, URL, date osservazione/acquisizione, verifica, note, versione dataset e riferimenti derivati. Date non documentate restano null.

PropertyObservation associa un campo tipizzato al valore, al valore grezzo e alla provenienza. Più osservazioni dello stesso campo possono coesistere, anche in conflitto. Questa fase non risolve conflitti e non promuove automaticamente un'osservazione a valore canonico. ListingObservation è disponibile per dati commerciali; l'adapter registra prezzo e condominio, oltre alla fonte generale del Listing.

“Real” indica soltanto non-demo: non significa verified. I dati dichiarati da un annuncio restano declared. La classe energetica legacy reale ha origine non sufficientemente tracciata e resta unknown nella provenance; nessun numero EPgl viene estratto dal testo libero o dai componenti UI. L'APE dovrà avere un'importazione esplicita e un'associazione verificata all'immobile.

## Adapter e identità

`adaptLegacyListing`, `adaptPortalListing` e `adaptCatalogue` in `adapters/legacy-catalogue.ts` non modificano gli input. Gli ID Property sono distinti dagli ID Listing e restano provvisori. Un registro esplicito collega le versioni vendita/affitto dei quattro immobili sponsorizzati demo; non viene effettuata deduplicazione automatica di immobili reali.

Gli sponsorizzati sono costruiti in `src/data/catalogue.ts` da campi espliciti della propria fixture, senza copiare altri immobili. Caratteristiche non documentate restano null o segnaposto legacy compatibili con la UI. Foto, prezzi e caratteristiche dimostrative restano demo.

## Protezione evidenze

`assessEstimateEvidence` restituisce sempre eligibleForEstimateEvidence: false in Fase 1, con motivazioni. Il controllo di ammissibilità reale non è ancora implementato: nemmeno cambiare una fonte in verified sblocca un record. I demo sono sempre esclusi. Non esiste ancora un Estimate Engine.

`canUseForPreciseAssociation` verifica soltanto una precondizione geografica: coordinate valide, precisione address/building, fonte ammessa e verificata, record non-demo. Non dimostra l'identità di un APE o di un edificio. Le coordinate zone attuali non superano questo controllo e non devono essere usate per associazioni puntuali a edifici, APE, rischio, OMI o distanze ai servizi.

Inventare valori mancanti renderebbe indistinguibili ipotesi e fatti e contaminerebbe le evidenze. In futuro un insieme insufficiente di evidenze dovrà produrre insufficient_data, non una stima artificiale.

## Verifica e fase successiva

Eseguire `npm run typecheck`, `npm test` e `npm run build`. I test di dominio includono input demo avvelenati per rilevare l'ereditarietà accidentale; i contratti TypeScript verificano anche l'assenza di askingPrice da Property e la correlazione campo/valore delle osservazioni.

Prima della Fase 2 occorre definire fonti ammissibili e verifiche, identità degli immobili e associazioni documentali, gestione dei conflitti, semantica documentata delle superfici e criteri minimi di sufficienza delle evidenze. Le decisioni prodotto restano: residenziale in vendita a Carmagnola, intervallo principale, un solo futuro motore per listing/manuale anonimo, prezzo richiesto solo per confronto successivo. Report premium live separati, senza archivio permanente degli acquisti. Nessun backend o motore di stima è introdotto qui.
