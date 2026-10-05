import {RiderHomeSummary} from './RiderHomeSummary';
import { FeatureVisual } from './FeatureVisual';
import { BrandLogo } from '../common/BrandLogo';
import { AccountForm } from '../auth/AccountForm';
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Layers,
  Dices,
  Trophy,
  Share2,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  LogIn,
  Zap,
} from 'lucide-react';
import { TrickMatrixDemo } from './TrickMatrixDemo';
import { Modal } from '../common/Modal';

export const LandingPage: React.FC = () => {
  const {
    setActiveTab,
    isLoggedIn,
    isFirstLogin,
    profile,
    isSignInModalOpen,
    setIsSignInModalOpen,
  } = useApp();
  const [accountMode, setAccountMode] = useState<'signup'|'signin'|'reset'>('signup');
  const accountTitle = accountMode === 'signup' ? 'Create Your Rider Account' : accountMode === 'reset' ? 'Reset Your Password' : 'Sign In to Your Rider Account';
  const accountDescription = accountMode === 'signup' ? <>Save your setups, practice sessions, and progress<span className="block">securely to your account.</span></> : accountMode === 'reset' ? 'Enter your account email to receive a password reset link.' : <>Sign in with your username or email and password to<span className="block">access your saved progress.</span></>;
  const [featureGroup, setFeatureGroup] = useState('Generate & Learn');
  const accountSectionRef = useRef<HTMLDivElement | null>(null);

  const handlePromptAuth = () => {
    setAccountMode('signup');
    accountSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    const nameInput = document.getElementById('rider-name-input');
    if (nameInput) {
      nameInput.focus();
    }
  };

  const riderDisplayName = profile?.displayName || 'Rider';

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-4">
        {isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm tracking-widest text-neutral-600 dark:text-neutral-400">THE DARK SLIDE {'\u00b7'} FINGERBOARD LAB</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
              {isFirstLogin ? 'Welcome to the Dark Slide,' : 'Welcome back,'}
              <span className="block">{riderDisplayName}.</span>
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-neutral-800 dark:text-neutral-200 pt-1">
              What tricks are we cooking today?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h1><BrandLogo className="w-full max-w-[540px] mx-auto" /></h1>
            <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto space-y-1">
              <p className="leading-snug">
                The ultimate fingerboard trick generator, combo transition engine, and session practice tracker.
              </p>
              <p className="leading-snug">
                Build muscle memory, track landing rates, and analyze your progress.
              </p>
            </div>
          </div>
        )}

        {/* Launch Buttons: Shown ONLY when logged in */}
        {isLoggedIn && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className="homepage-launch-cta px-6 py-3 font-semibold text-sm rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Trick Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-sm rounded-xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              <span>View Dashboard</span>
            </button>
          </div>
        )}
      </section>

      {/* Everything You Need to Progress Section */}
      {isLoggedIn ? <RiderHomeSummary/> : <section className="space-y-8">
        <div className="homepage-practice-account-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl grid lg:grid-cols-2 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <TrickMatrixDemo embedded onPromptAuth={handlePromptAuth} />
          </div>
          <section ref={accountSectionRef} id="account-section" className="min-w-0 p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800">
            <div className="mb-6 space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#8A6500] dark:text-[#D4A72C]">Your rider account</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{accountTitle}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{accountDescription}</p>
            </div>
            <AccountForm mode={accountMode} onModeChange={setAccountMode} onSuccess={() => setIsSignInModalOpen(false)} />
          </section>
        </div>
      </section>}

      {/* Feature groups keep the homepage easy to scan. */}
      {!isLoggedIn && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 !mt-10 sm:!mt-12">
          <header className="space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#8A6500] dark:text-[#D4A72C]">Explore the lab</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Tools for Every Session</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Explore what you can generate, personalize, track, and learn.</p>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Explore features">
            {['Generate & Learn', 'Make It Yours', 'Track Sessions', 'Review Progress'].map(group => (
              <button key={group} type="button" aria-pressed={featureGroup === group}
                aria-controls="homepage-feature-panel" onClick={() => setFeatureGroup(group)}
                className={`px-3 py-3 rounded-lg border text-sm font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A72C] ${featureGroup === group
                  ? 'border-[#8A6500] dark:border-[#D4A72C] text-[#8A6500] dark:text-[#D4A72C] bg-[#D4A72C]/10'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-transparent hover:text-neutral-950 dark:hover:text-white'}`}>
                {group}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <h3 id="homepage-feature-group-heading" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{featureGroup}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">4 groups · 16 features</p>
          </div>
        <div id="homepage-feature-panel" role="region" aria-labelledby="homepage-feature-group-heading" className="homepage-feature-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 pt-2">
          {[
            {
              icon: Dices,
              group: 'Generate & Learn',
              title: "Tricks That Make Sense",
              description: "Generate valid tricks in Regular, Fakie, Switch, or Nollie, with FS / BS rotations, body varials, manuals, and reverts."
            },
            {
              icon: Sliders,
              group: 'Make It Yours',
              title: "Locks, Pools & Saved Challenges",
              description: "Lock parameters, customize item pools, and save presets. Bookmark exact challenges or repeat them in a fresh session."
            },
            {
              icon: Layers,
              group: 'Generate & Learn',
              title: "Combos & Obstacle Challenges",
              description: "Build two-trick combos or ledge and rail challenges. Customize the entry, grind or slide, transfer, and exit."
            },
            {
              icon: Sparkles,
              group: 'Generate & Learn',
              title: "Choose Your Challenge Level",
              description: "Choose Class C, B, or A for stance and specialty-trick access. Rate how difficult the session felt separately after practicing."
            },
            {
              icon: Clock,
              group: 'Track Sessions',
              title: "Sessions & Share Cards",
              description: "Log attempts, landings, time, miss tags, and notes. Set a goal, choose a regular or countdown timer, and park or finish with a difficulty rating and share card."
            },
            {
              icon: CheckCircle2,
              group: 'Track Sessions',
              title: "First Lands & Consistency Goals",
              description: "Track your first landing’s attempt number and time, your best streak, and goals for consecutive landings."
            },
            {
              icon: Layers,
              group: 'Make It Yours',
              title: "Your Personal Trick Library",
              description: "Track Want to Learn, Learning, Landed, and Consistent tricks. Link exact session histories and shuffle selected library challenges by learning status."
            },
            {
              icon: Dices,
              group: 'Make It Yours',
              title: "Your Rider Showcase",
              description: "Make your profile yours: add a bio and practice goal, choose an accent, and feature your setup, tricks, and earned milestones."
            },
            {
              icon: Sliders,
              group: 'Track Sessions',
              title: "Find Your Weak Points",
              description: "Tag missed attempts and identify your most common issues, from underflips to missed catches and lock-ins."
            },
            {
              icon: Trophy,
              group: 'Review Progress',
              title: "Personal Bests & Progress Dashboard",
              description: "Explore session history and personal bests for first landings, landing rates, and consecutive successes."
            },
            {
              icon: Layers,
              group: 'Review Progress',
              title: "Compare Your Setups",
              description: "Compare decks, trucks, and wheels, with an exact-trick filter to focus your setup comparisons."
            },
            {
              icon: Layers,
              group: 'Generate & Learn',
              title: "Learn with Trick Guides",
              description: "Explore 48 guides with prerequisites, finger positioning, technique tips, tutorial links, and recorded landing markers. Start practicing from any guide."
            },
            {
              icon: CheckCircle2,
              group: 'Make It Yours',
              title: "Your Selected Trick Pool",
              description: "Shuffle only the tricks you select, such as Kickflip, Tre Flip, or Impossible. Choose valid Regular, Nollie, Fakie, Switch, and None / FS / BS variations."
            },
            {
              icon: Sliders,
              group: 'Review Progress',
              title: "Your Dashboard, Your Focus",
              description: "Pin insights and filter history by trick, date, or setup. Sign in by username or email to sync across devices, and import or export your records."
            },
            {
              icon: Layers,
              group: 'Review Progress',
              title: "Milestones Worth Celebrating",
              description: "Celebrate first landings, new streak records, landing-rate improvements, and completed community challenges. Feature your favorites on your rider profile."
            },
            {
              icon: Share2,
              group: 'Track Sessions',
              title: "Daily & Weekly Challenges",
              description: "Join the shared daily or weekly challenge in Trick Lab. Track completion and submission totals, with a flatground alternative for obstacle weeks."
            }
          ].filter(feature => feature.group === featureGroup).map(({ title, description }, index) => (
            <div
              key={title}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4"
            >
              <header className="flex w-full items-center justify-between gap-3"><span className="shrink-0 text-[10px] font-mono tracking-widest text-[#8A6500] dark:text-[#D4A72C]">{String(index+1).padStart(2,'0')}</span><span className="text-right text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{featureGroup}</span></header>
              <FeatureVisual title={title} />
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* About the Project */}
      <section className="homepage-about-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 !mt-10 sm:!mt-12">
        <header className="space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-[#8A6500] dark:text-[#D4A72C]">ABOUT THE PROJECT</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          DARK SLIDE · Fingerboard Lab
        </h2>
        </header>

        <div className="w-full space-y-5 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            DARK SLIDE started with a familiar question: what should I try next?
            It's easy to fall back on the same comfortable tricks, lose track of
            what you've been working on, or overlook the small improvements
            between a missed catch and a clean landing.
          </p>

          <p>
            The idea is to give practice a little direction without taking away
            the freedom that makes fingerboarding fun. A new challenge can push
            you out of a routine. Returning to one can show you how much has
            changed. Neither has to turn every session into a test.
          </p>

          <p>
            Progress isn't always a new trick. Sometimes it's a cleaner catch,
            fewer attempts, or landing something three times in a row. DARK SLIDE
            exists to make those moments easier to notice, remember, and build on
            — at your own pace, on your own setup.
          </p>

          <p>
            Built by a fingerboarder, for fingerboarders, this project is a place
            to stay curious, work through the frustrating attempts, and give the
            small wins the credit they deserve. It keeps growing around that
            same purpose: helping you enjoy the process and keep coming back.
          </p>

          <p className="font-medium text-neutral-900 dark:text-neutral-200">
            Pick a challenge. Put in the attempts.{' '}
            <span className="relative inline-block pb-3 font-bold">
              Find your next breakthrough.
              <svg
                aria-hidden="true"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute bottom-0 left-0 w-full h-3 text-[#D4A72C] pointer-events-none"
              >
                <path
                  d="M4 12 C70 3, 190 3, 296 8 C215 7, 100 12, 20 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </p>
        </div>
      </section>

      {/* Sign In Popup Modal for when user clicks Sign In when far down the page */}
      <Modal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        title={accountTitle}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {accountDescription}
          </p>

          <AccountForm mode={accountMode} onModeChange={setAccountMode} onSuccess={() => setIsSignInModalOpen(false)} />
        </div>
      </Modal>
    </div>
  );
};
