import Link from 'next/link';
import {Camera} from 'lucide-react';
export default function Header(){return <header className="header"><Link href="/" className="brand"><span className="brandIcon"><Camera size={18}/></span><span>REVFRAME<small>AI AUTOMOTIVE STUDIO</small></span></Link><nav><Link href="/professional">Professional</Link><Link href="/rollers">Rollers</Link><Link href="/wheels">Wheels</Link><Link href="/pricing">Pricing</Link><Link href="/account" className="account">Account</Link></nav></header>}
