import type { SaleListing } from '../types/listing';
export type FinancePreferences={deposit:string;rate:string;years:string};
export const emptyPreferences:FinancePreferences={deposit:'',rate:'',years:'30'};
export type InitialCost={label:string;amount:number;kind:'estimate'|'declared'};
export function calculatePurchase(listing:SaleListing,p:FinancePreferences,additionalCosts:InitialCost[]=[]){
 const deposit=Number(p.deposit),rate=Number(p.rate),years=Number(p.years);
 const valid=p.deposit.trim()!==''&&p.rate.trim()!==''&&Number.isFinite(deposit)&&deposit>=0&&deposit<=listing.price&&Number.isFinite(rate)&&rate>=0&&rate<=100&&[10,15,20,25,30].includes(years);
 const agencyKnown=listing.sellerType==='agency';
 const agency=agencyKnown?listing.price*.03:null;
 const notary=listing.price*(4000/170000);
 const costs:InitialCost[]=[...(agency!==null?[{label:'Agenzia — stima 3%',amount:agency,kind:'estimate' as const}]:[]),{label:'Notaio — stima',amount:notary,kind:'estimate'},...additionalCosts];
 if(!valid)return {valid:false,principal:null,payment:null,liquidity:null,agency,notary,costs};
 const principal=listing.price-deposit,months=years*12,r=rate/1200;
 const payment=principal===0?0:r===0?principal/months:principal*r/(-Math.expm1(-months*Math.log1p(r)));
 return {valid:true,principal,payment,liquidity:deposit+costs.reduce((sum,c)=>sum+c.amount,0),agency,notary,costs};
}
export const pricePerSqm=(l:SaleListing)=>l.areaSqm>0?l.price/l.areaSqm:null;
