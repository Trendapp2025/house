# Verifica Fase 2 su Supabase

- Connessione PostgreSQL riuscita; PostGIS 3.3.7 nello schema extensions.
- Applicata esclusivamente 001_foundation.sql, SQL originale invariato. Ripetizione riuscita senza riapplicazione.
- Tabelle nello schema dedicato houseid; nessuna tabella aggiunta in public. anon e authenticated non hanno USAGE su houseid.
- 20 tabelle: address, address_point, building, dataset_version, energy_certificate, estimate_run, estimate_run_dataset, import_record, import_report, listing, listing_revision, market_observation, municipality, omi_quote, property, property_observation, property_territorial_link, schema_migration, source, territorial_feature.
- Audit cataloghi: 36 foreign key, 46 CHECK, 20 primary key, 9 vincoli unique. Quattro indici GiST su building, address_point, property, territorial_feature. Cinque colonne geometriche SRID 4326: Point, MultiPolygon e Geometry secondo lo schema.
- Seed Carmagnola 001059 riuscito e ripetuto: un Comune, un dataset, un record importato; nessuna evidenza di mercato o Property applicativa.
- Integrazione: otto sottotest più contenitore (9 pass, 0 fail, 0 skip), incluse migrazioni ripetibili, pipeline idempotente, versioni, osservazioni multiple, storico listing, categorie mercato, vincoli negativi, precisione geografica e divieto nearest per APE.
- Schema di test isolato rimosso; nessun houseid_test_* residuo.
- TypeScript, 18 test dominio, 13 test infrastruttura, regressioni finanziarie e build superati.
- Build di produzione avviata temporaneamente sulla porta 3100: /api/health HTTP 200 con database reachable e postgis available; homepage, acquisto, affitto e scheda immobile HTTP 200. Server temporaneo arrestato dopo verifica.

## Modifiche rispetto alla Fase 2

Pool: search_path houseid,extensions,public. CLI: crea houseid prima della migration. Test: riconosce PostGIS già installato senza installarlo o spostarlo; include extensions nella risoluzione dei tipi. Documentazione aggiornata. Nessuna modifica al file SQL della migration già prevista.

## Segreti e limiti

DATABASE_URL letta dal solo .env.local, escluso dalle regole .gitignore. TEST_DATABASE_URL valorizzata solo nel processo autorizzato di test, senza modificare il file dei segreti. La directory non è un repository Git inizializzato. Nessuna credenziale riportata nei risultati. Nessun blocco residuo per la verifica richiesta. Fase 3 ed Estimate Engine non avviati.
