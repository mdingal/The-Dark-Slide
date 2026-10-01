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
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const accountSectionRef = useRef<HTMLDivElement | null>(null);

  const handlePromptAuth = () => {
    setIsCreatingAccount(true);
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
            <div className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
              THE DARK SLIDE
            </div>
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
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
              THE DARK SLIDE
            </h1>
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
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
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

      {/* Account Creation / Quick Login Card: Shown ONLY when NOT logged in */}
      {!isLoggedIn && (
        <section
          ref={accountSectionRef}
          id="account-section"
          className="homepage-account-card max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-sm transition-colors"
        >
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isCreatingAccount ? 'Create Your Rider Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Save your setups, practice sessions, and progress securely to your account.
            </p>
          </div>

          <AccountForm onSuccess={() => setIsSignInModalOpen(false)} />
        </section>
      )}

      {/* Everything You Need to Progress Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Everything You Need to Progress
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Find your next challenge, make every attempt count, and see how your riding evolves.
          </p>
        </div>

        {/* Interactive Trick Generator Sandbox Demo */}
        <TrickMatrixDemo onPromptAuth={handlePromptAuth} />

        {/* Feature Grid */}
        <div className="homepage-feature-grid grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {[
            {
              icon: Dices,
              title: "Tricks That Make Sense",
              description: "Generate valid flatground challenges across Regular, Fakie, Switch, and Nollie, with FS / BS variations, body varials, manuals, and reverts."
            },
            {
              icon: Sliders,
              title: "Locks, Pools & Presets",
              description: "Lock any parameter, choose what stays in each pool, and use Select All or Select None. Save pool presets to return to your favorite practice mix."
            },
            {
              icon: Layers,
              title: "Combos & Obstacle Challenges",
              description: "Build connected two-trick combos or practice grinds and slides on ledges and rails. Randomize or lock the obstacle, entry, transfer, and exit."
            },
            {
              icon: Sparkles,
              title: "Choose Your Challenge Level",
              description: "Filter for Beginner, Intermediate, or Advanced challenges based on trick complexity. Rate how difficult the session felt separately when you finish."
            },
            {
              icon: Clock,
              title: "Every Attempt Counts",
              description: "Track attempts, successful landings, active practice time, and session notes. Undo an entry, then finish with a Pending, Success, or Failed status and difficulty rating."
            },
            {
              icon: CheckCircle2,
              title: "First Lands & Consistency Goals",
              description: "Record the attempt number and elapsed time at your first landing. Track current and best landing streaks, and set a goal for consecutive makes."
            },
            {
              icon: Layers,
              title: "Your Personal Trick Library",
              description: "Organize tricks as Want to Learn, Learning, Landed, or Consistent. Keep each exact variation connected to its session history and progress."
            },
            {
              icon: Dices,
              title: "Repeat & Bookmark Challenges",
              description: "Bookmark challenges worth keeping and repeat a saved trick or combo in a fresh session. Revisit unfinished goals without losing your earlier results."
            },
            {
              icon: Sliders,
              title: "Find Your Weak Points",
              description: "Tag misses as underflip, overflip, missed catch, missed lock-in, or slipped out. See the most common issues for each trick in your library."
            },
            {
              icon: Trophy,
              title: "Personal Bests & Progress Dashboard",
              description: "Track fewest attempts to first landing, highest landing rate, and longest streak per trick. Explore filtered history and charts, open session details, or delete individual and selected records."
            },
            {
              icon: Layers,
              title: "Compare Your Setups",
              description: "Save deck sizes, wheel materials, and deck, truck, and wheel models. Compare landing rates across setups or components, with an exact-trick filter for focused comparisons."
            },
            {
              icon: Share2,
              title: "Share Your Progress",
              description: "Export a share card after finishing a session. Keep your library, bookmarks, presets, setups, and history under your rider profile, saved in this browser, with Light, Dark, and System themes."
            }
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-7 space-y-4"
            >
              <div className="w-9 h-9 rounded-lg bg-[#D4A72C]/10 text-[#8A6500] dark:text-[#D4A72C] flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About the Project */}
      <section className="homepage-about-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          About the Project
        </h2>

        <div className="w-full space-y-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            The Dark Slide is a fingerboarding practice companion built for those
            moments when you want to ride but aren't sure what to try next.
            Generate a challenge, explore a new combo, or take your session to
            a ledge or rail.
          </p>

          <p>
            Make each challenge your own. Lock the tricks and parameters you want
            to work on, choose what stays in your pool, and let the generator
            mix up the rest. Whether you're dialing in the basics or chasing
            something harder, there's always another line to explore.
          </p>

          <p>
            Track your attempts, landings, practice time, and setup to see how
            your sessions develop. Use your history to revisit unfinished
            challenges, spot patterns, and recognize the progress that's easy
            to miss between tries.
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
        title={isCreatingAccount ? 'Create Your Rider Account' : 'Sign In to Your Account'}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isCreatingAccount
              ? 'Save your setups, practice sessions, and progress securely to your account.'
              : 'Sign in with your email and password to access your progress.'}
          </p>

          <AccountForm onSuccess={() => setIsSignInModalOpen(false)} />
        </div>
      </Modal>
    </div>
  );
};
