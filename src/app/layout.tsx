import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
export const metadata: Metadata = {title:'HouseID — Scopri il valore di ogni zona',description:'Esplora Carmagnola, confronta le zone e trova la tua prossima casa. Prototipo con dati dimostrativi.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="it"><body>{children}</body></html>; }
