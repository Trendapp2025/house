export type Market = 'sale' | 'rent';
export type SearchTab = 'search' | 'value' | 'explore';
export interface Zone {
  id: string; name: string; salePerSqm: number; rentPerSqm: number;
  center: [longitude: number, latitude: number];
  preview: { x: number; y: number };
  geometry: { type: 'Polygon'; coordinates: number[][][] } | null;
}
export interface Property {
  id: string; title: string; address: string; zoneId: string;
  salePrice: number; monthlyRent: number; area: number; rooms: number; bathrooms: number;
  imageIndex: number; imageAlt: string; sponsored: boolean;
}
export interface PropertyQuery { market: Market; query: string }
export interface PropertyRepository {
  getZones(): Promise<Zone[]>;
  findProperties(query: PropertyQuery): Promise<Property[]>;
}
