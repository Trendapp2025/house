import type { SaleListing } from '@/types/listing';
import type { Market, Property } from '@/types/real-estate';
import { zoneSaleListings } from './zone-listings';
import { properties, zones } from './mock';
export type PortalListing = SaleListing & { market:Market; sponsored?:boolean; preview?:Property };
function sponsoredListing(p: Property, market: Market): PortalListing {
 const zone=zones.find(z=>z.id===p.zoneId);
 if(!zone)throw new Error(`Zona demo mancante per ${p.id}: ${p.zoneId}`);
 // Construct from this fixture only. No other property's defaults may leak here.
 return {
  id:`${market}-${p.id}`,areaId:p.zoneId,zoneName:zone.name,market,status:'demo',
  title:p.title,price:market==='sale'?p.salePrice:p.monthlyRent,areaSqm:p.area,rooms:p.rooms,bathrooms:p.bathrooms,
  location:{label:p.address,coordinates:[...zone.center],precision:'zone'},
  description:'Annuncio dimostrativo del catalogo HouseID. Indirizzo, prezzo e caratteristiche sono esempi, non un’offerta reale.',
  propertyType:p.title.includes('Villa')||p.title.includes('Villetta')?'Villa':'Appartamento',
  // Legacy UI requires strings for these fields; the domain adapter maps them to null.
  floor:'Da verificare',condition:'Dato non disponibile',
  totalFloors:null,lift:null,yearBuilt:null,energyClass:null,energyConsumption:null,
  heating:null,condominiumMonthly:null,availability:null,features:[],photos:[],floorPlanUrl:null,
  contact:null,sourceUrl:null,updatedAt:null,sponsored:true,preview:p,
 };
}
const sponsored=properties.flatMap(p=>(['sale','rent'] as const).map(market=>sponsoredListing(p,market)));
export const catalogue:PortalListing[]=[...zoneSaleListings.map(l=>({...l,market:'sale' as const})),...sponsored];
export const findPortalListing=(id:string)=>catalogue.find(l=>l.id===id);
