'use client';
import {useState} from 'react';
import {browserSupabase} from '@/lib/supabase';

export default function Auth(){
  const [view,setView]=useState<'signup'|'signin'|'forgot'>('signup');
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState('');
  async function submit(){
    const s=browserSupabase();setMessage('');
    if(view==='signup'){
      const {error}=await s.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/account`}});
      setMessage(error?.message||'Check your email to finish creating your account.');
    }else if(view==='signin'){
      const {error}=await s.auth.signInWithPassword({email,password});
      if(error)setMessage(error.message);else location.href=new URLSearchParams(location.search).get('next')||'/account';
    }else{
      const {error}=await s.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/reset`});
      setMessage(error?.message||'Password reset email sent.');
    }
  }
  return <main className="auth"><div className="authCard"><small>REVFRAME ACCOUNT</small><h1>{view==='signup'?'CREATE ACCOUNT':view==='signin'?'SIGN IN':'RESET PASSWORD'}</h1><input type="email" autoComplete="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>{view!=='forgot'&&<input type="password" autoComplete={view==='signup'?'new-password':'current-password'} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>}<button className="btn light" onClick={submit}>{view==='signup'?'CREATE ACCOUNT':view==='signin'?'SIGN IN':'SEND RESET LINK'}</button>{message&&<p>{message}</p>}<div className="switch">{view!=='signin'&&<button onClick={()=>setView('signin')}>Sign in</button>}{view!=='signup'&&<button onClick={()=>setView('signup')}>Create account</button>}<button onClick={()=>setView('forgot')}>Forgot password?</button></div></div></main>
}
