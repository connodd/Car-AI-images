import {NextResponse} from 'next/server';
import {waitUntil} from '@vercel/functions';
import {adminSupabase,requireUser} from '@/lib/supabase';
import {stripe,priceFor} from '@/lib/stripe';
import {canStart,hasUnlimited,runJob,withinRateLimit} from '@/lib/jobs';

export const maxDuration=300;

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const {projectId,unlimited=false}=await req.json();
    const db=adminSupabase();
    if(!(await withinRateLimit(user.id)))return NextResponse.json({error:'Too many requests. Try again later.'},{status:429});
    const {data:project}=await db.from('projects').select('*').eq('id',projectId).eq('user_id',user.id).single();
    if(!project||project.status!=='DRAFT')return NextResponse.json({error:'Project is not ready for checkout.'},{status:400});

    if(await hasUnlimited(user.id)){
      if(!(await canStart(user.id)))return NextResponse.json({error:'Two generations are already running. Let one finish first.'},{status:429});
      await db.from('projects').update({status:'PREPARING',entitlement_type:'subscription'}).eq('id',project.id);
      waitUntil(runJob(project.id));
      return NextResponse.json({generate:true});
    }

    const {data:profile}=await db.from('billing_profiles').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
    const session=await stripe().checkout.sessions.create({
      mode:unlimited?'subscription':'payment',
      customer:profile?.stripe_customer_id||undefined,
      customer_email:profile?.stripe_customer_id?undefined:user.email,
      client_reference_id:user.id,
      line_items:[{price:unlimited?process.env.STRIPE_PRICE_UNLIMITED!:priceFor(project.mode),quantity:1}],
      success_url:`${process.env.NEXT_PUBLIC_SITE_URL}/results/${project.id}?checkout=success`,
      cancel_url:`${process.env.NEXT_PUBLIC_SITE_URL}/${project.mode}?checkout=cancelled`,
      metadata:{user_id:user.id,project_id:project.id,mode:project.mode,purchase_type:unlimited?'unlimited':'single'},
      subscription_data:unlimited?{metadata:{user_id:user.id}}:undefined
    });
    return NextResponse.json({url:session.url});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Checkout failed.'},{status:500});
  }
}
