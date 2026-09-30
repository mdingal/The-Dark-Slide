import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PracticeSession, UserProfile, SetupData, GeneratedTrickResult, SessionStatus } from '../domain/types';
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
  activeTab: 'home' | 'generator' | 'history' | 'settings';
  setActiveTab: (tab: 'home' | 'generator' | 'history' | 'settings') => void;
  profile: UserProfile | null;
  activeSetup: SetupData | null;
  setActiveSetup: (setup: SetupData) => void;
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  setCurrentSession: (session: PracticeSession | null) => void;
  startNewSession: (result: GeneratedTrickResult) => Promise<PracticeSession>;
  updateSession: (updated: PracticeSession) => Promise<void>;
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
  login: (email: string, name?: string, isNewAccount?: boolean) => void;
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
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'history' | 'settings'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSetup, setActiveSetupState] = useState<SetupData | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    }
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

    if (currentSession && currentSession.timerState.isRunning) {
      const finalized = {
        ...currentSession,
        timerState: stopTimer(currentSession.timerState),
      };
      await storageService.saveSession(profile.id, finalized);
    }

    const newSession: PracticeSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trickResult: result,
      setupSnapshot: { ...currentSetupSnapshot },
      status: 'pending',
      generatedAt: new Date().toISOString(),
      sessionStartedAt: undefined,
      sessionEndedAt: undefined,
      attemptCount: 0,
      landingCount: 0,
      activeDurationMs: 0,
      timerState: createInitialTimerState(),
      difficultyRating: currentSetupSnapshot.difficultyRating || 3,
      notes: '',
      history: [],
    };

    await storageService.saveSession(profile.id, newSession);
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
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
    setProfile(updatedProfile);
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

  const login = (email: string, name?: string, isNewAccount: boolean = false) => {
    setIsLoggedIn(true);
    localStorage.setItem('ktnk_auth_status', 'logged_in');

    const cleanEmail = email.toLowerCase().trim();
    const riderKey = `ktnk_rider_visits_${cleanEmail}`;
    const visitCount = parseInt(localStorage.getItem(riderKey) || '0', 10);
    const isFirst = isNewAccount === true || visitCount === 0;

    setIsFirstLogin(isFirst);
    localStorage.setItem('ktnk_rider_is_first_login', isFirst ? 'true' : 'false');
    localStorage.setItem(riderKey, (visitCount + 1).toString());

    const riderDisplayName = name?.trim() || 'Rider';

    if (isFirst || isNewAccount) {
      // New account: empty Instagram handle & empty hardware setups
      const newProfile: UserProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        displayName: riderDisplayName,
        instagramHandle: '',
        email: cleanEmail,
        preferredTheme: profile?.preferredTheme || 'system',
        defaultSetupId: undefined,
        savedSetups: [],
        availableObstacles: ['flatground', 'ledge', 'rail', 'manual_pad'],
      };
      storageService.saveProfile(newProfile);
      storageService.switchProfile(newProfile.id);
      setProfile(newProfile);
      setActiveSetupState(DEFAULT_FALLBACK_SETUP);
      setSessions([]);
      setCurrentSession(null);
    } else if (profile) {
      const updated = {
        ...profile,
        email: cleanEmail,
        displayName: name?.trim() || profile.displayName,
      };
      updateProfile(updated);
    }
    setActiveTab('home');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    });
    showToast(isFirst ? `Welcome to the Dark Slide, ${riderDisplayName}.` : `Welcome back, ${riderDisplayName}.`);
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
