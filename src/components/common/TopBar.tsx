import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeProvider';
import { Sun, Moon, Monitor, Instagram, LogIn, LogOut, ExternalLink } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { activeTab, setActiveTab, profile, isLoggedIn, logout, openSignIn } = useApp();
  const { theme, setTheme } = useTheme();

  const cleanInstagramHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
  };

  const instagramUser = cleanInstagramHandle(profile?.instagramHandle);

  return (
    <header className="border-b border-[#cdbda7] dark:border-neutral-800 bg-[#eee5d7]/95 dark:bg-neutral-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
              style={{ animation: "none", boxShadow: "none" }}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
              THE DARK SLIDE
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links - Shown only when logged in */}
        {isLoggedIn && (
          <nav className="flex items-center gap-1 sm:gap-5" aria-label="Main Navigation">
            <button
              onClick={() => setActiveTab('home')}
              style={{ animation: "none", boxShadow: "none" }}
              className={`text-xs sm:text-sm font-medium transition-colors py-1 cursor-pointer ${
                activeTab === 'home'
                  ? 'text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#8A6500] dark:border-[#D4A72C] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              style={{ animation: "none", boxShadow: "none" }}
              className={`text-xs sm:text-sm font-medium transition-colors py-1 cursor-pointer ${
                activeTab === 'generator'
                  ? 'text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#8A6500] dark:border-[#D4A72C] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Trick Lab
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{ animation: "none", boxShadow: "none" }}
              className={`text-xs sm:text-sm font-medium transition-colors py-1 cursor-pointer ${
                activeTab === 'history'
                  ? 'text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#8A6500] dark:border-[#D4A72C] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{ animation: "none", boxShadow: "none" }}
              className={`text-xs sm:text-sm font-medium transition-colors py-1 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#8A6500] dark:border-[#D4A72C] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Rider Profile
            </button>
          </nav>
        )}

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
