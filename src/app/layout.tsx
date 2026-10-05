import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import './design-system.css';
export const metadata: Metadata = {title:'HouseID — Trova casa. Capisci il prezzo.',description:'Annunci e dati territoriali a Carmagnola, con fonti trasparenti e informazioni per conoscere meglio la casa.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="it" data-scroll-behavior="smooth"><body>{children}</body></html>; }
