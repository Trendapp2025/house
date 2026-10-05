import 'server-only';
import {loadEnvConfig} from '@next/env';
import {writeFile,mkdir} from 'node:fs/promises';
import {getPool} from '../../src/server/db/pool';
import {loadBDTRESnapshot} from '../../src/server/imports/bdtre';
import {persistBDTRE} from '../../src/server/data/bdtre-repository';
loadEnvConfig(process.cwd());
async function main(){
 if(!process.argv[2])throw new Error('Manifest path required');
 const input=await loadBDTRESnapshot(process.argv[2]),pool=getPool();
 try{const report=await persistBDTRE(pool,input);await mkdir('docs/import-reports',{recursive:true});const file=`docs/import-reports/${input.dataset.id}-${Date.now()}.json`;await writeFile(file,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('Report:',file);}finally{await pool.end();}
}
main().catch((e:unknown)=>{console.error('BDTRE import failed',e instanceof Error?e.message.replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]'):'unknown error');process.exitCode=1;});
