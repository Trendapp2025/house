import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
// Same in-memory TypeScript transpilation as the finance tests; no dependency or emitted files.
const urls=new Map();
function moduleUrl(file){
 file=path.resolve(file);if(urls.has(file))return urls.get(file);
 let js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 js=js.replace(/from\s+(['"])([^'"]+)\1/g,(full,quote,spec)=>{
   if(!spec.startsWith('.')&&!spec.startsWith('@/'))throw new Error('Unexpected runtime import: '+spec);
   const dependency=spec.startsWith('@/')?path.resolve('src',spec.slice(2)):path.resolve(path.dirname(file),spec);
   return 'from '+JSON.stringify(moduleUrl(dependency+'.ts'));
 });
 const url='data:text/javascript;base64,'+Buffer.from(js).toString('base64');urls.set(file,url);return url;
}
const {zoneSaleListings}=await import(moduleUrl('src/data/zone-listings.ts'));
const template=zoneSaleListings.find(l=>l.status==='demo');
const original={...template};
Object.assign(template,{heating:'POISON_OTHER_HOUSE',contact:{name:'Wrong agent',phone:'000',email:null},floorPlanUrl:'wrong',energyClass:'A4',energyConsumption:999,yearBuilt:2020,lift:true,condominiumMonthly:999,availability:'wrong'});
const {catalogue}=await import(moduleUrl('src/data/catalogue.ts'));
Object.assign(template,original);
const {adaptLegacyListing,adaptPortalListing,adaptCatalogue}=await import(moduleUrl('src/domain/property/adapters/legacy-catalogue.ts'));
const {assessEstimateEvidence,canUseForPreciseAssociation}=await import(moduleUrl('src/domain/property/evidence-policy.ts'));
const {createUnknownProperty}=await import(moduleUrl('src/domain/property/factory.ts'));
const {unknownProvenance}=await import(moduleUrl('src/domain/provenance/types.ts'));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const real=catalogue.find(l=>l.status==='real');
const demo=catalogue.find(l=>l.status==='demo');
const normalized=adaptPortalListing(real);
test('catalogue preserves 15 IDs, 11 sales, 4 rentals, one real listing',()=>{assert.equal(catalogue.length,15);assert.equal(new Set(catalogue.map(l=>l.id)).size,15);assert.equal(catalogue.filter(l=>l.market==='sale').length,11);assert.equal(catalogue.filter(l=>l.status==='real').length,1);assert.equal(real.price,180000);assert.equal(real.areaSqm,95);});
test('sponsored records do not inherit poisoned template fields',()=>{for(const l of catalogue.filter(l=>l.sponsored)){for(const key of ['heating','contact','floorPlanUrl','energyClass','energyConsumption','yearBuilt','lift','condominiumMonthly','availability'])assert.equal(l[key],null,key);assert.deepEqual(l.features,[]);}});
test('unknown is not false; zero is not null',()=>{const a=adaptLegacyListing({...real,lift:null,condominiumMonthly:0,floor:'0° piano'});assert.equal(a.property.building.elevator,null);assert.equal(a.listing.condominiumMonthly,0);assert.equal(a.property.floor.floorNumber,0);assert.equal(a.property.floor.isGroundFloor,true);assert.equal(adaptLegacyListing({...real,lift:false}).property.building.elevator,false);});
test('missing terrace is unknown; present terrace does not invent dimensions',()=>{assert.equal(adaptLegacyListing({...real,features:[]}).property.outdoorSpaces.terrace.presence,null);const terrace=normalized.property.outdoorSpaces.terrace;assert.equal(terrace.presence,true);assert.equal(terrace.surfaceSqm,null);assert.equal(terrace.count,null);});
test('all catalogue coordinates stay zone-level and cannot drive precise joins',()=>{for(const r of adaptCatalogue(catalogue)){assert.equal(r.property.geoLocation.precision,'zone');assert.equal(canUseForPreciseAssociation(r),false);}});
test('every mock is ineligible and its observations retain demo origin',()=>{for(const r of adaptCatalogue(catalogue.filter(l=>l.status==='demo'))){assert.equal(assessEstimateEvidence(r).eligibleForEstimateEvidence,false);assert.ok(assessEstimateEvidence(r).reasons.includes('demo_data'));assert.ok(r.propertyObservations.every(o=>o.provenance.sourceType==='demo'));}});
test('real never becomes verified automatically; even manual verified flag cannot unlock Phase 1',()=>{assert.equal(normalized.listing.source.verificationStatus,'declared');assert.equal(assessEstimateEvidence(normalized).eligibleForEstimateEvidence,false);assert.ok(normalized.propertyObservations.every(o=>o.provenance.verificationStatus!=='verified'));const r=structuredClone(normalized);r.listing.source.verificationStatus='verified';assert.equal(assessEstimateEvidence(r).eligibleForEstimateEvidence,false);});
test('commercial, usable, cadastral, heated and untyped surfaces remain separate',()=>{assert.equal(normalized.property.surface.unspecifiedSurfaceSqm,95);for(const field of ['commercialSurfaceSqm','usableSurfaceSqm','cadastralSurfaceSqm','heatedSurfaceSqm'])assert.equal(normalized.property.surface[field],null);const p=createUnknownProperty('p','a','non_demo');p.surface.commercialSurfaceSqm=95;p.surface.heatedSurfaceSqm=61.1;assert.notEqual(p.surface.commercialSurfaceSqm,p.surface.heatedSurfaceSqm);});
test('asking price belongs only to Listing and cannot change Property or its observations',()=>{const other=adaptPortalListing({...real,price:1});assert.equal(other.listing.askingPrice,1);assert.deepEqual(other.property,normalized.property);assert.deepEqual(other.propertyObservations,normalized.propertyObservations);assert.equal('askingPrice' in normalized.property,false);assert.notEqual(normalized.property.propertyId,normalized.listing.listingId);});
test('ambiguous floors, type and condition stay unknown; raw text survives',()=>{const r=adaptLegacyListing({...real,floor:'Da verificare',propertyType:'Villetta',condition:'Ottimo potenziale'});assert.equal(r.property.floor.floorNumber,null);assert.equal(r.property.propertyType,null);assert.equal(r.property.condition.state,null);assert.equal(r.propertyObservations.find(o=>o.field==='condition.state').rawValue,'Ottimo potenziale');});
test('two levels do not invent floor number or top-floor status',()=>{const r=adaptLegacyListing({...real,floor:'Su due livelli'});assert.equal(r.property.floor.isMultiLevel,true);assert.equal(r.property.floor.floorNumber,null);assert.equal(r.property.floor.isTopFloor,null);});
test('address splits explicit street and number without fabricating postal/ISTAT identifiers',()=>{assert.equal(normalized.address.street,'Via Giacomo Piscina');assert.equal(normalized.address.streetNumber,'41');assert.equal(normalized.address.municipality,'Carmagnola');assert.equal(normalized.address.province,'Torino');assert.equal(normalized.address.region,'Piemonte');assert.equal(normalized.address.countryCode,'IT');assert.equal(normalized.address.postalCode,null);assert.equal(normalized.address.municipalityIstatCode,null);const r=adaptLegacyListing({...real,location:{...real.location,label:'Indirizzo non disponibile'}});assert.equal(r.address.municipality,null);});
test('sale and rental versions of same sponsored fixture share provisional Property ID only',()=>{const sale=adaptPortalListing(catalogue.find(l=>l.id==='sale-villa-poirino'));const rent=adaptPortalListing(catalogue.find(l=>l.id==='rent-villa-poirino'));assert.equal(sale.property.propertyId,rent.property.propertyId);assert.notEqual(sale.listing.listingId,rent.listing.listingId);assert.equal(rent.listing.rentPeriod,'month');assert.equal(sale.listing.rentPeriod,null);assert.ok(assessEstimateEvidence(rent).reasons.includes('outside_sale_scope'));});
test('energy text is not silently converted into verified EPgl or heated surface',()=>{assert.equal(normalized.property.energy.energyClass,'G');assert.equal(normalized.property.energy.epgl,null);assert.equal(normalized.propertyObservations.find(o=>o.field==='energy.energyClass').provenance.sourceType,'unknown');assert.ok(normalized.legacy.energyLabel.includes('359,52'));});
test('multiple observations may coexist without a silent conflict resolver',()=>{const r=structuredClone(normalized);r.propertyObservations.push({observationId:'second-source',field:'energy.energyClass',value:'F',rawValue:'F',provenance:{...unknownProvenance(),sourceType:'public_source',verificationStatus:'conflicting'}});assert.equal(r.propertyObservations.filter(o=>o.field==='energy.energyClass').length,2);assert.equal(r.property.energy.energyClass,'G');assert.equal(assessEstimateEvidence(r).eligibleForEstimateEvidence,false);});
test('source dates are not promoted to acquisition/verification dates',()=>{assert.equal(normalized.listing.updatedAt,'2026-07-30');assert.equal(normalized.listing.source.acquiredAt,null);assert.equal(normalized.listing.source.observedAt,null);assert.equal(normalized.listing.publishedAt,null);assert.equal(normalized.listing.status,'unknown');assert.equal(adaptLegacyListing({...real,updatedAt:'31/02/2026'}).listing.updatedAt,null);});
test('invalid coordinates are rejected rather than clamped or made exact',()=>{const r=adaptLegacyListing({...real,location:{...real.location,coordinates:[181,91]}});assert.equal(r.property.geoLocation.latitude,null);assert.equal(r.property.geoLocation.precision,'unknown');assert.equal(canUseForPreciseAssociation(r),false);});
test('adapter never mutates source records',()=>{const before=structuredClone(real);adaptPortalListing(real);assert.deepEqual(real,before);const changed=adaptPortalListing(real);changed.listing.photos[0].alt='changed';changed.legacy.featureTexts.push('changed');assert.deepEqual(real,before);});
console.log(`${passed} domain tests passed.`);
