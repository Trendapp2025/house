import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {finalizeBoundary} from './bdtre-boundary.mjs';
const root='https://geoservices.csi.it/ms/wfs/bdtre/rp-01/bdtrewfs/bdtre_';
const hash=s=>createHash('sha256').update(s).digest('hex');
const acquiredAt=new Date().toISOString();
const dir=path.join('data/raw/bdtre',acquiredAt.replaceAll(':','-'));
await fs.mkdir(dir,{recursive:true});
const files=[];
async function get(service,layer,params,file){
 const url=new URL(root+service);url.search=new URLSearchParams({service:'WFS',version:'1.0.0',request:'GetFeature',typeName:layer,outputFormat:'geojson',srsName:'EPSG:32632',...params}).toString();
 const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);
 const raw=await r.text(),data=JSON.parse(raw);if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Not a feature collection');
 await fs.writeFile(path.join(dir,file),raw);files.push({file,url,checksum:hash(raw),count:data.features.length,layer});return data;
}
const boundary=await get('amm','comune',{filter:'<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>comune_nom</ogc:PropertyName><ogc:Literal>Carmagnola</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>'},'comune.json');
if(boundary.features.length!==1||boundary.features[0].properties.comune_ist!=='001059')throw new Error('Municipality mismatch');
const layers=[];
for(const [service,layer] of [['viab','acc_pc'],['imm','edifc'],['viab','tp_str']]){
 const selected=[];let pages=0;
 async function tile(bbox,depth=0){
  const file=`${layer}-${pages++}.json`,data=await get(service,layer,{bbox:bbox.join(',')},file);
  if(data.features.length>=1000){if(depth>=10)throw new Error('Unresolved WFS limit');const [x,y,X,Y]=bbox,mx=(x+X)/2,my=(y+Y)/2;for(const b of [[x,y,mx,my],[mx,y,X,my],[x,my,mx,Y],[mx,my,X,Y]])await tile(b,depth+1);}
  else selected.push(file);
 }
 await tile(boundary.bbox);layers.push({layer,files:selected});console.log(layer,'pages',pages,'complete leaf pages',selected.length);
}
const manifest={source:'Regione Piemonte BDTRE WFS',catalogueUrl:'https://igr.piemonte.it/scheda-informativa/dati-servizi',acquiredAt,version:`snapshot-${acquiredAt}`,sourceSrid:32632,municipalityIstat:'001059',boundaryFile:'comune.json',layers,files};
await finalizeBoundary(dir,manifest);
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Manifest:',path.join(dir,'manifest.json'));
