import { createHash } from 'node:crypto';
import type { UnitOfWork } from '../data/contracts';
import { datasetSchema,municipalitySchema,type DatasetInput } from '../data/validation';
export const hashRaw=(raw:unknown)=>createHash('sha256').update(JSON.stringify(raw)).digest('hex');
/** An admin/offline entry point. Input remains unknown until runtime validation. */
export async function importMunicipalities(uow:UnitOfWork,dataset:DatasetInput,raw:unknown){
 const d=datasetSchema.parse(dataset);
 if(!Array.isArray(raw)||raw.length>10000)throw new Error('Expected a bounded array of administrative records');
 if(hashRaw(raw)!==d.checksum)throw new Error('Dataset checksum mismatch');
 return uow.run(async repo=>{
  await repo.register(d);
  let accepted=0,rejected=0;const seen=new Set<string>();
  for(const [index,record] of raw.entries()){
   const parsed=municipalitySchema.safeParse(record);
   const duplicate=parsed.success&&seen.has(parsed.data.istatCode);
   if(parsed.success)seen.add(parsed.data.istatCode);
   const normalized=parsed.success&&!duplicate?parsed.data:null;
   const errors=duplicate?['Duplicate source record ID']:parsed.success?[]:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`);
   // Invalid/duplicate rows retain their own staging key and cannot overwrite a valid source row.
   const externalId=normalized?.istatCode??`rejected-row:${index}`;
   await repo.stage(d.id,externalId,record,hashRaw(record),normalized,errors);
   if(normalized){await repo.importMunicipality(d.id,normalized);accepted++;}else rejected++;
  }
  await repo.finish(d.id,accepted,rejected);
  return {datasetVersionId:d.id,accepted,rejected};
 });
}
