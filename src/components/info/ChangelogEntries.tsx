import React from 'react';

const entries = [{"title": "Community challenges and rider progression", "date": "October 3, 2026", "sha": "bb5a52c", "items": ["Daily and weekly challenges with completion tracking and submission totals.", "Milestones for first landings, streaks, and landing-rate improvements; a customizable rider showcase.", "Generate from selected tricks or your library, with stance and rotation choices.", "Username login, 48 Trick Guides, and a refreshed homepage."]}, {"title": "Cloud accounts and rider data", "date": "October 2, 2026", "sha": "659a032", "items": ["Email accounts, verification, password reset, and persistent sign-in.", "Practice records and rider settings sync across devices.", "Import backups or export your data as JSON or CSV."]}, {"title": "Progression tools and dashboard", "date": "October 1, 2026", "sha": "637577c", "items": ["Repeat and bookmark challenges, save pool presets, and organize your trick library.", "Track first landings, streaks, personal bests, and common misses.", "Explore dashboard insights and compare setups using trick, date, and setup filters."]}, {"title": "Trick Lab and session improvements", "date": "October 1, 2026", "sha": "a503597", "items": ["Improved obstacle randomization and grind or slide transfer controls.", "Finish sessions with a status and difficulty rating, then create a share card.", "Clearer trick names, pool selection, and a more compact practice workspace."]}, {"title": "Welcome to DARK SLIDE", "date": "September 30, 2026", "sha": "9a834f6", "items": ["Generate single tricks, combos, and obstacle challenges with locks and trick pools.", "Track attempts, landings, time, notes, and setups.", "Review your history and charts in light or dark mode."]}];

export const ChangelogEntries: React.FC = () => (
  <div className="space-y-8">
    {entries.map(entry => (
      <section key={entry.sha || 'unreleased'} className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 font-semibold text-[#8A6500] dark:text-[#D4A72C]">Release</span>
          {entry.date && <span>{entry.date}</span>}
          {entry.sha && <a href={`https://github.com/mdingal/The-Dark-Slide/commit/${entry.sha}`} target="_blank" rel="noopener noreferrer" className="font-mono underline underline-offset-4 hover:text-[#8A6500] dark:hover:text-[#D4A72C]">{entry.sha}</a>}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-950 dark:text-neutral-100">{entry.title}</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base leading-7 text-neutral-700 dark:text-neutral-300">
          {entry.items.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>
    ))}
  </div>
);
