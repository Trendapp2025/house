import type { FeatureCollection, Polygon } from 'geojson';

// Illustrative contiguous polygons, NOT official borough, cadastral or OMI boundaries.
// Coordinates are [longitude, latitude]. Shared edges avoid gaps and overlapping fills.
const core = [
  [7.726,44.854],[7.733,44.847],[7.727,44.839],
  [7.709,44.839],[7.706,44.846],[7.711,44.853],
];
const perimeter = [
  [[7.736,44.880],[7.749,44.881],[7.751,44.874],[7.769,44.872],[7.774,44.866],[7.789,44.860]],
  [[7.789,44.860],[7.793,44.851],[7.782,44.846],[7.785,44.834],[7.771,44.829],[7.765,44.815]],
  [[7.765,44.815],[7.750,44.817],[7.739,44.812],[7.724,44.816],[7.711,44.811],[7.690,44.815]],
  [[7.690,44.815],[7.684,44.822],[7.688,44.830],[7.675,44.837],[7.678,44.844],[7.670,44.850]],
  [[7.670,44.850],[7.677,44.856],[7.674,44.864],[7.685,44.868],[7.683,44.875],[7.691,44.880]],
  [[7.691,44.880],[7.701,44.878],[7.710,44.883],[7.719,44.878],[7.728,44.882],[7.736,44.880]],
];
const sectors = [
  {id:'tuninetti',name:'Tuninetti e settore nord-est',color:'#45a96a'},
  {id:'est',name:'Settore est e campagna',color:'#79bc69'},
  {id:'san-giovanni',name:'San Giovanni e settore sud',color:'#efcd4d'},
  {id:'san-bernardo',name:'San Bernardo e settore ovest',color:'#afd06b'},
  {id:'san-michele',name:'San Michele e Grato',color:'#e3d856'},
  {id:'salsasio',name:'Salsasio e settore nord',color:'#f39944'},
];
export const mockPriceAreas: FeatureCollection<Polygon,{id:string;name:string;color:string;illustrative:boolean}> = {
  type:'FeatureCollection',
  features:[
    {type:'Feature',properties:{id:'centro',name:'Centro di Carmagnola',color:'#e44738',illustrative:true},geometry:{type:'Polygon',coordinates:[[...core,core[0]]]}},
    ...sectors.map((sector,index)=>({
      type:'Feature' as const,
      properties:{...sector,illustrative:true},
      geometry:{type:'Polygon' as const,coordinates:[[core[index],...perimeter[index],core[(index+1)%core.length],core[index]]]},
    })),
  ],
};
