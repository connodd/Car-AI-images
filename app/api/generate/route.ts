import {NextResponse} from 'next/server';
import {waitUntil} from '@vercel/functions';
import {adminSupabase,requireUser} from '@/lib/supabase';
import {canStart,runJob,withinRateLimit} from '@/lib/jobs';

export const maxDuration=300;

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const {projectId,retry=false}=await req.json();
    if(!retry)return NextResponse.json({error:'This endpoint only retries failed generations.'},{status:400});

    const db=adminSupabase();
    if(!(await withinRateLimit(user.id)))return NextResponse.json({error:'Too many requests. Try again later.'},{status:429});

    const {data:project}=await db.from('projects').select('*').eq('id',projectId).eq('user_id',user.id).single();
    if(!project)return NextResponse.json({error:'Project not found.'},{status:404});
    if(project.status!=='FAILED')return NextResponse.json({error:'Only failed generations can be retried.'},{status:400});
    if(!project.entitlement_type)return NextResponse.json({error:'Payment required.'},{status:402});
    if(!(await canStart(user.id)))return NextResponse.json({error:'Two generations are already running.'},{status:429});

    const {data:claimed,error}=await db.from('projects')
      .update({status:'PREPARING',error_message:null})
      .eq('id',project.id)
      .eq('user_id',user.id)
      .eq('status','FAILED')
      .select('id')
      .maybeSingle();
    if(error)throw error;
    if(!claimed)return NextResponse.json({error:'This generation is already being retried.'},{status:409});

    waitUntil(runJob(project.id));
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Generation could not start.'},{status:500});
  }
}
