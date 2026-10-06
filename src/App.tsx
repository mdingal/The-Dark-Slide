import {RiderOnboarding} from './components/auth/RiderOnboarding';
import React from 'react';
import { InfoPage, InfoPageId, readInfoPage } from './components/info/InfoPage';
import { SiteFooter } from './components/info/SiteFooter';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeProvider';
import { TopBar } from './components/common/TopBar';
import { Toast } from './components/common/Toast';
import { GeneratorPage } from './components/generator/GeneratorPage';
import { HistoryDashboard } from './components/dashboard/HistoryDashboard';
import { ProfileSettingsPage } from './components/settings/ProfileSettingsPage';
import { LandingPage } from './components/landing/LandingPage';
import { TrickLibraryPage } from './components/library/TrickLibraryPage';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, profile, authLoading, authError, refreshAccount } = useApp();

  const [infoPage, setInfoPage] = React.useState<InfoPageId | null>(readInfoPage);
  const needsOnboarding=isLoggedIn && !!profile?.onboarding && !profile.onboarding.completedAt;
  const previousTab = React.useRef(activeTab);
  const closeInfoPage = () => {
    if (readInfoPage()) window.location.hash = '';
    setInfoPage(null);
  };
  React.useEffect(() => {
    const onHashChange = () => setInfoPage(readInfoPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  React.useEffect(() => {
    if (previousTab.current !== activeTab) {
      previousTab.current = activeTab;
      if (readInfoPage()) window.location.hash = '';
      setInfoPage(null);
    }
  }, [activeTab]);

  React.useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);


  return (
    <div className={`${isLoggedIn&&!needsOnboarding?'mobile-has-navigation':''} cutting-mat-page min-h-screen flex flex-col bg-[#e8dfd1] dark:bg-neutral-950 text-[#292524] dark:text-neutral-100 transition-colors`}>
      <div className="sticky top-0 z-30">
      <TopBar onboarding={needsOnboarding} currentPage={infoPage} onNavigate={(tab) => { if(needsOnboarding)return; closeInfoPage(); setActiveTab(tab); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {needsOnboarding ? <RiderOnboarding key={profile?.id} /> : infoPage ? <InfoPage page={infoPage} onHome={() => { closeInfoPage(); setActiveTab('home'); }} /> : <>
        {authLoading && <p role="status" className="text-center py-8">Loading your account…</p>}
        {authError && <div role="alert" className="text-center py-4">{authError} <button className="underline" onClick={() => void refreshAccount()}>Retry</button></div>}
        {(!authLoading && (!isLoggedIn || activeTab === 'home')) && <LandingPage />}
        {isLoggedIn && activeTab === 'generator' && <GeneratorPage key={profile?.id} />}
        {isLoggedIn && activeTab === 'history' && <HistoryDashboard key={profile?.id} />}
        {isLoggedIn && activeTab === 'library' && <TrickLibraryPage key={profile?.id} />}
        {isLoggedIn && activeTab === 'settings' && <ProfileSettingsPage />}
        </>}
      </main>

      <SiteFooter currentPage={infoPage} className={isLoggedIn ? 'hidden lg:block' : ''} />

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
