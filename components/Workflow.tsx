'use client';
import {useMemo,useState} from 'react';
import {Upload,X,ArrowRight,LoaderCircle} from 'lucide-react';
import {browserSupabase} from '@/lib/supabase-browser';
import {track} from '@vercel/analytics';

type Mode='professional'|'rollers'|'wheels';
const prices={professional:'$14.99',rollers:'$14.99',wheels:'$7.99'};
const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);

export default function Workflow({mode}:{mode:Mode}){
  const [cars,setCars]=useState<File[]>([]);
  const [wheel,setWheel]=useState<File|null>(null);
  const [instructions,setInstructions]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const previews=useMemo(()=>cars.map(f=>({f,url:URL.createObjectURL(f)})),[cars]);
  const ready=mode==='wheels'?cars.length===1&&!!wheel:cars.length>=3&&cars.length<=8;

  function validate(files:File[]){for(const f of files){if(!allowed.has(f.type))throw new Error('Use JPEG, PNG, WebP, HEIC or HEIF images.');if(f.size>20*1024*1024)throw new Error('Each image must be under 20 MB.')}}

  async function create(unlimited=false){
    if(!ready||busy)return;
    track('checkout_started',{mode,purchase:unlimited?'unlimited':'single'});
    setBusy(true);setMsg('Preparing your project…');
    const s=browserSupabase();
    const {data:{user}}=await s.auth.getUser();
    if(!user){location.href=`/auth?next=/${mode}`;return}
    try{
      const files=[...cars,...(wheel?[wheel]:[])];validate(files);
      const {data:p,error}=await s.from('projects').insert({user_id:user.id,mode,instructions:instructions.trim()||null,status:'UPLOADING'}).select().single();
      if(error)throw error;
      for(let i=0;i<files.length;i++){
        const f=files[i],kind=mode==='wheels'&&i===files.length-1?'wheel_reference':'reference';
        const ext=(f.name.split('.').pop()||'img').toLowerCase().replace(/[^a-z0-9]/g,'');
        const path=`${user.id}/${p.id}/${kind}-${i}.${ext}`;
        if(i===0)track('upload_started',{mode});
        const {error:up}=await s.storage.from('revframe-inputs').upload(path,f,{contentType:f.type,upsert:false});
        if(up)throw up;
        const {error:asset}=await s.from('assets').insert({project_id:p.id,user_id:user.id,kind,path,mime_type:f.type});
        if(asset)throw asset;
      }
      track('upload_completed',{mode,count:files.length});
      const finalized=await fetch('/api/projects/ready',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:p.id})});
      const fjson=await finalized.json();if(!finalized.ok)throw new Error(fjson.error||'Upload validation failed');
      const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:p.id,unlimited})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||'Checkout failed');
      location.href=j.generate?`/results/${p.id}`:j.url;
    }catch(e){setMsg(e instanceof Error?e.message:'Something went wrong');setBusy(false)}
  }

  return <div className="workflow"><div className="steps"><b>1 UPLOAD</b><span>2 REVIEW</span><span>3 GENERATE</span><span>4 RESULTS</span></div>
    <section className="panel"><div className="panelHead"><span>01</span><div><h2>{mode==='wheels'?'YOUR CAR':'REFERENCE PHOTOS'}</h2><p>{mode==='wheels'?'Upload one clear photo of your car.':'Upload 3–8 clear photos. Include multiple angles and make modifications visible.'}</p></div></div>
      <label className="drop"><Upload/><strong>Drop photos here</strong><small>or click to choose from your device</small><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple={mode!=='wheels'} onChange={e=>{const f=Array.from(e.target.files||[]).slice(0,mode==='wheels'?1:8);try{validate(f);setCars(f);setMsg('')}catch(err){setMsg(err instanceof Error?err.message:'Invalid file')}}}/></label>
      <div className="thumbs">{previews.map(({f,url},i)=><div className="thumb" key={f.name+i}><img src={url} alt="Reference"/><button onClick={()=>setCars(v=>v.filter((_,n)=>n!==i))}><X size={15}/></button></div>)}</div>
    </section>
    {mode==='wheels'&&<section className="panel"><div className="panelHead"><span>02</span><div><h2>WHEEL REFERENCE</h2><p>Upload one clear image of the exact wheel design you want installed.</p></div></div><label className="drop compact"><Upload/><strong>{wheel?wheel.name:'Choose wheel reference'}</strong><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e=>{const f=e.target.files?.[0]||null;if(f)try{validate([f]);setWheel(f);setMsg('')}catch(err){setMsg(err instanceof Error?err.message:'Invalid file')}}}/></label></section>}
    <section className="panel"><div className="panelHead"><span>{mode==='wheels'?'03':'02'}</span><div><h2>ANYTHING SPECIFIC?</h2><p>Optional. Leave blank and REVFRAME will make tasteful photographic decisions.</p></div></div><textarea maxLength={600} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder={mode==='rollers'?'Mountain road at sunset, front three-quarter tracking shots.':mode==='wheels'?'Bronze finish, slightly larger diameter, factory ride height, flush fitment.':'Golden-hour mountain road, low front three-quarter shots, cinematic but realistic.'}/></section>
    <section className="checkout"><div><small>READY TO CREATE</small><strong>{mode==='wheels'?'1 finished wheel visualization':'6 finished photographs'}</strong></div><div className="actions"><button className="btn ghost" disabled={!ready||busy} onClick={()=>create(true)}>GO UNLIMITED — $19.99/MO</button><button className="btn light" disabled={!ready||busy} onClick={()=>create(false)}>{busy?<LoaderCircle className="spin"/>:<><span>GENERATE — {prices[mode]}</span><ArrowRight/></>}</button></div></section>
    {msg&&<p className="error">{msg}</p>}
  </div>
}
