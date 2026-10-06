import React, {useEffect, useState} from 'react';
import {MessageSquare, X, ArrowUpRight} from 'lucide-react';
import {Modal} from './Modal';
import {useApp} from '../../context/AppContext';

export const BETA_VERSION = '0.1.0-beta.1';
const DISMISS_KEY = `dark-slide-beta-notice:${BETA_VERSION}`;

export function BetaTools() {
  const {isLoggedIn} = useApp();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === 'dismissed'; }
    catch { return false; }
  });
  const [save, setSave] = useState({state: '', message: ''});
  const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine);
  const [category, setCategory] = useState('Bug report');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const changed = (event: Event) => setSave((event as CustomEvent).detail);
    const connected = () => setOnline(navigator.onLine);
    const show = () => { setSubmitted(false); setOpen(true); };
    window.addEventListener('cloud-save-status', changed);
    window.addEventListener('online', connected);
    window.addEventListener('offline', connected);
    window.addEventListener('open-beta-report', show);
    return () => {
      window.removeEventListener('cloud-save-status', changed);
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', connected);
      window.removeEventListener('open-beta-report', show);
    };
  }, []);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (save.state === 'saving') { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [save.state]);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, 'dismissed'); } catch { /* UI still dismisses. */ }
  };
  const input = 'mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-base text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4A72C]';

  return <>
    <div className={save.state || !online ? 'flex justify-end mb-3 text-xs' : 'hidden'}>
      <span role="status" aria-live="polite" className={save.state === 'error' || !online ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500'}>
        {!online ? 'Offline · reconnect before saving' : save.state === 'saving' ? 'Saving…' : save.state === 'saved' ? 'Saved to your account' : save.state === 'error' ? save.message : ''}
      </span>
    </div>
    {!dismissed && <aside aria-label="Beta feedback" className={`fixed right-3 left-3 sm:left-auto sm:right-5 sm:w-80 lg:right-6 z-40 rounded-2xl border border-[#D4A72C]/40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md p-4 shadow-xl text-neutral-950 dark:text-white ${isLoggedIn ? 'bottom-[calc(88px+env(safe-area-inset-bottom,0px))] lg:bottom-6' : 'bottom-[calc(16px+env(safe-area-inset-bottom,0px))]'}`}>
      <button type="button" aria-label="Dismiss beta notice" onClick={dismiss} className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center cursor-pointer rounded-lg text-neutral-500 hover:text-neutral-950 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-[#D4A72C]">
        <X size={18}/>
      </button>
      <p className="pr-9 text-xs font-semibold tracking-widest text-[#8A6500] dark:text-[#D4A72C]">DARK SLIDE · BETA</p>
      <p className="mt-2 pr-5 text-sm leading-6">You’re riding the beta. Help shape what comes next—share a bug, an idea, or what’s working.</p>
      <button type="button" onClick={() => {setSubmitted(false); setOpen(true);}} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4A72C] px-4 py-2.5 text-sm font-semibold text-black cursor-pointer hover:bg-[#e1b841] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A72C]">
        <MessageSquare size={16}/> Give feedback
      </button>
    </aside>}
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Help shape DARK SLIDE">
      <form action="https://formsubmit.co/mark.david.ingal+ds@gmail.com" method="POST" target="_blank" rel="noopener noreferrer" className="space-y-4" onSubmit={() => setSubmitted(true)}>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">Found a bug or have an idea? Tell us. Please don’t include passwords or private account information.</p>
        <input type="hidden" name="_subject" value="DARK SLIDE beta feedback"/>
        <input type="hidden" name="_template" value="table"/>
        <input type="hidden" name="App version" value={BETA_VERSION}/>
        <input type="hidden" name="Page" value={typeof window === 'undefined' ? '' : window.location.pathname}/>
        <div hidden aria-hidden="true"><input name="_honey" type="text" tabIndex={-1} autoComplete="off"/></div>
        <label className="block text-sm font-medium">Feedback type
          <select name="Feedback type" className={input} value={category} onChange={event => setCategory(event.target.value)}>
            <option>Bug report</option><option>Feature idea</option><option>General feedback</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Name <span className="font-normal text-neutral-500">(optional)</span>
            <input name="name" autoComplete="name" maxLength={100} className={input} placeholder="Your rider name"/>
          </label>
          <label className="block text-sm font-medium">Email <span className="font-normal text-neutral-500">(optional)</span>
            <input name="email" type="email" autoComplete="email" maxLength={254} className={input} placeholder="For a reply"/>
          </label>
        </div>
        <label className="block text-sm font-medium">{category === 'Bug report' ? 'What happened?' : 'Your feedback'}
          <textarea name="message" required minLength={10} maxLength={5000} rows={4} className={input} placeholder={category === 'Bug report' ? 'What did you try, what did you expect, and what happened instead?' : 'What would make your sessions better?'}/>
        </label>
        <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-400">Submitting sends these fields, the app version, and this page’s path through FormSubmit to the DARK SLIDE inbox. No practice records are attached. <a href="/privacy" className="underline cursor-pointer">Privacy Policy</a></p>
        <button type="submit" disabled={!online} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D4A72C] px-4 py-3 font-semibold text-black cursor-pointer hover:bg-[#e1b841] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Send feedback <ArrowUpRight size={18}/>
        </button>
        <p className="text-xs text-neutral-500">A new tab opens for the security check and submission confirmation.</p>
        {submitted && <p role="status" className="text-sm text-[#8A6500] dark:text-[#D4A72C]">Complete the security check in the new tab. Feedback is only submitted once that page confirms it. If no tab opened, allow popups and try again.</p>}
        {!online && <p role="status" className="text-sm text-rose-600 dark:text-rose-400">Reconnect before sending feedback. Your draft is still here.</p>}
      </form>
    </Modal>
  </>;
}
