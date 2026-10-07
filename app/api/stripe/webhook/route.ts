import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {waitUntil} from '@vercel/functions';
import {adminSupabase} from '@/lib/supabase';
import {stripe} from '@/lib/stripe';
import {runJob} from '@/lib/jobs';

export const maxDuration=300;

async function saveSubscription(userId:string,sub:Stripe.Subscription){
  const periodEnd=sub.items.data[0]?.current_period_end;
  await adminSupabase().from('subscriptions').upsert({
    user_id:userId,
    stripe_subscription_id:sub.id,
    stripe_customer_id:String(sub.customer),
    status:sub.status,
    current_period_end:periodEnd?new Date(periodEnd*1000).toISOString():null,
    cancel_at_period_end:sub.cancel_at_period_end,
    updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
}

export async function POST(req:Request){
  const body=await req.text();
  const signature=(await headers()).get('stripe-signature');
  if(!signature)return new NextResponse('Missing signature',{status:400});

  let event:Stripe.Event;
  try{
    event=stripe().webhooks.constructEvent(body,signature,process.env.STRIPE_WEBHOOK_SECRET!);
  }catch{
    return new NextResponse('Invalid signature',{status:400});
  }

  const db=adminSupabase();
  const {data:seen}=await db.from('webhook_events').select('id').eq('id',event.id).maybeSingle();
  if(seen)return NextResponse.json({received:true});

  try{
    if(event.type==='checkout.session.completed'){
      const session=event.data.object as Stripe.Checkout.Session;
      const userId=session.metadata?.user_id||session.client_reference_id;
      const projectId=session.metadata?.project_id;

      if(userId&&session.customer){
        await db.from('billing_profiles').upsert({
          user_id:userId,
          stripe_customer_id:String(session.customer),
          updated_at:new Date().toISOString()
        },{onConflict:'user_id'});
      }

      if(session.mode==='payment'&&session.payment_status==='paid'&&userId&&projectId){
        await db.from('payments').upsert({
          user_id:userId,
          project_id:projectId,
          stripe_checkout_session_id:session.id,
          stripe_payment_intent_id:String(session.payment_intent||''),
          mode:session.metadata?.mode||'unknown',
          status:'paid'
        },{onConflict:'stripe_checkout_session_id'});
        await db.from('projects').update({status:'PREPARING',entitlement_type:'single'}).eq('id',projectId).eq('user_id',userId).eq('status','DRAFT');
        waitUntil(runJob(projectId));
      }

      if(session.mode==='subscription'&&userId&&session.subscription){
        const sub=await stripe().subscriptions.retrieve(String(session.subscription));
        await saveSubscription(userId,sub);
        if(projectId){
          await db.from('projects').update({status:'PREPARING',entitlement_type:'subscription'}).eq('id',projectId).eq('user_id',userId).eq('status','DRAFT');
          waitUntil(runJob(projectId));
        }
      }
    }

    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const sub=event.data.object as Stripe.Subscription;
      const userId=sub.metadata?.user_id;
      if(userId)await saveSubscription(userId,sub);
    }

    if(event.type==='invoice.paid'||event.type==='invoice.payment_failed'){
      const invoice=event.data.object as Stripe.Invoice;
      const subscriptionRef=invoice.parent?.subscription_details?.subscription;
      if(typeof subscriptionRef==='string'){
        const sub=await stripe().subscriptions.retrieve(subscriptionRef);
        const userId=sub.metadata?.user_id;
        if(userId)await saveSubscription(userId,sub);
      }
    }

    const {error:markError}=await db.from('webhook_events').insert({id:event.id,type:event.type});
    if(markError?.code!=='23505'&&markError)throw markError;
  }catch(e){
    console.error(e);
    return new NextResponse('Webhook handler failed',{status:500});
  }

  return NextResponse.json({received:true});
}
