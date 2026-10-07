import {createBrowserClient,createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';

export function browserSupabase(){
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
export async function serverSupabase(){
  const store=await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookies:{getAll:()=>store.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}
  });
}
export function adminSupabase(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function requireUser(){
  const s=await serverSupabase();
  const {data:{user}}=await s.auth.getUser();
  if(!user) throw new Error('UNAUTHENTICATED');
  return user;
}
