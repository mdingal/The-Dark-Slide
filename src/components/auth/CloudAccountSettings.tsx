import './AccountActions.css';
import { fetchRiderExport, downloadRiderExport } from '../../services/dataExport';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { importRiderExport, parseRiderExport } from '../../services/fileImport';
import type { RiderExport } from '../../services/dataExport';
import { accountError } from './AccountForm';
export const CloudAccountSettings: React.FC = () => {
  const { profile, resetPassword, refreshAccount } = useApp();
  const [importFile, setImportFile] = useState<RiderExport | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  if (!profile) return null;
  const run = async (task: () => Promise<void>) => { setBusy(true); setMessage(''); try { await task(); } catch(error) { setMessage(accountError(error)); } finally { setBusy(false); } };
  return <section className="account-actions bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
    <h2 className="font-semibold">Cloud account</h2><p className="text-sm">{profile.email} {'\u00b7'} Email verified</p>
    <p className="text-xs text-neutral-500">Your records are saved to Firebase. An internet connection is required to save changes. Your sign-in persistence follows the authentication settings for this app.</p>
    <button disabled={busy} className="account-action-button text-sm mr-3 mb-2" onClick={() => void run(refreshAccount)}>Reload cloud data</button>
    <button className="account-action-button text-sm" disabled={busy} onClick={() => void run(async () => { await resetPassword(profile.email!); setMessage('Password reset requested. Check your email.'); })}>Change password by email</button>
    <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
      <h3 className="font-medium">Export your data</h3>
      <p className="text-xs">JSON includes your profile, sessions, setups, bookmarks, presets, library entries, and preferences. CSV includes all session records for spreadsheets. Exports read your saved cloud data; save current edits first.</p>
      <p className="text-xs text-neutral-500">Use a JSON export to import records into your account. CSV is for spreadsheets.</p>
      <div className="flex flex-wrap gap-3 text-sm">
        {(['json', 'csv'] as const).map(format => <button key={format} className="account-action-button" disabled={busy} onClick={() => void run(async () => { const data = await fetchRiderExport(profile.id); downloadRiderExport(data, format); setMessage('Export prepared. Check your browser downloads.'); })}>Download {format.toUpperCase()}</button>)}
      </div>
    </div>
    <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
      <h3 className="font-medium">Import your data</h3>
      <p className="text-xs">Upload a JSON export from The Dark Slide (maximum 10 MB). Sessions and saved tools are added to this account. Existing records are kept; matching IDs are skipped. Account details and preferences stay unchanged. CSV imports are not supported.</p>
      <label className="block text-sm">Choose JSON backup
        <input type="file" accept=".json,application/json" disabled={busy} className="block mt-2 w-full text-xs cursor-pointer disabled:cursor-not-allowed" onChange={event => {
          const file = event.target.files?.[0]; setImportFile(null); setMessage('');
          if (!file) return;
          void run(async () => { if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file smaller than 10 MB.'); const data = parseRiderExport(await file.text()); setImportFile(data); });
          event.target.value = '';
        }} />
      </label>
      {importFile && <div className="space-y-3">
        <p className="text-xs">From {importFile.profile.displayName}: {importFile.sessions.length} sessions, {importFile.profile.savedSetups.length} setups, {(importFile.profile.bookmarks || []).length} bookmarks, {(importFile.profile.poolPresets || []).length} presets, {(importFile.profile.trickLibrary || []).length} library entries.</p>
        <button disabled={busy} className="rounded px-3 py-2 bg-[#D4A72C] text-neutral-950 text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed" onClick={() => { if (!window.confirm(`Add records from ${importFile.profile.displayName} to ${profile.email}? Confirm you own this backup. Existing records will be kept.`)) return; void run(async () => { const result = await importRiderExport(profile.id, importFile); await refreshAccount(); setImportFile(null); setMessage(`Import completed: ${result.added} sessions added, ${result.skipped} existing sessions skipped. Saved tools merged.`); }); }}>{busy ? 'Please wait...' : 'Import this backup'}</button>
      </div>}
      <p className="text-xs text-neutral-500">If an import is interrupted, select the same file and retry. Already imported sessions will be skipped.</p>
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
};
