import { z } from 'zod';
import type { Property, Listing } from '../../domain/property/types';

export const identifier = z.string().trim().min(1).max(240);
export const nonnegative = z.number().finite().nonnegative();
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
 const d = new Date(v); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===v;
}, 'Invalid calendar date');
export const timestamp = z.string().datetime({offset:true});
export const precision = z.enum(['address','building','street','zone','municipality','unknown']);
export const verification = z.enum(['unverified','declared','verified','conflicting','not_applicable']);
export const sourceType = z.enum(['listing_declared','user_provided','public_source','external_provider','houseid_calculated','houseid_estimated','demo','unknown']);
export const propertyType = z.enum(['apartment','detached_house','semi_detached_house','terraced_house','villa','farmhouse','other_residential']);
export const provenance = z.object({sourceType,sourceId:identifier.nullable(),sourceName:z.string().nullable(),sourceUrl:z.string().url().nullable(),observedAt:timestamp.nullable(),acquiredAt:timestamp.nullable(),verificationStatus:verification,notes:z.array(z.string()),datasetVersion:identifier.nullable(),derivedFrom:z.array(identifier)});
export const point = z.object({longitude:z.number().finite().min(-180).max(180),latitude:z.number().finite().min(-90).max(90)}).strict();
const amenity = z.object({presence:z.boolean().nullable(),surfaceSqm:nonnegative.nullable(),count:nonnegative.int().nullable()}).strict();
const nullableBoolean=z.boolean().nullable();
export const propertySchema: z.ZodType<Property> = z.object({
 propertyId:identifier,addressId:identifier,dataKind:z.enum(['demo','non_demo']),identityStatus:z.enum(['provisional','resolved']),propertyType:propertyType.nullable(),
 geoLocation:z.object({latitude:point.shape.latitude.nullable(),longitude:point.shape.longitude.nullable(),precision,method:z.enum(['source_coordinates','geocoded','user_pin','surveyed','unknown']),provenance}).refine(v=>(v.latitude===null)===(v.longitude===null),'Coordinates must be a complete pair'),
 surface:z.object({commercialSurfaceSqm:nonnegative.nullable(),usableSurfaceSqm:nonnegative.nullable(),cadastralSurfaceSqm:nonnegative.nullable(),heatedSurfaceSqm:nonnegative.nullable(),unspecifiedSurfaceSqm:nonnegative.nullable()}).strict(),
 composition:z.object({rooms:nonnegative.nullable(),bedrooms:nonnegative.int().nullable(),bathrooms:nonnegative.int().nullable()}).strict(),
 floor:z.object({floorNumber:z.number().int().nullable(),isGroundFloor:nullableBoolean,isBasement:nullableBoolean,isTopFloor:nullableBoolean,isAttic:nullableBoolean,isMultiLevel:nullableBoolean}).strict(),
 building:z.object({totalFloors:nonnegative.int().nullable(),elevator:nullableBoolean,yearBuilt:nonnegative.int().nullable()}).strict(),
 outdoorSpaces:z.object({balcony:amenity,terrace:amenity,privateGarden:amenity}).strict(),accessories:z.object({garage:amenity,parkingSpace:amenity,cellar:amenity,attic:amenity}).strict(),
 condition:z.object({state:z.enum(['to_renovate','needs_work','good','renovated','new']).nullable(),renovationYear:nonnegative.int().nullable(),finishes:z.enum(['basic','standard','high_quality']).nullable()}).strict(),
 energy:z.object({energyClass:z.enum(['A4','A3','A2','A1','A','B','C','D','E','F','G']).nullable(),epgl:nonnegative.nullable(),epglUnit:z.literal('kWh/m²/year').nullable(),epglKind:z.enum(['non_renewable','total']).nullable(),heatingType:z.enum(['autonomous','centralized','district']).nullable(),heatingFuel:z.enum(['natural_gas','electricity','oil','biomass','other']).nullable(),airConditioning:nullableBoolean}).strict(),
 systems:z.object({heatDistribution:z.enum(['radiators','underfloor','air']).nullable()}).strict(),orientation:z.object({mainDirection:z.enum(['N','NE','E','SE','S','SW','W','NW']).nullable(),freeSides:nonnegative.int().nullable()}).strict()
}).strict();
export const municipalitySchema=z.object({id:identifier,istatCode:z.string().regex(/^\d{6}$/),name:identifier,province:identifier,provinceCode:z.string().regex(/^[A-Z]{2}$/),region:identifier,countryCode:z.string().regex(/^[A-Z]{2}$/)}).strict();
const contact=z.object({name:z.string(),phone:z.string().nullable(),email:z.string().nullable()}).strict();
const sourceDate=z.union([date,timestamp]).nullable();
export const listingSchema:z.ZodType<Listing>=z.object({listingId:identifier,propertyId:identifier,dataKind:z.enum(['demo','non_demo']),market:z.enum(['sale','rent']),askingPrice:nonnegative.nullable(),currency:z.literal('EUR'),rentPeriod:z.literal('month').nullable(),title:z.string(),description:z.string(),sellerType:z.enum(['agency','private']).nullable(),agency:contact.nullable(),source:provenance,externalListingId:identifier.nullable(),sourceUrl:z.string().url().nullable(),publishedAt:sourceDate,updatedAt:sourceDate,status:z.enum(['active','withdrawn','sold','rented','unknown']),condominiumMonthly:nonnegative.nullable(),availabilityText:z.string().nullable(),contact:contact.nullable(),photos:z.array(z.object({src:z.string(),alt:z.string()}).strict()),floorPlanUrl:z.string().nullable()}).strict().refine(l=>l.propertyId!==l.listingId,'Distinct property/listing IDs required').refine(l=>l.market==='rent'?l.rentPeriod==='month':l.rentPeriod===null,'Invalid rent period');
export type MunicipalityInput=z.infer<typeof municipalitySchema>;
export const datasetSchema=z.object({id:identifier,sourceId:identifier,datasetName:identifier,version:identifier,acquiredAt:timestamp,checksum:z.string().regex(/^[a-f0-9]{64}$/),validFrom:date.nullable(),validTo:date.nullable()}).strict().refine(v=>v.validFrom===null||v.validTo===null||v.validFrom<=v.validTo,'Invalid validity interval');
export type DatasetInput=z.infer<typeof datasetSchema>;
export const marketSchema=z.object({
 id:identifier,kind:z.enum(['ASKING_LISTING','TRANSACTION','OMI_QUOTE']),price:nonnegative.nullable(),pricePerSqm:nonnegative.nullable(),surface:nonnegative.nullable(),surfaceType:z.enum(['commercial','usable','cadastral','heated','unspecified']).nullable(),propertyType:propertyType.nullable(),observationDate:date,location:point.nullable(),precision,
 sourceId:identifier,datasetVersionId:identifier,externalId:identifier,sourceType:z.enum(['listing_declared','user_provided','public_source','external_provider','houseid_calculated','houseid_estimated']),dataKind:z.literal('non_demo'),verificationStatus:verification,qualityFlags:z.array(z.string()),eligibleForEstimateEvidence:z.literal(false)
}).strict().refine(v=>(v.surface===null)===(v.surfaceType===null),'Surface type required with surface').refine(v=>v.kind!=='OMI_QUOTE'||(v.price===null&&v.pricePerSqm===null),'OMI uses an interval in omi_quote');
export type MarketInput=z.infer<typeof marketSchema>;
const coordinate=z.tuple([point.shape.longitude,point.shape.latitude]);
const ring=z.array(coordinate).min(4).refine(r=>r[0][0]===r[r.length-1][0]&&r[0][1]===r[r.length-1][1],'Ring must close');
export const geometrySchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('Point'),coordinates:coordinate}).strict(),
 z.object({type:z.literal('Polygon'),coordinates:z.array(ring).min(1)}).strict(),
 z.object({type:z.literal('MultiPolygon'),coordinates:z.array(z.array(ring).min(1)).min(1)}).strict()
]); // Topological validity is additionally enforced by PostGIS ST_IsValid.
export const territorialSchema=z.object({id:identifier,municipalityId:identifier.nullable(),featureType:identifier,sourceId:identifier,datasetVersionId:identifier,externalId:identifier,geometry:geometrySchema,attributes:z.record(z.string(),z.unknown())}).strict();
export type TerritorialInput=z.infer<typeof territorialSchema>;
export function requirePreciseLocation(p:Property):void {
 const g=p.geoLocation;
 if(p.dataKind==='demo'||!['address','building'].includes(g.precision)||g.provenance.verificationStatus!=='verified'||!['public_source','external_provider','user_provided'].includes(g.provenance.sourceType))throw new Error('Verified precise location required');
 point.parse({longitude:g.longitude,latitude:g.latitude});
}
export const energyAssociationSchema=z.object({propertyId:identifier.nullable(),buildingId:identifier.nullable(),method:z.enum(['verified_identifier','document_review']),verificationStatus:z.literal('verified'),notes:z.string().trim().min(1)}).strict().refine(v=>v.propertyId!==null||v.buildingId!==null,'Association target required');
