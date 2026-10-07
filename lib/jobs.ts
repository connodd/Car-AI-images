import {adminSupabase} from './supabase';
import {generateImages, type Mode} from './ai';

export async function hasUnlimited(userId:string){
  const {data}=await adminSupabase().from('subscriptions').select('status,current_period_end').eq('user_id',userId).maybeSingle();
  return !!data && ['active','trialing'].includes(data.status) && (!data.current_period_end || new Date(data.current_period_end)>new Date());
}
export async function withinRateLimit(userId:string){
  const since=new Date(Date.now()-60*60*1000).toISOString();
  const {count}=await adminSupabase().from('projects').select('id',{count:'exact',head:true}).eq('user_id',userId).gte('created_at',since);
  return (count??0)<30;
}
export async function canStart(userId:string){
  const {count}=await adminSupabase().from('projects').select('id',{count:'exact',head:true}).eq('user_id',userId).in('status',['PREPARING','GENERATING','FINALIZING']);
  return (count??0)<2;
}

async function clearPartialResults(projectId:string){
  const db=adminSupabase();
  const {data:oldResults,error}=await db.from('assets').select('id,path').eq('project_id',projectId).eq('kind','result');
  if(error)throw error;
  if(!oldResults?.length)return;
  const {error:storageError}=await db.storage.from('revframe-results').remove(oldResults.map(result=>result.path));
  if(storageError)throw storageError;
  const {error:deleteError}=await db.from('assets').delete().in('id',oldResults.map(result=>result.id));
  if(deleteError)throw deleteError;
}

export async function runJob(id:string){
  const db=adminSupabase();
  const {data:p}=await db.from('projects').select('*').eq('id',id).single();
  if(!p || !['PREPARING','FAILED'].includes(p.status)) return;
  try{
    await clearPartialResults(id);
    await db.from('projects').update({status:'GENERATING',error_message:null,completed_at:null}).eq('id',id);
    const {data:assets}=await db.from('assets').select('*').eq('project_id',id).order('created_at');
    const refs=(assets||[]).filter(a=>a.kind!=='result');
    const inputs=await Promise.all(refs.map(async a=>{
      const {data,error}=await db.storage.from('revframe-inputs').download(a.path);
      if(error||!data) throw error||new Error('INPUT_MISSING');
      return {bytes:Buffer.from(await data.arrayBuffer()),mime:a.mime_type};
    }));
    const outputs=await generateImages(p.mode as Mode,inputs,p.instructions);
    await db.from('projects').update({status:'FINALIZING'}).eq('id',id);
    for(let i=0;i<outputs.length;i++){
      const ext=outputs[i].mime.includes('jpeg')?'jpg':'png';
      const path=`${p.user_id}/${id}/result-${i+1}.${ext}`;
      const {error}=await db.storage.from('revframe-results').upload(path,outputs[i].bytes,{contentType:outputs[i].mime,upsert:false});
      if(error) throw error;
      const {error:assetError}=await db.from('assets').insert({project_id:id,user_id:p.user_id,kind:'result',path,mime_type:outputs[i].mime});
      if(assetError)throw assetError;
    }
    await db.from('projects').update({status:'COMPLETE',completed_at:new Date().toISOString()}).eq('id',id);
  }catch(e){
    await db.from('projects').update({status:'FAILED',error_message:e instanceof Error?e.message.slice(0,400):'Generation failed'}).eq('id',id);
    throw e;
  }
}
