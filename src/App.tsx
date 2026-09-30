import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeProvider';
import { TopBar } from './components/common/TopBar';
import { Toast } from './components/common/Toast';
import { GeneratorPage } from './components/generator/GeneratorPage';
import { HistoryDashboard } from './components/dashboard/HistoryDashboard';
import { ProfileSettingsPage } from './components/settings/ProfileSettingsPage';
import { LandingPage } from './components/landing/LandingPage';

const AppContent: React.FC = () => {
  const { activeTab, isLoggedIn } = useApp();

  React.useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);


  return (
    <div className="cutting-mat-page min-h-screen flex flex-col bg-[#e8dfd1] dark:bg-neutral-950 text-[#292524] dark:text-neutral-100 transition-colors">
      <TopBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(!isLoggedIn || activeTab === 'home') && <LandingPage />}
        {isLoggedIn && activeTab === 'generator' && <GeneratorPage />}
        {isLoggedIn && activeTab === 'history' && <HistoryDashboard />}
        {isLoggedIn && activeTab === 'settings' && <ProfileSettingsPage />}
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-neutral-800 dark:text-neutral-200">
            <strong>THE DARK SLIDE {'\u00B7'} Fingerboard Lab</strong>{' '}
            <span className="font-normal">
              by{' '}
              <a href="https://www.instagram.com/ktnk.fb/"
                target="_blank" rel="noopener noreferrer"
                className="hover:underline underline-offset-4">
                @ktnk.fb
              </a>
            </span>
          </div>
          <div>
            <span>Deterministic Trick Rules · Stance Transition Physics</span>
          </div>
        </div>
      </footer>

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
