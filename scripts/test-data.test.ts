import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QueryResultRow } from 'pg';
import { propertySchema,marketSchema,point,date,geometrySchema,datasetSchema,energyAssociationSchema,requirePreciseLocation,type DatasetInput,type MunicipalityInput } from '../src/server/data/validation';
import { createUnknownProperty } from '../src/domain/property/factory';
import { hashRaw,importMunicipalities } from '../src/server/imports/municipalities';
import { PgPropertyRepository,PgMarketRepository,PgDatasetRepository,type SqlClient } from '../src/server/data/repositories';
import type { DatasetRepository,UnitOfWork } from '../src/server/data/contracts';
const raw=[{id:'it:municipality:001059',istatCode:'001059',name:'Carmagnola',province:'Torino',provinceCode:'TO',region:'Piemonte',countryCode:'IT'}];
const dataset:DatasetInput={id:'d1',sourceId:'s1',datasetName:'admin',version:'1',acquiredAt:'2026-10-05T00:00:00Z',checksum:hashRaw(raw),validFrom:null,validTo:null};
const market={id:'m',kind:'ASKING_LISTING',price:100,pricePerSqm:null,surface:50,surfaceType:'commercial',propertyType:'apartment',observationDate:'2026-10-05',location:null,precision:'unknown',sourceId:'s1',datasetVersionId:'d1',externalId:'ext',sourceType:'listing_declared',dataKind:'non_demo',verificationStatus:'declared',qualityFlags:[],eligibleForEstimateEvidence:false};
class MemoryDatasets implements DatasetRepository,UnitOfWork {
 versions=new Map<string,DatasetInput>();records=new Map<string,unknown>();municipalities=new Map<string,MunicipalityInput>();reports:unknown[]=[];
 async run<T>(work:(r:DatasetRepository)=>Promise<T>){return work(this);}
 async register(d:DatasetInput){const old=this.versions.get(d.id);if(old&&JSON.stringify(old)!==JSON.stringify(d))throw new Error('Version conflict');this.versions.set(d.id,d);}
 async stage(d:string,e:string,r:unknown,_h:string,n:MunicipalityInput|null,errors:string[]){this.records.set(`${d}/${e}`,{raw:r,normalized:n,errors});}
 async importMunicipality(_d:string,m:MunicipalityInput){this.municipalities.set(m.id,m);}
 async finish(_d:string,accepted:number,rejected:number){this.reports.push({accepted,rejected});}
}
class CaptureSql implements SqlClient {
 calls:{sql:string;values?:unknown[]}[]=[];
 async query<R extends QueryResultRow>(sql:string,values?:unknown[]):Promise<{rows:R[]}>{this.calls.push({sql,values});return {rows:[]};}
}
test('Property cannot contain askingPrice; null and zero remain distinct',()=>{const p=createUnknownProperty('p','a','non_demo');assert.equal(propertySchema.parse(p).building.elevator,null);assert.throws(()=>propertySchema.parse({...p,askingPrice:100}));p.surface.heatedSurfaceSqm=0;assert.equal(propertySchema.parse(p).surface.heatedSurfaceSqm,0);});
test('asking, transaction and OMI are mandatory distinct categories',()=>{assert.equal(marketSchema.parse(market).kind,'ASKING_LISTING');assert.equal(marketSchema.parse({...market,kind:'TRANSACTION'}).kind,'TRANSACTION');assert.throws(()=>marketSchema.parse({...market,kind:undefined}));assert.throws(()=>marketSchema.parse({...market,kind:'OMI_QUOTE'}));assert.equal(marketSchema.parse({...market,kind:'OMI_QUOTE',price:null}).kind,'OMI_QUOTE');});
test('demo, unknown sources and estimate eligibility are rejected',()=>{for(const delta of [{dataKind:'demo'},{sourceType:'demo'},{sourceType:'unknown'},{eligibleForEstimateEvidence:true}])assert.throws(()=>marketSchema.parse({...market,...delta}));});
test('invalid prices, coordinates, surfaces and dates rejected',()=>{for(const price of [-1,NaN,Infinity,'100'])assert.throws(()=>marketSchema.parse({...market,price}));assert.throws(()=>marketSchema.parse({...market,surface:-1}));assert.throws(()=>marketSchema.parse({...market,surfaceType:null}));for(const p of [{longitude:181,latitude:44},{longitude:7,latitude:91},{longitude:NaN,latitude:44}])assert.throws(()=>point.parse(p));assert.throws(()=>date.parse('2026-02-30'));});
test('geometry rings must close and use valid coordinates',()=>{assert.throws(()=>geometrySchema.parse({type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1]]]}));assert.throws(()=>geometrySchema.parse({type:'Point',coordinates:[190,44]}));});
test('dataset identity and validity are validated',()=>{assert.equal(datasetSchema.parse(dataset).version,'1');assert.throws(()=>datasetSchema.parse({...dataset,sourceId:''}));assert.throws(()=>datasetSchema.parse({...dataset,validFrom:'2026-10-05',validTo:'2025-01-01'}));});
test('import is idempotent and preserves multiple versions',async()=>{const repo=new MemoryDatasets();await importMunicipalities(repo,dataset,raw);await importMunicipalities(repo,dataset,raw);assert.equal(repo.records.size,1);assert.equal(repo.municipalities.size,1);await importMunicipalities(repo,{...dataset,id:'d2',version:'2'},raw);assert.equal(repo.versions.size,2);assert.equal(repo.records.size,2);});
test('invalid and duplicate records are quarantined; no silent coercion',async()=>{const repo=new MemoryDatasets();const bad=[...raw,raw[0],{...raw[0],istatCode:1059}];const result=await importMunicipalities(repo,{...dataset,checksum:hashRaw(bad)},bad);assert.equal(result.accepted,1);assert.equal(result.rejected,2);assert.equal(repo.records.size,3);});
test('checksum change rejected before staging',async()=>{const repo=new MemoryDatasets();await assert.rejects(importMunicipalities(repo,dataset,[]));assert.equal(repo.records.size,0);});
test('zone or demo location cannot create precise association',()=>{const p=createUnknownProperty('p','a','non_demo');p.geoLocation={latitude:44,longitude:7,precision:'zone',method:'source_coordinates',provenance:{...p.geoLocation.provenance,sourceType:'public_source',verificationStatus:'verified'}};assert.throws(()=>requirePreciseLocation(p));p.geoLocation.precision='address';assert.doesNotThrow(()=>requirePreciseLocation(p));p.dataKind='demo';assert.throws(()=>requirePreciseLocation(p));});
test('APE nearest association is not a permitted method',()=>{assert.throws(()=>energyAssociationSchema.parse({propertyId:'p',buildingId:null,method:'nearest',verificationStatus:'verified',notes:'nearby'}));assert.doesNotThrow(()=>energyAssociationSchema.parse({propertyId:'p',buildingId:null,method:'document_review',verificationStatus:'verified',notes:'Matched identifier'}));});
test('repository validates before SQL and binds identifiers instead of interpolating',async()=>{const sql=new CaptureSql(),repo=new PgMarketRepository(sql);await assert.rejects(repo.append({...marketSchema.parse(market),price:-1}));assert.equal(sql.calls.length,0);await new PgPropertyRepository(sql).find("p'; DROP TABLE property;--");assert.ok(sql.calls[0].sql.includes('$1'));assert.equal(sql.calls[0].values?.[0],"p'; DROP TABLE property;--");});
test('dataset repository rejects unresolvable source/version conflicts',async()=>{await assert.rejects(new PgDatasetRepository(new CaptureSql()).register(dataset),/identity/);});
