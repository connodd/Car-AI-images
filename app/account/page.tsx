import Link from 'next/link';
import {redirect} from 'next/navigation';
import {serverSupabase} from '@/lib/supabase';
import SignOut from '@/components/SignOut';

export default async function Account(){
  const s=await serverSupabase();
  const {data:{user}}=await s.auth.getUser();
  if(!user)redirect('/auth?next=/account');
  const [{data:sub},{data:projects}]=await Promise.all([
    s.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).maybeSingle(),
    s.from('projects').select('id,mode,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30)
  ]);
  return <main className="simple"><div className="accountTop"><div><small>ACCOUNT</small><h1>{user.email}</h1><p>REVFRAME Unlimited: <b>{sub?.status?.toUpperCase()||'INACTIVE'}</b></p></div><div className="accountActions">{sub&&<form action="/api/portal" method="post"><button className="btn ghost">MANAGE SUBSCRIPTION</button></form>}<SignOut/></div></div><h2 className="historyTitle">HISTORY</h2><div className="history">{projects?.length?projects.map(p=><Link href={`/results/${p.id}`} className="project" key={p.id}><span>{p.mode.toUpperCase()}</span><strong>{new Date(p.created_at).toLocaleDateString()}</strong><small>{p.status}</small></Link>):<div className="empty">No projects yet.</div>}</div></main>
}
