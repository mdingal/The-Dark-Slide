import React from 'react';
import { INFO_LINKS, InfoPageId } from './InfoPage';
export const SiteFooter: React.FC<{ currentPage: InfoPageId | null }> = ({ currentPage }) => (
  <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 sm:py-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm text-neutral-900 dark:text-neutral-100"><strong>THE DARK SLIDE · Fingerboard Lab</strong>{' '}<span className="font-normal">by <a href="https://www.instagram.com/ktnk.fb/" target="_blank" rel="noopener noreferrer" className="text-[#8A6500] dark:text-[#D4A72C] hover:underline underline-offset-4">@ktnk.fb</a></span></p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {INFO_LINKS.map(link => <a key={link.id} href={`#/${link.id}`} aria-current={currentPage === link.id ? 'page' : undefined} className={`underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A72C] ${currentPage === link.id ? 'text-[#8A6500] dark:text-[#D4A72C]' : 'text-neutral-700 dark:text-neutral-300'}`}>{link.label}</a>)}
        </nav>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <p>© {new Date().getFullYear()} The Dark Slide.</p>
        <p>Your practice data is saved in this browser.</p>
      </div>
    </div>
  </footer>
);
