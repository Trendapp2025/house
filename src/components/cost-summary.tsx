import { runningCosts, gasAnnual, electricityAnnual, tariBaseAnnual, insuranceAnnual, knownAnnualSubtotal } from '@/data/running-costs';
const euros=(amount:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(amount);
export function CostSummary(){
 const t=runningCosts.tari;
 return <section className="purchase-insights cost-summary" aria-labelledby="cost-summary-title">
 <h3 id="cost-summary-title">Riepilogo delle spese · famiglia di 3 persone</h3>
 <p>Stime annuali di gestione. Le voci non disponibili non sono considerate pari a zero.</p>
 <dl className="listing-facts">
 <div><dt>Gas · {runningCosts.gas.period}</dt><dd>{euros(gasAnnual)}/anno</dd></div>
 <div><dt>Luce · {runningCosts.electricity.period}</dt><dd>{euros(electricityAnnual)}/anno</dd></div>
 <div><dt>TARI base · provvisoria, tariffe 2025</dt><dd>{euros(tariBaseAnnual)}/anno + maggiorazioni</dd></div>
 <div><dt>Assicurazione · esempio utente, da preventivare</dt><dd>{euros(insuranceAnnual)}/anno equivalente</dd></div>
 </dl>
 <p className="purchase-total"><strong>Subtotale indicativo: {euros(knownAnnualSubtotal)}/anno</strong><br/>Circa {euros(knownAnnualSubtotal/12)} al mese, come media annuale. Non è il costo complessivo della casa: mancano maggiorazioni TARI e voci sotto elencate.</p>
 <details><summary>Come è stimata la TARI e cosa manca</summary>
 <p>Tariffario CCS Carmagnola 2025: quota fissa per 3 componenti {t.areaRate} €/m²; indifferenziato {t.litreRate} €/litro per svuotamento, con minimo di 5 svuotamenti.</p>
 <p>Esempio di calcolo: {t.area} m² × {t.areaRate} + {t.binLitres} litri × {t.collections} svuotamenti × {t.litreRate} = {euros(tariBaseAnnual)} annui prima delle maggiorazioni.</p>
 <p>I 95 m² sono usati soltanto come ipotesi numerica: la superficie commerciale dell’annuncio non è la superficie imponibile accertata. Anche il contenitore da 120 litri e i 12 svuotamenti annui sono ipotesi, non dati dell’utenza né una media verificata. Pertinenze imponibili, contenitore effettivo, svuotamenti e riduzioni vanno verificati.</p>
 <p>Non inclusi TEFA, componenti perequative e servizi aggiuntivi. Il Comune ha approvato le tariffe 2026, ma gli importi non sono stati verificati: questa voce non costituisce una stima aggiornata della TARI 2026.</p>
 <p><a href="https://www.ccs.to.it/flex/files/1/4/c/D.36dcf1dc8eb9e0834ca9/Tariffe_2025_carmagnola.pdf" target="_blank" rel="noopener noreferrer">Fonte: tariffario CCS 2025</a> · <a href="https://carmagnola.consiglicloud.it/home" target="_blank" rel="noopener noreferrer">Approvazione tariffe 2026</a></p>
 </details>
 <details><summary>Assicurazione: € 300 per 10 anni, cosa significa</summary><p>Usiamo l’esperienza riferita dall’utente come ipotesi illustrativa, non come prezzo medio o preventivo per questo immobile: € 300 ÷ 10 = € 30/anno, pari a € 2,50/mese.</p><p>Se il premio è unico anticipato, l’esborso è di € 300 all’inizio, non € 30 ogni anno. Nel subtotale ripartiamo il costo sui dieci anni: non sommare anche il premio iniziale allo stesso totale annualizzato. Eventuali interessi se il premio è finanziato non sono inclusi.</p><p>Esistono polizze incendio e scoppio a premio unico legate al mutuo, ma non sappiamo se quella dell’utente fosse di questo tipo. Non assumiamo coperture per furto, contenuto, responsabilità civile o danni da acqua. Prezzo e copertura dipendono da capitale assicurato, garanzie, franchigie e durata: serve un preventivo.</p><p><a href="https://www.mediolanumassicurazioni.it/prodotti/beni/polizza-incendio-scoppio" target="_blank" rel="noopener noreferrer">Esempio di prodotto a premio unico e criteri di calcolo</a> · <a href="https://www.ivass.it/consumatori/quesiti/polizze-connesse-mutui/index.html" target="_blank" rel="noopener noreferrer">IVASS: polizze connesse ai mutui</a></p></details>
 <h4>Da aggiungere al subtotale</h4>
 <ul><li>Acqua: non stimata.</li><li>Manutenzione caldaia e immobile, eventuali garanzie assicurative aggiuntive: da preventivare.</li><li>Spese comuni: l’annuncio dichiara nessuna spesa condominiale; eventuali costi condivisi restano da verificare.</li><li>IMU, se dovuta: dipende dall’uso e dai dati catastali.</li><li>Mutuo, se richiesto: rata da calcolare sulle condizioni effettive.</li></ul>
 <h4>Spese iniziali, separate da quelle annuali</h4><p>Prezzo richiesto € 180.000, oltre a imposte, notaio, eventuale commissione d’agenzia, costi del mutuo, trasloco, arredi e lavori. Queste voci non sono comprese nel subtotale e non sono ancora quantificate.</p>
 <p className="solar-source">Gas e luce riprendono consumi, prezzi e limiti spiegati nella sezione precedente. Totali calcolati prima dell’arrotondamento. TARI aggiunta come esempio provvisorio, non come importo dovuto.</p>
 </section>;
}
