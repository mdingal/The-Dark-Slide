import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export type InfoPageId = 'about' | 'terms' | 'privacy' | 'contact';
export const INFO_LINKS: { id: InfoPageId; label: string }[] = [
  { id: 'about', label: 'About' }, { id: 'terms', label: 'Terms & Conditions' },
  { id: 'privacy', label: 'Privacy Policy' }, { id: 'contact', label: 'Contact & Feedback' },
];
export function readInfoPage(): InfoPageId | null {
  const id = window.location.hash.replace(/^#\/?/, '');
  return INFO_LINKS.some(link => link.id === id) ? id as InfoPageId : null;
}
const pages: Record<InfoPageId, { title: string; intro: string; sections: { title: string; text: string[] }[] }> = {
  about: {
    title: 'About The Dark Slide',
    intro: 'A fingerboarding practice companion created by @ktnk.fb. Find a challenge, put in the attempts, and see your progress take shape.',
    sections: [
      { title: 'Built for the next breakthrough', text: ['Explore flatground tricks, connected combos, and ledge or rail challenges. Locks, item pools, saved presets, and complexity filters help you focus on what you want to practice.'] },
      { title: 'Progress beyond the landing', text: ['Record attempts, landings, active time, notes, miss tags, and setup details. Track first landings and consecutive makes, build your personal trick library, and compare sessions and hardware.'] },
      { title: 'A personal practice space', text: ['The current version saves rider profiles and practice records in this browser. Bookmarks, library statuses, and presets stay with each local profile. Cloud sync and password authentication are not available yet.'] },
      { title: 'Made with the community in mind', text: ['Trick names, complexity levels, and transition rules are practical guides that can improve with rider feedback. Share a correction, feature idea, or bug report through the Contact & Feedback page.'] },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'These terms describe use of the current browser-based version of The Dark Slide, the project credited to @ktnk.fb.',
    sections: [
      { title: '1. Using the app', text: ['Use the app for personal fingerboarding practice and progress tracking. By using the service, you agree to these terms. If you do not agree, discontinue use. If you cannot legally agree to terms on your own, involve a parent or guardian.'] },
      { title: '2. Local rider profiles', text: ['The current sign-in flow selects a profile using an email address; it does not verify email ownership or use a password. Profiles and records are stored in your browser and are not secure cloud accounts. Anyone with access to the same browser may be able to access them.', 'Use accurate information you are entitled to provide, and do not put passwords, payment information, or sensitive personal information in session notes. Signing out does not erase saved records.'] },
      { title: '3. Responsible use', text: ['Do not use the app to distribute unlawful content, infringe others’ rights, impersonate others, attempt unauthorized access, or interfere with the service. Submit only content and images you have permission to use or share.'] },
      { title: '4. Your records and shared cards', text: ['You retain your rights in the notes and other content you enter. The app processes those records to provide its features. Generating a share card does not publish it automatically; you choose whether and where to share it. Review the information on a card before posting.'] },
      { title: '5. Practice guidance and results', text: ['Generated trick names, transition rules, complexity levels, and performance summaries are practice aids. They may contain errors and do not guarantee a landing or any particular improvement. Choose challenges appropriate to your skill, equipment, and surroundings.'] },
      { title: '6. Availability and local data', text: ['The service is provided as available. Features may change or be unavailable, and saved data may be lost if browser storage is cleared, the browser removes it, or the site address changes. The current app does not provide cloud backup or cross-device synchronization.', 'To the extent allowed by applicable law, no warranty is given that the service will be uninterrupted or error-free. These terms do not exclude rights or liabilities that applicable law does not allow to be excluded.'] },
      { title: '7. External services', text: ['Links to Instagram and other external sites are governed by those services’ terms and privacy practices. The Dark Slide does not control their availability or content.'] },
      { title: '8. Changes and contact', text: ['Changes to these terms will appear on this page with an updated date. Material changes to data handling or new paid features should be explained before they are introduced. Contact the project through @ktnk.fb on Instagram with questions.'] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This notice describes how the current version of The Dark Slide handles information. Rider records are saved in your browser rather than synchronized to a project database.',
    sections: [
      { title: '1. Information you enter', text: ['Local rider profiles may contain your display name, email address, Instagram handle, and saved setups. Practice records can include generated challenges, timestamps, attempts, landings, duration, first-landing measurements, streaks, miss tags, session status, difficulty ratings, and notes.', 'The app also saves bookmarks, pool presets, trick-library statuses, the selected profile, and theme preferences. It does not ask for a password or payment information.'] },
      { title: '2. How information is used', text: ['The app uses your entries to restore local profiles, generate challenges, save practice sessions, calculate statistics, compare setups, and create share cards. An email address identifies a local profile; this flow does not verify email ownership.'] },
      { title: '3. Browser storage and retention', text: ['Records and settings use localStorage on this site’s browser origin. They remain until you delete them, clear site data, or the browser removes them. They are not automatically shared between browsers, devices, or different site addresses.', 'Signing out leaves saved data in place. Someone using the same browser may be able to select or inspect local profiles. Avoid entering confidential information, particularly on a shared device.'] },
      { title: '4. Network requests and external services', text: ['The current application code does not send rider profiles or session records to a project database and does not include advertising or analytics trackers. Loading the website still involves requests to its hosting provider, which may process technical request information such as IP addresses and browser details under its own policies.', 'The page loads fonts from Google Fonts, which involves requests to Google’s servers and technical request information. Opening Instagram links or sending a message uses Instagram’s privacy practices. Information you voluntarily send in a support message is received through that service.'] },
      { title: '5. Sharing', text: ['Share cards are generated in the browser. The app does not post them automatically. When you download, send, or publish a card, the included information is shared according to your choice and the platform you use. The current app does not sell local rider records or use them for targeted advertising.'] },
      { title: '6. Viewing, correcting, and deleting data', text: ['View practice records in the Dashboard and edit supported profile and setup fields in Rider Profile. Delete individual or selected sessions from the Dashboard. Bookmarks, presets, and library entries have their own removal controls.', 'To remove all local records, use your browser’s settings to clear this site’s stored data. This removes every local rider profile and preference on that browser origin; demo records may be recreated when the app next loads. The project cannot retrieve or recover records that exist only in your browser.', 'You may have rights to access, correct, erase, or object to processing under applicable privacy law. For questions about information sent directly to the project, contact @ktnk.fb. If you are in the Philippines, you may also contact the National Privacy Commission about privacy concerns.'] },
      { title: '7. Children and sensitive information', text: ['This version does not request a birth date or verify age. If you are a minor, involve a parent or guardian before providing personal information or contacting the project. Do not enter sensitive personal information in notes or feedback.'] },
      { title: '8. Future changes and contact', text: ['If cloud accounts, payments, analytics, or other data services are introduced, this notice will need to explain their providers, purposes, retention, and user controls. The current notice does not claim those features exist.', 'For privacy questions, reach the project through @ktnk.fb on Instagram. This contact channel is hosted by a third party; avoid sending sensitive details in an initial message.'] },
    ],
  },
  contact: {
    title: 'Contact & Feedback',
    intro: 'Found a bug, spotted an unusual trick name, or have an idea for your next practice tool? Get in touch with @ktnk.fb on Instagram.',
    sections: [
      { title: 'Report a bug', text: ['Include the page or practice mode, what you clicked, what you expected, and what happened. A screenshot and browser name help. Remove personal information from screenshots before sending them.'] },
      { title: 'Suggest a feature or trick correction', text: ['Describe the practice problem you want to solve. For trick or transition corrections, include the stance, rotations, obstacle, and complete sequence so the rule can be checked.'] },
      { title: 'Privacy questions', text: ['Say that your message is a privacy question and describe your concern without sending passwords or sensitive information. Locally stored practice records cannot be accessed or recovered by the project through Instagram.'] },
    ],
  },
};

export const InfoPage: React.FC<{ page: InfoPageId; onHome: () => void }> = ({ page, onHome }) => {
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    const previousTitle = document.title;
    document.title = `${pages[page].title} · The Dark Slide`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
    return () => { document.title = previousTitle; };
  }, [page]);
  const content = pages[page];
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <a href="#" onClick={onHome} className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-[#8A6500] dark:hover:text-[#D4A72C]">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </a>
      <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-mono text-[#8A6500] dark:text-[#D4A72C]">The Dark Slide · Fingerboard Lab</p>
          <h1 ref={heading} tabIndex={-1} className="text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white focus:outline-none">{content.title}</h1>
          {(page === 'terms' || page === 'privacy') && <p className="text-xs text-neutral-600 dark:text-neutral-400">Last updated: October 1, 2026</p>}
          <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{content.intro}</p>
        </div>
        {content.sections.map(section => <section key={section.title} className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-100">{section.title}</h2>
          {section.text.map(text => <p key={text} className="text-sm sm:text-base leading-7 text-neutral-700 dark:text-neutral-300">{text}</p>)}
        </section>)}
        {page === 'privacy' && <div className="text-sm space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-5">
          <a href="https://privacy.gov.ph/data-privacy-act/" target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 text-[#8A6500] dark:text-[#D4A72C]">Philippine Data Privacy Act and privacy rights</a>
          <a href="https://developers.google.com/fonts/faq/privacy" target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 text-[#8A6500] dark:text-[#D4A72C]">Google Fonts privacy information</a>
        </div>}
        <a href="https://www.instagram.com/ktnk.fb/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4A72C] text-neutral-950 text-sm font-semibold hover:bg-[#e1b841]">Contact @ktnk.fb <ArrowUpRight className="w-4 h-4" /></a>
      </article>
    </div>
  );
};
