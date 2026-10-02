import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeProvider';
import { Sun, Moon, Monitor, Instagram, LogIn, LogOut, ExternalLink } from 'lucide-react';

type MainTab = 'home' | 'history' | 'generator' | 'library' | 'settings';
export const TopBar: React.FC<{ currentPage: string | null; onNavigate: (tab: MainTab) => void }> = ({ currentPage, onNavigate }) => {
  const { activeTab, profile, isLoggedIn, logout, openSignIn } = useApp();
  const { theme, setTheme } = useTheme();

  const cleanInstagramHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
  };

  const instagramUser = cleanInstagramHandle(profile?.instagramHandle);

  return (
    <header className="border-b border-[#cdbda7] dark:border-neutral-800 bg-[#eee5d7]/95 dark:bg-black backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap gap-3 items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
              style={{ animation: "none", boxShadow: "none" }}
            className="text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A72C]"
          >
            {!isLoggedIn && activeTab === 'home' ? (
              <BrandLogo monogram className="w-14" />
            ) : (
              <BrandLogo className="w-36 sm:w-40" />
            )}
          </button>
        </div>

        {/* Main navigation */}
        {isLoggedIn && <nav className="order-last w-full lg:order-none lg:w-auto flex items-center justify-center gap-4 sm:gap-5 overflow-x-auto whitespace-nowrap" aria-label="Main Navigation">
          {(isLoggedIn ? [
            { id: 'home', label: 'Home' },
            { id: 'history', label: 'Dashboard' },
            { id: 'generator', label: 'Trick Lab' },
            { id: 'library', label: 'Trick Library' },
            { id: 'trick-guide', label: 'Trick Guides' },
            { id: 'settings', label: 'Rider Profile' },
          ] : [{ id: 'home', label: 'Home' }, { id: 'trick-guide', label: 'Trick Guides' }]).map(tab => {
            const selected = tab.id === 'trick-guide' ? currentPage === 'trick-guide' : !currentPage && activeTab === tab.id;
            return <button key={tab.id} type="button" aria-current={selected ? 'page' : undefined}
              onClick={() => tab.id === 'trick-guide' ? window.location.hash = '/trick-guide' : onNavigate(tab.id as MainTab)}
              style={{ animation: 'none', boxShadow: 'none' }}
              className={`text-xs sm:text-sm font-medium py-1 cursor-pointer whitespace-nowrap ${selected
                ? 'text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#8A6500] dark:border-[#D4A72C] font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'}`}>
              {tab.label}
            </button>;
          })}
        </nav>}

        {/* Zone 3: Actions, Instagram, Auth & Theme Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Instagram quick link */}
          {instagramUser && (
            <a
              href={`https://instagram.com/${instagramUser}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit @${instagramUser} on Instagram`}
              className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}

          {/* Theme segmented toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setTheme('light')}
              style={{ animation: "none", boxShadow: "none" }}
              title="Light theme"
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#D4A72C] text-[#292524]'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{ animation: "none", boxShadow: "none" }}
              title="Dark theme"
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'text-[#8A6500] dark:text-[#D4A72C]'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              style={{ animation: "none", boxShadow: "none" }}
              title="System theme"
              aria-label="System theme"
              aria-pressed={theme === 'system'}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Login / Logout button */}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              title="Sign out of local account"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
