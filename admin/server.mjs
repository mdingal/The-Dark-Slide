import { readFile, appendFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createAdminServer } from './app.mjs';
import { firebaseService } from './firebase-service.mjs';
const privateDir = new URL('../.admin/', import.meta.url);
try {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Clear Firebase emulator environment variables before using this live admin panel.');
  const config = JSON.parse(await readFile(new URL('config.json', privateDir), 'utf8'));
  const account = JSON.parse(await readFile(new URL('service-account.json', privateDir), 'utf8'));
  if (config.projectId !== 'the-dark-slide-fe8a4' || account.project_id !== config.projectId) throw new Error('Unexpected Firebase project.');
  const app = initializeApp({ credential: cert(account), projectId: config.projectId });
  const audit = async data => { try { await appendFile(new URL('audit.ndjson', privateDir), JSON.stringify({ at: new Date().toISOString(), ...data }) + '\n', { mode: 0o600 }); } catch { console.warn('Admin action completed, but local audit recording failed.'); } };
  const server = createAdminServer({ config, service: firebaseService(getAuth(app), getFirestore(app)), publicDir: new URL('./public/', import.meta.url), audit });
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? 'Port 3002 is in use. Stop the other admin process.' : 'Unable to start the local server.'); process.exitCode = 1; });
  server.listen(3002, '127.0.0.1', () => console.log('DARK SLIDE admin: http://127.0.0.1:3002\nLIVE PROJECT: ' + config.projectId + '\nLocal access only. Stop with Ctrl+C. Admin sessions expire after one hour.'));
} catch (e) { console.error(e.code === 'ENOENT' ? 'Run npm run admin:setup first.' : e.message); process.exitCode = 1; }
