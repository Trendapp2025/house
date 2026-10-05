import type { Property, Zone } from '@/types/real-estate';
// Mock prices; place coordinates from OSM place nodes, retrieved 2026-09-25.
// These points are not OMI polygons or official neighborhood boundaries.
export const zones: Zone[] = [
  { id:'centro', name:'Centro', salePerSqm:2450, rentPerSqm:10.5, center:[7.7192711,44.8455856], preview:{x:62,y:44}, geometry:null },
  { id:'salsasio', name:'Salsasio', salePerSqm:1850, rentPerSqm:8.2, center:[7.7163774,44.8640113], preview:{x:49,y:29}, geometry:null },
  { id:'san-bernardo', name:'San Bernardo', salePerSqm:1620, rentPerSqm:7.4, center:[7.6955548,44.8443872], preview:{x:74,y:33}, geometry:null },
  { id:'san-giovanni', name:'San Giovanni', salePerSqm:1320, rentPerSqm:6.3, center:[7.7189336,44.8309979], preview:{x:36,y:50}, geometry:null },
  { id:'san-michele', name:'Borgo S. Michele', salePerSqm:1480, rentPerSqm:6.8, center:[7.7026597,44.8599615], preview:{x:45,y:68}, geometry:null },
  { id:'tuninetti', name:'Tuninetti', salePerSqm:1200, rentPerSqm:5.7, center:[7.7737529,44.8551918], preview:{x:78,y:76}, geometry:null },
];
export const properties: Property[] = [
  {id:'villa-poirino',title:'Villa indipendente',address:'Via Poirino, Carmagnola (TO)',zoneId:'salsasio',salePrice:399000,monthlyRent:1500,area:200,rooms:5,bathrooms:2,imageIndex:0,imageAlt:'Villa con piscina e giardino',sponsored:true},
  {id:'trilocale-torino',title:'Trilocale ristrutturato',address:'Via Torino, Carmagnola (TO)',zoneId:'centro',salePrice:178000,monthlyRent:650,area:85,rooms:3,bathrooms:1,imageIndex:1,imageAlt:'Soggiorno luminoso con zona pranzo',sponsored:true},
  {id:'villetta-sommariva',title:'Villetta con giardino',address:'Via Sommariva, Carmagnola (TO)',zoneId:'san-michele',salePrice:265000,monthlyRent:1100,area:150,rooms:4,bathrooms:2,imageIndex:2,imageAlt:'Villetta circondata da un giardino',sponsored:true},
  {id:'quadrilocale-porto',title:'Quadrilocale luminoso',address:'Via del Porto, Carmagnola (TO)',zoneId:'san-giovanni',salePrice:145000,monthlyRent:550,area:110,rooms:4,bathrooms:2,imageIndex:3,imageAlt:'Palazzina residenziale con ampi balconi',sponsored:true},
];
