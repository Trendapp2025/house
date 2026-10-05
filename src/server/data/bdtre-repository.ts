import 'server-only';
import type {Pool} from 'pg';
import type {BDTRERecord} from '../imports/bdtre-parser';
import {PgDatasetRepository} from './repositories';
import type {DatasetInput} from './validation';
export interface BDTREImport {dataset:DatasetInput;records:BDTRERecord[];metadata:Record<string,unknown>;sourceRead:number;duplicates:number}
export async function persistBDTRE(pool:Pool,input:BDTREImport){
 const c=await pool.connect();const d=input.dataset;
 try{
  await c.query('BEGIN');await c.query("SET LOCAL statement_timeout='120s'");
  await c.query("SELECT pg_advisory_xact_lock(hashtext('houseid:bdtre-import'))");
  await c.query(`INSERT INTO source(id,name,type,provider,url,reuse_notes,access_method) VALUES($1,'BDTRE Piemonte WFS','public_source','Regione Piemonte','https://igr.piemonte.it/scheda-informativa/dati-servizi','Regione Piemonte BDTRE, CC BY; attribution and transformations retained in dataset metadata','WFS snapshot') ON CONFLICT(id) DO NOTHING`,[d.sourceId]);
  await new PgDatasetRepository(c).register(d);
  const current=await c.query<{dataset_version_id:string;acquired_at:Date}>(`SELECT h.dataset_version_id,v.acquired_at FROM dataset_head h JOIN dataset_version v ON v.id=h.dataset_version_id WHERE h.source_id=$1 AND h.dataset_name=$2`,[d.sourceId,d.datasetName]);
  const previous=current.rows[0]?.dataset_version_id??null;
  if(current.rows[0]&&current.rows[0].acquired_at.getTime()>Date.parse(d.acquiredAt))throw new Error('Older snapshot cannot replace current dataset');
  await c.query('UPDATE dataset_version SET metadata=$2::jsonb WHERE id=$1',[d.id,JSON.stringify(input.metadata)]);
  await c.query(`CREATE TEMP TABLE bdtre_stage(external_id text PRIMARY KEY,layer text,raw jsonb,raw_hash text,reference text,attributes jsonb,street text,number text,suffix text,precision text,errors jsonb,geom geometry(Geometry,4326),action text) ON COMMIT DROP`);
  for(let start=0;start<input.records.length;start+=500){
   await c.query(`INSERT INTO bdtre_stage SELECT r->>'externalId',r->>'layer',r->'raw',r->>'hash',r->>'reference',r->'attributes',r->>'street',r->>'number',r->>'suffix',r->>'precision',r->'errors',CASE WHEN r->'errors'='[]'::jsonb THEN bdtre_geometry(r->'geometry',32632) ELSE NULL END,NULL FROM jsonb_array_elements($1::jsonb) r`,[JSON.stringify(input.records.slice(start,start+500))]);
  }
  await c.query(`UPDATE bdtre_stage SET errors=errors||'"invalid_geometry"'::jsonb WHERE geom IS NULL OR ST_IsEmpty(geom) OR NOT ST_IsValid(geom)`);
  const boundary=await c.query(`SELECT external_id FROM bdtre_stage WHERE layer='comune' AND attributes->>'comune_ist'='001059' AND errors='[]'::jsonb`);
  if(boundary.rows.length!==1)throw new Error('Exactly one valid official Carmagnola boundary required');
  await c.query(`UPDATE bdtre_stage s SET errors=s.errors||'"outside_municipality"'::jsonb FROM bdtre_stage b WHERE b.layer='comune' AND s.layer<>'comune' AND s.errors='[]'::jsonb AND NOT CASE WHEN s.layer='acc_pc' THEN ST_Covers(b.geom,s.geom) ELSE ST_Intersects(b.geom,s.geom) END`);
  await c.query(`UPDATE bdtre_stage SET errors=errors||'"invalid_coordinate_range"'::jsonb WHERE errors='[]'::jsonb AND NOT ST_CoveredBy(geom,ST_MakeEnvelope(-180,-90,180,90,4326))`);
  await c.query(`UPDATE bdtre_stage s SET action=CASE WHEN errors<>'[]'::jsonb THEN 'rejected' WHEN EXISTS(SELECT 1 FROM import_record r WHERE r.dataset_version_id=$1 AND r.external_id=s.external_id AND r.status='imported') THEN 'unchanged' WHEN EXISTS(SELECT 1 FROM import_record r WHERE r.dataset_version_id=$2 AND r.external_id=s.external_id AND r.status='imported' AND r.raw_hash=s.raw_hash) THEN 'unchanged' WHEN EXISTS(SELECT 1 FROM import_record r WHERE r.dataset_version_id=$2 AND r.external_id=s.external_id AND r.status='imported') THEN 'updated' ELSE 'inserted' END`,[d.id,previous]);
  const prefix=d.id+':';
  await c.query(`INSERT INTO building(id,source_id,dataset_version_id,external_id,geometry,attributes) SELECT $1||external_id,$2,$3,external_id,ST_Multi(geom),attributes||jsonb_build_object('sourceSrid',32632,'transformation','ST_Force2D; ST_Transform 32632→4326; ST_Multi','quality','source_declared') FROM bdtre_stage WHERE layer='edifc' AND errors='[]'::jsonb ON CONFLICT(dataset_version_id,external_id) DO NOTHING`,[prefix,d.sourceId,d.id]);
  await c.query(`INSERT INTO territorial_feature(id,municipality_id,feature_type,source_id,dataset_version_id,external_id,geometry,attributes) SELECT $1||external_id,'it:municipality:001059','bdtre:'||layer,$2,$3,external_id,geom,attributes||jsonb_build_object('sourceSrid',32632,'transformation','ST_Force2D; ST_Transform 32632→4326') FROM bdtre_stage WHERE layer IN ('comune','tp_str') AND errors='[]'::jsonb ON CONFLICT(dataset_version_id,external_id) DO NOTHING`,[prefix,d.sourceId,d.id]);
  await c.query(`INSERT INTO address(id,municipality_id,street,street_number,street_number_suffix,source_attributes,dataset_version_id,external_identifiers) SELECT $1||external_id,'it:municipality:001059',street,number,suffix,attributes,$2,jsonb_build_array(jsonb_build_object('namespace','bdtre:acc_pc','value',attributes->>'uuid','datasetVersion',$2::text)) FROM bdtre_stage WHERE layer='acc_pc' AND errors='[]'::jsonb ON CONFLICT(id) DO NOTHING`,[prefix,d.id]);
  await c.query(`INSERT INTO address_point(id,address_id,building_id,street_number,point,precision,source_id,dataset_version_id,external_id,attributes)
   SELECT $1||s.external_id,$1||s.external_id,CASE WHEN s.precision='address' AND links.n=1 THEN links.id ELSE NULL END,s.number,s.geom,s.precision::geo_precision,$2,$3,s.external_id,s.attributes||jsonb_build_object('sourceSrid',32632,'transformation','ST_Force2D; ST_Transform 32632→4326','buildingLinkMethod','unique_point_covered_by_building','buildingCandidates',links.n,'buildingLinkStatus',CASE WHEN s.precision<>'address' THEN 'approximate_access' WHEN links.n=1 THEN 'unique_spatial_candidate' WHEN links.n>1 THEN 'ambiguous' ELSE 'unresolved' END)
   FROM bdtre_stage s CROSS JOIN LATERAL (SELECT count(*) n,min(b.id) id FROM building b WHERE b.dataset_version_id=$3 AND s.precision='address' AND ST_Covers(b.geometry,s.geom)) links
   WHERE s.layer='acc_pc' AND s.errors='[]'::jsonb ON CONFLICT(dataset_version_id,external_id) DO NOTHING`,[prefix,d.sourceId,d.id]);
  await c.query(`INSERT INTO import_record(dataset_version_id,external_id,raw_hash,raw_reference,raw_payload,normalized_payload,status,errors) SELECT $1,external_id,raw_hash,reference,raw,jsonb_build_object('layer',layer,'geometry',ST_AsGeoJSON(geom)::jsonb,'srid',4326,'street',street,'number',number,'suffix',suffix,'precision',precision),CASE WHEN errors='[]'::jsonb THEN 'imported' ELSE 'rejected' END,errors FROM bdtre_stage ON CONFLICT(dataset_version_id,external_id) DO NOTHING`,[d.id]);
  const counts=await c.query(`SELECT layer,count(*)::int read_unique,count(*) FILTER(WHERE errors='[]'::jsonb)::int valid,count(*) FILTER(WHERE action='inserted')::int inserted,count(*) FILTER(WHERE action='updated')::int updated,count(*) FILTER(WHERE action='unchanged')::int unchanged,count(*) FILTER(WHERE action='rejected')::int rejected,count(*) FILTER(WHERE errors ? 'invalid_geometry')::int invalid_geometry,count(*) FILTER(WHERE errors ? 'outside_municipality')::int outside_municipality FROM bdtre_stage GROUP BY layer ORDER BY layer`);
  const quality=await c.query(`SELECT count(*)::int access_points,count(*) FILTER(WHERE point IS NOT NULL)::int with_coordinates,count(*) FILTER(WHERE building_id IS NOT NULL)::int linked_buildings,count(*) FILTER(WHERE precision='unknown')::int approximate,count(*) FILTER(WHERE street_number IS NULL)::int missing_number FROM address_point WHERE dataset_version_id=$1`,[d.id]);
  const absent=await c.query(`SELECT count(*)::int n FROM import_record r WHERE r.dataset_version_id=$1 AND r.status='imported' AND NOT EXISTS(SELECT 1 FROM bdtre_stage s WHERE s.external_id=r.external_id AND s.errors='[]'::jsonb)`,[previous]);
  const extent=await c.query(`SELECT ST_Extent(geom)::text extent4326 FROM bdtre_stage WHERE errors='[]'::jsonb`);
  const rejected=input.records.length-counts.rows.reduce((n,r)=>n+Number(r.valid),0);
  const outOfScope=counts.rows.reduce((n,r)=>n+Number(r.outside_municipality),0);
  const qualityRejected=rejected-outOfScope;
  const report={outOfScope,qualityRejected,datasetVersionId:d.id,sourceRead:input.sourceRead,duplicates:input.duplicates,unique:input.records.length,layers:counts.rows,access:quality.rows[0],absentFromPrevious:absent.rows[0].n,extent4326:extent.rows[0].extent4326,coveragePercent:null,previousVersion:previous};
  await c.query(`UPDATE dataset_version SET import_status=$2 WHERE id=$1`,[d.id,qualityRejected?'failed':'completed']);
  await c.query(`INSERT INTO import_report(dataset_version_id,accepted,rejected,report) VALUES($1,$2,$3,$4::jsonb)`,[d.id,input.records.length-rejected,rejected,JSON.stringify(report)]);
  await c.query(`INSERT INTO dataset_head(source_id,dataset_name,dataset_version_id) VALUES($1,$2,$3) ON CONFLICT(source_id,dataset_name) DO UPDATE SET dataset_version_id=EXCLUDED.dataset_version_id`,[d.sourceId,d.datasetName,d.id]);
  await c.query('COMMIT');return report;
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
