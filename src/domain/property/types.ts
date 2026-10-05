import type { Observation, Provenance } from '../provenance/types';
export type PropertyType = 'apartment' | 'detached_house' | 'semi_detached_house' | 'terraced_house' | 'villa' | 'farmhouse' | 'other_residential';
export type Condition = 'to_renovate' | 'needs_work' | 'good' | 'renovated' | 'new';
export type EnergyClass = 'A4' | 'A3' | 'A2' | 'A1' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type DataKind = 'demo' | 'non_demo';
export interface ExternalIdentifier { namespace: string; value: string; datasetVersion: string | null }
export interface Address {
  addressId: string;
  municipality: string | null;
  municipalityIstatCode: string | null;
  street: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  province: string | null;
  provinceCode: string | null;
  region: string | null;
  countryCode: string | null;
  externalIdentifiers: ExternalIdentifier[];
}
export type GeoPrecision = 'address' | 'building' | 'street' | 'zone' | 'municipality' | 'unknown';
export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  precision: GeoPrecision;
  method: 'source_coordinates' | 'geocoded' | 'user_pin' | 'surveyed' | 'unknown';
  provenance: Provenance;
}
export interface Surface {
  commercialSurfaceSqm: number | null;
  usableSurfaceSqm: number | null;
  cadastralSurfaceSqm: number | null;
  heatedSurfaceSqm: number | null;
  /** Legacy area with no certified semantic type. Never an automatic fallback. */
  unspecifiedSurfaceSqm: number | null;
}
export interface Amenity { presence: boolean | null; surfaceSqm: number | null; count: number | null }
export interface Property {
  propertyId: string;
  dataKind: DataKind;
  identityStatus: 'provisional' | 'resolved';
  propertyType: PropertyType | null;
  addressId: string;
  geoLocation: GeoLocation;
  surface: Surface;
  composition: { rooms: number | null; bedrooms: number | null; bathrooms: number | null };
  floor: { floorNumber: number | null; isGroundFloor: boolean | null; isBasement: boolean | null; isTopFloor: boolean | null; isAttic: boolean | null; isMultiLevel: boolean | null };
  building: { totalFloors: number | null; elevator: boolean | null; yearBuilt: number | null };
  outdoorSpaces: { balcony: Amenity; terrace: Amenity; privateGarden: Amenity };
  accessories: { garage: Amenity; parkingSpace: Amenity; cellar: Amenity; attic: Amenity };
  condition: { state: Condition | null; renovationYear: number | null; finishes: 'basic' | 'standard' | 'high_quality' | null };
  energy: { energyClass: EnergyClass | null; epgl: number | null; epglUnit: 'kWh/m²/year' | null; epglKind: 'non_renewable' | 'total' | null; heatingType: 'autonomous' | 'centralized' | 'district' | null; heatingFuel: 'natural_gas' | 'electricity' | 'oil' | 'biomass' | 'other' | null; airConditioning: boolean | null };
  systems: { heatDistribution: 'radiators' | 'underfloor' | 'air' | null };
  orientation: { mainDirection: Direction | null; freeSides: number | null };
}
export interface Listing {
  listingId: string;
  propertyId: string;
  dataKind: DataKind;
  market: 'sale' | 'rent';
  askingPrice: number | null;
  currency: 'EUR';
  rentPeriod: 'month' | null;
  title: string;
  description: string;
  sellerType: 'agency' | 'private' | null;
  agency: { name: string; phone: string | null; email: string | null } | null;
  source: Provenance;
  externalListingId: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  /** Source's real/demo flag says nothing about commercial availability. */
  status: 'active' | 'withdrawn' | 'sold' | 'rented' | 'unknown';
  condominiumMonthly: number | null;
  availabilityText: string | null;
  contact: { name: string; phone: string | null; email: string | null } | null;
  photos: { src: string; alt: string }[];
  floorPlanUrl: string | null;
}
type Fields<T, Prefix extends string> = { [K in keyof T & string as `${Prefix}.${K}`]: T[K] };
export type PropertyFieldValues = { propertyType: Property['propertyType'] }
 & Fields<Surface, 'surface'> & Fields<Property['composition'], 'composition'>
 & Fields<Property['floor'], 'floor'> & Fields<Property['building'], 'building'>
 & Fields<Property['condition'], 'condition'> & Fields<Property['energy'], 'energy'>
 & Fields<Property['systems'], 'systems'> & Fields<Property['orientation'], 'orientation'>
 & Fields<Amenity, 'outdoorSpaces.balcony'> & Fields<Amenity, 'outdoorSpaces.terrace'> & Fields<Amenity, 'outdoorSpaces.privateGarden'>
 & Fields<Amenity, 'accessories.garage'> & Fields<Amenity, 'accessories.parkingSpace'> & Fields<Amenity, 'accessories.cellar'> & Fields<Amenity, 'accessories.attic'>
 & Fields<Omit<Address, 'addressId' | 'externalIdentifiers'>, 'address'>
 & Fields<Pick<GeoLocation, 'latitude' | 'longitude' | 'precision' | 'method'>, 'geoLocation'>;
/** Discriminated union preserves field/value correlation at compile time. */
export type PropertyObservation = { [K in keyof PropertyFieldValues]: Observation<K, PropertyFieldValues[K]> }[keyof PropertyFieldValues];
export type ListingObservation = { [K in keyof Listing]: Observation<K, Listing[K]> }[keyof Listing];
export interface NormalizedRecord {
  property: Property;
  address: Address;
  listing: Listing;
  propertyObservations: PropertyObservation[];
  listingObservations: ListingObservation[];
  /** Lossless references only, not normalized features or market evidence. */
  legacy: { listingId: string; areaId: string; zoneName: string; featureTexts: string[]; energyLabel: string | null; updatedAtText: string | null };
}
