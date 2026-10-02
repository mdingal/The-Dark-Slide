import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../.admin');
let muted = false;
const output = new Writable({ write(chunk, encoding, cb) { if (!muted) process.stdout.write(chunk); cb(); } });
const rl = createInterface({ input: process.stdin, output, terminal: true });
try {
  console.log('Local admin setup. Credentials stay on this computer; never upload them.');
  try { await access(resolve(dir, 'config.json')); if ((await rl.question('Replace existing admin configuration? Type REPLACE: ')) !== 'REPLACE') process.exit(0); } catch {}
  const path = (await rl.question('Full path to Firebase service-account JSON: ')).trim().replace(/^"|"$/g, '');
  const account = JSON.parse(await readFile(path, 'utf8'));
  if (account.project_id !== 'the-dark-slide-fe8a4' || !account.private_key || !account.client_email) throw new Error('Use the service account for the-dark-slide-fe8a4.');
  async function secret(prompt) {
    process.stdout.write(prompt); muted = true;
    try { return await rl.question(''); } finally { muted = false; process.stdout.write('\n'); }
  }
  const code = await secret('Choose an admin secret (at least 16 characters; input hidden): ');
  if (code.length < 16 || code.length > 256) throw new Error('Use 16–256 characters.');
  if (code !== await secret('Confirm secret (input hidden): ')) throw new Error('Secrets did not match.');
  const salt = randomBytes(32).toString('hex');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(resolve(dir, 'service-account.json'), JSON.stringify(account), { mode: 0o600 });
  await writeFile(resolve(dir, 'config.json'), JSON.stringify({ projectId: account.project_id, salt, secretHash: scryptSync(code, salt, 64).toString('hex') }), { mode: 0o600 });
  console.log('Setup complete. Run npm run admin, then open http://127.0.0.1:3002');
} catch (e) { console.error(e.message); process.exitCode = 1; } finally { rl.close(); }
