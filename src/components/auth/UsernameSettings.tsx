import React, { useEffect, useState } from 'react';
import { claimUsername, getUsername, usernameConfigured } from '../../services/usernameService';
export const UsernameSettings: React.FC = () => {
 const [current,setCurrent]=useState<string|null>(null),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true; void getUsername().then(name=>{if(active){setCurrent(name);setValue(name||'');}}).catch(()=>{if(active)setMessage('Could not load username. Retry by saving your username.');});return()=>{active=false;};},[]);
 if(!usernameConfigured())return null;
 return <form className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4" onSubmit={e=>{e.preventDefault();setBusy(true);setMessage('');void claimUsername(value).then(name=>{setCurrent(name);setValue(name);setMessage('Username saved. You can now sign in with @'+name+'.');}).catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}>
  <h3 className="font-medium">Login username</h3><p className="text-xs">{current?'Current username: @'+current:'Choose a unique username. Your rider name stays separate.'}</p>
  <label className="block text-sm">Username<input className="w-full mt-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2" required minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_]{2,23}" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={value} onChange={e=>setValue(e.target.value)} placeholder="e.g. ktnk_fb" /></label>
  <p className="text-xs text-neutral-500">3–24 characters. Letters, numbers, and underscores; start with a letter. Case-insensitive. Email login stays available.</p>
  <button disabled={busy} className="account-action-button">{busy?'Saving…':current?'Update username':'Choose username'}</button>{message&&<p role="status" className="text-sm">{message}</p>}
 </form>;
};
