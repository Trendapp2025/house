import 'server-only';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import type { Property, Listing, PropertyObservation } from '../../domain/property/types';
import type { PropertyRepository,ListingRepository,MarketRepository,TerritorialRepository,DatasetRepository,UnitOfWork } from './contracts';
import { identifier, nonnegative, propertySchema, listingSchema, datasetSchema, marketSchema, territorialSchema, requirePreciseLocation, provenance, type DatasetInput, type MarketInput, type TerritorialInput, type MunicipalityInput } from './validation';
export interface SqlClient {query<R extends QueryResultRow=QueryResultRow>(sql:string,values?:unknown[]):Promise<{rows:R[]}>}
const json=(value:unknown)=>JSON.stringify(value);

export class PgPropertyRepository implements PropertyRepository {
 constructor(private db:SqlClient){}
 async find(id:string):Promise<Property|null>{const r=await this.db.query<{domain_payload:unknown}>('SELECT domain_payload FROM property WHERE id=$1',[identifier.parse(id)]);return r.rows[0]?propertySchema.parse(r.rows[0].domain_payload):null;}
 async insert(input:Property){
  const p=propertySchema.parse(input),g=p.geoLocation;
  await this.db.query(`INSERT INTO property(id,address_id,data_kind,property_type,location,precision,geo_verification,geo_source_type,commercial_surface,usable_surface,cadastral_surface,heated_surface,domain_payload)
   VALUES($1,$2,$3,$4,CASE WHEN $5::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($5,$6),4326) END,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)`,
   [p.propertyId,p.addressId,p.dataKind,p.propertyType,g.longitude,g.latitude,g.precision,g.provenance.verificationStatus,g.provenance.sourceType,p.surface.commercialSurfaceSqm,p.surface.usableSurfaceSqm,p.surface.cadastralSurfaceSqm,p.surface.heatedSurfaceSqm,json(p)]);
 }
 async observe(propertyId:string,o:PropertyObservation,unit:string|null){
  const p=provenance.parse(o.provenance);
  identifier.parse(o.observationId);identifier.parse(o.field);
  // Validate the observed field with the same domain schema; observations never update canonical values.
  const base=await this.find(propertyId);if(!base)throw new Error('Unknown property');
  if(!o.field.startsWith('address.')){
   const candidate:Record<string,unknown>=structuredClone(base) as unknown as Record<string,unknown>;
   const keys=o.field.split('.');let target=candidate;
   for(const key of keys.slice(0,-1)){const next=target[key];if(!next||typeof next!=='object')throw new Error('Invalid field');target=next as Record<string,unknown>;}
   target[keys[keys.length-1]]=o.value;propertySchema.parse(candidate);
  } else if(o.value!==null&&typeof o.value!=='string')throw new Error('Invalid address observation');
  await this.db.query(`INSERT INTO property_observation(id,property_id,field,value,unit,source_id,dataset_version_id,source_type,observed_at,acquired_at,verification_status,provenance,raw_value) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)`,[o.observationId,propertyId,o.field,json(o.value),unit,p.sourceId,p.datasetVersion,p.sourceType,p.observedAt,p.acquiredAt,p.verificationStatus,json(p),json(o.rawValue)??null]);
 }
}
export class PgListingRepository implements ListingRepository {
 constructor(private db:SqlClient){}
 async find(id:string):Promise<Listing|null>{const r=await this.db.query<{domain_payload:unknown}>('SELECT domain_payload FROM listing WHERE id=$1',[identifier.parse(id)]);return r.rows[0]?listingSchema.parse(r.rows[0].domain_payload):null;}
 async save(input:Listing){
  const l=listingSchema.parse(input);
  identifier.parse(l.listingId);identifier.parse(l.propertyId);provenance.parse(l.source);
  if(l.listingId===l.propertyId)throw new Error('Listing and property identities must differ');
  if(l.askingPrice!==null)nonnegative.parse(l.askingPrice);
  await this.db.query(`INSERT INTO listing(id,property_id,source_id,external_listing_id,market,asking_price,currency,published_at,updated_at,status,domain_payload)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
   ON CONFLICT(id) DO UPDATE SET asking_price=EXCLUDED.asking_price,updated_at=EXCLUDED.updated_at,status=EXCLUDED.status,domain_payload=EXCLUDED.domain_payload
   WHERE listing.property_id=EXCLUDED.property_id AND listing.source_id IS NOT DISTINCT FROM EXCLUDED.source_id AND listing.external_listing_id IS NOT DISTINCT FROM EXCLUDED.external_listing_id AND listing.market=EXCLUDED.market
   RETURNING id`,[l.listingId,l.propertyId,l.source.sourceId,l.externalListingId,l.market,l.askingPrice,l.currency,l.publishedAt,l.updatedAt,l.status,json(l)]).then(r=>{if(!r.rows.length)throw new Error('Listing identity mismatch');});
 }
 async history(id:string){const r=await this.db.query<{payload:unknown}>('SELECT payload FROM listing_revision WHERE listing_id=$1 ORDER BY id',[identifier.parse(id)]);return r.rows.map(r=>r.payload);}
}
export class PgMarketRepository implements MarketRepository {
 constructor(private db:SqlClient){}
 async append(input:MarketInput){const m=marketSchema.parse(input);
  await this.db.query(`INSERT INTO market_observation(id,kind,price,price_per_sqm,surface,surface_type,property_type,observation_date,location,precision,source_id,dataset_version_id,external_id,source_type,data_kind,verification_status,quality_flags)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $9::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($9,$10),4326) END,$11,$12,$13,$14,$15,$16,$17,$18)`,[m.id,m.kind,m.price,m.pricePerSqm,m.surface,m.surfaceType,m.propertyType,m.observationDate,m.location?.longitude??null,m.location?.latitude??null,m.precision,m.sourceId,m.datasetVersionId,m.externalId,m.sourceType,m.dataKind,m.verificationStatus,m.qualityFlags]);
 }
 async byDataset(id:string):Promise<MarketInput[]>{
  const r=await this.db.query<{record:unknown}>(`SELECT jsonb_build_object('id',id,'kind',kind,'price',price,'pricePerSqm',price_per_sqm,'surface',surface,'surfaceType',surface_type,'propertyType',property_type,'observationDate',to_char(observation_date,'YYYY-MM-DD'),'location',CASE WHEN location IS NULL THEN NULL ELSE jsonb_build_object('longitude',ST_X(location),'latitude',ST_Y(location)) END,'precision',precision,'sourceId',source_id,'datasetVersionId',dataset_version_id,'externalId',external_id,'sourceType',source_type,'dataKind',data_kind,'verificationStatus',verification_status,'qualityFlags',quality_flags,'eligibleForEstimateEvidence',eligible_for_estimate) AS record FROM market_observation WHERE dataset_version_id=$1 ORDER BY id`,[identifier.parse(id)]);
  return r.rows.map(r=>marketSchema.parse(r.record));
 }
}
export class PgTerritorialRepository implements TerritorialRepository {
 constructor(private db:SqlClient){}
 async append(input:TerritorialInput){const t=territorialSchema.parse(input);await this.db.query(`INSERT INTO territorial_feature(id,municipality_id,feature_type,source_id,dataset_version_id,external_id,geometry,attributes) VALUES($1,$2,$3,$4,$5,$6,ST_SetSRID(ST_GeomFromGeoJSON($7),4326),$8::jsonb)`,[t.id,t.municipalityId,t.featureType,t.sourceId,t.datasetVersionId,t.externalId,json(t.geometry),json(t.attributes)]);}
 async link(input:Parameters<TerritorialRepository['link']>[0]){
  const p=await new PgPropertyRepository(this.db).find(input.propertyId);if(!p)throw new Error('Unknown property');requirePreciseLocation(p);
  if(input.distanceM!==null)nonnegative.parse(input.distanceM);
  await this.db.query(`INSERT INTO property_territorial_link(id,property_id,territorial_feature_id,link_method,distance_m,quality,notes) VALUES($1,$2,$3,$4,$5,'unverified',$6)`,[identifier.parse(input.id),input.propertyId,identifier.parse(input.featureId),input.method,input.distanceM,input.notes]);
 }
}
export class PgDatasetRepository implements DatasetRepository {
 constructor(private db:SqlClient){}
 async register(input:DatasetInput){const d=datasetSchema.parse(input);
  await this.db.query(`INSERT INTO dataset_version(id,source_id,dataset_name,version,acquired_at,checksum,valid_from,valid_to,import_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'staging') ON CONFLICT DO NOTHING`,[d.id,d.sourceId,d.datasetName,d.version,d.acquiredAt,d.checksum,d.validFrom,d.validTo]);
  const r=await this.db.query<{id:string;checksum:string;source_id:string;dataset_name:string;version:string}>(`SELECT id,checksum,source_id,dataset_name,version FROM dataset_version WHERE id=$1 FOR UPDATE`,[d.id]);const old=r.rows[0];
  if(!old||old.checksum!==d.checksum||old.source_id!==d.sourceId||old.dataset_name!==d.datasetName||old.version!==d.version)throw new Error('Dataset identity/checksum conflict; use a new version');
 }
 async stage(datasetId:string,externalId:string,raw:unknown,hash:string,normalized:MunicipalityInput|null,errors:string[]){
  await this.db.query(`INSERT INTO import_record(dataset_version_id,external_id,raw_hash,raw_payload,normalized_payload,status,errors) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7::jsonb) ON CONFLICT(dataset_version_id,external_id) DO NOTHING`,[datasetId,externalId,hash,json(raw),normalized?json(normalized):null,normalized?'staged':'rejected',json(errors)]);
 }
 async importMunicipality(datasetId:string,m:MunicipalityInput){
  await this.db.query(`INSERT INTO municipality(id,istat_code,name,province,province_code,region,country_code,dataset_version_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,province=EXCLUDED.province,province_code=EXCLUDED.province_code,region=EXCLUDED.region,country_code=EXCLUDED.country_code,dataset_version_id=EXCLUDED.dataset_version_id WHERE municipality.istat_code=EXCLUDED.istat_code RETURNING id`,[m.id,m.istatCode,m.name,m.province,m.provinceCode,m.region,m.countryCode,datasetId]).then(r=>{if(!r.rows.length)throw new Error('Municipality identity conflict');});
  await this.db.query(`UPDATE import_record SET status='imported' WHERE dataset_version_id=$1 AND external_id=$2`,[datasetId,m.istatCode]);
 }
 async finish(id:string,accepted:number,rejected:number){await this.db.query(`UPDATE dataset_version SET import_status=$2 WHERE id=$1`,[id,rejected?'failed':'completed']);await this.db.query(`INSERT INTO import_report(dataset_version_id,accepted,rejected,report) VALUES($1,$2,$3,$4::jsonb)`,[id,accepted,rejected,json({accepted,rejected})]);}
}
export class PgUnitOfWork implements UnitOfWork {
 constructor(private pool:Pool){}
 async run<T>(work:(datasets:DatasetRepository)=>Promise<T>):Promise<T>{const c:PoolClient=await this.pool.connect();try{await c.query('BEGIN');const r=await work(new PgDatasetRepository(c));await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
}
