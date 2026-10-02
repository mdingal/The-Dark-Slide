import React, { useState, useRef } from 'react';
import { GeneratorPresetConfig } from '../../domain/types';
import { useApp } from '../../context/AppContext';

export const PoolPresets: React.FC<{ config: GeneratorPresetConfig; onApply: (config: GeneratorPresetConfig) => void }> = ({ config, onApply }) => {
  const { profile, savePoolPreset, deletePoolPreset, showToast } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const presets = profile?.poolPresets || [];
  const selected = presets.find(p => p.id === selectedId);
  const perform = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save this change.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const input = 'rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs min-w-0';
  return <section aria-label="Pool presets" className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
    <div>
      <h2 className="text-sm font-semibold">Pool Presets</h2>
      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">Save pools, locks, and selected values for all three modes. Applying a preset changes the next generation, not your current session.</p>
    </div>
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1">
        <select aria-label="Saved pool preset" disabled={busy} value={selected ? selectedId : ''} onChange={e => setSelectedId(e.target.value)} className={`${input} col-span-2 w-full sm:w-auto sm:flex-1 min-h-11 sm:min-h-0`}>
          <option value="">Choose a saved preset</option>
          {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="button" disabled={!selected || busy} onClick={() => {
          if (selected) { onApply(structuredClone(selected.config)); showToast(`Applied "${selected.name}". Generate when ready.`); }
        }} className="cursor-pointer min-h-11 sm:min-h-0 px-3 py-2 text-xs rounded-md bg-[#D4A72C] text-[#292524] disabled:opacity-40">Apply</button>
        <button type="button" disabled={!selected || busy} onClick={() => void perform(async () => {
          if (selected) { await deletePoolPreset(selected.id); setSelectedId(''); }
        })} className="cursor-pointer min-h-11 sm:min-h-0 px-3 py-2 text-xs rounded-md text-rose-600 disabled:opacity-40">Delete</button>
      </div>
      <form className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1" onSubmit={e => {
        e.preventDefault(); void perform(async () => { await savePoolPreset(name, config); setName(''); });
      }}>
        <input aria-label="New pool preset name" placeholder="Name this preset" maxLength={60} value={name}
          disabled={busy} onChange={e => setName(e.target.value)} className={`${input} col-span-2 w-full sm:w-auto sm:flex-1 min-h-11 sm:min-h-0`} />
        <button type="submit" disabled={busy || !name.trim()} className="cursor-pointer w-full sm:w-auto min-h-11 sm:min-h-0 px-3 py-2 rounded-md text-xs bg-neutral-100 dark:bg-neutral-800 disabled:opacity-40 whitespace-nowrap">Save Preset</button>
      </form>
    </div>
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
  </section>;
};
