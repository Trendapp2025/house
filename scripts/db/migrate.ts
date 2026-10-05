import 'server-only';
import { readFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Pool } from 'pg';
export async function migrate(pool:Pool){
 const c=await pool.connect();
 try {
  await c.query("SELECT pg_advisory_lock(hashtext('houseid:migrations'))");
  await c.query('CREATE TABLE IF NOT EXISTS schema_migration(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const name of (await readdir(path.resolve('db/migrations'))).filter(n=>n.endsWith('.sql')).sort()){
   const sql=await readFile(path.resolve('db/migrations',name),'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
   const prior=await c.query<{checksum:string}>('SELECT checksum FROM schema_migration WHERE name=$1',[name]);
   if(prior.rows[0]){if(prior.rows[0].checksum!==checksum)throw new Error('Applied migration changed: '+name);continue;}
   await c.query('BEGIN');
   try{await c.query(sql);await c.query('INSERT INTO schema_migration(name,checksum) VALUES($1,$2)',[name,checksum]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}
  }
 }finally{await c.query("SELECT pg_advisory_unlock(hashtext('houseid:migrations'))");c.release();}
}
