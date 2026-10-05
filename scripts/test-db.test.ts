import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { loadEnvConfig } from '@next/env';
import { migrate } from './db/migrate';
import { PgUnitOfWork,PgPropertyRepository,PgListingRepository,PgMarketRepository,PgTerritorialRepository } from '../src/server/data/repositories';
import { hashRaw,importMunicipalities } from '../src/server/imports/municipalities';
import { createUnknownProperty } from '../src/domain/property/factory';
import { unknownProvenance } from '../src/domain/provenance/types';
import { marketSchema } from '../src/server/data/validation';
import { adaptPortalListing } from '../src/domain/property/adapters/legacy-catalogue';
import {persistBDTRE} from '../src/server/data/bdtre-repository';
import {parseFeature} from '../src/server/imports/bdtre-parser';
import { catalogue } from '../src/data/catalogue';
loadEnvConfig(process.cwd());
test('PostgreSQL/PostGIS integration (isolated schema)',{skip:!process.env.TEST_DATABASE_URL},async t=>{
 // Never fall back to the application's DATABASE_URL.
 const connectionString=process.env.TEST_DATABASE_URL;
 const admin=new Pool({connectionString,connectionTimeoutMillis:3000});
 const schema='houseid_test_'+randomUUID().replaceAll('-','');
 const pool=new Pool({connectionString,options:`-c search_path=${schema},extensions,public`,connectionTimeoutMillis:3000});
 try{
  const installed=await admin.query("SELECT 1 FROM pg_extension WHERE extname='postgis'");
  if(!installed.rows.length)throw new Error('PostGIS must be installed before integration tests');
  await admin.query(`CREATE SCHEMA ${schema}`);
  await migrate(pool);await migrate(pool);
  await t.test('PostGIS is available and migrations are repeatable',async()=>{assert.ok((await pool.query('SELECT PostGIS_Version() AS version')).rows[0].version);assert.equal((await pool.query('SELECT count(*) FROM schema_migration')).rows[0].count,'2');});
  await pool.query("INSERT INTO source(id,name,type,access_method) VALUES('s','Test only','houseid','fixture')");
  const raw=[{id:'m',istatCode:'001059',name:'Carmagnola',province:'Torino',provinceCode:'TO',region:'Piemonte',countryCode:'IT'}];
  const d={id:'d',sourceId:'s',datasetName:'integration-fixture',version:'1',acquiredAt:'2026-10-05T00:00:00Z',checksum:hashRaw(raw),validFrom:null,validTo:null};
  await t.test('pipeline is idempotent and preserves dataset versions',async()=>{
   const uow=new PgUnitOfWork(pool);await importMunicipalities(uow,d,raw);await importMunicipalities(uow,d,raw);
   assert.equal((await pool.query('SELECT count(*) FROM municipality')).rows[0].count,'1');assert.equal((await pool.query('SELECT count(*) FROM import_record')).rows[0].count,'1');
   await importMunicipalities(uow,{...d,id:'d2',version:'2'},raw);assert.equal((await pool.query('SELECT count(*) FROM dataset_version')).rows[0].count,'2');
   await assert.rejects(importMunicipalities(uow,{...d,checksum:hashRaw([])},[]));
   await assert.rejects(pool.query("UPDATE dataset_version SET version='changed' WHERE id='d'"));
  });
  await pool.query("INSERT INTO address(id,municipality_id,street,street_number) VALUES('a','m','Test','1')");
  const p=createUnknownProperty('p','a','non_demo');p.geoLocation.precision='zone';p.geoLocation.latitude=44;p.geoLocation.longitude=7;
  const properties=new PgPropertyRepository(pool);await properties.insert(p);
  await t.test('Property persists separately; multiple observations coexist',async()=>{
   assert.deepEqual(await properties.find('p'),p);
   await properties.observe('p',{observationId:'o1',field:'energy.energyClass',value:'G',rawValue:'G',provenance:unknownProvenance()},null);
   await properties.observe('p',{observationId:'o2',field:'energy.energyClass',value:'F',rawValue:'F',provenance:unknownProvenance()},null);
   assert.equal((await pool.query("SELECT count(*) FROM property_observation WHERE property_id='p'")).rows[0].count,'2');
   assert.equal((await properties.find('p'))?.energy.energyClass,null);
  });
  await t.test('listing price history is append-only',async()=>{
   const sample=catalogue[0];const l=adaptPortalListing(sample).listing;l.propertyId='p';l.listingId='l';l.source.sourceId=null;l.source.datasetVersion=null;
   const listings=new PgListingRepository(pool);await listings.save(l);await listings.save({...l,askingPrice:123});assert.equal((await listings.history('l')).length,2);await assert.rejects(pool.query('DELETE FROM listing_revision'));
  });
  const markets=new PgMarketRepository(pool);
  const base=marketSchema.parse({id:'market1',kind:'ASKING_LISTING',price:100,pricePerSqm:null,surface:50,surfaceType:'commercial',propertyType:'apartment',observationDate:'2026-10-05',location:null,precision:'unknown',sourceId:'s',datasetVersionId:'d',externalId:'ext',sourceType:'listing_declared',dataKind:'non_demo',verificationStatus:'declared',qualityFlags:['integration_fixture'],eligibleForEstimateEvidence:false});
  await t.test('market categories remain distinct and never eligible',async()=>{await markets.append(base);await markets.append({...base,id:'transaction-test',kind:'TRANSACTION'});await markets.append({...base,id:'omi-test',kind:'OMI_QUOTE',price:null});assert.deepEqual((await markets.byDataset('d')).map(m=>m.kind).sort(),['ASKING_LISTING','OMI_QUOTE','TRANSACTION']);});
  await t.test('database constraints reject invalid market values, demo and source mismatch',async()=>{
   const sql=`INSERT INTO market_observation(id,kind,price,surface,observation_date,precision,source_id,dataset_version_id,external_id,source_type,data_kind,verification_status) VALUES($1,'ASKING_LISTING',$2,$3,'2026-10-05','unknown',$4,'d',$1,$5,$6,'declared')`;
   for(const values of [['bad-price',-1,null,'s','listing_declared','non_demo'],['bad-surface',100,-1,'s','listing_declared','non_demo'],['bad-demo',100,null,'s','demo','demo'],['bad-source',100,null,'missing','listing_declared','non_demo']])await assert.rejects(pool.query(sql,values));
   await assert.rejects(pool.query("INSERT INTO address_point(id,point,precision,source_id,dataset_version_id,external_id) VALUES('bad-point',ST_SetSRID(ST_MakePoint(200,44),4326),'address','s','d','x')"));
  });
  await t.test('zone coordinates rejected by repository and DB territorial guard',async()=>{
   const repo=new PgTerritorialRepository(pool);await repo.append({id:'f',municipalityId:'m',featureType:'test',sourceId:'s',datasetVersionId:'d',externalId:'f',geometry:{type:'Polygon',coordinates:[[[6,43],[8,43],[8,45],[6,43]]]},attributes:{test:true}});
   await assert.rejects(repo.link({id:'link',propertyId:'p',featureId:'f',method:'point_inside_polygon',distanceM:null,notes:'test'}));
   await assert.rejects(pool.query("INSERT INTO property_territorial_link(id,property_id,territorial_feature_id,link_method,quality) VALUES('l','p','f','nearest','unverified')"));
  });
  await t.test('BDTRE spatial validation, quarantine, reimport and next version',async()=>{
   await pool.query("INSERT INTO municipality(id,name,country_code) VALUES('it:municipality:001059','Carmagnola fixture','IT')");
   const polygon=(size:number)=>({type:'Polygon',coordinates:[[[400000-size,4970000-size],[400000+size,4970000-size],[400000+size,4970000+size],[400000-size,4970000+size],[400000-size,4970000-size]]]});
   const boundary=parseFeature({type:'Feature',properties:{uuid:'boundary',comune_ist:'001059'},geometry:polygon(100)},'comune','test',0);
   const building=parseFeature({type:'Feature',properties:{uuid:'building'},geometry:polygon(10)},'edifc','test',0);
   const access=parseFeature({type:'Feature',properties:{uuid:'access',acc_pc_geo:'puntuale',civico_num:'1'},geometry:{type:'Point',coordinates:[400000,4970000]}},'acc_pc','test',0);
   const invalid=parseFeature({type:'Feature',properties:{uuid:'invalid'},geometry:{type:'Polygon',coordinates:[[[400000,4970000],[400010,4970010],[400010,4970000],[400000,4970010],[400000,4970000]]]}},'edifc','test',1);
   const outside=parseFeature({type:'Feature',properties:{uuid:'outside'},geometry:{type:'Point',coordinates:[450000,4970000]}},'acc_pc','test',1);
   const records=[boundary,building,access,invalid,outside];
   const input={dataset:{...d,id:'bdtre-test-v1',datasetName:'bdtre-test',sourceId:'bdtre-test',checksum:hashRaw(records)},records,metadata:{test:true},sourceRead:5,duplicates:0};
   const first=await persistBDTRE(pool,input);assert.equal(first.access.linked_buildings,1);assert.equal(first.layers.reduce((n,r)=>n+r.rejected,0),2);
   const again=await persistBDTRE(pool,input);assert.equal(again.layers.reduce((n,r)=>n+r.inserted,0),0);assert.equal(again.layers.reduce((n,r)=>n+r.unchanged,0),3);
   const changed=parseFeature({type:'Feature',properties:{uuid:'access',acc_pc_geo:'approssimato',civico_num:'2'},geometry:{type:'Point',coordinates:[400000,4970000]}},'acc_pc','test',0);
   const nextRecords=[boundary,changed];
   const next=await persistBDTRE(pool,{...input,dataset:{...input.dataset,id:'bdtre-test-v2',version:'2',acquiredAt:'2026-10-06T00:00:00Z',checksum:hashRaw(nextRecords)},records:nextRecords,sourceRead:2});
   assert.equal(next.layers.reduce((n,r)=>n+r.updated,0),1);assert.equal(next.absentFromPrevious,1);assert.equal(next.access.linked_buildings,0);
   assert.equal((await pool.query("SELECT count(*) FROM building WHERE dataset_version_id='bdtre-test-v1'")).rows[0].count,'1');
  });
  await t.test('APE cannot associate by nearest point',async()=>{await assert.rejects(pool.query("INSERT INTO energy_certificate(id,certificate_identifier,source_id,dataset_version_id,property_id,association_method,verification_status,association_notes) VALUES('ape','test','s','d','p','nearest','verified','test')"));});
 }finally{
  await pool.end();
  // Only the generated, isolated test schema is removed. Never public or application data.
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await admin.end();
 }
});
