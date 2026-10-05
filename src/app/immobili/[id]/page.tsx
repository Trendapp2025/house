import { catalogue,findPortalListing } from '@/data/catalogue';
import { PropertyPage } from '@/components/property-page';
import { notFound } from 'next/navigation';
export function generateStaticParams(){return catalogue.map(l=>({id:l.id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const listing=findPortalListing(id);if(!listing)notFound();return <PropertyPage listing={listing}/>;}
