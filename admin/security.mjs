import { normalizeUsername } from '../shared/username.mjs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function verifySecret(code, config) {
  if (typeof code !== 'string' || code.length < 16 || code.length > 256) return false;
  const expected = Buffer.from(config.secretHash, 'hex');
  const actual = scryptSync(code, config.salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const token = () => randomBytes(32).toString('hex');
export function validUid(uid) { return typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid); }
export function validateUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['displayName', 'email', 'disabled', 'emailVerified', 'username'].includes(k))) throw new Error('Unsupported fields.');
  const { displayName, email, disabled, emailVerified } = body;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 80) throw new Error('Rider name must be 1–80 characters.');
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  if (typeof disabled !== 'boolean' || typeof emailVerified !== 'boolean') throw new Error('Invalid account status.');
  const username = body.username === undefined || body.username === '' ? undefined : normalizeUsername(body.username);
  return { displayName: displayName.trim(), email: email.trim(), disabled, emailVerified, ...(username ? {username} : {}) };
}
