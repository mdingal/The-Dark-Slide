import {SessionStartWizard} from './SessionStartWizard';
import {closePractice,goalReached,remainingTime} from '../../domain/sessionPlan';
import React, { useEffect, useState, useRef } from 'react';
import { PracticeSession, SessionStatus, CounterActionHistoryItem, SetupData } from '../../domain/types';
import {
  startTimer,
  pauseTimer,
  stopTimer,
  calculateActiveDurationMs,
  formatDurationMs,
} from '../../domain/timer';
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Undo2,
  Plus,
  Star,
  Share2,
  Download,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import QRCode from 'qrcode';
import { getStreaks, MISS_TAGS } from '../../domain/progression';
import { MissTag } from '../../domain/types';
import { recordCounterAction, undoCounterAction } from '../../domain/practiceActions';

interface PracticePanelProps {
  demo?: {setups:SetupData[];onStart:()=>void};
  session: PracticeSession;
  onUpdateSession: (updated: PracticeSession) => Promise<void>;
  onFinishSession?: (finished: PracticeSession) => void;
  savedSetups: SetupData[];
  onSelectSetup: (setup: SetupData) => void;
}

export const PracticePanel: React.FC<PracticePanelProps> = ({
  session,
  onUpdateSession,
  savedSetups,
  onSelectSetup,
  onFinishSession,
  demo,
}) => {
  // Local display time ticker
  const [displayDurationMs, setDisplayDurationMs] = useState<number>(() =>
    calculateActiveDurationMs(session.timerState)
  );

  const isFinished = Boolean(session.sessionEndedAt);
  const [selectedMissTags, setSelectedMissTags] = useState<MissTag[]>([]);
  const streaks = getStreaks(session);
  const consistencyGoal = session.consistencyGoal || 3;
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [finishStatus, setFinishStatus] = useState<SessionStatus>('pending');
  const [finishRating, setFinishRating] = useState<number | null>(null);
  const [recordMissingLanding, setRecordMissingLanding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finishError, setFinishError] = useState('');
  const [notesDraft, setNotesDraft] = useState(session.notes);
  const finishTimeRef = useRef<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5'>('1:1');


  // Tick local timer every 250ms when running without saving to storage every second
  useEffect(() => {
    setDisplayDurationMs(calculateActiveDurationMs(session.timerState));

    if (!session.timerState.isRunning) return;

    const interval = setInterval(() => {
      setDisplayDurationMs(calculateActiveDurationMs(session.timerState));
    }, 250);

    return () => clearInterval(interval);
  }, [session.timerState]);

  const [startIntent,setStartIntent]=useState<'start'|'attempt'|'landing'|null>(null);
  const [park,setPark]=useState(false);
  const openStart=(intent:'start'|'attempt'|'landing')=>{setStartIntent(intent);};
  const handleToggleTimer=()=>{
    if(!session.sessionStartedAt){openStart('start');return;}
    const now=Date.now();
    void saveCounter({...session,parkedAt:undefined,timerState:session.timerState.isRunning?pauseTimer(session.timerState,now):startTimer(session.timerState,now)});
  };
  const handleStopSession=()=>{
    if(!session.sessionStartedAt){openStart('start');return;}
    finishTimeRef.current=Date.now();setPark(false);setFinishRating(null);setFinishError('');setIsFinishOpen(true);
    void saveCounter({...session,timerState:pauseTimer(session.timerState,finishTimeRef.current),activeDurationMs:calculateActiveDurationMs(session.timerState,finishTimeRef.current)});
  };
  useEffect(()=>{if(session.outcomeReviewPending){finishTimeRef.current=Date.parse(session.sessionEndedAt!);setPark(false);setIsFinishOpen(true);}},[session.outcomeReviewPending]);
  const handleFinishSession=async()=>{
    if(isSaving||counterBusyRef.current||finishRating===null)return;
    setIsSaving(true);setFinishError('');
    const now=Date.now();
    const finished={...closePractice(session,park,finishRating,notesDraft,now,session.endedReason||'manual'),outcomeReviewPending:false,...(isFinished?{sessionEndedAt:session.sessionEndedAt}: {})};
    try{await onUpdateSession(finished);setIsFinishOpen(false);onFinishSession?.(finished);}
    catch{setFinishError('Could not save. Your session is still available; please retry.');}
    finally{setIsSaving(false);}
  };

  // Serialize counter updates so fast clicks cannot overwrite another landing.
  const counterBusyRef = useRef(false);
  const [counterBusy, setCounterBusy] = useState(false);
  const [counterError, setCounterError] = useState('');
  const saveCounter = async (updated: PracticeSession) => {
    if (demo || counterBusyRef.current || isFinished) return false;
    counterBusyRef.current = true;
    setCounterBusy(true);
    setCounterError('');
    try { await onUpdateSession(updated); return true; }
    catch { setCounterError('Could not save the update. Try again.'); return false; }
    finally { counterBusyRef.current = false; setCounterBusy(false); }
  };
  const handleAddAttempt = async () => {
    if(!session.sessionStartedAt){openStart('attempt');return;}
    if(session.practiceTimer?.type==='countdown'&&remainingTime(session)===0)return;
    const saved = await saveCounter(recordCounterAction(session, 'attempt', Date.now(), selectedMissTags));
    if (saved) setSelectedMissTags([]);
  };
  const handleAddLanding = () => {if(!session.sessionStartedAt){openStart('landing');return;}if(session.practiceTimer?.type==='countdown'&&remainingTime(session)===0)return;return saveCounter(recordCounterAction(session, 'landing'));};
  const handleUndo = () => saveCounter(undoCounterAction(session));



  const landingRate =
    session.attemptCount > 0
      ? Math.round((session.landingCount / session.attemptCount) * 100)
      : 0;

  // Share Progress Card Generation via Canvas (Monotone, High Contrast, Aspect Ratio Choice, with QR code)
  const renderShareCard = async (ratio: '1:1' | '4:5' = selectedRatio) => {
    const width = 1080;
    const height = ratio === '1:1' ? 1080 : 1350;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pitch black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Subtle monotone outer frame border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // Corner decorative markers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(34, 34, 18, 4);
    ctx.fillRect(34, 34, 4, 18);
    ctx.fillRect(width - 52, 34, 18, 4);
    ctx.fillRect(width - 38, 34, 4, 18);
    ctx.fillRect(34, height - 38, 18, 4);
    ctx.fillRect(34, height - 52, 4, 18);
    ctx.fillRect(width - 52, height - 38, 18, 4);
    ctx.fillRect(width - 38, height - 52, 4, 18);

    const padLeft = 72;
    const contentWidth = width - 144;

    // 1. Top Header Bar
    let curY = 96;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SESSION PERFORMANCE REPORT', padLeft, curY);

    // Status Badge on Top Right
    const statusText = `STATUS: ${session.status.toUpperCase()}`;
    ctx.font = 'bold 18px monospace';
    const statusWidth = ctx.measureText(statusText).width;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(width - padLeft - statusWidth - 24, curY - 22, statusWidth + 24, 34);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - padLeft - statusWidth - 24, curY - 22, statusWidth + 24, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statusText, width - padLeft - statusWidth - 12, curY);

    // Divider
    curY += 34;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, curY);
    ctx.lineTo(width - padLeft, curY);
    ctx.stroke();

    // 2. Challenge Trick Title Section
    curY += 46;
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('TARGET TRICK CHALLENGE', padLeft, curY);

    curY += 56;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px "Plus Jakarta Sans", -apple-system, sans-serif';

    // Multi-line wrap trick title
    const wrapText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number
    ): number => {
      const words = text.split(' ');
      let line = '';
      let yPos = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, yPos);
          line = words[n] + ' ';
          yPos += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, yPos);
      return yPos;
    };

    const trickName = session.trickResult.canonicalName;
    const endY = wrapText(trickName, padLeft, curY, contentWidth, 68);
    curY = endY + 36;

    // Hardware specs
    const setupName = session.setupSnapshot.name.toUpperCase();
    const setupWidth = `${session.setupSnapshot.deckWidthMm}MM`;
    const setupWheel = session.setupSnapshot.wheelMaterial.toUpperCase();
    const shape = session.setupSnapshot.shape ? ` · ${session.setupSnapshot.shape.toUpperCase()}` : '';
    const hardwareString = `HARDWARE: ${setupName} · ${setupWidth} · ${setupWheel}${shape}`;

    ctx.fillStyle = '#d4d4d8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(hardwareString, padLeft, curY, contentWidth);

    // 3. Stats Section
    curY += 34;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, curY);
    ctx.lineTo(width - padLeft, curY);
    ctx.stroke();

    curY += ratio === '1:1' ? 44 : 72;

    // 2x2 Grid of Stat Boxes
    const colGap = 24;
    const colWidth = (contentWidth - colGap) / 2;
    const boxHeight = ratio === '1:1' ? 180 : 210;

    const stats = [
      { label: 'ATTEMPTS', value: `${session.attemptCount}` },
      { label: 'LANDINGS', value: `${session.landingCount}` },
      { label: 'LANDING RATE', value: `${landingRate}%` },
      { label: 'PRACTICE TIME', value: formatDurationMs(displayDurationMs) },
    ];

    stats.forEach((stat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = padLeft + col * (colWidth + colGap);
      const by = curY + row * (boxHeight + (ratio === '1:1' ? 24 : 32));

      // Box background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(bx, by, colWidth, boxHeight);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, colWidth, boxHeight);

      // Label
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(stat.label, bx + 28, by + 48);

      // Value
      ctx.fillStyle = '#ffffff';
      ctx.font = idx === 3 ? 'bold 54px monospace' : '900 68px monospace';
      ctx.fillText(stat.value, bx + 28, by + (boxHeight - 42));
    });

    // 4. QR Code & Verification Footer
    const qrSize = 136;
    const qrY = height - 190;
    const qrX = width - padLeft - qrSize;

    // Generate real QR code image
    const appUrl = window.location.origin;
    try {
      const qrDataUrl = await QRCode.toDataURL(appUrl, {
        width: qrSize,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });

      // White container for QR code
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch {
      // Fallback
    }

    // Footer Text left of QR code
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('SCAN TO TEST TRICK', padLeft, qrY + 36);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px monospace';
    ctx.fillText('DETERMINISTIC FINGERBOARD ENGINE', padLeft, qrY + 70);

    ctx.fillStyle = '#71717a';
    ctx.font = '14px monospace';
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()} · VERIFIED METRICS`, padLeft, qrY + 104);

    const uri = canvas.toDataURL('image/png');
    setShareImageUri(uri);
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    renderShareCard(selectedRatio);
  };

  const handleDownloadImage = () => {
    if (!shareImageUri) return;
    const a = document.createElement('a');
    a.href = shareImageUri;
    a.download = `session-report-${selectedRatio.replace(':', '-')}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-5">
      {startIntent&&<SessionStartWizard session={session} demoSetups={demo?.setups} onClose={()=>setStartIntent(null)} onStart={async configured=>{if(demo){setStartIntent(null);demo.onStart();return;}const next=startIntent==='start'?configured:recordCounterAction(configured,startIntent!,Date.now(),selectedMissTags);await onUpdateSession(next);setStartIntent(null);setSelectedMissTags([]);}}/>}
      {/* Header with Title, Status and Setup Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 w-full">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 shrink-0">
            {isFinished ? 'Saved Session' : 'Practice Session'}
            {isFinished && <span
              className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded ${
                session.status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : session.status === 'failed'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {session.status}
            </span>}
          </h2>

          <div className="text-xs min-w-0"><span className="text-neutral-500">Setup used: </span>{session.sessionStartedAt?session.setupSnapshot.name:'Choose when starting'}{session.practiceSurface&&<span className="block text-neutral-500">{session.practiceSurface}</span>}</div>
        </div>

        {isFinished && (
          <button type="button" onClick={handleOpenShareModal}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium">
            <Share2 className="w-3.5 h-3.5" /> Share Card
          </button>
        )}
      </div>

      {/* Timer and Primary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-[minmax(190px,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/80 dark:border-neutral-800/80">
        {/* Practice Timer */}
        <div className="col-span-2 lg:col-span-1 min-w-0">
          <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Practice Timer</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-0.5">
            {formatDurationMs(session.practiceTimer?.type==='countdown'?Math.max(0,(session.practiceTimer.durationMs||0)-displayDurationMs):displayDurationMs)}
          </div>
          {!isFinished && <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              disabled={counterBusy}
              onClick={handleToggleTimer}
              className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1 px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                session.timerState.isRunning
                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90'
              }`}
            >
              {session.timerState.isRunning ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> {session.timerState.accumulatedMs > 0 ? 'Resume' : 'Start'}
                </>
              )}
            </button>

            {/* Stop Session Button */}
            <button
              disabled={counterBusy}
              onClick={handleStopSession}
              title="Stop timer and finalize practice session"
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 px-3 py-2 text-xs font-medium rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop Session
            </button>
          </div>}
        </div>

        {/* Attempts */}
        <div className="min-w-0">
          <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Attempts</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-0.5">
            {session.attemptCount}
          </div>
          <div className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-2 font-mono">
            First land: {session.firstLandingAttemptNumber ? `#${session.firstLandingAttemptNumber}` : '—'}
            <div>Time to first land: {session.firstLandingElapsedMs !== undefined
              ? formatDurationMs(session.firstLandingElapsedMs) : '—'}</div>
          </div>
        </div>

        {/* Landed */}
        <div className="min-w-0">
          <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Successful Landings</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {session.landingCount}
          </div>
          <div className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-2 font-mono">
            {landingRate}% landing rate
          </div>
        </div>

      </div>
      {isFinished && <p className="text-xs text-neutral-600 dark:text-neutral-300">Miss tags: {MISS_TAGS.filter(t => (session.missTagCounts?.[t.id] || 0) > 0)
        .map(t => `${t.label}: ${session.missTagCounts?.[t.id]}`).join(' · ') || 'None recorded'}</p>}
      {isFinished && (
        <p className="text-xs text-neutral-600 dark:text-neutral-300">
          Difficulty: {session.difficultyRating} / 5. Saved to your history.
        </p>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium">Landing streak: <strong className="text-[#8A6500] dark:text-[#D4A72C]">{streaks.current}</strong> / {consistencyGoal} <span className="text-neutral-500">· Best: {streaks.best}</span></p>
          <p className="text-xs">Goal: {session.goal?`${session.goal.target} ${session.goal.type==='streak'?'in a row':'total landings'}`:'Choose when starting'}{session.goal&&goalReached(session)?' · Reached!':''}</p>
        </div>
        {streaks.current >= consistencyGoal && <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">Consistency goal reached!</p>}
        {!isFinished && <p className="text-[11px] text-neutral-500">Add Attempt records a miss and resets your current streak. Successful Landing extends it.</p>}
      </div>
      {!isFinished && <fieldset disabled={counterBusy} className="space-y-2">
        <legend className="text-xs font-medium">Miss tags (optional, applied to your next Add Attempt)</legend>
        <div className="flex flex-wrap gap-2">
          {MISS_TAGS.map(tag => <label key={tag.id} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
            <input type="checkbox" checked={selectedMissTags.includes(tag.id)} onChange={() => setSelectedMissTags(tags =>
              tags.includes(tag.id) ? tags.filter(t=>t!==tag.id) : [...tags,tag.id])} />{tag.label}
          </label>)}
        </div>
      </fieldset>}

      {/* Interactive Counter Buttons */}
      {!isFinished && <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={counterBusy}
          onClick={handleAddAttempt}
          className="flex-1 min-w-[140px] py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Add Attempt
        </button>

        <button
          type="button"
          disabled={counterBusy}
          onClick={handleAddLanding}
          className="flex-1 min-w-[220px] whitespace-nowrap py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          Successful Landing (+1)
        </button>

        <button
          type="button"
          onClick={handleUndo}
          disabled={counterBusy || !session.history || session.history.length === 0}
          title="Undo last attempt or landing counter"
          className="py-3 px-3 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-xs font-medium">Undo</span>
        </button>
      </div>}

      {counterError && <p role="alert" className="text-xs text-rose-600">{counterError}</p>}

      {/* Practice Session Notes */}
      <div className="session-notes-field">
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          Session Notes & Observations
        </label>
        <textarea
          value={notesDraft}
          readOnly={isFinished}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="E.g. finger placement on concave, pop angle, smooth rollaway, catch timing..."
          rows={2}
          className="w-full text-xs font-normal bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
        />
      </div>

      <Modal
        isOpen={isFinishOpen}
        onClose={() => { if (!isSaving) setIsFinishOpen(false); }}
        title="Finish this session?"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            End this session or park it for later. Rate how difficult it felt and add your notes.
            Your session will be saved before the active practice session resets.
          </p>
          {!isFinished&&<div className="flex gap-3"><button disabled={isSaving} type="button" aria-pressed={!park} className={`border rounded-lg p-3 ${!park?'border-[#D4A72C] bg-[#D4A72C]/10':'border-neutral-300 dark:border-neutral-700'}`} onClick={()=>setPark(false)}>End session</button><button disabled={isSaving} type="button" aria-pressed={park} className={`border rounded-lg p-3 ${park?'border-[#D4A72C] bg-[#D4A72C]/10':'border-neutral-300 dark:border-neutral-700'}`} onClick={()=>setPark(true)}>Park for later</button></div>}
          <p className="text-sm">{park?'Your session will stay pending so you can resume it later.':`Goal ${goalReached(session)?'reached — success':'not reached — failed'}.`}</p>
          <label className="block text-sm">Session notes & observations<textarea className="w-full rounded-lg border p-3 bg-transparent" rows={4} value={notesDraft} disabled={isSaving} onChange={e=>setNotesDraft(e.target.value)}/></label>
          <fieldset disabled={isSaving} className="space-y-2">
            <legend className="text-sm font-medium mb-2">Difficulty rating (required)</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" aria-label={`Difficulty ${rating} of 5`}
                  aria-pressed={finishRating === rating} onClick={() => setFinishRating(rating)}
                  className={`px-3 py-2 rounded-md ${finishRating === rating
                    ? 'bg-[#D4A72C] text-[#292524]' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  {rating}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500">1 = Easy · 5 = Very difficult</p>
          </fieldset>
          {finishError && <p role="alert" className="text-sm text-rose-600">{finishError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" disabled={isSaving} onClick={() => setIsFinishOpen(false)}
              className="px-3 py-2 rounded-md text-sm">Cancel</button>
            <button type="button" disabled={isSaving || counterBusy || finishRating === null}
              onClick={handleFinishSession}
              className="px-4 py-2 rounded-md bg-[#D4A72C] text-[#292524] text-sm font-semibold disabled:opacity-40">
              {isSaving ? 'Saving...' : park ? 'Park session' : 'End session'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Card Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Session Card"
      >
        <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-0.5">
          {/* Aspect Ratio Selector (1:1 / 4:4 Square vs 4:5 Portrait) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 pl-1 sm:pl-2">
              Select Output Aspect Ratio:
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedRatio('1:1');
                  renderShareCard('1:1');
                }}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRatio === '1:1'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                1:1 (4:4 Square)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRatio('4:5');
                  renderShareCard('4:5');
                }}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRatio === '4:5'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                4:5 (Feed Portrait)
              </button>
            </div>
          </div>

          {/* Mobile-optimized preview */}
          {shareImageUri ? (
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black shadow-lg max-h-[50vh] flex items-center justify-center p-2">
              <img
                src={shareImageUri}
                alt="Session Performance Report"
                className="max-h-[46vh] max-w-full w-auto object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-500">
              Generating high-contrast card...
            </div>
          )}

          {/* Controls footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
              Monotone high-contrast graphic with embedded QR code.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG ({selectedRatio})</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
