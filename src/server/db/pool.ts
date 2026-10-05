import 'server-only';
import { Pool } from 'pg';
const globalPool=globalThis as typeof globalThis & { houseidPool?:Pool };
export function getPool():Pool {
 if(!process.env.DATABASE_URL)throw new Error('Database not configured');
 if(!globalPool.houseidPool)globalPool.houseidPool=new Pool({connectionString:process.env.DATABASE_URL,options:"-c search_path=houseid,extensions,public",max:5,connectionTimeoutMillis:3000,idleTimeoutMillis:30000,statement_timeout:10000});
 return globalPool.houseidPool;
}
