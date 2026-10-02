import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { referenceChallenge } from '../../domain/referenceChallenge';
import { Modal } from '../common/Modal';
import { AccountForm } from '../auth/AccountForm';

export const GuidePracticeButton: React.FC<{ trickId:string }> = ({trickId}) => {
  const {isLoggedIn,currentSession,repeatChallenge,showToast}=useApp();
  const [confirm,setConfirm]=useState(false),[signIn,setSignIn]=useState(false),[busy,setBusy]=useState(false);
  const working=useRef(false);
  const begin=async()=>{
    if(working.current)return;
    working.current=true;setBusy(true);
    try { await repeatChallenge(referenceChallenge(trickId)); setConfirm(false); window.location.hash=''; window.scrollTo({top:0,behavior:'instant'}); }
    catch(e){showToast(e instanceof Error?e.message:'Could not start practice. Try again.');}
    finally{working.current=false;setBusy(false);}
  };
  const request=()=>{
    if(!isLoggedIn){setSignIn(true);return;}
    if(currentSession&&!currentSession.sessionEndedAt&&(currentSession.attemptCount>0||currentSession.timerState.isRunning||currentSession.activeDurationMs>0)){setConfirm(true);return;}
    void begin();
  };
  return <>
    <button type="button" disabled={busy} onClick={request} className="guide-outline-button inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"><Play className="w-3.5 h-3.5"/>{busy?'Starting…':'Practice this trick'}</button>
    <Modal isOpen={signIn} onClose={()=>setSignIn(false)} title="Sign in to save your practice"><p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">Use a verified rider account to start a session. Once signed in, select Practice this trick again.</p><AccountForm onSuccess={()=>setSignIn(false)}/></Modal>
    <Modal isOpen={confirm} onClose={()=>{if(!busy)setConfirm(false);}} title="Start a new practice session?"><div className="space-y-4 text-sm"><p>Your current session will be paused and kept in history. The guide challenge starts with fresh counters.</p><div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button><button type="button" disabled={busy} onClick={()=>void begin()} className="rounded-lg bg-[#D4A72C] text-neutral-950 px-4 py-2 font-semibold">{busy?'Starting…':'Start practice'}</button></div></div></Modal>
  </>;
};
