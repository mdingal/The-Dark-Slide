import {createTarget} from '../domain/practiceTargets';
import {DeckGameLink,newDeckCard,latestDeckResume,finishLegacySuddenDeath} from '../domain/deckGame';
import {PracticeTarget} from '../domain/practiceTargets';
import {sessionRewards,SessionReward} from '../domain/riderProgression';
import {ProgressionReward} from '../components/common/ProgressionReward';
import {navigate,tabPaths} from '../domain/routes';
import {requestDashboardView,requestLabStart,consumeLabStart} from '../domain/dashboardEntry';
import {riderSetupAnswers} from '../domain/riderSetup';
import {closePractice,remainingTime} from '../domain/sessionPlan';
import {SharedChallengeLink} from '../domain/communityChallenges';
import {newlyEarnedMilestones} from '../domain/milestones';
import { claimUsername, normalizeUsername, resolveUsernameLogin, usernameConfigured } from '../services/usernameService';
import { auth, authReady } from '../services/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, updateProfile as updateAuthProfile, sendEmailVerification, sendPasswordResetEmail, signOut, reload, getIdToken } from 'firebase/auth';
import { DashboardPreferences, dashboardPreferences } from '../domain/dashboardAnalytics';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { PracticeSession, UserProfile, SetupData, GeneratedTrickResult, SessionStatus, GeneratorPresetConfig, TrickLearningStatus } from '../domain/types';
import { trickKey } from '../domain/progression';
import { createPracticeSession, challengeKey } from '../domain/practiceActions';
import { storageService } from '../services/firebaseStorageService';
import { stopTimer } from '../domain/timer';

export const DEFAULT_FALLBACK_SETUP: SetupData = {
  id: 'setup_default',
  name: 'Standard Fingerboard 34mm',
  deckWidthMm: 34,
  isCustomDeckWidth: false,
  wheelMaterial: 'urethane',
  shape: 'popsicle',
  mold: 'medium',
  difficultyRating: 3,
  notes: 'Stock standard setup',
};

