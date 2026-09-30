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
    login,
    profile,
    isSignInModalOpen,
    setIsSignInModalOpen,
  } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);

  const accountSectionRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    login(email.trim(), name.trim() || undefined, isCreatingAccount);
    // After logging in or creating account, default page is the homepage
    setActiveTab('home');
    setIsSignInModalOpen(false);
  };

  const handleQuickDemoLogin = () => {
    login('rider@fingerboardlab.local', 'Demo Rider', false);
    setActiveTab('home');
    setIsSignInModalOpen(false);
  };

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
              {isFirstLogin ? `Welcome to the Dark Slide, ${riderDisplayName}.` : `Welcome back, ${riderDisplayName}.`}
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
                Build muscle memory, track landing rates, and analyze your deck hardware.
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
          className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-sm transition-colors"
        >
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isCreatingAccount ? 'Create Your Rider Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Save personal hardware setups, practice streaks, and trick stats locally.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isCreatingAccount && (
              <div>
                <label
                  htmlFor="rider-name-input"
                  className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Rider Display Name
                </label>
                <input
                  id="rider-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivers (Street Tech)"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="rider-email-input"
                className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Email Address
              </label>
              <input
                id="rider-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@fingerboardlab.local"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-1 text-xs"
            >
              {isCreatingAccount ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isCreatingAccount ? 'Create Account & Enter Lab' : 'Sign In'}</span>
            </button>

            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
              >
                {isCreatingAccount ? 'Already have an account? Sign In' : 'Need an account? Create one'}
              </button>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Quick Sign In (Guest Demo Profile)</span>
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Lab Capabilities & Engine Features Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Lab Capabilities & Engine Features
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Engineered with realistic skateboarding physics, canonical terminology, and zero random string slop.
          </p>
        </div>

        {/* Interactive Trick Generator Sandbox Demo */}
        <TrickMatrixDemo onPromptAuth={handlePromptAuth} />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Dices className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Deterministic Trick Generation
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Curated trick catalog respecting true board rotations (e.g. Backside Pop Shuvit vs Frontside Pop Shuvit), body varials ("Sex Change" alias), and landing modifiers.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Category Locks & Item Pools
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Lock any parameter to a fixed value, or filter the item pool to exclude tricks you dislike (e.g. randomize only Regular and Nollie while excluding Switch and Fakie).
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Combo Transition Physics
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Step 2 stance is strictly derived from Step 1 rotation and landing mechanics. Landing in manual restricts follow-up tricks to cataloged pop-outs.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Practice Timer & Counters
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Timestamp-based active duration timer (excluding paused time) that survives page reloads. Includes quick Attempt (+1), Landing (+1), Undo, and Stop Session.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Batch History & Recharts
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Multi-select rows for batch deletion, deep filtering, and visual frequency histograms, status distribution donut charts, and timeline graphs.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Instant Share Card Generator
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Export high-resolution session graphic cards rendered via HTML5 canvas with your trick name, attempts, landing rate, and hardware specs.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            App Roadmap & Future Iterations
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            What we are building next for The Dark Slide.
          </p>
        </div>

        <div className="space-y-4">
          {/* Milestone 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Phase 1: Deterministic Engine & Local Session Tracking
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">
                  Completed
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Core catalog, compatibility validator, category locks, item pool filtering, combo transitions, obstacle mode, hardware setup snapshots, multi-select history, and canvas share card.
              </p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Phase 2: Cloud Firestore Sync & Firebase Auth
                <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                  In Design
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Replacing the localStorage service with Firebase Authentication and Cloud Firestore for seamless cross-device synchronization between mobile and desktop.
              </p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Phase 3: Turn-Based Game of S.K.A.T.E. Mode
                <span className="text-[10px] font-mono uppercase bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                  Planned
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Digital referee mode for Game of S.K.A.T.E. with offensive/defensive rounds, trick validation, letter tracking (S-K-A-T-E), and offense challenge rolls.
              </p>
            </div>
          </div>

          {/* Milestone 4 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Phase 4: Expanded Grind Catalog & Video Clip Logs
                <span className="text-[10px] font-mono uppercase bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                  Planned
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Support for advanced grinds (Crooked, Smith, Feeble, Overcrook, Bluntslides) and optional video clip attachment to practice records.
              </p>
            </div>
          </div>
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
              ? 'Save personal hardware setups, practice streaks, and trick stats locally.'
              : 'Enter your email to sign back into your saved rider profile.'}
          </p>

          <form
            onSubmit={(e) => {
              handleSubmit(e);
              setIsSignInModalOpen(false);
            }}
            className="space-y-3.5 text-xs"
          >
            {isCreatingAccount && (
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Rider Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivers (Street Tech)"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@fingerboardlab.local"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-1 text-xs"
            >
              {isCreatingAccount ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isCreatingAccount ? 'Create Account & Enter Lab' : 'Sign In'}</span>
            </button>

            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
              >
                {isCreatingAccount ? 'Already have an account? Sign In' : 'Need an account? Create one'}
              </button>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickDemoLogin();
                    setIsSignInModalOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Quick Sign In (Guest Demo Profile)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
