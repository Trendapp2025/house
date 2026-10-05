# HouseID — infrastruttura dati, Fase 2

## Decisione architetturale

PostgreSQL + PostGIS, nello stesso progetto Next.js. Accesso con `pg`, SQL parametrizzato, repository TypeScript e validazione runtime Zod. Le query hanno tipi di risultato espliciti; SQL non è verificato staticamente contro lo schema: i test di integrazione restano indispensabili.

Alternative valutate: [Prisma offre un'estensione PostGIS](https://www.prisma.io/docs/orm/extensions), ma qui aggiungerebbe un livello per operazioni spaziali esplicite; [Drizzle supporta geometry e query geografiche](https://orm.drizzle.team/docs/guides/postgis-geometry-point), ed è una valida alternativa futura. Per questo MVP, [pg e parametri SQL](https://node-postgres.com/features/queries) consentono migrazioni trasparenti, vincoli/trigger e PostGIS senza un secondo schema ORM da sincronizzare. Nessun microservizio.

## Setup

Prerequisiti: Node compatibile con Next 15, PostgreSQL con estensione PostGIS installata. Un amministratore crea database vuoti `houseid` e `houseid_test` e un ruolo con permesso di migrazione; in produzione usare un ruolo applicativo più limitato. Installare PostGIS tramite il proprio gestore PostgreSQL. Il ruolo migrazione deve poter creare l'estensione, oppure l'amministratore la crea prima con `CREATE EXTENSION postgis`.

1. `npm install`.
2. Copiare `.env.example` in `.env.local`, sostituire i segnaposto. Non usare credenziali reali nel repository. I file `.env*` sono ignorati salvo l'esempio.
3. `npm run db:migrate`.
4. `npm run db:seed`.
5. `npm run dev`, oppure `npm run build` e `npm start`.

DATABASE_URL è esclusivamente server-side; non usare il prefisso NEXT_PUBLIC. Per database remoti configurare TLS verificato secondo il provider, senza disabilitare la verifica dei certificati. Non esiste connessione automatica a un provider né provisioning remoto.

## Migrazioni e schema

`db/migrations/001_foundation.sql` crea PostGIS, tipi, vincoli, indici GiST e le entità:

- municipality, address, building, address_point;
- property, listing, listing_revision, property_observation;
- source, dataset_version;
- territorial_feature, property_territorial_link, energy_certificate;
- market_observation, omi_quote;
- estimate_run, estimate_run_dataset;
- import_record, import_report.

Il runner usa un lock PostgreSQL per serializzare le migrazioni, una transazione per file e SHA-256. Una migrazione applicata non si modifica: si aggiunge un nuovo file numerato. Un checksum diverso interrompe l'esecuzione. Non esiste un comando distruttivo di reset.

Property conserva il dominio Fase 1 in JSONB validato, con colonne esplicite per identità, superfici, coordinate e filtri principali. Listing ha ID separato e relazione molti-a-uno; ogni inserimento o modifica conserva una revisione append-only. Le osservazioni sono append-only e non aggiornano il valore canonico; sono consentite più fonti per lo stesso campo.

MarketObservation richiede una categoria ASKING_LISTING, TRANSACTION oppure OMI_QUOTE; il tipo può essere esteso tramite migrazione. Le quotazioni OMI hanno entità dedicata per intervallo, semestre, tipologia, conservazione, mercato e unità. Nessun prezzo richiesto è convertito in transazione. Tutte le evidenze restano non ammissibili a Estimate in questa fase, anche se verificate. Non esiste alcun writer/algoritmo Estimate.

## Geografia e APE

Geometrie SRID 4326, coordinate limitate agli intervalli validi, topologia verificata con ST_IsValid. Building ammette una geometria assente; nessun seed inventa poligoni. TerritorialFeature mantiene featureType estendibile, geometria e attributi sorgente; identità di fonte/versione restano colonne obbligatorie.

Le associazioni territoriali richiedono coordinate address/building verificate di un immobile non-demo: controllo repository più trigger SQL. Soddisfare questa precondizione non prova che una specifica associazione sia corretta: il repository registra il metodo e lascia la qualità unverified. Non implementa ricerca del vicino, geocoding o associazioni automatiche.

I certificati APE possono essere non associati. Un'associazione richiede identificativo verificato o revisione documentale, note e stato verified; nearest non è un metodo ammesso. La verifica documentale resta responsabilità di un futuro flusso amministrativo.

## Repository e sicurezza

`src/server/data/contracts.ts` definisce PropertyRepository, ListingRepository, MarketRepository, TerritorialRepository, DatasetRepository e UnitOfWork. `repositories.ts` contiene le implementazioni SQL. Il dominio Fase 1 non importa pg o Zod. Importer e futuri servizi usano queste interfacce; i componenti React continuano a usare il catalogo legacy.

Pool lazy riutilizzato, connessioni e query con timeout; nessuna connessione richiesta durante build. I moduli database sono marcati server-only. CLI/test usano la condizione react-server per quel marcatore, non una rimozione della protezione client. Nessuna API di import pubblica.

`GET /api/health` è dinamico Node.js, non cacheabile. Verifica connessione e PostGIS; restituisce 200 generico o 503 generico, senza versione, host, credenziali o errori SQL. Non è un controllo completo di schema/migrazione.

## Pipeline, raw e versioni

`importMunicipalities`: input unknown → validazione/checksum → normalizzazione → staging → persistenza → report. Eseguito da CLI/admin, non dal browser. Il piccolo importer amministrativo dimostra il contratto riusabile senza importare dati immobiliari. Un'intera esecuzione è transazionale; errori SQL annullano staging e scritture. Errori di validazione sono registrati come rejected, i record validi sono importati e il dataset è marcato failed quando contiene rifiuti. Il report rende esplicito l'import parziale.

Chiave dataset: source + datasetName + version. SHA-256 e identità impediscono di riutilizzare una versione per contenuti differenti. Un secondo import conserva i record e la prima acquiredAt, aggiungendo soltanto un report di esecuzione; non duplica dati normalizzati. Ogni nuova versione conserva staging e payload precedenti. Municipality rappresenta il valore corrente, il suo storico è ricostruibile dai record normalizzati delle versioni importate.

Staging conserva externalId, rawHash, piccolo rawPayload, normalizedPayload ed errori. I duplicati interni al file sono rifiutati. Per futuri file BDTRE voluminosi usare rawReference a uno storage amministrativo e checksum, non copiare file interi nel database. Nessun blob store è introdotto ora.

Provenance conserva fonte, categoria, versione, osservazione/acquisizione e verifica. Una fonte pubblica non rende automaticamente verificato ogni dato. Le relazioni composite impediscono di collegare un dataset a una fonte diversa. DatasetVersion conserva periodo, checksum e data acquisizione immutabili; le nuove edizioni aggiungono righe.

## Seed Carmagnola e altri comuni

`db/seeds/carmagnola.json`: Carmagnola, ISTAT 001059, Torino/TO, Piemonte, IT. Fonte amministrativa: [Regione Piemonte, codici comuni](https://www.regione.piemonte.it/web/media/55140/download). Solo identificativi amministrativi, nessuna posizione/prezzo/statistica. La data acquisizione registra l'esecuzione del seed, non una fittizia data di osservazione della fonte. Nessun dato legacy viene importato.

Per aggiungere un Comune: verificare i suoi dati amministrativi e condizioni di riuso, registrare Source, preparare un nuovo dataset amministrativo con versione e checksum, chiamare lo stesso importer. Il dominio e lo schema non limitano i comuni a Carmagnola. L'MVP commerciale resta Carmagnola.

## Test e limiti di verifica

- `npm run typecheck`.
- `npm test`: 18 test dominio Fase 1, regressioni finanziarie, test unitari dati/repository.
- `npm run test:db`: richiede TEST_DATABASE_URL; senza variabile viene esplicitamente saltato. Non usa mai DATABASE_URL come fallback.
- `npm run build`.

Il test DB applica due volte le migrazioni in uno schema temporaneo casuale di un database dedicato, esegue import, repository e vincoli, poi elimina esclusivamente quello schema. Richiede permesso di creare schemi e PostGIS gi� installato in extensions oppure public. Il test non installa n� sposta estensioni. Le transazioni fittizie esistono soltanto come fixture nel database di test isolato e vengono rimosse. Non sono un seed applicativo.

Verifica reale completata su Supabase con PostGIS 3.3.7 in extensions: migrazione, seed e tutti i test di integrazione superati. Le tabelle applicative sono nello schema houseid, non esposto ai ruoli anon/authenticated. Il pool usa search_path=houseid,extensions,public. Il runner CLI crea houseid prima di applicare la migrazione originale, rimasta invariata. I test usano uno schema casuale separato e lo eliminano al termine. Per questa verifica TEST_DATABASE_URL � stato valorizzato soltanto nel processo di test dalla connessione autorizzata; nessuna duplicazione del segreto nei file.

## Deployment e Fase 3

Rimosso output: export perché `/api/health` richiede un runtime server e una connessione privata. `out/` eventualmente già presente è un vecchio artefatto e non rappresenta il nuovo deployment. Usare `npm run build` + `npm start` su host Node o hosting Next compatibile, con PostgreSQL/PostGIS raggiungibile. Le pagine frontend restano prerenderizzabili e funzionano senza database; nessun redesign. L'hosting di soli file statici non esegue l'API. Eventuali costi dipendono dal provider, nessun servizio a pagamento è attivato.

Fase 3 raccomandata: prima eseguire integrazione DB e revisionare i vincoli su PostGIS reale; poi selezionare un dataset pubblico reale con licenza chiara, importarlo con controlli di qualità, identità e precisione. Definire ammissibilità delle evidenze soltanto dopo aver visto i dati reali. Non anticipare coefficienti, comparabili o soglie. Il futuro prodotto premium resta live e separato: nessun archivio permanente di report acquistati è previsto da questa fase.
