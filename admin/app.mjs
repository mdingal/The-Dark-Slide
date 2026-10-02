import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { token, verifySecret, validUid, validateUpdate } from './security.mjs';
export function createAdminServer({ config, service, publicDir, audit = async () => {}, port = 3002 }) {
  const sessions = new Map(); let failures = 0, blockedUntil = 0;
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const origins = new Set([...hosts].map(h => `http://${h}`));
  function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
  async function body(req) {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('JSON required.'), { status: 415 });
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 8192) throw Object.assign(new Error('Request too large.'), { status: 413 }); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }); }
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      if (!hosts.has(req.headers.host)) return send(res, 403, { error: 'Localhost access only.' });
      if (req.headers.origin && !origins.has(req.headers.origin)) return send(res, 403, { error: 'Invalid origin.' });
      if (req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { error: 'Cross-site access denied.' });
      const url = new URL(req.url, 'http://127.0.0.1');
      const mutation = !['GET', 'HEAD'].includes(req.method);
      if (mutation && !origins.has(req.headers.origin)) return send(res, 403, { error: 'Origin required.' });
      if (url.pathname === '/api/unlock' && req.method === 'POST') {
        if (Date.now() < blockedUntil) return send(res, 429, { error: 'Too many attempts. Wait 15 minutes or restart the local server.' });
        const data = await body(req);
        if (!verifySecret(data.code, config)) { failures++; if (failures >= 5) { blockedUntil = Date.now() + 15 * 60_000; failures = 0; } return send(res, 401, { error: 'Incorrect secret code.' }); }
        failures = 0; const id = token(), csrf = token();
        for (const [key, session] of sessions) if (session.expires < Date.now()) sessions.delete(key);
        if (sessions.size >= 10) sessions.delete(sessions.keys().next().value);
        sessions.set(id, { csrf, expires: Date.now() + 60 * 60_000 });
        res.setHeader('Set-Cookie', `darkslide_admin=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);
        return send(res, 200, { csrf, projectId: config.projectId });
      }
      if (url.pathname.startsWith('/api/')) {
        const id = /(?:^|;\s*)darkslide_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
        const session = sessions.get(id);
        if (!session || session.expires < Date.now()) { if (id) sessions.delete(id); return send(res, 401, { error: 'Unlock the local admin panel.' }); }
        if (mutation && req.headers['x-admin-csrf'] !== session.csrf) return send(res, 403, { error: 'Invalid session token. Reload and unlock again.' });
        if (url.pathname === '/api/session' && req.method === 'GET') return send(res, 200, { csrf: session.csrf, projectId: config.projectId });
        if (url.pathname === '/api/logout' && req.method === 'POST') { sessions.delete(id); res.setHeader('Set-Cookie', 'darkslide_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(res, 200, { locked: true }); }
        if (url.pathname === '/api/users' && req.method === 'GET') {
          const search = (url.searchParams.get('search') || '').trim(), page = url.searchParams.get('page') || '';
          if (search.length > 254 || page.length > 2048) return send(res, 400, { error: 'Invalid search.' });
          return send(res, 200, await service.list(page, search));
        }
        const match = /^\/api\/users\/([A-Za-z0-9_-]+)(\/cleanup)?$/.exec(url.pathname);
        if (match && validUid(match[1])) {
          const uid = match[1];
          if (!match[2] && req.method === 'PATCH') {
            let update; try { update = validateUpdate(await body(req)); } catch (e) { e.status = 400; throw e; }
            let result;
            try { result = await service.update(uid, update); } catch (e) { if (e.partial) await audit({ action: 'update-partial', uid }); throw e; }
            await audit({ action: 'update', uid }); return send(res, 200, { user: result });
          }
          if ((!match[2] && req.method === 'DELETE') || (match[2] && req.method === 'POST')) {
            const data = await body(req);
            if (data.confirmUid !== uid) return send(res, 400, { error: 'Type the exact UID to confirm.' });
            if (!match[2] && typeof data.deleteData !== 'boolean') return send(res, 400, { error: 'Choose whether to delete practice data.' });
            const action = match[2] ? 'cleanup' : data.deleteData ? 'delete-account-and-data' : 'delete-account';
            let result;
            try { result = match[2] ? await service.cleanup(uid) : await service.remove(uid, data.deleteData); } catch (e) { if (e.partial) await audit({ action: action + '-partial', uid }); throw e; }
            await audit({ action, uid }); return send(res, 200, result);
          }
        }
        return send(res, 404, { error: 'Unknown admin action.' });
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
      const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
      if (!assets[url.pathname]) return send(res, 404, { error: 'Not found.' });
      const [name, mime] = assets[url.pathname]; const data = await readFile(new URL(name, publicDir)); res.writeHead(200, { 'Content-Type': mime }); res.end(data);
    } catch (e) {
      const known = e.code?.startsWith('auth/');
      const status = e.status || (e.partial ? 409 : known || e.message?.startsWith('Rider name') || e.message?.startsWith('Enter a valid') || e.message?.startsWith('Unsupported') || e.message === 'Invalid account status.' || e.message?.startsWith('Account still exists') ? 400 : 500);
      const error = known ? ({ 'auth/email-already-exists': 'This email belongs to another account.', 'auth/user-not-found': 'Account not found.', 'auth/invalid-page-token': 'Reload the user list.' }[e.code] || 'Firebase rejected this account change.') : status < 500 ? e.message : 'Firebase request failed. Check credentials and connectivity; no success was confirmed.';
      send(res, status, { error, partial: Boolean(e.partial) });
    }
  });
  return server;
}
