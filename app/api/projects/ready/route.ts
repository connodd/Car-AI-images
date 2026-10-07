import {NextResponse} from 'next/server';
import {adminSupabase,requireUser} from '@/lib/supabase';

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const {projectId}=await req.json();
    const db=adminSupabase();
    const {data:project}=await db.from('projects').select('id,mode,status').eq('id',projectId).eq('user_id',user.id).single();
    if(!project)return NextResponse.json({error:'Project not found.'},{status:404});
    if(project.status!=='UPLOADING')return NextResponse.json({error:'Project is not accepting uploads.'},{status:400});
    const {data:assets}=await db.from('assets').select('kind').eq('project_id',projectId).eq('user_id',user.id);
    const references=(assets||[]).filter(a=>a.kind==='reference').length;
    const wheelReferences=(assets||[]).filter(a=>a.kind==='wheel_reference').length;
    const valid=project.mode==='wheels'
      ? references===1&&wheelReferences===1
      : references>=3&&references<=8&&wheelReferences===0;
    if(!valid)return NextResponse.json({error:'Upload requirements are not complete.'},{status:400});
    await db.from('projects').update({status:'DRAFT'}).eq('id',project.id).eq('user_id',user.id);
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Could not finalize uploads.'},{status:401});
  }
}
