'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House } from 'lucide-react';
export function PortalShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div className="portal"><a className="skip-link" href="#contenuto">Vai al contenuto</a><header className="portal-header"><div className="container"><Link className="brand" href="/" aria-label="HouseID, homepage"><span className="brand-icon"><House size={22}/></span><span>House<span className="brand-id">ID</span></span></Link><nav aria-label="Navigazione principale">{[['/acquisto','Acquista'],['/affitto','Affitto']].map(([href,label])=><Link key={href} href={href} aria-current={path===href?'page':undefined}>{label}</Link>)}</nav></div></header>{children}<footer className="portal-footer container"><div><Link className="brand" href="/"><span className="brand-icon"><House size={22}/></span><span>House<span className="brand-id">ID</span></span></Link><p>Trova casa. Capisci il prezzo.</p></div><div><strong>Cerca casa</strong><Link href="/acquisto">Acquista a Carmagnola</Link><Link href="/affitto">Affitti · catalogo demo</Link></div><div><strong>Carmagnola, prima di tutto.</strong><p>Annunci e informazioni con fonti e limiti espliciti. Le proposte demo sono riconoscibili.</p></div></footer></div>;
}
