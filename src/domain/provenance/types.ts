/** Origin and verification are independent: a real source is not a verification. */
export type SourceType = 'listing_declared' | 'user_provided' | 'public_source' | 'external_provider' | 'houseid_calculated' | 'houseid_estimated' | 'demo' | 'unknown';
export type VerificationStatus = 'unverified' | 'declared' | 'verified' | 'conflicting' | 'not_applicable';
export interface Provenance {
  sourceType: SourceType;
  sourceId: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  acquiredAt: string | null;
  verificationStatus: VerificationStatus;
  notes: string[];
  datasetVersion: string | null;
  /** Observation IDs used by a derivation; never a replacement for their origins. */
  derivedFrom: string[];
}
export interface Observation<Field extends string, Value> {
  observationId: string;
  field: Field;
  value: Value;
  provenance: Provenance;
  /** Preserve ambiguous legacy input without treating it as a normalized fact. */
  rawValue: unknown;
}
export function unknownProvenance(notes: string[] = []): Provenance {
  return { sourceType: 'unknown', sourceId: null, sourceName: null, sourceUrl: null,
    observedAt: null, acquiredAt: null, verificationStatus: 'unverified', notes,
    datasetVersion: null, derivedFrom: [] };
}
