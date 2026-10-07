import {NextResponse} from 'next/server';
import {adminSupabase,requireUser} from '@/lib/supabase';
import {stripe} from '@/lib/stripe';

export async function POST(){
  try{
    const user=await requireUser();
    const {data}=await adminSupabase().from('billing_profiles').select('stripe_customer_id').eq('user_id',user.id).single();
    if(!data?.stripe_customer_id)return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/account`,303);
    const session=await stripe().billingPortal.sessions.create({
      customer:data.stripe_customer_id,
      configuration:process.env.STRIPE_PORTAL_CONFIGURATION,
      return_url:`${process.env.NEXT_PUBLIC_SITE_URL}/account`
    });
    return NextResponse.redirect(session.url,303);
  }catch{
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?next=/account`,303);
  }
}
