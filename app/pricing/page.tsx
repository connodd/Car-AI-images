import Link from 'next/link';
import type {ReactNode} from 'react';
import {Check,ArrowRight} from 'lucide-react';

export default function Pricing(){
  return <main className="simple"><header className="pageTitle"><small>PRICING</small><h1>PAY ONCE. OR GO UNLIMITED.</h1><p>No credits. No confusing tiers.</p></header><div className="pricing"><Price name="PROFESSIONAL" price="$14.99" href="/professional">6 finished photos per generation</Price><Price name="ROLLERS" price="$14.99" href="/rollers">6 finished rollers per generation</Price><Price name="WHEELS" price="$7.99" href="/wheels">1 before/after wheel visualization</Price><div className="price featured"><small>BEST FOR REGULAR USE</small><h2>REVFRAME UNLIMITED</h2><strong>$19.99<em>/MO</em></strong><p><Check size={17}/> Unlimited Professional Photoshoots</p><p><Check size={17}/> Unlimited Rollers</p><p><Check size={17}/> Unlimited Wheel Swaps</p><Link className="btn light" href="/professional">START CREATING <ArrowRight/></Link></div></div></main>
}
function Price({name,price,href,children}:{name:string,price:string,href:string,children:ReactNode}){return <div className="price"><h2>{name}</h2><strong>{price}</strong><p><Check size={17}/>{children}</p><Link className="btn ghost" href={href}>CHOOSE {name}</Link></div>}
