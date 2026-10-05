import type { Property, PropertyObservation } from '../src/domain/property/types';
import { unknownProvenance } from '../src/domain/provenance/types';
// Compile-time contracts included by the existing strict tsconfig, not executed in the UI.
declare const property: Property;
// @ts-expect-error Asking price is not a physical-property feature.
property.askingPrice;
// @ts-expect-error Observation value must match the field (not a boolean for an energy class).
const wrong: PropertyObservation = {observationId:'x',field:'energy.energyClass',value:false,rawValue:null,provenance:unknownProvenance()};
void wrong;
