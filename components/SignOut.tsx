'use client';
import {browserSupabase} from '@/lib/supabase-browser';
export default function SignOut(){return <button className="btn ghost" onClick={async()=>{await browserSupabase().auth.signOut();location.href='/'}}>SIGN OUT</button>}
