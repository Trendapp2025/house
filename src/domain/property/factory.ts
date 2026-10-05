import type { Property } from './types';
import { unknownProvenance } from '../provenance/types';
export function createUnknownProperty(propertyId: string, addressId: string, dataKind: Property['dataKind']): Property {
  const amenity = () => ({ presence: null, surfaceSqm: null, count: null });
  return { propertyId, addressId, dataKind, identityStatus: 'provisional', propertyType: null,
    geoLocation: { latitude: null, longitude: null, precision: 'unknown', method: 'unknown', provenance: unknownProvenance() },
    surface: { commercialSurfaceSqm: null, usableSurfaceSqm: null, cadastralSurfaceSqm: null, heatedSurfaceSqm: null, unspecifiedSurfaceSqm: null },
    composition: { rooms: null, bedrooms: null, bathrooms: null },
    floor: { floorNumber: null, isGroundFloor: null, isBasement: null, isTopFloor: null, isAttic: null, isMultiLevel: null },
    building: { totalFloors: null, elevator: null, yearBuilt: null },
    outdoorSpaces: { balcony: amenity(), terrace: amenity(), privateGarden: amenity() },
    accessories: { garage: amenity(), parkingSpace: amenity(), cellar: amenity(), attic: amenity() },
    condition: { state: null, renovationYear: null, finishes: null },
    energy: { energyClass: null, epgl: null, epglUnit: null, epglKind: null, heatingType: null, heatingFuel: null, airConditioning: null },
    systems: { heatDistribution: null }, orientation: { mainDirection: null, freeSides: null } };
}
