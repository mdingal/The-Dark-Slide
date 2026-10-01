import { DashboardPreferences, dashboardPreferences } from '../domain/dashboardAnalytics';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { PracticeSession, UserProfile, SetupData, GeneratedTrickResult, SessionStatus, GeneratorPresetConfig, TrickLearningStatus } from '../domain/types';
import { trickKey } from '../domain/progression';
import { createPracticeSession, challengeKey } from '../domain/practiceActions';
import { storageService } from '../services/localStorageService';
import { createInitialTimerState, stopTimer } from '../domain/timer';

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
  activeTab: 'home' | 'generator' | 'history' | 'library' | 'settings';
  setActiveTab: (tab: 'home' | 'generator' | 'history' | 'library' | 'settings') => void;
  profile: UserProfile | null;
  activeSetup: SetupData | null;
  setActiveSetup: (setup: SetupData) => void;
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  setCurrentSession: (session: PracticeSession | null) => void;
  startNewSession: (result: GeneratedTrickResult) => Promise<PracticeSession>;
  updateSession: (updated: PracticeSession) => Promise<void>;
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
  resetDemoData: () => Promise<void>;
  isLoggedIn: boolean;
  isFirstLogin: boolean;
  isSignInModalOpen: boolean;
  setIsSignInModalOpen: (open: boolean) => void;
  openSignIn: () => void;
  login: (email: string, name?: string, isNewAccount?: boolean) => Promise<void>;
  logout: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    return localStorage.getItem('ktnk_rider_is_first_login') === 'true';
  });

  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'history' | 'library' | 'settings'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSetup, setActiveSetupState] = useState<SetupData | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
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

  // Load initial profile & sessions
  const loadData = useCallback(async () => {
    const active = await storageService.getActiveProfile();
    setProfile(active);

    const defaultSetup =
      active.savedSetups.find((s) => s.id === active.defaultSetupId) ||
      active.savedSetups[0] ||
      DEFAULT_FALLBACK_SETUP;
    setActiveSetupState(defaultSetup);

    const profileSessions = await storageService.getSessions(active.id);
    setSessions(profileSessions);

    if (profileSessions.length > 0) {
      const pending = profileSessions.find((s) => s.status === 'pending' && !s.sessionEndedAt);
      setCurrentSession(pending || null);
    } else { setCurrentSession(null); }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setActiveSetup = (setup: SetupData) => {
    setActiveSetupState(setup);
  };

  const startNewSession = async (result: GeneratedTrickResult): Promise<PracticeSession> => {
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
    await storageService.saveSession(profile.id, newSession);
    const paused = previous;
    setSessions(prev => [newSession, ...prev.map(s => s.id === paused?.id ? paused! : s)]);
    setCurrentSession(newSession);
    return newSession;
  };

  const updateSession = async (updated: PracticeSession): Promise<void> => {
    if (!profile) throw new Error('Profile missing');
    await storageService.saveSession(profile.id, updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (currentSession?.id === updated.id) {
      setCurrentSession(updated);
    }
  };

  const repeatChallenge = async (result: GeneratedTrickResult) => {
    await startNewSession(result);
    setActiveTab('generator');
    showToast('Same challenge, fresh session.');
  };

  const savedToolsQueue = useRef<Promise<void>>(Promise.resolve());
  const mutateSavedTools = (change: (current: UserProfile) => UserProfile): Promise<void> => {
    const riderId = profile?.id;
    const task = savedToolsQueue.current.catch(() => {}).then(async () => {
    const current = profileRef.current;
    if (!current || current.id !== riderId || !isLoggedIn) throw new Error('Sign in to save your practice tools.');
    const updated = change(current);
    // LocalStorage saves synchronously before this promise resolves.
    await storageService.saveProfile(updated);
    profileRef.current = updated;
    setProfile(updated);
    });
    savedToolsQueue.current = task;
    return task;
  };
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
    const remaining = sessions.filter((s) => !ids.includes(s.id));
    setSessions(remaining);
    if (currentSession && ids.includes(currentSession.id)) {
      setCurrentSession(remaining[0] || null);
    }
    showToast(`Deleted ${ids.length} session record${ids.length > 1 ? 's' : ''}.`);
  };

  const resumeSession = (session: PracticeSession) => {
    if (session.status === 'pending' && session.sessionEndedAt) {
      const resumed = { ...session, sessionEndedAt: undefined };
      setCurrentSession(resumed);
      void updateSession(resumed).catch(() => showToast('Could not save the resumed session.'));
    } else {
      setCurrentSession(session);
    }
    setActiveTab('generator');
    showToast(`Resumed "${session.trickResult.canonicalName}"`);
  };

  const updateProfile = async (updatedProfile: UserProfile): Promise<void> => {
    await storageService.saveProfile(updatedProfile);
    profileRef.current = updatedProfile;
    setProfile(updatedProfile);
    setActiveSetupState(current => updatedProfile.savedSetups.find(s => s.id === current?.id)
      || updatedProfile.savedSetups.find(s => s.id === updatedProfile.defaultSetupId)
      || updatedProfile.savedSetups[0] || DEFAULT_FALLBACK_SETUP);
    showToast('Profile updated.');
  };

  const resetDemoData = async (): Promise<void> => {
    if (!profile) return;
    await storageService.resetToDemoSeed(profile.id);
    const userSessions = await storageService.getSessions(profile.id);
    setSessions(userSessions);
    setCurrentSession(userSessions[0] || null);
    showToast('Reset to default sample data.');
  };

  const login = async (email: string, name?: string, isNewAccount = false) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const profiles = await storageService.getProfiles();
      const existing = profiles.find(p => p.email?.toLowerCase().trim() === cleanEmail);
      const isFirst = !existing;
      if (isNewAccount && existing) {
        showToast('This rider already exists. Use Sign In.');
        return;
      }
      const rider: UserProfile = existing || {
        id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        displayName: name?.trim() || 'Rider', email: cleanEmail, instagramHandle: '',
        preferredTheme: profile?.preferredTheme || 'system', savedSetups: [],
        availableObstacles: ['flatground', 'ledge', 'rail', 'manual_pad'],
        bookmarks: [], poolPresets: [],
      };
      if (!existing) await storageService.saveProfile(rider);
      await storageService.switchProfile(rider.id);
      const riderSessions = await storageService.getSessions(rider.id);
      profileRef.current = rider;
      setProfile(rider);
      setActiveSetupState(rider.savedSetups.find(s => s.id === rider.defaultSetupId)
        || rider.savedSetups[0] || DEFAULT_FALLBACK_SETUP);
      setSessions(riderSessions);
      setCurrentSession(riderSessions.find(s => s.status === 'pending' && !s.sessionEndedAt) || null);
      setIsLoggedIn(true);
      setIsFirstLogin(isFirst);
      localStorage.setItem('ktnk_auth_status', 'logged_in');
      localStorage.setItem('ktnk_rider_is_first_login', String(isFirst));
      setActiveTab('home');
      requestAnimationFrame(() => requestAnimationFrame(() =>
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })));
      showToast(isFirst ? `Welcome to the Dark Slide, ${rider.displayName}.`
        : `Welcome back, ${rider.displayName}.`);
    } catch { showToast('Could not load this rider. Please try again.'); }
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('ktnk_auth_status', 'logged_out');
    setActiveTab('home');
    showToast('Signed out. Switched to guest mode.');
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
        setActiveTab,
        profile,
        activeSetup,
        setActiveSetup,
        sessions,
        currentSession,
        setCurrentSession,
        startNewSession,
        repeatChallenge,
        toggleBookmark,
        savePoolPreset,
        deletePoolPreset,
        setTrickLearningStatus,
        saveDashboardPreferences,
        updateSession,
        deleteSession,
        deleteSessions,
        resumeSession,
        updateProfile,
        resetDemoData,
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
