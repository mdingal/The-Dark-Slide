import {navigate,readTab,dashboardRoute} from './domain/routes';
import {requestDashboardView} from './domain/dashboardEntry';
import {AppErrorBoundary} from './components/common/AppErrorBoundary';
import {BetaTools} from './components/common/BetaTools';
import {RiderOnboarding} from './components/auth/RiderOnboarding';
import React from 'react';
import { InfoPage, InfoPageId, readInfoPage } from './components/info/InfoPage';
import { SiteFooter } from './components/info/SiteFooter';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeProvider';
import { TopBar } from './components/common/TopBar';
import { Toast } from './components/common/Toast';
import { GeneratorPage } from './components/generator/GeneratorPage';
const HistoryDashboard=React.lazy(()=>import('./components/dashboard/HistoryDashboard').then(m=>({default:m.HistoryDashboard})));
const ProfileSettingsPage=React.lazy(()=>import('./components/settings/ProfileSettingsPage').then(m=>({default:m.ProfileSettingsPage})));
import { LandingPage } from './components/landing/LandingPage';
const TrickLibraryPage=React.lazy(()=>import('./components/library/TrickLibraryPage').then(m=>({default:m.TrickLibraryPage})));

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, profile, authLoading, authError, refreshAccount } = useApp();

  const [infoPage, setInfoPage] = React.useState<InfoPageId | null>(readInfoPage);
  const dashboardPreferencesRef=React.useRef(profile?.dashboardPreferences);
  dashboardPreferencesRef.current=profile?.dashboardPreferences;
  const [,setRouteRevision]=React.useState(0);
  const unknownRoute=!readInfoPage()&&!readTab();
  const needsOnboarding=isLoggedIn && !!profile?.onboarding && !profile.onboarding.completedAt;
  const closeInfoPage = () => { setInfoPage(null); };
  React.useEffect(() => {
    const sync=()=>{
      setRouteRevision(v=>v+1);
      const legacy=window.location.hash.replace(/^#\/?/,'');
      if(legacy){navigate(legacy==='trick-guide'?'/trick-guides':'/'+legacy,true);return;}
      setInfoPage(readInfoPage());
      const tab=readTab();
      if(tab){
        // Route synchronization must not trigger a new practice configuration.
        window.dispatchEvent(new CustomEvent('route-tab-change',{detail:tab}));
        if(tab==='history'){const view=dashboardRoute();requestDashboardView(view);window.dispatchEvent(new CustomEvent('dashboard-view-change',{detail:{...dashboardPreferencesRef.current,view,category:'Progress'}}));}
      }
      const title=location.pathname.startsWith('/trick-guides/')?decodeURIComponent(location.pathname.split('/')[2]).replaceAll('-',' '):location.pathname.split('/').filter(Boolean).join(' · ').replaceAll('-',' ')||'Fingerboard Trick Generator & Practice Tracker';
      document.title=title+' | The Dark Slide';
      document.querySelector('meta[name="description"]')?.setAttribute('content',location.pathname.startsWith('/trick-guides')?'Learn fingerboard tricks with prerequisites, finger positioning, practice tips, and common mistakes.':'Generate fingerboard tricks and combos, track practice sessions, and learn with The Dark Slide · Fingerboard Lab.');
      let robots=document.querySelector<HTMLMetaElement>('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}robots.content=/^\/(dashboard|rider-profile|trick-library|trick-lab)(\/|$)/.test(location.pathname)?'noindex,follow':'index,follow';
      let canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}canonical.href=location.origin+location.pathname;
    };
    sync();window.addEventListener('app-route-change',sync);window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
    const links=(e:MouseEvent)=>{const a=(e.target as HTMLElement).closest('a');if(!a||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;const u=new URL(a.href);if(u.origin===location.origin&&!u.hash){e.preventDefault();navigate(u.pathname+u.search);}};
    document.addEventListener('click',links);
    return()=>{window.removeEventListener('app-route-change',sync);window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);document.removeEventListener('click',links);};
  },[]);
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
        <BetaTools />
        <AppErrorBoundary><React.Suspense fallback={<p role="status" className="p-6 text-sm">Loading page…</p>}>
        {unknownRoute ? <section className="rounded-xl border border-neutral-700 p-8 space-y-4"><h1 className="text-2xl font-bold">Page not found</h1><a href="/" className="underline text-[#D4A72C]">Return home</a></section> : needsOnboarding ? <RiderOnboarding key={profile?.id} /> : infoPage ? <InfoPage page={infoPage} onHome={() => { closeInfoPage(); setActiveTab('home'); }} /> : <>
        {authLoading && <p role="status" className="text-center py-8">Loading your account…</p>}
        {authError && <div role="alert" className="text-center py-4">{authError} <button className="underline" onClick={() => void refreshAccount()}>Retry</button></div>}
        {(!authLoading && (!isLoggedIn || activeTab === 'home')) && <LandingPage />}
        {isLoggedIn && activeTab === 'generator' && <GeneratorPage key={profile?.id} />}
        {isLoggedIn && activeTab === 'history' && <HistoryDashboard key={profile?.id} />}
        {isLoggedIn && activeTab === 'library' && <TrickLibraryPage key={profile?.id} />}
        {isLoggedIn && activeTab === 'settings' && <ProfileSettingsPage />}
        </>}
        </React.Suspense></AppErrorBoundary>
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
