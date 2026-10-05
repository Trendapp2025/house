import type { SaleListing } from '../../../types/listing';
import type { PortalListing } from '../../../data/catalogue';
import type { Provenance, Observation } from '../../provenance/types';
import { unknownProvenance } from '../../provenance/types';
import { createUnknownProperty } from '../factory';
import type { Address, Condition, EnergyClass, NormalizedRecord, PropertyFieldValues, PropertyType } from '../types';

/** Current catalog identities are provisional. This is not physical-property deduplication. */
const sponsoredIdentity: Readonly<Record<string, string>> = {
  'sale-villa-poirino':'sponsored-villa-poirino', 'rent-villa-poirino':'sponsored-villa-poirino',
  'sale-trilocale-torino':'sponsored-trilocale-torino', 'rent-trilocale-torino':'sponsored-trilocale-torino',
  'sale-villetta-sommariva':'sponsored-villetta-sommariva', 'rent-villetta-sommariva':'sponsored-villetta-sommariva',
  'sale-quadrilocale-porto':'sponsored-quadrilocale-porto', 'rent-quadrilocale-porto':'sponsored-quadrilocale-porto',
};
const types: Readonly<Record<string, PropertyType>> = {
  'Appartamento':'apartment', 'Appartamento · intera proprietà':'apartment',
  'Casa indipendente':'detached_house', 'Villa':'villa',
};
const conditions: Readonly<Record<string, Condition>> = { 'Buono stato':'good', 'Buono stato (esempio)':'good', 'Da ristrutturare':'to_renovate', 'Ristrutturato':'renovated', 'Nuovo':'new' };
const energyClasses: readonly EnergyClass[] = ['A4','A3','A2','A1','A','B','C','D','E','F','G'];
const numberOrNull = (n: number | null) => typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
function dateOrNull(text: string | null): string | null {
  const match=text?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match)return null;
  const iso=`${match[3]}-${match[2]}-${match[1]}`;
  const date=new Date(iso+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:null;
}
function sourceFor(l: SaleListing): Provenance {
  return { ...unknownProvenance(), sourceType:l.status==='demo'?'demo':l.sourceUrl?'listing_declared':'unknown',
    sourceId:l.id,sourceName:'Catalogo legacy HouseID',sourceUrl:l.sourceUrl,
    verificationStatus:l.status==='demo'?'not_applicable':l.sourceUrl?'declared':'unverified',
    notes:['Trascrizione legacy; nessuna verifica indipendente. Date di osservazione/acquisizione non disponibili.'] };
}
function externalId(url: string | null): string | null {
  if(!url)return null;
  try {const parsed=new URL(url);return ['www.immobiliare.it','immobiliare.it'].includes(parsed.hostname)?parsed.pathname.match(/^\/annunci\/(\d+)\/?$/)?.[1]??null:null;}catch{return null;}
}
type ObservationInput = { [K in keyof PropertyFieldValues]: Omit<Observation<K,PropertyFieldValues[K]>, 'observationId'> }[keyof PropertyFieldValues];

