import {NextResponse} from 'next/server';
import {adminSupabase,requireUser} from '@/lib/supabase';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser();
    const {id}=await params;
    const db=adminSupabase();
    const {data:project}=await db.from('projects').select('*').eq('id',id).eq('user_id',user.id).single();
    if(!project)return NextResponse.json({error:'Project not found.'},{status:404});
    const {data:rawAssets}=await db.from('assets').select('*').eq('project_id',id).eq('user_id',user.id).order('created_at');
    const assets=await Promise.all((rawAssets||[]).map(async asset=>{
      const bucket=asset.kind==='result'?'revframe-results':'revframe-inputs';
      const {data}=await db.storage.from(bucket).createSignedUrl(asset.path,3600);
      return {...asset,url:data?.signedUrl||null};
    }));
    return NextResponse.json({...project,assets});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Unauthorized.'},{status:401});
  }
}
