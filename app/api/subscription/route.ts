import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase';

export async function GET(){
  try{
    const s=await serverSupabase();
    const {data:{user}}=await s.auth.getUser();
    if(!user)return NextResponse.json({active:false});
    const {data}=await s.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).maybeSingle();
    const active=!!data&&['active','trialing'].includes(data.status)&&(!data.current_period_end||new Date(data.current_period_end)>new Date());
    return NextResponse.json({active,status:data?.status||'inactive',currentPeriodEnd:data?.current_period_end||null});
  }catch{return NextResponse.json({active:false,configured:false})}
}
