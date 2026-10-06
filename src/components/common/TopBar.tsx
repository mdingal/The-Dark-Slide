import {navigate} from '../../domain/routes';
import {requestDashboardView} from '../../domain/dashboardEntry';
import React,{useState} from 'react';
import {dashboardPreferences} from '../../domain/dashboardAnalytics';
import {Modal} from './Modal';
import {Home,FlaskConical,BookOpen,BarChart3,Menu} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeProvider';
import { Bug, Sun, Moon, ChevronDown, Instagram, LogIn, LogOut, ExternalLink } from 'lucide-react';

type MainTab = 'home' | 'history' | 'generator' | 'library' | 'settings';
export const TopBar: React.FC<{ currentPage: string | null; onNavigate: (tab: MainTab) => void; onboarding?: boolean }> = ({ currentPage, onNavigate, onboarding=false }) => {
  const { activeTab, profile, isLoggedIn, logout, openSignIn, saveDashboardPreferences, showToast } = useApp();
  const [moreOpen,setMoreOpen]=useState(false);
  const { theme, setTheme } = useTheme();

  const [themeOpen,setThemeOpen]=useState(false);
  const cleanInstagramHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
  };

  const instagramUser = cleanInstagramHandle(profile?.instagramHandle);

  return (
    <> <header className="border-b border-[#cdbda7] dark:border-neutral-800 bg-[#eee5d7]/95 dark:bg-black backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap gap-3 items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
              style={{ animation: "none", boxShadow: "none" }}
            className="text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A72C]"
          >
            {onboarding || (!isLoggedIn && activeTab === 'home') ? (
              <BrandLogo monogram className="w-14" />
            ) : (
              <BrandLogo className="w-36 sm:w-40" />
            )}
          </button>
        </div>

        {/* Main navigation */}
        {isLoggedIn && !onboarding && <nav className="hidden lg:flex lg:flex-wrap lg:w-auto items-center justify-center gap-4" aria-label="Main Navigation">
          {([{id:'home',label:'Home'},{id:'generator',label:'Trick Lab'},{id:'history',label:'Dashboard'},{id:'faq',label:'FAQ'},{id:'settings',label:'Rider Profile'}] as const).map(tab=>{
            const selected=tab.id==='generator'?(!currentPage&&(activeTab==='generator'||activeTab==='library'))||currentPage==='trick-guide':tab.id==='faq'?currentPage==='faq':!currentPage&&activeTab===tab.id;
            const tabClass=`inline-flex items-center gap-2 py-2 text-sm font-medium cursor-pointer ${selected?'desktop-tab-active text-[#8A6500] dark:text-[#D4A72C] border-b-2 border-[#D4A72C]':'text-neutral-600 dark:text-neutral-400'}`;
            if(tab.id==='generator'||tab.id==='history')return <details key={tab.id} className="desktop-navigation-dropdown relative" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))e.currentTarget.open=false;}}><summary className={tabClass}>{tab.label} <ChevronDown aria-hidden="true" className="w-4 h-4 shrink-0"/></summary><div className="absolute top-full left-0 mt-2 min-w-56 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-[#eee5d7] dark:bg-neutral-950 shadow-xl p-2 z-50">{(tab.id==='generator'?[['generator','Trick Lab'],['library','Trick Library'],['trick-guide','Trick Guides']]:[['overview','Overview'],['history','Session History'],['analytics','Analytics'],['setups','Setup Comparisons']]).map(([id,label])=><button type="button" key={id} className="block w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-[#D4A72C]/10 focus-visible:outline-2 focus-visible:outline-[#D4A72C] cursor-pointer" onClick={async e=>{const details=e.currentTarget.closest('details');if(details)details.open=false;if(tab.id==='generator'){if(id==='trick-guide')navigate('/trick-guides');else onNavigate(id as MainTab);}else{try{const next={...dashboardPreferences(profile?.dashboardPreferences),view:id as 'overview'|'history'|'analytics'|'setups',category:'Progress' as const};await saveDashboardPreferences(next);onNavigate('history');requestDashboardView(next.view);navigate(next.view==='overview'?'/dashboard':'/dashboard/'+next.view);window.dispatchEvent(new CustomEvent('dashboard-view-change',{detail:next}));}catch{showToast('Could not open dashboard view. Try again.');}}}}>{label}</button>)}</div></details>;
            return <button key={tab.id} type="button" className={tabClass} aria-current={selected?'page':undefined} onClick={()=>tab.id==='faq'?navigate('/faq'):onNavigate(tab.id)}>{tab.label}</button>;
          })}
        </nav>}

        {/* Zone 3: Actions, Instagram, Auth & Theme Selector */}
        <div className="flex items-center gap-2 sm:gap-3"><button type="button" onClick={()=>window.dispatchEvent(new Event('open-beta-report'))} aria-label="Report a beta problem" title="Beta · Report a problem" className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:text-[#D4A72C] cursor-pointer"><Bug aria-hidden="true" className="w-4 h-4"/></button>
          {/* Instagram quick link */}
          {!onboarding && instagramUser && (
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

          <button type="button" onClick={()=>setThemeOpen(true)} aria-label="Choose color theme" aria-expanded={themeOpen} className="sm:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-neutral-300 dark:border-neutral-700">{theme==='light'?<Sun className="w-5 h-5 text-[#8A6500]"/>:<Moon className="w-5 h-5 text-[#D4A72C]"/>}</button>
          <Modal isOpen={themeOpen} onClose={()=>setThemeOpen(false)} title="Color theme"><div className="grid gap-3">{(['light','dark'] as const).map(value=><button key={value} type="button" aria-pressed={theme===value} onClick={()=>{setTheme(value);setThemeOpen(false);}} className={`flex items-center gap-3 p-4 rounded-xl border ${theme===value?'border-[#D4A72C] bg-[#D4A72C]/10':'border-neutral-300 dark:border-neutral-700'}`}>{value==='light'?<Sun className="w-5 h-5 text-[#8A6500]"/>:<Moon className="w-5 h-5 text-[#D4A72C]"/>}<span>{value==='light'?'Light mode':'Dark mode'}</span>{theme===value&&<span className="ml-auto text-xs">Selected</span>}</button>)}</div></Modal>
          {/* Theme segmented toggle */}
          <div className="hidden sm:flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
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

          </div>

          {/* Login / Logout button */}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              title="Sign out of your account"
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
    {isLoggedIn&&!onboarding&&<>
      <nav aria-label="Mobile navigation" className="mobile-bottom-navigation lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-neutral-300 dark:border-neutral-800 bg-[#eee5d7]/95 dark:bg-neutral-950/95 backdrop-blur-md grid grid-cols-5 px-2 pt-2" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))'}}>
        {([{id:'home',label:'Home',icon:Home},{id:'generator',label:'Trick Lab',icon:FlaskConical},{id:'library',label:'Library',icon:BookOpen},{id:'history',label:'Dashboard',icon:BarChart3}] as const).map(t=><button key={t.id} type="button" aria-current={!currentPage&&activeTab===t.id?'page':undefined} onClick={()=>onNavigate(t.id)} className={`flex flex-col items-center justify-center gap-1 rounded-xl min-h-14 text-[10px] font-semibold ${!currentPage&&activeTab===t.id?'text-[#8A6500] dark:text-[#D4A72C] bg-[#D4A72C]/10':'text-neutral-600 dark:text-neutral-400'}`}><t.icon className="w-5 h-5"/>{t.label}</button>)}
        <button type="button" onClick={()=>setMoreOpen(true)} aria-expanded={moreOpen} aria-current={currentPage||activeTab==='settings'?'page':undefined} className={`flex flex-col items-center justify-center gap-1 rounded-xl min-h-14 text-[10px] font-semibold ${currentPage||activeTab==='settings'?'text-[#8A6500] dark:text-[#D4A72C]':'text-neutral-600 dark:text-neutral-400'}`}><Menu className="w-5 h-5"/>More</button>
      </nav>
      <Modal isOpen={moreOpen} onClose={()=>setMoreOpen(false)} title="Your Dark Slide">
        <div className="grid gap-3">{[{id:'trick-guide',label:'Trick Guides',description:'Technique and prerequisites'},{id:'faq',label:'FAQ',description:'Answers about the app'},{id:'settings',label:'Rider Profile',description:'Your details, parts, and setups'}].map(t=><button type="button" key={t.id} className="text-left rounded-xl border border-neutral-200 dark:border-neutral-700 p-4" onClick={()=>{setMoreOpen(false);if(t.id==='settings')onNavigate('settings');else navigate(t.id==='trick-guide'?'/trick-guides':'/'+t.id);}}><span className="block font-semibold">{t.label}</span><span className="text-xs text-neutral-500">{t.description}</span></button>)}</div>
      </Modal>
    </>}
    </>
  );
};
