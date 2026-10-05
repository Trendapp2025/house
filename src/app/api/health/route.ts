import { getPool } from '@/server/db/pool';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try {
  await getPool().query('SELECT PostGIS_Version()');
  return Response.json({status:'ok',database:'reachable',postgis:'available'},{headers:{'Cache-Control':'no-store'}});
 } catch {
  return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
