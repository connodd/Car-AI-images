import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight,Camera,Gauge,CircleDot,ShieldCheck} from 'lucide-react';

export default function Home(){
  return <main>
    <section className="hero">
      <div className="heroCopy"><small>AI AUTOMOTIVE STUDIO</small><h1>YOUR CAR.<br/><span>SHOT DIFFERENTLY.</span></h1><p>Upload your actual vehicle. REVFRAME creates professional automotive photography while preserving the build that makes it yours.</p><div className="actions"><Link className="btn light" href="/professional">CREATE PHOTOS <ArrowRight/></Link><a className="btn ghost" href="#modes">SEE HOW IT WORKS</a></div><div className="trust"><ShieldCheck size={17}/> Built for vehicle fidelity, not generic AI reinterpretation.</div></div>
      <div className="heroVisual"><div className="speed one"/><div className="speed two"/><div className="speed three"/><div className="car"><div className="body"/><div className="wh a"/><div className="wh b"/></div><div className="tag"><small>ROLLERS</small><b>CAR SHARP.</b><b>WORLD MOVING.</b></div></div>
    </section>
    <section id="modes" className="section"><small>THREE WAYS TO CREATE</small><h2>BUILT AROUND YOUR ACTUAL CAR.</h2><div className="cards"><Mode icon={<Camera/>} href="/professional" title="PROFESSIONAL PHOTOSHOOT" price="$14.99">Professional automotive photography from your existing car photos.</Mode><Mode icon={<Gauge/>} href="/rollers" title="ROLLERS" price="$14.99">Turn parked or reference photos into realistic rolling shots.</Mode><Mode icon={<CircleDot/>} href="/wheels" title="WHEELS" price="$7.99">See real wheels on your actual car before buying them.</Mode></div></section>
    <section className="unlimited"><div><small>REVFRAME UNLIMITED</small><h2>$19.99<span>/MONTH</span></h2><p>Unlimited Professional Photoshoots, Rollers, and Wheel Swaps. No credits.</p></div><Link className="btn light" href="/pricing">GO UNLIMITED <ArrowRight/></Link></section>
  </main>
}

function Mode({icon,href,title,price,children}:{icon:ReactNode,href:string,title:string,price:string,children:ReactNode}){
  return <Link href={href} className="modeCard"><div className="modeArt"><span>{icon}</span><i/><i/></div><div className="modeCopy"><small>{price}</small><h3>{title}</h3><p>{children}</p><b>OPEN <ArrowRight size={17}/></b></div></Link>
}
