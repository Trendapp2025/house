# Fase 4 — verifica

Baseline pre-redesign pubblicata su main: b6411e859629b94c3427bca59e5f4af91a319662.

Prima delle modifiche UI: TypeScript, 18 test dominio, suite finanziaria, 13 test infrastruttura, 5 test BDTRE e build Next completati con successo.

Dopo le modifiche:
- TypeScript: passato.
- Dominio: 18/18; catalogo e regole demo/declared/verified preservati.
- Finanza: suite passata (ammortamento, tasso zero, senza mutuo, validazione, costi noti/ignoti, preferenze).
- Infrastruttura: 13/13.
- BDTRE: 5/5.
- PostgreSQL/PostGIS: 10/10, nessuno saltato, schema temporaneo isolato. Include vincoli, idempotenza migration/import, versioni, quarantena spaziale e divieto di associazione APE per prossimità.
- Conteggi e checksum di tutte le tabelle dello schema houseid identici prima/dopo i test: phase4-database-verification.json. Nessun import o migration applicato allo schema applicativo.
- Build Next: passata, 21 pagine generate.
- Build produzione su porta 3100: HTTP 200 per /, /acquisto, /affitto, /immobili/immobiliare-131431598 e /api/health. Health: status ok, database reachable, postgis available.

Controlli browser: ricerca homepage trasferisce q/max; borgo San Bernardo restituisce l’annuncio reale; marker apre popup e link alla scheda; filtri affitto, stato vuoto e reset; planimetria apre/chiude senza navigazione; confronto apre/chiude con Escape; navigazione principale. Controlli mobile e desktop, con correzione overflow delle card simili. Console senza errori durante i controlli finali. Focus visibile e controlli nativi con label, tab ricercabili da tastiera; non è una certificazione WCAG.

Limiti preesistenti: catalogo in gran parte demo, posizioni di zona indicative, dati di mercato e Estimate indisponibili, informazioni dell’annuncio da confermare. Le tile cartografiche e le fotografie remote dipendono da servizi esterni. I conteggi BDTRE in homepage descrivono lo snapshot importato, non un aggiornamento live.

Screenshot in docs/screenshots. Nessuna Fase 3B o Estimate Engine avviata.

Verifica responsive finale: 1280 px (quattro colonne), 768 px (due colonne), 390 px (una colonna e filtri comprimibili); scrollWidth uguale alla larghezza utile, senza overflow pagina. Console errori: nessuno rilevato. Screenshot delle quattro pagine sia desktop sia mobile.

Controllo pubblicazione: .env.local e data/raw esclusi da Git; scansione contenuti contro credenziali locali e pattern di segreti senza risultati (CHANGE_ME in .env.example è un segnaposto). Nessun file oltre 10 MB. .gitattributes conserva LF per SQL, già presenti nei file locali, per mantenere stabili i checksum delle migration anche nei futuri checkout Windows.