export function adaptLegacyListing(legacy: SaleListing, market: 'sale' | 'rent' = 'sale'): NormalizedRecord {
  const source=sourceFor(legacy);
  const unknown=legacy.status==='demo'?{...source,notes:['Campo non noto anche nel record demo.']} : unknownProvenance(['Campo non strutturato o provenienza non determinabile nel catalogo legacy.']);
  const identity=legacy.status==='demo'?sponsoredIdentity[legacy.id]??legacy.id:legacy.id;
  const propertyId='houseid:property:'+encodeURIComponent(identity);
  const addressId='houseid:address:'+encodeURIComponent(identity);
  const property=createUnknownProperty(propertyId,addressId,legacy.status==='demo'?'demo':'non_demo');
  const address: Address={ addressId,municipality:null,municipalityIstatCode:null,street:null,streetNumber:null,postalCode:null,province:null,provinceCode:null,region:null,countryCode:null,externalIdentifiers:[] };
  // Recognize only the explicit existing catalogue suffix; never infer a municipality from a map centre.
  if(legacy.location.label.endsWith(', Carmagnola (TO)')) {
    address.municipality='Carmagnola';address.provinceCode='TO';
    // Administrative expansion in this legacy adapter, not in the general Property domain.
    address.province='Torino';address.region='Piemonte';address.countryCode='IT';
    const street=legacy.location.label.slice(0,-', Carmagnola (TO)'.length);
    if(/^(Via|Corso|Piazza|Viale|Vicolo|Strada) /i.test(street)) {
      const match=street.match(/^(.*?)[ ]+(\d+[A-Za-z]?(?:\/[A-Za-z0-9]+)?)$/);
      address.street=match?.[1]??street;address.streetNumber=match?.[2]??null;
    }
  }
  const geoSource=legacy.status==='demo'?source:unknownProvenance(['Punto legacy indicativo; non attribuibile all’unità né a un dataset geografico verificato.']);
  const [lng,lat]=legacy.location.coordinates;
  const coordinatesValid=Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lng)&&lng>=-180&&lng<=180;
  property.geoLocation={latitude:coordinatesValid?lat:null,longitude:coordinatesValid?lng:null,
    precision:coordinatesValid?legacy.location.precision:'unknown',method:coordinatesValid?'source_coordinates':'unknown',provenance:geoSource};
  property.propertyType=types[legacy.propertyType]??null;
  property.surface.unspecifiedSurfaceSqm=numberOrNull(legacy.areaSqm);
  property.composition.rooms=numberOrNull(legacy.rooms);property.composition.bathrooms=numberOrNull(legacy.bathrooms);
  const bedrooms=legacy.features.map(f=>f.match(/^(\d+) camere$/)).find(m=>m!==null);
  property.composition.bedrooms=bedrooms?Number(bedrooms[1]):null;
  const floor=legacy.floor.match(/^(-?\d+)° piano$/);
  if(floor) {property.floor.floorNumber=Number(floor[1]);property.floor.isGroundFloor=property.floor.floorNumber===0;property.floor.isBasement=property.floor.floorNumber<0;}
  if(legacy.floor==='Su due livelli')property.floor.isMultiLevel=true;
  property.building={totalFloors:numberOrNull(legacy.totalFloors),elevator:typeof legacy.lift==='boolean'?legacy.lift:null,yearBuilt:numberOrNull(legacy.yearBuilt)};
  const has=(...words:string[])=>words.some(w=>legacy.features.includes(w))?true:null;
  property.outdoorSpaces.balcony.presence=has('Balcone');property.outdoorSpaces.terrace.presence=has('Terrazzo');property.outdoorSpaces.privateGarden.presence=has('Giardino privato');
  property.accessories.garage.presence=has('Box privato','Box auto');property.accessories.parkingSpace.presence=has('Posto auto');property.accessories.cellar.presence=has('Cantina');property.accessories.attic.presence=has('Soffitta');
  property.condition.state=conditions[legacy.condition]??null;
  property.energy.energyClass=energyClasses.find(c=>c===legacy.energyClass)??null;
  // An untyped energy number/string is NOT automatically an EPgl figure. Keep raw observations.
  if(legacy.heating==='Autonomo, radiatori a metano') {property.energy.heatingType='autonomous';property.energy.heatingFuel='natural_gas';property.systems.heatDistribution='radiators';}
  if(legacy.heating==='Autonomo (esempio)'&&legacy.status==='demo')property.energy.heatingType='autonomous';
  const energySource=legacy.status==='demo'?source:unknownProvenance(['Classe/indicatore legacy potenzialmente derivati da APE: fonte per campo e associazione all’unità non strutturate.']);
  const inputs:ObservationInput[]=[
    {field:'propertyType',value:property.propertyType,rawValue:legacy.propertyType,provenance:property.propertyType?source:unknown},
    {field:'surface.unspecifiedSurfaceSqm',value:property.surface.unspecifiedSurfaceSqm,rawValue:legacy.areaSqm,provenance:source},
    {field:'surface.commercialSurfaceSqm',value:null,rawValue:legacy.areaSqm,provenance:unknown},
    {field:'surface.heatedSurfaceSqm',value:null,rawValue:null,provenance:unknown},
    {field:'composition.rooms',value:property.composition.rooms,rawValue:legacy.rooms,provenance:source},
    {field:'composition.bathrooms',value:property.composition.bathrooms,rawValue:legacy.bathrooms,provenance:source},
    {field:'composition.bedrooms',value:property.composition.bedrooms,rawValue:legacy.features,provenance:property.composition.bedrooms!==null?source:unknown},
    {field:'floor.floorNumber',value:property.floor.floorNumber,rawValue:legacy.floor,provenance:floor?source:unknown},
    {field:'floor.isGroundFloor',value:property.floor.isGroundFloor,rawValue:legacy.floor,provenance:floor?source:unknown},
    {field:'floor.isBasement',value:property.floor.isBasement,rawValue:legacy.floor,provenance:floor?source:unknown},
    {field:'floor.isMultiLevel',value:property.floor.isMultiLevel,rawValue:legacy.floor,provenance:property.floor.isMultiLevel===true?source:unknown},
    {field:'building.elevator',value:property.building.elevator,rawValue:legacy.lift,provenance:legacy.lift===null?unknown:source},
    {field:'building.totalFloors',value:property.building.totalFloors,rawValue:legacy.totalFloors,provenance:source},
    {field:'building.yearBuilt',value:property.building.yearBuilt,rawValue:legacy.yearBuilt,provenance:source},
    {field:'condition.state',value:property.condition.state,rawValue:legacy.condition,provenance:property.condition.state?source:unknown},
    {field:'energy.energyClass',value:property.energy.energyClass,rawValue:legacy.energyClass,provenance:energySource},
    {field:'energy.epgl',value:null,rawValue:{number:legacy.energyConsumption,label:legacy.energyConsumptionLabel??null},provenance:energySource},
    {field:'energy.heatingType',value:property.energy.heatingType,rawValue:legacy.heating,provenance:property.energy.heatingType?source:unknown},
    {field:'energy.heatingFuel',value:property.energy.heatingFuel,rawValue:legacy.heating,provenance:property.energy.heatingFuel?source:unknown},
    {field:'systems.heatDistribution',value:property.systems.heatDistribution,rawValue:legacy.heating,provenance:property.systems.heatDistribution?source:unknown},
    {field:'geoLocation.latitude',value:property.geoLocation.latitude,rawValue:lat,provenance:geoSource},
    {field:'geoLocation.longitude',value:property.geoLocation.longitude,rawValue:lng,provenance:geoSource},
    {field:'geoLocation.precision',value:property.geoLocation.precision,rawValue:legacy.location.precision,provenance:geoSource},
    {field:'geoLocation.method',value:property.geoLocation.method,rawValue:null,provenance:geoSource},
    {field:'address.municipality',value:address.municipality,rawValue:legacy.location.label,provenance:source},
    {field:'address.street',value:address.street,rawValue:legacy.location.label,provenance:address.street?source:unknown},
    {field:'address.streetNumber',value:address.streetNumber,rawValue:legacy.location.label,provenance:address.streetNumber?source:unknown},
    {field:'address.provinceCode',value:address.provinceCode,rawValue:legacy.location.label,provenance:source},
    {field:'address.province',value:address.province,rawValue:legacy.location.label,provenance:unknown},
    {field:'address.region',value:address.region,rawValue:legacy.location.label,provenance:unknown},
    {field:'address.countryCode',value:address.countryCode,rawValue:legacy.location.label,provenance:unknown},
    {field:'outdoorSpaces.balcony.presence',value:property.outdoorSpaces.balcony.presence,rawValue:legacy.features,provenance:property.outdoorSpaces.balcony.presence?source:unknown},
    {field:'outdoorSpaces.terrace.presence',value:property.outdoorSpaces.terrace.presence,rawValue:legacy.features,provenance:property.outdoorSpaces.terrace.presence?source:unknown},
    {field:'outdoorSpaces.privateGarden.presence',value:property.outdoorSpaces.privateGarden.presence,rawValue:legacy.features,provenance:property.outdoorSpaces.privateGarden.presence?source:unknown},
    {field:'accessories.garage.presence',value:property.accessories.garage.presence,rawValue:legacy.features,provenance:property.accessories.garage.presence?source:unknown},
    {field:'accessories.parkingSpace.presence',value:property.accessories.parkingSpace.presence,rawValue:legacy.features,provenance:property.accessories.parkingSpace.presence?source:unknown},
    {field:'accessories.cellar.presence',value:property.accessories.cellar.presence,rawValue:legacy.features,provenance:property.accessories.cellar.presence?source:unknown},
    {field:'accessories.attic.presence',value:property.accessories.attic.presence,rawValue:legacy.features,provenance:property.accessories.attic.presence?source:unknown},
  ];
  const listing={listingId:'houseid:listing:'+encodeURIComponent(legacy.id),propertyId,dataKind:property.dataKind,market,
    askingPrice:numberOrNull(legacy.price),currency:'EUR' as const,rentPeriod:market==='rent'?'month' as const:null,
    title:legacy.title,description:legacy.description,sellerType:legacy.sellerType??null,
    agency:legacy.sellerType==='agency'&&legacy.contact?{...legacy.contact}:null,
    source,externalListingId:externalId(legacy.sourceUrl),sourceUrl:legacy.sourceUrl,publishedAt:null,updatedAt:dateOrNull(legacy.updatedAt),status:'unknown' as const,
    condominiumMonthly:numberOrNull(legacy.condominiumMonthly),availabilityText:legacy.availability,
    contact:legacy.contact?{...legacy.contact}:null,photos:legacy.photos.map(p=>({...p})),floorPlanUrl:legacy.floorPlanUrl};
  return {property,address,listing,propertyObservations:inputs.map(input=>({...input,observationId:propertyId+':'+legacy.id+':'+input.field})),
    listingObservations:[{observationId:listing.listingId+':askingPrice',field:'askingPrice',value:listing.askingPrice,provenance:source,rawValue:legacy.price},
      {observationId:listing.listingId+':condominiumMonthly',field:'condominiumMonthly',value:listing.condominiumMonthly,provenance:source,rawValue:legacy.condominiumMonthly}],
    legacy:{listingId:legacy.id,areaId:legacy.areaId,zoneName:legacy.zoneName,featureTexts:[...legacy.features],energyLabel:legacy.energyConsumptionLabel??null,updatedAtText:legacy.updatedAt}};
}
export function adaptPortalListing(listing: PortalListing): NormalizedRecord {return adaptLegacyListing(listing,listing.market);}
export function adaptCatalogue(listings: readonly PortalListing[]): NormalizedRecord[] {return listings.map(adaptPortalListing);}
