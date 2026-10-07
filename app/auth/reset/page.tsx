'use client';
import {useState} from 'react';
import {browserSupabase} from '@/lib/supabase-browser';
export default function Reset(){const [password,setPassword]=useState(''),[message,setMessage]=useState('');async function submit(){const {error}=await browserSupabase().auth.updateUser({password});if(error)setMessage(error.message);else{setMessage('Password updated.');setTimeout(()=>location.href='/account',700)}}return <main className="auth"><div className="authCard"><small>REVFRAME ACCOUNT</small><h1>NEW PASSWORD</h1><input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="btn light" onClick={submit}>UPDATE PASSWORD</button>{message&&<p>{message}</p>}</div></main>}
