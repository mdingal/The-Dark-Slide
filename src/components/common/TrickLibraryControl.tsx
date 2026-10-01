import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { GeneratedTrickResult, TrickLearningStatus } from '../../domain/types';
import { trickKey, LEARNING_STATUSES } from '../../domain/progression';

export const TrickLibraryControl: React.FC<{ result: GeneratedTrickResult }> = ({result}) => {
  const { profile, setTrickLearningStatus, showToast } = useApp();
  const [busy,setBusy]=useState(false),busyRef=useRef(false);
  const entry=profile?.trickLibrary?.find(t=>trickKey(t.trickResult)===trickKey(result));
  return <select aria-label={`Learning status for ${result.canonicalName}`} value={entry?.status || ''} disabled={busy}
    className="max-w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-2 text-xs"
    onChange={async e => {
      if(busyRef.current)return;busyRef.current=true;setBusy(true);
      const value=e.target.value;
      try {await setTrickLearningStatus(result,value ? value as TrickLearningStatus : null);}
      catch {showToast('Could not save your learning status. Try again.');}
      finally {busyRef.current=false;setBusy(false);}
    }}>
    <option value="">{entry ? 'Remove from library' : 'Add to Trick Library'}</option>
    {LEARNING_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
  </select>;
};
