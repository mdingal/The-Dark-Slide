import { auth } from './firebase';
import { normalizeUsername } from '../../shared/username.mjs';
export { normalizeUsername };
export function usernameConfigured(): boolean { return Boolean(import.meta.env.VITE_USERNAME_WORKER_URL); }
async function call(path: string, data: unknown, authenticated = false): Promise<{ username?: string | null; email?: string }> {
 const base = import.meta.env.VITE_USERNAME_WORKER_URL?.replace(/\/$/, '');
 if (!base) throw new Error('Username service is not configured yet. Sign in with email.');
 const url = new URL(base);
 if (url.protocol !== 'https:' && !(['localhost','127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) throw new Error('Username service must use HTTPS.');
 const headers: Record<string,string> = { 'Content-Type':'application/json' };
 if (authenticated) { if (!auth.currentUser) throw new Error('Sign in first.'); headers.Authorization = 'Bearer ' + await auth.currentUser.getIdToken(); }
 let response: Response;
 try { response = await fetch(base + path, { method:'POST',headers,body:JSON.stringify(data),signal:AbortSignal.timeout(20000) }); } catch { throw new Error('Username service unavailable. Try again, or sign in with email.'); }
 const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Username request failed.'); return result;
}
export async function claimUsername(value: string): Promise<string> { const result = await call('/username',{username:normalizeUsername(value)},true); return result.username!; }
export async function getUsername(): Promise<string | null> { if (!usernameConfigured()) return null; return (await call('/me',{},true)).username || null; }
export async function resolveUsernameLogin(value: string, password: string): Promise<string> { const result = await call('/login',{username:value,password}); if (!result.email) throw new Error('Username or password is incorrect.'); return result.email; }
