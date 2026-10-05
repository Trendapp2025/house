import {createHash} from 'node:crypto';
import {z} from 'zod';
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export const layers=['comune','acc_pc','edifc','tp_str'] as const;
export type Layer=typeof layers[number];
const feature=z.object({type:z.literal('Feature'),properties:z.record(z.string(),z.unknown()),geometry:z.object({type:z.enum(['Point','Polygon','MultiPolygon','LineString','MultiLineString']),coordinates:z.unknown()})});
export const textValue=(v:unknown):string|null=>typeof v==='string'&&v.trim()?v.trim().replace(/\s+/g,' '):null;
export interface BDTRERecord {externalId:string;layer:Layer;raw:unknown;hash:string;geometry:unknown;attributes:Record<string,unknown>;street:string|null;number:string|null;suffix:string|null;precision:'address'|'unknown';errors:string[];reference:string}
function coordinatesValid(v:unknown):boolean {
 if(!Array.isArray(v)||!v.length)return false;
 if(typeof v[0]==='number')return v.length>=2&&v.every(n=>typeof n==='number'&&Number.isFinite(n));
 return v.every(coordinatesValid);
}
export function parseFeature(raw:unknown,layer:Layer,reference:string,index:number):BDTRERecord {
 const result=feature.safeParse(raw),hash=digest(JSON.stringify(raw));
 const base:BDTRERecord={externalId:`${layer}:invalid:${digest(reference).slice(0,12)}:${index}`,layer,raw,hash,geometry:null,attributes:{},street:null,number:null,suffix:null,precision:'unknown',errors:[],reference};
 if(!result.success)return {...base,errors:['invalid_feature']};
 const {properties:p,geometry:g}=result.data,uuid=textValue(p.uuid);
 const allowed=layer==='acc_pc'?['Point']:layer==='tp_str'?['LineString','MultiLineString']:['Polygon','MultiPolygon'];
 const errors:string[]=[];if(!uuid)errors.push('missing_uuid');if(!allowed.includes(g.type)||!coordinatesValid(g.coordinates))errors.push('invalid_geometry');
 return {...base,externalId:uuid?`${layer}:${uuid}`:base.externalId,geometry:g,attributes:p,street:textValue(p.tp_str_nom),number:textValue(p.civico_num),suffix:textValue(p.civico_sub),precision:p.acc_pc_geo==='puntuale'?'address':'unknown',errors};
}
export function deduplicate(records:BDTRERecord[]){
 const byId=new Map<string,BDTRERecord>();let duplicates=0;
 for(const r of records){const old=byId.get(r.externalId);if(!old)byId.set(r.externalId,r);else{duplicates++;if(old.hash!==r.hash)old.errors=[...new Set([...old.errors,'conflicting_duplicate'])];}}
 return {records:[...byId.values()],duplicates};
}
export function parseCollection(raw:unknown,layer:Layer,reference:string):BDTRERecord[]{
 const c=z.object({type:z.literal('FeatureCollection'),crs:z.object({properties:z.object({name:z.literal('urn:ogc:def:crs:EPSG::32632')})}),features:z.array(z.unknown())}).parse(raw);
 return c.features.map((f,i)=>parseFeature(f,layer,reference,i));
}
