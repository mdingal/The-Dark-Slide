import './AccountActions.css';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
export function accountError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Username/email or password is incorrect.',
    'auth/email-already-in-use': 'Unable to create this account. Try signing in or resetting your password.',
    'auth/weak-password': 'Choose a stronger password that meets the password policy.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many requests. Please wait before trying again.',
    'auth/network-request-failed': 'Check your connection and try again.',
  };
  return code ? messages[code] || 'Unable to complete this request. Please try again.' : error instanceof Error ? error.message : 'Please try again.';
}
export const AccountForm: React.FC<{ onSuccess?: () => void; mode?: 'signup'|'signin'|'reset'; onModeChange?: (mode: 'signup'|'signin'|'reset') => void }> = ({ onSuccess, mode: externalMode, onModeChange }) => {
  const { login, resetPassword, authUser, authLoading, resendVerification, refreshAccount, logout } = useApp();
  const [internalMode, setInternalMode] = useState<'signup'|'signin'|'reset'>('signup');
  const mode = externalMode ?? internalMode;
  const setMode = (next: 'signup'|'signin'|'reset') => { setInternalMode(next); onModeChange?.(next); };
  const [username, setUsername] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch(e) { setError(accountError(e)); } finally { setBusy(false); } };
  const input = 'w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white';
  const button = 'rounded-lg px-4 py-2 bg-[#D4A72C] text-neutral-950 font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed';
  if (authUser && !authUser.emailVerified) return <div className="account-actions space-y-4 text-sm">
    <p>Verify <strong>{authUser.email}</strong> using the link in your email to start saving progress.</p>
    <p>After verification, return here and choose “I’ve verified my email”.</p>
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy || authLoading} onClick={() => void run(async () => { await refreshAccount(); })}>I’ve verified my email</button>
      <button className="account-action-button" disabled={busy} onClick={() => void run(resendVerification)}>Resend verification</button>
      <button className="account-action-button" disabled={busy} onClick={logout}>Sign out</button>
    </div>{error && <p role="alert" className="text-rose-500">{error}</p>}
  </div>;
  return <form className="account-actions space-y-4 text-sm" onSubmit={e => { e.preventDefault(); void run(async () => {
    if (mode === 'reset') { await resetPassword(email); setMessage('If this email has an account, a reset link will be sent.'); return; }
    if (mode === 'signup' && password !== confirm) throw new Error('Passwords do not match.');
    await login(email, password, name, mode === 'signup', username); setPassword(''); setConfirm(''); onSuccess?.();
  }); }}>
    <h3 className="font-semibold">{mode === 'signup' ? 'Create an account' : mode === 'reset' ? 'Reset your password' : 'Sign in'}</h3>
    {mode === 'signup' && <label className="block">Rider name<input id="rider-name-input" className={input} required maxLength={80} placeholder="e.g. Dark Slide Rider" autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} /></label>}
    {mode === 'signup' && <label className="block">Username<input className={input} required minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_]{2,23}" placeholder="e.g. ktnk_fb" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)} /><span className="text-xs text-neutral-500">Unique login name, separate from your rider name. 3–24 letters, numbers, or underscores; start with a letter.</span></label>}
    <label className="block">{mode === 'signin' ? 'Username or email' : 'Email'}<input id="rider-email-input" className={input} type={mode === 'signin' ? 'text' : 'email'} placeholder={mode === 'signin' ? 'Username or you@example.com' : 'you@example.com'} required autoComplete={mode === 'signin' ? 'username' : 'email'} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={e => setEmail(e.target.value)} /></label>
    {mode !== 'reset' && <label className="block">Password<input className={input} type="password" placeholder={mode === 'signup' ? 'Create a password (12+ characters)' : 'Enter your password'} required minLength={mode === 'signup' ? 12 : undefined} maxLength={4096} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} />{mode === 'signup' && <span className="text-xs text-neutral-500">Use at least 12 characters.</span>}</label>}
    {mode === 'signup' && <label className="block">Confirm password<input className={input} type="password" placeholder="Re-enter your password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
    {error && <p role="alert" className="text-rose-500">{error}</p>}{message && <p role="status">{message}</p>}
    <div className={mode === 'signup' ? 'pt-3' : undefined}>
    <button type="submit" className={`${button} w-full`} disabled={busy || authLoading}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
    </div>
    <div className="flex flex-wrap justify-center gap-3 text-xs">
      <button type="button" className="account-text-link" disabled={busy} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button>
      {mode !== 'reset' && <button type="button" className="account-text-link" disabled={busy} onClick={() => { setMode('reset'); setError(''); }}>Forgot password?</button>}
    </div>
    <p className="text-xs leading-relaxed text-neutral-500 mt-4">{mode==='signup'?'By creating an account, you agree to our ':'Read our '}<a href="#terms" target="_blank" rel="noopener noreferrer" className="cursor-pointer underline underline-offset-4">Terms &amp; Conditions</a> and <a href="#privacy" target="_blank" rel="noopener noreferrer" className="cursor-pointer underline underline-offset-4">Privacy Policy</a>. Browser storage keeps you signed in; sign out on shared devices.</p>
  </form>;
};
