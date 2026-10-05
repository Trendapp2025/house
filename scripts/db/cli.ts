import 'server-only';
import { loadEnvConfig } from '@next/env';
import { readFile } from 'node:fs/promises';
import { getPool } from '../../src/server/db/pool';
import { migrate } from './migrate';
import { PgUnitOfWork } from '../../src/server/data/repositories';
import { hashRaw,importMunicipalities } from '../../src/server/imports/municipalities';
loadEnvConfig(process.cwd());
async function main(){
 const pool=getPool();
 try{
  const command=process.argv[2];
  if(command==='migrate'){await pool.query('CREATE SCHEMA IF NOT EXISTS houseid');await migrate(pool);console.log('Migrations applied.');}
  else if(command==='seed'){
   await pool.query(`INSERT INTO source(id,name,type,provider,url,reuse_notes,access_method) VALUES('piemonte-administration','Regione Piemonte — codici comuni','public_source','Regione Piemonte','https://www.regione.piemonte.it/web/media/55140/download','Identificativi amministrativi verificati; verificare licenza prima di import estesi','manual_verified_extract') ON CONFLICT(id) DO NOTHING`);
   const raw:unknown=JSON.parse(await readFile('db/seeds/carmagnola.json','utf8'));
   console.log(await importMunicipalities(new PgUnitOfWork(pool),{id:'carmagnola-admin-v1',sourceId:'piemonte-administration',datasetName:'municipality-administrative-seed',version:'v1',acquiredAt:new Date().toISOString(),checksum:hashRaw(raw),validFrom:null,validTo:null},raw));
  }else throw new Error('Use migrate or seed');
 }finally{await pool.end();}
}
main().catch(()=>{console.error('Database operation failed. Check configuration, connectivity and migration compatibility. No credentials logged.');process.exitCode=1;});
