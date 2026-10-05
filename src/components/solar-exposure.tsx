'use client';
import { useEffect, useId, useState } from 'react';

export function SolarExposure(){
 const [progress,setProgress]=useState(0);
 const [playing,setPlaying]=useState(false);
 const clip=useId();
 useEffect(()=>{
  if(!playing)return;
  const timer=window.setInterval(()=>setProgress(value=>{if(value>=100){setPlaying(false);return 100;}return value+1;}),110);
  return ()=>window.clearInterval(timer);
 },[playing]);
 const phase=progress<33?0:progress<67?1:2;
 const labels=['Mattino','Ore centrali','Pomeriggio'];
 const descriptions=[
  'Il sole arriva da est, a destra della pianta, verso l’apertura laterale della camera 2. Il terrazzo a ovest non è rivolto al sole del mattino. Restano da valutare le ombre esterne.',
  'Nelle ore centrali il sole arriva da sud, in basso nella pianta, verso il balcone della camera 2 e l’apertura del cucinino. L’ingresso effettivo della luce dipende da schermature e ostacoli.',
  'Il sole si sposta a ovest, a sinistra della pianta, verso il terrazzo e le aperture di soggiorno e camera 1. Il terrazzo è coperto: la copertura può limitare l’ingresso della luce diretta.'
 ];
 const angle=Math.PI*progress/100;
 const sunX=300+245*Math.cos(angle),sunY=235+205*Math.sin(angle);
 return <section className="solar-exposure" aria-labelledby="solar-title">
 <h3 id="solar-title">Una giornata di luce, dentro casa</h3>
 <p>Segui il sole sulla pianta semplificata dell’appartamento. Ipotesi di orientamento: terrazzo a ovest e balcone a sud, secondo la correzione dell’utente.</p>
 <div className="sun-demo">
 <div className="sun-demo-heading"><strong>{labels[phase]}</strong><span>Percorso illustrativo · non in scala</span></div>
 <svg viewBox="0 0 600 470" role="img" aria-label={'Pianta schematica, terrazzo a ovest e balcone a sud. '+labels[phase]+': '+descriptions[phase]}>
 <defs><clipPath id={clip}><path d="M220 125H330V250H220Z M335 125H395V200H335Z M220 255H330V365H220Z M335 290H395V365H335Z M400 255H490V365H400Z"/></clipPath></defs>
 <path d="M55 235 A245 205 0 0 0 545 235" fill="none" stroke="#e2c68a" strokeWidth="2" strokeDasharray="5 6"/>
 <g fill="#edf1ed" stroke="#72857b" strokeWidth="2">
 <rect x="150" y="125" width="65" height="240" fill="#e3eadc"/>
 <rect x="220" y="125" width="110" height="125"/>
 <rect x="335" y="125" width="60" height="75"/>
 <rect x="335" y="205" width="60" height="80"/>
 <rect x="400" y="125" width="90" height="125" fill="#f2f2ef"/>
 <rect x="220" y="255" width="110" height="110"/>
 <rect x="335" y="290" width="60" height="75"/>
 <rect x="400" y="255" width="90" height="110"/>
 <rect x="415" y="370" width="65" height="25" fill="#e3eadc"/>
 </g>
 <g clipPath={'url(#'+clip+')'} fill="#ffd35c">
 <path d="M490 290V320L425 340V270Z" opacity={phase===0?.5:.04}/>
 <path d="M220 165V195L280 215V150Z M220 290V320L295 345V270Z" opacity={phase===2?.42:.04}/>
 <path d="M345 365H380L385 305H335Z M430 365H460L480 285H415Z" opacity={phase===1?.5:.04}/>
 </g>
 <g stroke="#4997ad" strokeWidth="5"><path d="M350 125H380 M220 165V195 M220 290V320 M345 365H380 M430 365H460 M490 290V320"/></g>
 <g fill="#24483d" fontSize="12" textAnchor="middle" fontFamily="Arial,sans-serif">
 <text x="275" y="190">Camera 1</text><text x="365" y="167">Bagno</text><text x="365" y="247">Dis.</text>
 <text x="445" y="185">Scale</text><text x="445" y="201">comuni</text>
 <text x="275" y="315">Soggiorno</text><text x="365" y="333">Cucinino</text><text x="445" y="315">Camera 2</text>
 <text x="447" y="387">Balcone</text><text transform="translate(186 245) rotate(-90)">Terrazzo coperto</text>
 <text x="325" y="105" fontWeight="bold">NORD</text><text x="531" y="249" fontWeight="bold">EST</text><text x="325" y="418" fontWeight="bold">SUD</text><text x="112" y="249" fontWeight="bold">OVEST</text>
 </g>
 <line x1={sunX} y1={sunY} x2={phase===0?500:phase===1?410:210} y2={phase===0?305:phase===1?385:245} stroke="#d99c24" strokeWidth="2" strokeDasharray="4 6"/>
 <circle cx={sunX} cy={sunY} r="22" fill="#ffe7a0" opacity=".6"/><circle cx={sunX} cy={sunY} r="13" fill="#f5b72f"/>
 </svg>
 <div className="sun-playback"><button type="button" onClick={()=>{if(progress>=100)setProgress(0);setPlaying(!playing);}}>{playing?'Pausa':'▶ Riproduci'}</button><label htmlFor={clip+'-time'}>Scorri la giornata</label><input id={clip+'-time'} type="range" min="0" max="100" value={progress} aria-valuetext={labels[phase]} onChange={event=>{setPlaying(false);setProgress(Number(event.target.value));}}/></div>
 <div className="sun-periods">{labels.map((label,index)=><button type="button" key={label} aria-pressed={phase===index} onClick={()=>{setPlaying(false);setProgress([10,50,90][index]);}}>{label}</button>)}</div>
 <p className="sun-explanation">{descriptions[phase]}</p>
 </div>
 <p className="solar-source">Giallo = possibile ingresso della luce, non illuminazione misurata. Azzurro = aperture schematizzate dalla pianta fornita. Orientamento schematico secondo le indicazioni dell’utente: terrazzo a ovest (sinistra), balcone a sud (in basso), est a destra e nord in alto. Da confermare sulla planimetria originale.</p>
 <p className="solar-note">In estate il sole è più alto e la copertura può schermarlo; in inverno è più basso e può entrare più in profondità, ma le ombre esterne si allungano. Questa animazione spiega le direzioni: non calcola ore di sole, ombre, intensità o differenze stagionali. Servono orientamento confermato, misure delle aperture, coperture e ostacoli per una simulazione reale.</p>
 </section>;
}
