import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {Analytics} from '@vercel/analytics/next';
import './globals.css';
import Header from '@/components/Header';

export const metadata:Metadata={
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),
  title:{default:'REVFRAME — AI Automotive Studio',template:'%s — REVFRAME'},
  description:'Professional AI automotive photography, realistic rollers, and wheel visualization built around your actual car.',
  openGraph:{title:'REVFRAME',description:'Your car. Shot differently.',type:'website'},
  icons:{icon:'/icon.svg',apple:'/icon.svg'}
};

export default function Layout({children}:{children:ReactNode}){
  return <html lang="en"><body><Header/>{children}<footer><div>REVFRAME <span>AI AUTOMOTIVE STUDIO</span></div><nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund">Refund Policy</a></nav></footer><Analytics/></body></html>
}
