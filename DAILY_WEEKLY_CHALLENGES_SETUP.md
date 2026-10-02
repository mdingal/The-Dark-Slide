# Daily and weekly community challenges

The sticky challenge bar is below the header. Participation is optional. Open a challenge to start its exact practice session or resume a linked session. Signing in saves participation to the rider's existing Firebase account.

Daily goal: one landing in a finished session. Weekly goal: three landings in one finished session, not necessarily consecutive. Obstacle weeks include a fixed flatground alternative. Ordinary generated sessions do not count. Finish before the deadline. Results are self-reported and private; there is no public ranking or media upload.

Daily changes at midnight Philippines (UTC+8). Weekly changes Monday midnight Philippines. Deadlines display in the rider's device timezone. The initial pool has 34 daily variations and 12 weekly challenges. Repetition begins after the pool cycles.

## Install and publish

Run the update installer in the project folder, then `npm run build`. Deploy the included Firestore rules before using the challenge bar:

```
npx firebase-tools deploy --only firestore:rules --project the-dark-slide-fe8a4
npm run admin:install
npm run challenges:preview
npm run challenges:publish
npm run dev
```

The publisher uses your existing local `.admin/service-account.json`. This file must belong to this Firebase project. Never upload it or commit it. The publisher previews then creates missing schedule documents; existing challenges are preserved. No Cloudflare change is needed.

The default schedule covers 60 days. Run the publisher monthly to extend it, or use `npm run challenges:publish -- --days 120`. Rotation uses published dates and requires no scheduled backend job. If publication runs out, the site displays an unpublished message. The preview is read-only; the publish command writes to your real Firebase project. Your normal Firebase Hosting deployment publishes the updated frontend separately.

Completion appears in Dashboard Overview and milestones, and can be featured in the rider showcase. Deleting linked sessions removes their derived completion. Export/import preserves session metadata; imported records remain self-reported. Do not change a challenge's target or dates after riders have started it.
