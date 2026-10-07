import {NextResponse} from 'next/server';
import {adminSupabase,requireUser} from '@/lib/supabase';

const mimeToExt:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'};
const maxBytes=20*1024*1024;

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const {projectId,kind,mimeType,size}=await req.json();
    if(typeof projectId!=='string'||!['reference','wheel_reference'].includes(kind))return NextResponse.json({error:'Invalid upload request.'},{status:400});
    if(!mimeToExt[mimeType]||typeof size!=='number'||size<=0||size>maxBytes)return NextResponse.json({error:'Unsupported image or file is larger than 20 MB.'},{status:400});
    const db=adminSupabase();
    const {data:project}=await db.from('projects').select('id,mode,status').eq('id',projectId).eq('user_id',user.id).single();
    if(!project||project.status!=='UPLOADING')return NextResponse.json({error:'This project is not accepting uploads.'},{status:409});
    if(project.mode!=='wheels'&&kind==='wheel_reference')return NextResponse.json({error:'Wheel references are only used in Wheels mode.'},{status:400});
    const path=`${user.id}/${projectId}/${kind}-${crypto.randomUUID()}.${mimeToExt[mimeType]}`;
    return NextResponse.json({path,bucket:'revframe-inputs'});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Upload could not be prepared.'},{status:500})}
}
