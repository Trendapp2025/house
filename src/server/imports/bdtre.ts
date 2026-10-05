import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {deduplicate,digest,parseCollection,layers,type BDTRERecord} from './bdtre-parser';
import type {BDTREImport} from '../data/bdtre-repository';
const manifestSchema=z.object({source:z.string(),catalogueUrl:z.string().url(),acquiredAt:z.string().datetime(),version:z.string(),sourceSrid:z.literal(32632),municipalityIstat:z.literal('001059'),boundaryFile:z.string(),boundarySource:z.object({file:z.string(),checksum:z.string(),url:z.string().url()}),boundaryConversion:z.string(),layers:z.array(z.object({layer:z.enum(layers),files:z.array(z.string())})),files:z.array(z.object({file:z.string(),url:z.string().url(),checksum:z.string().regex(/^[a-f0-9]{64}$/),count:z.number().int().nonnegative(),layer:z.enum(layers)}))});
export async function loadBDTRESnapshot(manifestPath:string):Promise<BDTREImport>{
 const rawManifest=await readFile(manifestPath,'utf8'),m=manifestSchema.parse(JSON.parse(rawManifest)),dir=path.dirname(path.resolve(manifestPath));
 const gmlPath=path.resolve(dir,m.boundarySource.file);if(path.dirname(gmlPath)!==dir||digest(await readFile(gmlPath,'utf8'))!==m.boundarySource.checksum)throw new Error('Boundary source checksum mismatch');
 const records:BDTRERecord[]=[];
 const selected=[{layer:'comune' as const,files:[m.boundaryFile]},...m.layers];
 for(const item of selected)for(const file of item.files){
  const resolved=path.resolve(dir,file);if(path.dirname(resolved)!==dir)throw new Error('Invalid snapshot path');
  const metadata=m.files.find(f=>f.file===file&&f.layer===item.layer);if(!metadata)throw new Error('Missing file provenance');
  const raw=await readFile(resolved,'utf8');if(digest(raw)!==metadata.checksum)throw new Error('Snapshot checksum mismatch');
  const parsed=parseCollection(JSON.parse(raw),item.layer,`${file}#sha256=${metadata.checksum}`);if(parsed.length!==metadata.count)throw new Error('Count mismatch');
  records.push(...parsed);
 }
 const unique=deduplicate(records),checksum=digest(rawManifest);
 return {dataset:{id:`bdtre-carmagnola-${checksum.slice(0,20)}`,sourceId:'regione-piemonte-bdtre',datasetName:'bdtre-carmagnola-nc-wfs',version:m.version,acquiredAt:m.acquiredAt,checksum,validFrom:null,validTo:null},records:unique.records,sourceRead:records.length,duplicates:unique.duplicates,metadata:{manifest:m,manifestPath,sourceSrid:32632,targetSrid:4326,transformation:'ST_Force2D + ST_Transform; building polygons promoted to MultiPolygon without repair',versionSemantics:'acquisition snapshot; not an asserted official edition',attribution:'Regione Piemonte — BDTRE, accessed through CSI Piemonte WFS',licenseReference:'https://www.regione.piemonte.it/web/media/21742/download',license:'CC BY 4.0 per regional publication policy; source attributes retained',scope:'official comune 001059 polygon; points covered, polygon/line intersections retained without clipping',lifecycle:'append-only snapshots; dataset_head selects current; missing previous records remain retained in superseded snapshots'}};
}
