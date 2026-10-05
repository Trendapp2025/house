import type { NormalizedRecord } from './types';
export interface EvidenceEligibility {
  eligibleForEstimateEvidence: false;
  reasons: string[];
}
/** Phase 1 is deny-by-default, not an evidence certification mechanism. */
export function assessEstimateEvidence(record: NormalizedRecord): EvidenceEligibility {
  const reasons=['evidence_review_not_implemented'];
  if(record.property.dataKind==='demo'||record.listing.dataKind==='demo'||record.listing.source.sourceType==='demo'||record.propertyObservations.some(o=>o.provenance.sourceType==='demo')||record.listingObservations.some(o=>o.provenance.sourceType==='demo'))reasons.push('demo_data');
  if(record.listing.market!=='sale')reasons.push('outside_sale_scope');
  if(record.address.municipality!=='Carmagnola'||record.address.provinceCode!=='TO')reasons.push('outside_or_unknown_location_scope');
  if(record.property.propertyType===null)reasons.push('unknown_property_type');
  if(record.listing.source.verificationStatus!=='verified')reasons.push('unverified_source');
  if(record.propertyObservations.some(o=>o.provenance.sourceType==='unknown'||o.provenance.verificationStatus==='conflicting'))reasons.push('unknown_or_conflicting_provenance');
  if(!canUseForPreciseAssociation(record))reasons.push('location_not_verified_for_precise_association');
  return {eligibleForEstimateEvidence:false,reasons};
}
/** Only a necessary geographic precondition, never proof of APE/building identity. */
export function canUseForPreciseAssociation(record: NormalizedRecord): boolean {
  const {property,listing}=record;const geo=property.geoLocation;
  return property.dataKind!=='demo'&&listing.dataKind!=='demo'
    &&(geo.precision==='address'||geo.precision==='building')
    &&geo.latitude!==null&&Number.isFinite(geo.latitude)&&Math.abs(geo.latitude)<=90
    &&geo.longitude!==null&&Number.isFinite(geo.longitude)&&Math.abs(geo.longitude)<=180
    &&geo.provenance.verificationStatus==='verified'
    &&['public_source','external_provider','user_provided'].includes(geo.provenance.sourceType);
}
