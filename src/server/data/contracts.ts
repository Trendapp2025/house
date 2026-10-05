import type { Property, Listing, PropertyObservation } from '../../domain/property/types';
import type { DatasetInput, MarketInput, MunicipalityInput, TerritorialInput } from './validation';
export interface PropertyRepository {
 find(id:string):Promise<Property|null>;
 insert(property:Property):Promise<void>;
 observe(propertyId:string,observation:PropertyObservation,unit:string|null):Promise<void>;
}
export interface ListingRepository {
 find(id:string):Promise<Listing|null>;
 save(listing:Listing):Promise<void>;
 history(id:string):Promise<unknown[]>;
}
export interface MarketRepository { append(input:MarketInput):Promise<void>; byDataset(id:string):Promise<MarketInput[]> }
export interface TerritorialRepository {
 append(input:TerritorialInput):Promise<void>;
 link(input:{id:string;propertyId:string;featureId:string;method:'point_inside_polygon'|'nearest'|'address_match'|'building_intersection';distanceM:number|null;notes:string}):Promise<void>;
}
export interface DatasetRepository {
 register(input:DatasetInput):Promise<void>;
 stage(datasetId:string,externalId:string,raw:unknown,hash:string,normalized:MunicipalityInput|null,errors:string[]):Promise<void>;
 importMunicipality(datasetId:string,input:MunicipalityInput):Promise<void>;
 finish(datasetId:string,accepted:number,rejected:number):Promise<void>;
}
export interface UnitOfWork { run<T>(work:(datasets:DatasetRepository)=>Promise<T>):Promise<T> }
