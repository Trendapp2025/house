'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, MapPin } from 'lucide-react';
export function PortalShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div className="portal"><a className="skip-link" href="#contenuto">Vai al contenuto</a><header className="portal-header"><div className="container"><Link className="brand" href="/"><House/>HouseID</Link><nav aria-label="Navigazione principale">{[['/','Home'],['/acquisto','Acquisto'],['/affitto','Affitto']].map(([href,label])=><Link key={href} href={href} aria-current={path===href?'page':undefined}>{label}</Link>)}</nav><span className="portal-location"><MapPin size={16}/>Carmagnola, TO</span></div></header>{children}<footer className="portal-footer container"><Link className="brand" href="/"><House/>HouseID</Link><p>Conosci la zona. Comprendi la casa.</p><small>Prototipo su Carmagnola · Annunci demo identificati. Dati dell’immobile reale con fonte e stime esplicite.</small></footer></div>;
}