interface AppContextType {
  activeTab: 'home' | 'generator' | 'history' | 'library' | 'tree' | 'games' | 'settings';
  setActiveTab: (tab: 'home' | 'generator' | 'history' | 'library' | 'tree' | 'games' | 'settings') => void;
  profile: UserProfile | null;
  activeSetup: SetupData | null;
  setActiveSetup: (setup: SetupData) => void;
  sessions: PracticeSession[];
  loadSessionDetails: (session:PracticeSession)=>Promise<PracticeSession>;
  currentSession: PracticeSession | null;
  setCurrentSession: (session: PracticeSession | null) => void;
  startNewSession: (result: GeneratedTrickResult, sharedChallenge?: SharedChallengeLink) => Promise<PracticeSession>;
  startDeckCard: (game:DeckGameLink,setup:SetupData,surface:string)=>Promise<PracticeSession>;
  updateSession: (updated: PracticeSession) => Promise<void>;
  startPracticeTarget: (target:PracticeTarget) => Promise<void>;
  repeatChallenge: (result: GeneratedTrickResult) => Promise<void>;
  toggleBookmark: (result: GeneratedTrickResult) => Promise<void>;
  savePoolPreset: (name: string, config: GeneratorPresetConfig) => Promise<void>;
  deletePoolPreset: (id: string) => Promise<void>;
  saveDashboardPreferences: (preferences: DashboardPreferences) => Promise<void>;
  setTrickLearningStatus: (result: GeneratedTrickResult, status: TrickLearningStatus | null) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteSessions: (ids: string[]) => Promise<void>;
  resumeSession: (session: PracticeSession) => void;
  updateProfile: (profile: UserProfile) => Promise<void>;
  authLoading: boolean;
  authError: string | null;
  authUser: User | null;
  refreshAccount: () => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggedIn: boolean;
  isFirstLogin: boolean;
  isSignInModalOpen: boolean;
  setIsSignInModalOpen: (open: boolean) => void;
  openSignIn: () => void;
  login: (email: string, password: string, name?: string, isNewAccount?: boolean, username?: string) => Promise<void>;
  logout: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const authEpoch = useRef(0);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'history' | 'library' | 'tree' | 'games' | 'settings'>('home');
  useEffect(()=>{const sync=(e:Event)=>setActiveTab((e as CustomEvent).detail);window.addEventListener('route-tab-change',sync);return()=>window.removeEventListener('route-tab-change',sync);},[]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSetup, setActiveSetupState] = useState<SetupData | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [practiceReward,setPracticeReward] = useState<SessionReward|null>(null);
  const sessionRecordsRef = useRef(sessions);
  sessionRecordsRef.current = sessions;
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const loadAccount = useCallback(async (user: User | null, forceRefresh=false) => {
    if(profileRef.current?.id&&profileRef.current.id!==user?.uid)storageService.clearMemory();
    const epoch = ++authEpoch.current;
    setPracticeReward(null);
    setAuthLoading(true); setAuthError(null); setIsLoggedIn(false);
    profileRef.current = null; setProfile(null); setSessions([]); setCurrentSession(null); setActiveSetupState(null);
    setAuthUser(user); setActiveTab((location.pathname.startsWith('/dashboard')?'history':Object.entries(tabPaths).find(([,p])=>p===location.pathname)?.[0]||'home') as typeof activeTab);
    try {
      if (!user || !user.emailVerified) {storageService.clearMemory();return;}
      let rider = await storageService.getProfile(user.uid);
      const first = !rider;
      if (!rider) {
        rider = { id: user.uid, email: user.email || '', displayName: user.displayName || 'Rider', instagramHandle: '', preferredTheme: 'system', onboarding: {version:1,step:0,answers:{}}, partsInventory: [], savedSetups: [], availableObstacles: ['ledge', 'rail'], bookmarks: [], poolPresets: [], trickLibrary: [] };
        await storageService.saveProfile(rider);
      }
      const records = await storageService.getSessions(user.uid,forceRefresh);
      for(let i=0;i<records.length;i++){
        const fixed=finishLegacySuddenDeath(records[i]);
        if(fixed!==records[i]){await storageService.saveSession(user.uid,fixed);records[i]=fixed;}
      }
      const fixedSetups=rider.savedSetups.map(setup=>{const used=records.find(s=>s.setupSnapshot.id===setup.id&&s.sessionStartedAt);return !setup.usedAt&&used?{...setup,usedAt:used.sessionStartedAt}:setup;});
      if(fixedSetups.some((setup,i)=>setup!==rider!.savedSetups[i])){rider={...rider,savedSetups:fixedSetups};await storageService.saveProfile(rider);}

      if (epoch !== authEpoch.current || auth.currentUser?.uid !== user.uid) return;
      profileRef.current = rider; setProfile(rider); setSessions(records);
      setActiveSetupState(rider.savedSetups.find(s => s.id === rider!.defaultSetupId) || rider.savedSetups[0] || DEFAULT_FALLBACK_SETUP);
      setCurrentSession(records.find(s => s.status === 'pending' && !s.sessionEndedAt) || null);
      window.dispatchEvent(new CustomEvent('rider-theme-loaded', { detail: rider.preferredTheme === 'light' ? 'light' : 'dark' }));
      setIsFirstLogin(first); setIsLoggedIn(true);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      if (epoch === authEpoch.current) setAuthError('Could not load cloud records. Check your connection and Firebase rules, then retry.');
    } finally { if (epoch === authEpoch.current) setAuthLoading(false); }
  }, []);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined; let cancelled = false;
    authReady.then(() => { if (!cancelled) unsubscribe = onAuthStateChanged(auth, user => { void loadAccount(user); }); })
      .catch(() => { setAuthError('Could not initialize authentication.'); setAuthLoading(false); });
    return () => { cancelled = true; unsubscribe?.(); ++authEpoch.current; };
  }, [loadAccount]);
  const refreshAccount = async () => {
    if (auth.currentUser) { await reload(auth.currentUser); await getIdToken(auth.currentUser, true); }
    await loadAccount(auth.currentUser,true);
  };
  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error('Sign in first.');
    await sendEmailVerification(auth.currentUser); showToast('Verification email sent.');
  };
  const resetPassword = async (email: string) => {
    await authReady; await sendPasswordResetEmail(auth, email.trim());
    showToast('If an account exists for that email, a reset link will be sent.');
  };

  const setActiveSetup = (setup: SetupData) => {
    setActiveSetupState(setup);
  };

  const startNewSession = async (result: GeneratedTrickResult, sharedChallenge?: SharedChallengeLink, target?:PracticeTarget): Promise<PracticeSession> => {
    if (!profile) {
      throw new Error('Profile missing');
    }

    const currentSetupSnapshot = activeSetup || profile.savedSetups[0] || DEFAULT_FALLBACK_SETUP;

    let previous = currentSession;
    if (previous && previous.timerState.isRunning) {
      const timerState = stopTimer(previous.timerState);
      previous = { ...previous, timerState, activeDurationMs: timerState.accumulatedMs };
      await storageService.saveSession(profile.id, previous);
    }
    const newSession = createPracticeSession(result, currentSetupSnapshot);
    if(target){newSession.goal={...target.goal};newSession.practiceTarget={id:target.id,reason:target.reason,...(target.focusTag?{focusTag:target.focusTag}:{})};if(target.goal.type==='time')newSession.practiceTimer={type:'countdown',durationMs:target.goal.target*60000};}
    if(sharedChallenge)newSession.sharedChallenge=structuredClone(sharedChallenge);
    await storageService.saveSession(profile.id, newSession);
    if (auth.currentUser?.uid !== profile.id) throw new Error("Account changed.");
    const paused = previous;
    setSessions(prev => [newSession, ...prev.map(s => s.id === paused?.id ? paused! : s)]);
    setCurrentSession(newSession);
    return newSession;
  };

  const startDeckCard=async(game:DeckGameLink,setup:SetupData,surface:string)=>{
    if(!profile)throw Error('Sign in to start a deck.');
    if(game.cardIndex>0&&latestDeckResume(sessionRecordsRef.current)?.game.gameId!==game.gameId)throw Error('This saved game was replaced by a newer session.');
    const previous=sessionRecordsRef.current.find(s=>s.id===currentSession?.id);
    if(previous?.timerState.isRunning&&!previous.sessionEndedAt){const timerState=stopTimer(previous.timerState);await updateSession({...previous,timerState,activeDurationMs:timerState.accumulatedMs,parkedAt:new Date().toISOString()});}
    const session=newDeckCard(game,setup,surface);
    await storageService.saveSession(profile.id,session);
    if(auth.currentUser?.uid!==profile.id)throw Error('Account changed.');
    sessionRecordsRef.current=[session,...sessionRecordsRef.current];setSessions(sessionRecordsRef.current);setCurrentSession(session);
    const current=profileRef.current;if(current){const next={...current,savedSetups:current.savedSetups.map(s=>s.id===setup.id&&!s.usedAt?{...s,usedAt:session.sessionStartedAt}:s)};profileRef.current=next;setProfile(next);}
    return session;
  };

  const updateSession = async (updated: PracticeSession): Promise<void> => {
    if (!profile) throw new Error('Profile missing');
    await storageService.saveSession(profile.id, updated);
    if (updated.sessionStartedAt && !profileRef.current?.savedSetups.find(s=>s.id===updated.setupSnapshot.id)?.usedAt) {
      const current=profileRef.current; if(current) {const next={...current,savedSetups:current.savedSetups.map(s=>s.id===updated.setupSnapshot.id?{...s,usedAt:updated.sessionStartedAt}:s)};profileRef.current=next;setProfile(next);}
    }
    if (auth.currentUser?.uid !== profile.id) return;
    const previousRecords = sessionRecordsRef.current;
    const previousRecord = previousRecords.find(record=>record.id===updated.id);
    const nextRecords = previousRecords.map(record=>record.id===updated.id?updated:record);
    sessionRecordsRef.current = nextRecords;
    if (!updated.deckGame && previousRecord && updated.sessionEndedAt && updated.status!=='pending' && !updated.outcomeReviewPending && (!previousRecord.sessionEndedAt || previousRecord.outcomeReviewPending)) {
      const reward = sessionRewards(nextRecords,updated.id);
      if (reward) setPracticeReward(reward);
    }
    const earned = newlyEarnedMilestones(previousRecords, nextRecords);
    if(earned.length){const m=earned.find(m=>m.kind==='first')||earned.find(m=>m.kind==='rate')||earned[0];showToast(`${m.title}: ${m.trickName} · ${m.detail}`);}
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (currentSession?.id === updated.id) {
      setCurrentSession(updated);
    }
  };

  const expirationBusy=useRef(false),expirationRetryAt=useRef(0);
  useEffect(()=>{
    const tick=()=>{if(expirationBusy.current||Date.now()<expirationRetryAt.current)return;
      const expiring=sessions.find(s=>s.practiceTimer?.type==='countdown'&&!!s.sessionStartedAt&&!s.sessionEndedAt&&remainingTime(s)===0);
      if(!expiring)return;
      expirationBusy.current=true;
      const remaining=(expiring.practiceTimer!.durationMs||0)-expiring.timerState.accumulatedMs;
      const endedAt=(expiring.timerState.lastStartedTimestamp||Date.now())+Math.max(0,remaining);
      void updateSession({...closePractice(expiring,false,expiring.difficultyRating,expiring.notes,endedAt,'countdown'),outcomeReviewPending:true})
        .then(()=>showToast('Countdown finished. Review your session in Trick Lab.'))
        .catch(()=>{expirationRetryAt.current=Date.now()+10000;showToast('Could not save countdown result. Reconnect and retry.');})
        .finally(()=>{expirationBusy.current=false;});
    };
    tick();const interval=setInterval(tick,500);return()=>clearInterval(interval);
  },[sessions]);

  const startPracticeTarget = async (target:PracticeTarget) => {
    await startNewSession(target.trickResult,undefined,target);
    consumeLabStart();setActiveTab('generator');navigate('/trick-lab');
    window.dispatchEvent(new Event('lab-target-entry'));
    window.scrollTo({top:0,behavior:'instant'});
  };

  const repeatChallenge = async (result: GeneratedTrickResult) => {
    await startNewSession(result);
    setActiveTab('generator'); navigate('/trick-lab');
    showToast('Same challenge, fresh session.');
  };

  const savedToolsQueue = useRef<Promise<void>>(Promise.resolve());
  const mutateSavedTools = (change: (current: UserProfile) => UserProfile): Promise<void> => {
    const riderId = profile?.id;
    const task = savedToolsQueue.current.catch(() => {}).then(async () => {
    const current = profileRef.current;
    if (!current || current.id !== riderId || !isLoggedIn) throw new Error('Sign in to save your practice tools.');
    const updated = change(current);
    if(updated.onboarding)updated.onboarding={...updated.onboarding,answers:riderSetupAnswers(updated.onboarding.answers,updated.savedSetups)};
    // Only update the interface after the cloud write succeeds.
    await storageService.saveProfile(updated);
    if (auth.currentUser?.uid !== riderId) return;
    profileRef.current = updated;
    setProfile(updated);
    });
    savedToolsQueue.current = task;
    return task;
  };
  useEffect(() => {
    const save = (event: Event) => {
      if (auth.currentUser?.emailVerified && profileRef.current) void mutateSavedTools(current => ({ ...current, preferredTheme: (event as CustomEvent<'light'|'dark'|'system'>).detail })).catch(() => showToast('Could not save theme preference.'));
    };
    window.addEventListener('rider-theme-change', save);
    return () => window.removeEventListener('rider-theme-change', save);
  });
  const toggleBookmark = async (result: GeneratedTrickResult) => {
    await mutateSavedTools(current => {
      const bookmarks = current.bookmarks || [];
      const key = challengeKey(result);
      const exists = bookmarks.some(b => challengeKey(b.trickResult) === key);
      return { ...current, bookmarks: exists
        ? bookmarks.filter(b => challengeKey(b.trickResult) !== key)
        : [{ id: `bookmark_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            savedAt: new Date().toISOString(), trickResult: structuredClone(result) }, ...bookmarks] };
    });
  };
  const savePoolPreset = async (name: string, config: GeneratorPresetConfig) => {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 60) throw new Error('Use a preset name between 1 and 60 characters.');
    await mutateSavedTools(current => {
      const poolPresets = current.poolPresets || [];
      if (poolPresets.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('That name already exists. Choose another name.');
      }
      return { ...current, poolPresets: [{ id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: cleanName, savedAt: new Date().toISOString(), config: structuredClone(config) }, ...poolPresets] };
    });
    showToast('Pool preset saved.');
  };
  const deletePoolPreset = async (id: string) => {
    await mutateSavedTools(current => ({ ...current,
      poolPresets: (current.poolPresets || []).filter(p => p.id !== id) }));
  };

  const saveDashboardPreferences = async (preferences: DashboardPreferences) => {
    await mutateSavedTools(current => ({ ...current, dashboardPreferences: dashboardPreferences(preferences) }));
  };

  const setTrickLearningStatus = async (result: GeneratedTrickResult, status: TrickLearningStatus | null) => {
    await mutateSavedTools(current => {
      const entries = current.trickLibrary || [];
      const key = trickKey(result), existing = entries.find(t => trickKey(t.trickResult) === key);
      const remaining = entries.filter(t => trickKey(t.trickResult) !== key);
      if (!status) return { ...current, trickLibrary: remaining };
      const now = new Date().toISOString();
      return { ...current, trickLibrary: [{ id: existing?.id || `trick_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
        addedAt: existing?.addedAt || now, updatedAt: now, status,
        trickResult: structuredClone(result) }, ...remaining] };
    });
  };

  const deleteSession = async (id: string): Promise<void> => {
    if (!profile) return;
    await storageService.deleteSession(profile.id, id);
    if (auth.currentUser?.uid !== profile.id) return;
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (currentSession?.id === id) {
      setCurrentSession(remaining[0] || null);
    }
    showToast('Session record deleted.');
  };

  const deleteSessions = async (ids: string[]): Promise<void> => {
    if (!profile || ids.length === 0) return;
    for (const id of ids) {
      await storageService.deleteSession(profile.id, id);
    }
    if (auth.currentUser?.uid !== profile.id) return;
    const remaining = sessions.filter((s) => !ids.includes(s.id));
    setSessions(remaining);
    if (currentSession && ids.includes(currentSession.id)) {
      setCurrentSession(remaining[0] || null);
    }
    showToast(`Deleted ${ids.length} session record${ids.length > 1 ? 's' : ''}.`);
  };

  const loadSessionDetails=async(session:PracticeSession):Promise<PracticeSession>=>{
    if(!profile)throw Error('Sign in to load the session.');
    if(!session.summaryOnly)return session;
    const row=await storageService.getSession(profile.id,session.id);
    if(!row)throw Error('This session no longer exists. Refresh your account.');
    if(auth.currentUser?.uid!==profile.id)throw Error('Account changed.');
    setSessions(prev=>prev.map(s=>s.id===row.id?row:s));return row;
  };
  const resumeSession = (session: PracticeSession) => {
    if(session.summaryOnly){void loadSessionDetails(session).then(resumeSession).catch(e=>showToast(e.message));return;}
    if(session.deckGame){if(latestDeckResume(sessionRecordsRef.current)?.game.gameId!==session.deckGame.gameId){showToast('This game is no longer resumable. Start a new deck instead.');return;}setCurrentSession(session);setActiveTab('games');navigate('/deck-games?game='+encodeURIComponent(session.deckGame.gameId));return;}
    if (session.status === 'pending' && session.sessionEndedAt) {
      const resumed = { ...session, sessionEndedAt: undefined };
      setCurrentSession(resumed);
      void updateSession(resumed).catch(() => showToast('Could not save the resumed session.'));
    } else {
      setCurrentSession(session);
    }
    setActiveTab('generator'); navigate('/trick-lab');
    showToast(`Resumed "${session.trickResult.canonicalName}"`);
  };

  const updateProfile = async (updatedProfile: UserProfile): Promise<void> => {
    if (!profile || updatedProfile.id !== profile.id) throw new Error('Account mismatch.');
    for (const setup of profile.savedSetups) {
      if (!setup.usedAt && !sessions.some(s=>s.setupSnapshot.id===setup.id&&s.sessionStartedAt)) continue;
      const next=updatedProfile.savedSetups.find(s=>s.id===setup.id);
      const config=(s:SetupData)=>JSON.stringify({...s,favorite:undefined,usedAt:undefined});
      if (!next || config(next)!==config(setup)) throw new Error('Used setup configurations are fixed. Create a new setup instead.');
    }
    const changes = Object.fromEntries(Object.entries(updatedProfile).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify((profile as unknown as Record<string, unknown>)[key])));
    await mutateSavedTools(current => ({ ...current, ...changes }));
    const saved = profileRef.current;
    if (!saved) return;
    setActiveSetupState(current => saved.savedSetups.find(s => s.id === current?.id)
      || saved.savedSetups.find(s => s.id === saved.defaultSetupId)
      || saved.savedSetups[0] || DEFAULT_FALLBACK_SETUP);
    showToast('Profile updated.');
  };

  const login = async (email: string, password: string, name?: string, isNewAccount = false, username?: string) => {
    await authReady;
    if (isNewAccount) {
      if (!name?.trim() || name.trim().length > 80) throw new Error('Enter a rider name between 1 and 80 characters.');
      if (!usernameConfigured()) throw new Error('Username service setup is required before creating new accounts.');
      const normalized = normalizeUsername(username);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try { await claimUsername(normalized); }
      catch (error) {
        try { await deleteUser(credential.user); }
        catch { throw new Error('Account created, but username setup failed. Sign in with email and choose a username in Rider Profile.'); }
        throw error;
      }
      await updateAuthProfile(credential.user, { displayName: name.trim() });
      try { await sendEmailVerification(credential.user); }
      catch { showToast('Account created. Use Resend verification to request your email.'); }
      setAuthUser(credential.user);
    } else {
      const identifier = email.trim();
      const loginEmail = identifier.includes('@') ? identifier : await resolveUsernameLogin(identifier, password);
      await signInWithEmailAndPassword(auth, loginEmail, password);
    }
  };
  const logout = () => {
    void signOut(auth).catch(() => showToast('Could not sign out. Try again.'));
  };

  const openSignIn = useCallback(() => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    }
    const scrollY = window.scrollY || window.pageYOffset || 0;
    // If user is far down the page (>= 400px), show popup instead of long scroll
    if (scrollY >= 400) {
      setIsSignInModalOpen(true);
    } else {
      const el = document.getElementById('account-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        const input = (document.getElementById('rider-email-input') ||
          document.getElementById('rider-name-input')) as HTMLInputElement | null;
        input?.focus();
      } else {
        setIsSignInModalOpen(true);
      }
    }
  }, [activeTab]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab: (tab) => { navigate(tabPaths[tab]); if(tab==='generator')requestLabStart(); if(tab==='history'){requestDashboardView('overview');window.dispatchEvent(new CustomEvent('dashboard-view-change',{detail:{...profile?.dashboardPreferences,view:'overview',category:'Progress'}}));} setActiveTab(tab); },
        profile,
        activeSetup,
        setActiveSetup,
        sessions,
        currentSession,
        setCurrentSession,
        startNewSession,
        repeatChallenge,
        startPracticeTarget,
        toggleBookmark,
        savePoolPreset,
        deletePoolPreset,
        setTrickLearningStatus,
        saveDashboardPreferences,
        updateSession,
        startDeckCard,
        loadSessionDetails,
        deleteSession,
        deleteSessions,
        resumeSession,
        updateProfile,
        authLoading, authError, authUser, refreshAccount, resendVerification, resetPassword,
        isLoggedIn,
        isFirstLogin,
        isSignInModalOpen,
        setIsSignInModalOpen,
        openSignIn,
        login,
        logout,
        toast,
        showToast,
      }}
    >
      {children}
      <ProgressionReward onRetry={session=>startPracticeTarget(createTarget(session.trickResult,session.goal||{type:'landings',target:5},'Repeat your last session goal.'))} records={sessions} onSaveTarget={target=>mutateSavedTools(current=>({...current,practiceTarget:target}))} reward={practiceReward} onClose={()=>setPracticeReward(null)} onProgress={()=>{setPracticeReward(null);navigate('/');setActiveTab('home');window.scrollTo({top:0,behavior:'instant'});}}/>
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
