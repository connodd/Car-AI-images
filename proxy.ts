import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';

export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep public REVFRAME pages available even before Supabase is connected.
  if(!url||!anonKey)return response;

  try{
    const supabase=createServerClient(url,anonKey,{
      cookies:{
        getAll:()=>request.cookies.getAll(),
        setAll:(items)=>{
          items.forEach(({name,value})=>request.cookies.set(name,value));
          response=NextResponse.next({request});
          items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        }
      }
    });
    await supabase.auth.getUser();
  }catch{
    // An auth-provider outage should not turn every public page into a 500.
  }

  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
