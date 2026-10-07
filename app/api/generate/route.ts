import {NextResponse} from 'next/server';
import {waitUntil} from '@vercel/functions';
import {adminSupabase,requireUser} from '@/lib/supabase';
import {canStart,hasUnlimited,runJob} from '@/lib/jobs';

export const maxDuration=300;

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const {projectId,retry=false}=await req.json();
    const db=adminSupabase();
    const {data:project}=await db.from('projects').select('*').eq('id',projectId).eq('user_id',user.id).single();
    if(!project)return NextResponse.json({error:'Project not found.'},{status:404});
    if(retry&&project.status!=='FAILED')return NextResponse.json({error:'Only failed generations can be retried.'},{status:400});
    if(!(await canStart(user.id)))return NextResponse.json({error:'Two generations are already running.'},{status:429});
    const entitled=(await hasUnlimited(user.id))||project.entitlement_type==='single'||project.entitlement_type==='subscription';
    if(!entitled)return NextResponse.json({error:'Payment required.'},{status:402});
    await db.from('projects').update({status:'PREPARING',error_message:null}).eq('id',project.id);
    waitUntil(runJob(project.id));
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Generation could not start.'},{status:500});
  }
}
