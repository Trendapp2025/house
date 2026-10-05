export const runningCosts = {
 insurance:{upfrontPremium:300,years:10,source:"Esempio personale riferito dall’utente, coperture da verificare"},
 gas: {consumption:2300,unitPrice:1.4372,period:'Agosto 2026'},
 electricity:{consumption:3000,unitPrice:0.3163,period:'Luglio–settembre 2026'},
 tari:{year:2025,area:95,areaRate:0.733,binLitres:120,collections:12,litreRate:0.154},
};
export const gasAnnual=runningCosts.gas.consumption*runningCosts.gas.unitPrice;
export const electricityAnnual=runningCosts.electricity.consumption*runningCosts.electricity.unitPrice;
const t=runningCosts.tari;
export const tariBaseAnnual=t.area*t.areaRate+t.binLitres*t.collections*t.litreRate;
export const insuranceAnnual=runningCosts.insurance.upfrontPremium/runningCosts.insurance.years;
export const knownAnnualSubtotal=gasAnnual+electricityAnnual+tariBaseAnnual+insuranceAnnual;
