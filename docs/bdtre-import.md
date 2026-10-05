# BDTRE — Fase 3A

## Fonte e acquisizione

Regione Piemonte / CSI Piemonte, servizi pubblici WFS indicati da https://igr.piemonte.it/scheda-informativa/dati-servizi (pagina aggiornata 1/7/2026). Endpoint effettivi:

- `https://geoservices.csi.it/ms/wfs/bdtre/rp-01/bdtrewfs/bdtre_viab`: acc_pc (accessi/civici), tp_str (toponimi stradali).
- `https://geoservices.csi.it/ms/wfs/bdtre/rp-01/bdtrewfs/bdtre_imm`: edifc (edifici).
- `https://geoservices.csi.it/ms/wfs/bdtre/rp-01/bdtrewfs/bdtre_amm`: comune, filtro Carmagnola verificato con comune_ist=001059.

GetCapabilities e DescribeFeatureType sono stati letti prima di definire i mapping. Lo snapshot ha data di acquisizione, non una presunta edizione ufficiale. data_acq/data_agg/data_fin restano attributi originali per record; 9999-12-31 non viene presentato come data di aggiornamento. Riferimento alla politica regionale CC BY 4.0: https://www.regione.piemonte.it/web/media/21742/download. Attribuzione conservata: Regione Piemonte — BDTRE; servizio CSI Piemonte; trasformazioni HouseID dichiarate.

Il servizio limita le risposte a 1000 record, anche nel conteggio hits. Lo script suddivide ricorsivamente il rettangolo ottenuto dal confine ufficiale finché ogni risposta è inferiore al limite. Le risposte genitore sono archiviate ma non importate. I duplicati tra foglie sono deduplicati per layer+uuid; contenuti discordanti con lo stesso ID vengono quarantinati. Nessuna percentuale di copertura è dedotta dal solo conteggio restituito dal WFS.

## Difetto del GeoJSON del confine

Il GeoJSON ufficiale del comune restituiva Polygon con un foro esterno: PostGIS ha rifiutato la prima transazione, senza scritture parziali. La controverifica GML2 espone invece MultiPolygon con due elementi distinti. Il convertitore Python usa il parser XML standard, preserva exterior/interior di ciascun Polygon e produce un MultiPolygon GeoJSON. Nessun ST_MakeValid o riordinamento arbitrario dei fori. Originale GML, GeoJSON problematico, conversione, URL e checksum sono conservati. Gli altri record invalidi sono quarantinati, non riparati.

## Riproduzione

Prerequisiti: Node, Python 3 (solo libreria standard), DATABASE_URL server-side già configurata. Su Windows impostare PYTHON al percorso dell'eseguibile se `python` non è disponibile.

1. `npm run db:acquire:bdtre` crea una nuova cartella locale snapshot e stampa il percorso manifest.
2. `npm run db:migrate` applica soltanto le migrazioni mancanti.
3. `npm run db:import:bdtre -- <percorso-manifest.json>`.
4. Ripetere lo stesso comando per verificare il reimport senza duplicati.

Raw e manifest sono in `data/raw/`, esclusi da Git per dimensione; conservarli insieme per audit e reimport. Hash dei file e riferimenti sono anche nel database. Il loader verifica i checksum e il CRS EPSG:32632, senza accettare percorsi esterni alla cartella snapshot. I report numerici sono in `docs/import-reports/` e in import_report.

## Schema e ciclo di vita

002_bdtre_import.sql aggiunge metadata a DatasetVersion, attributi sorgente/versione/esponente a Address, un indice staging, dataset_head e una funzione PostGIS che restituisce null per geometrie illeggibili (poi quarantinate). 001_foundation.sql resta invariata.

Si riutilizzano Source, DatasetVersion, Building, Address, AddressPoint, TerritorialFeature, import_record e import_report. Nessun Property o MarketObservation viene creato. Gli attributi originali restano JSONB, senza dedurre caratteristiche delle unità immobiliari.

Ogni versione è uno snapshot append-only. dataset_head indica la versione corrente; le precedenti sono implicitamente superseded, ancora consultabili. Gli oggetti mancanti nella nuova versione vengono contati, non cancellati; la loro assenza non dimostra demolizione o cessazione. Un reimport della stessa versione è unchanged. Una nuova versione confronta ID/hash con la precedente: inserted, updated o unchanged descrivono il contenuto logico; fisicamente conserva nuove righe di snapshot anche per contenuto invariato. Gli import con errori di qualit� hanno import_status failed e un report esplicito; le sole esclusioni fuori Comune non costituiscono un fallimento. dataset_head seleziona i soli record accettati dello snapshot, non certifica completezza. Un errore SQL annulla tutta la transazione.

## Geometrie e indirizzi

ST_Force2D e ST_Transform normalizzano 32632→4326. ST_IsValid e range coordinate controllano gli oggetti. I punti devono essere coperti dal confine; edifici e strade devono intersecarlo. Oggetti a cavallo del confine sono conservati interi: la selezione territoriale non equivale a taglio geometrico. Quelli totalmente esterni sono segnalati nello staging, separabili dagli invalidi.

Strada e numero vengono normalizzati solo per spazi bianchi. L'esponente resta separato; dati mancanti null, senza inventare CAP o interno. Denominazione e altri attributi originali restano disponibili. acc_pc_geo=puntuale produce un access point address; approssimato rimane unknown. Questo non assegna coordinate a nessuna unità immobiliare.

L'associazione accesso-edificio richiede un punto puntuale coperto da un solo edificio dello stesso snapshot. Zero candidati resta irrisolto, più candidati ambiguo; nessun nearest/fuzzy match. È un candidato spaziale, non una verifica catastale. Gli edifici non equivalgono ad appartamenti, superficie commerciale, piani, APE o valori di mercato. tp_str è conservato in TerritorialFeature; il nome strada dei civici proviene direttamente dal record acc_pc.

## Test

`npm test`: regressioni precedenti e parser BDTRE. `npm run test:db`: richiede TEST_DATABASE_URL, crea ed elimina soltanto uno schema casuale isolato. Il test BDTRE include geometrie valide/invalide, territorio, link, quarantena, reimport e versione successiva con record assente. Le fixture di test non entrano nello schema houseid. TypeScript e build restano richiesti.

Fase 3B proposta: audit degli accessi approssimati/irrisolti e validazione amministrativa degli abbinamenti indirizzo-edificio, con un piccolo insieme verificato manualmente. Non avviare Estimate o deduzioni economiche da questi dati territoriali.
