import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
export async function finalizeBoundary(dir,manifest){
 const url=new URL(manifest.files.find(f=>f.file==='comune.json').url);url.searchParams.set('outputFormat','GML2');
 const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error('Boundary GML download failed');
 const raw=await response.text();await fs.writeFile(path.join(dir,'comune.gml'),raw);
 const r=spawnSync(process.env.PYTHON||'python',['scripts/db/convert-bdtre-boundary.py',path.join(dir,'comune.gml'),path.join(dir,'comune-normalized.json')],{stdio:'inherit'});if(r.status!==0)throw new Error('GML conversion failed');
 const normalized=await fs.readFile(path.join(dir,'comune-normalized.json'),'utf8');
 manifest.boundaryFile='comune-normalized.json';
 manifest.boundarySource={file:'comune.gml',checksum:createHash('sha256').update(raw).digest('hex'),url:url.toString()};
 manifest.boundaryConversion='GML2 to GeoJSON preserving separate polygons and explicit exterior/interior rings; no ST_MakeValid';
 manifest.files=manifest.files.filter(f=>f.file!=='comune-normalized.json');
 manifest.files.push({file:'comune-normalized.json',url:url.toString(),checksum:createHash('sha256').update(normalized).digest('hex'),count:1,layer:'comune'});
 return manifest;
}
