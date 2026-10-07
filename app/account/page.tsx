import Link from 'next/link';
import {redirect} from 'next/navigation';
import {adminSupabase,serverSupabase} from '@/lib/supabase';
import SignOut from '@/components/SignOut';

export default async function Account(){
  const s=await serverSupabase();
  const {data:{user}}=await s.auth.getUser();
  if(!user)redirect('/auth?next=/account');
  const [{data:sub},{data:projects}]=await Promise.all([
    s.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).maybeSingle(),
    s.from('projects').select('id,mode,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30)
  ]);
  const db=adminSupabase();
  const withThumbs=await Promise.all((projects||[]).map(async p=>{
    const {data:asset}=await db.from('assets').select('path').eq('project_id',p.id).eq('user_id',user.id).eq('kind','result').order('created_at').limit(1).maybeSingle();
    if(!asset)return {...p,thumbnail:null};
    const {data:url}=await db.storage.from('revframe-results').createSignedUrl(asset.path,3600);
    return {...p,thumbnail:url?.signedUrl||null};
  }));
  return <main className="simple"><div className="accountTop"><div><small>ACCOUNT</small><h1>{user.email}</h1><p>REVFRAME Unlimited: <b>{sub?.status?.toUpperCase()||'INACTIVE'}</b></p></div><div className="accountActions">{sub&&<form action="/api/portal" method="post"><button className="btn ghost">MANAGE SUBSCRIPTION</button></form>}<SignOut/></div></div><h2 className="historyTitle">HISTORY</h2><div className="history">{withThumbs.length?withThumbs.map(p=><Link href={`/results/${p.id}`} className="project" key={p.id}>{p.thumbnail?<img src={p.thumbnail} alt="" className="projectThumb"/>:<div className="projectThumb placeholder"/>}<span>{p.mode.toUpperCase()}</span><strong>{new Date(p.created_at).toLocaleDateString()}</strong><small>{p.status}</small></Link>):<div className="empty">No projects yet.</div>}</div></main>
}
