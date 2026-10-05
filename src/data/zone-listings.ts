import type { SaleListing } from '@/types/listing';

// Separate from the sponsored catalogue. Exactly one demo per selectable map area.
// Coordinates are representative points inside each sample polygon, NOT property addresses.
const examples = [
  {areaId:'centro',zoneName:'Centro',title:'Trilocale nel centro di Carmagnola',price:219000,areaSqm:95,rooms:3,bathrooms:2,coordinates:[7.7192711,44.8455856],propertyType:'Appartamento',floor:'2° piano',features:['Balcone','Cantina','Doppi vetri']},
  {areaId:'tuninetti',zoneName:'Tuninetti e nord-est',title:'Casa indipendente con giardino',price:185000,areaSqm:145,rooms:5,bathrooms:2,coordinates:[7.769,44.860],propertyType:'Casa indipendente',floor:'Su due livelli',features:['Giardino privato','Box auto','Terrazzo']},
  {areaId:'est',zoneName:'Settore est e campagna',title:'Villetta con spazio esterno',price:198000,areaSqm:130,rooms:4,bathrooms:2,coordinates:[7.761,44.843],propertyType:'Villetta',floor:'Su due livelli',features:['Giardino privato','Posto auto','Ripostiglio']},
  {areaId:'san-giovanni',zoneName:'San Giovanni e sud',title:'Quadrilocale con terrazzo',price:169000,areaSqm:110,rooms:4,bathrooms:2,coordinates:[7.7189336,44.8309979],propertyType:'Appartamento',floor:'1° piano',features:['Terrazzo','Box auto','Cantina']},
  {areaId:'san-bernardo',zoneName:'San Bernardo e ovest',title:'Trilocale luminoso con balcone',price:149000,areaSqm:90,rooms:3,bathrooms:1,coordinates:[7.6955548,44.8443872],propertyType:'Appartamento',floor:'2° piano',features:['Balcone','Cantina','Posto auto']},
  {areaId:'san-michele',zoneName:'San Michele e Grato',title:'Casa con cortile privato',price:175000,areaSqm:125,rooms:4,bathrooms:2,coordinates:[7.693,44.861],propertyType:'Casa indipendente',floor:'Su due livelli',features:['Cortile privato','Box auto','Lavanderia']},
  {areaId:'salsasio',zoneName:'Salsasio e nord',title:'Appartamento ristrutturato',price:189000,areaSqm:100,rooms:4,bathrooms:2,coordinates:[7.7163774,44.8640113],propertyType:'Appartamento',floor:'1° piano',features:['Balcone','Cantina','Doppi vetri']},
];
const demoListings: SaleListing[] = examples.map(example=>({
  ...example,
  id:`demo-${example.areaId}`,
  status:'demo',
  location:{label:`${example.zoneName}, Carmagnola (TO)`,coordinates:example.coordinates as [number,number],precision:'zone'},
  description:`Esempio di ${example.propertyType.toLocaleLowerCase('it')} nella zona ${example.zoneName}, con ${example.rooms} locali e ${example.bathrooms} ${example.bathrooms===1?'bagno':'bagni'}. La distribuzione ipotizzata comprende soggiorno, cucina e zona notte. Questa descrizione è dimostrativa: fotografie, indirizzo e caratteristiche effettive saranno inseriti insieme ai dati della casa reale.`,
  condition:'Buono stato (esempio)',
  totalFloors:null,lift:null,yearBuilt:null,energyClass:null,energyConsumption:null,
  heating:'Autonomo (esempio)',condominiumMonthly:null,availability:null,
  photos:[],floorPlanUrl:null,contact:null,sourceUrl:null,updatedAt:null,
}));
// Imported from the public listing; map coordinates remain a zone reference.
const sanBernardoListing: SaleListing = {
  sellerType:'agency',id:'immobiliare-131431598',areaId:'san-bernardo',zoneName:'San Bernardo',status:'real',
  title:'Trilocale in villa bifamiliare',price:180000,areaSqm:95,rooms:3,bathrooms:1,
  location:{label:'Via Giacomo Piscina 41, Carmagnola (TO)',coordinates:[7.6955548,44.8443872],precision:'zone'},
  description:'Appartamento al primo piano di una bifamiliare, con soggiorno e angolo cottura, due camere e bagno. Dispone di terrazzo affacciato sul giardino interno, spazi esterni esclusivi e autorimessa. La fonte classifica la zona come “San Bernardo, San Giovanni”; in questa anteprima è associato a San Bernardo.',
  propertyType:'Appartamento · intera proprietà',condition:'Buono stato',floor:'1° piano',totalFloors:2,lift:false,yearBuilt:null,
  energyClass:'G',energyConsumption:null,energyConsumptionLabel:'EPgl,nren 359,52 kWh/m² anno · APE 2016, energia primaria non rinnovabile',
  heating:'Autonomo, radiatori a metano',condominiumMonthly:0,availability:'Libero subito',
  features:['2 camere','Terrazzo','Spazi esterni esclusivi','Box privato','Cantina','Non arredato','Doppi vetri / PVC','Fibra ottica','Allarme','Porta blindata','Cancello elettrico'],
  photos:[{src:'https://pwm.im-cdn.it/image/1980998188/cover-m-c.jpg',alt:'Facciata · foto dell’annuncio Immobiliare Castello'},{src:'https://pwm.im-cdn.it/image/1980998420/m-c.jpg',alt:'Terrazzo · foto dell’annuncio Immobiliare Castello'}],
  floorPlanUrl:'https://pic.im-cdn.it/plan/131979188/m.jpg',
  contact:{name:'Immobiliare Castello',phone:null,email:null},sourceUrl:'https://www.immobiliare.it/annunci/131431598/',updatedAt:'30/07/2026',
};
export const zoneSaleListings: SaleListing[] = demoListings.map(listing=>listing.areaId==='san-bernardo'?sanBernardoListing:listing);
export const getZoneListing = (areaId:string) => zoneSaleListings.find(listing=>listing.areaId===areaId);
