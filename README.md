# KTNK'S FINGERBOARD LAB

A deterministic fingerboard trick generator, combo transition engine, and session practice tracker built with React, Vite, TypeScript, and Tailwind CSS.

## Key Features & New Capabilities

- **Category Locks & Granular Pool Exclusions**: Lock any category to a fixed value, or use the "Pool" selector to exclude specific items from randomization (e.g. randomize only Regular and Nollie while excluding Switch and Fakie).
- **Two-Trick Combo Sequence**: Full dropdown controls, category locks, and individual item pool filters for both Step 1 and Step 2.
- **Obstacle Mode**: Modular approach side (Frontside/Backside), entry tricks, grinds/slides, and exit transitions with locking and item pool exclusions.
- **Practice Session**: Practice timer with active duration tracking (excluding paused time), Pause/Resume, Stop Session, Setup selector dropdown, Attempt (+1), Landing (+1), and Undo counters.
- **Share Progress Card**: Instant PNG export generated via HTML5 canvas displaying your session metrics, trick challenge, landing rate, and deck hardware.
- **Multi-Select History Dashboard**: Checkbox selection with batch deletion, advanced filters (status, date, stance, deck width, wheel material, obstacle), and interactive Recharts visualizations.
- **Hardware Setups**: Manage decks with width presets (`26`, `29`, `31`, `32`, `33`, `33.6`, `34`, `36`, custom mm), wheel materials (`plastic`, `urethane`, `resin`), shapes (`popsicle`, `boxy`, `cruiser`, `egg`, `old_school`), and molds (`medium`, `low`, `high`, `flat`).
- **Rider Profile & Social**: Connect Instagram handle with direct link badge, personalize display name, and login/logout of local rider account.
- **Features & Roadmap Page**: Interactive overview of current capabilities and future phases (Cloud Firestore sync, Game of S.K.A.T.E. digital referee, video clips).

## Architecture

The project cleanly separates domain logic, session management, persistence, and UI presentation:

```
src/
├── domain/
│   ├── types.ts              # Core domain models (tricks, combos, obstacles, sessions, setups, profiles)
│   ├── catalog.ts            # Curated catalog (ollie, kickflip, heelflip, pop shuvit, etc.)
│   ├── obstacleCatalog.ts    # Obstacles (flatground, ledge, rail, manual pad) and grinds/slides
│   ├── rules.ts              # Deterministic compatibility engine, lock filtering, conflict detection
│   ├── naming.ts             # Skateboarding canonical naming rules separated from generation rules
│   ├── comboEngine.ts        # Two-step combo sequence generator with physical stance & transition tracking
│   └── timer.ts              # Timestamp-based active practice timer math (excluding paused time)
├── services/
│   ├── storageInterface.ts   # IStorageService abstraction interface for future Firebase/Firestore swap
│   ├── localStorageService.ts# LocalStorage implementation with isolated profile namespaces
│   └── seedData.ts           # Realistic demo profiles, setups, and session history
├── context/
│   ├── AppContext.tsx        # Global app state (active session, profile switching, CRUD)
│   └── ThemeProvider.tsx     # Theme provider (light, dark, system with OS matchMedia)
├── components/
│   ├── common/               # TopBar, Modal, Toast
│   ├── generator/            # TrickDisplay, ParameterSelector with locks, ComboStepEditor, ObstaclePicker, PracticePanel
│   ├── dashboard/            # Metrics summary, HistoryFilters, HistoryTable with combo expansion, DashboardCharts
│   └── settings/             # ProfileSettingsPage, setup manager with mm presets & custom width validation
└── test/
    ├── rules.test.ts         # Tests: lock immutability, contradictory lock error detection, catalog validation
    ├── combo.test.ts         # Tests: stance transition physics, manual exit constraints, lock conflicts
    ├── timer.test.ts         # Tests: pause/resume elapsed duration math, formatting
    └── session.test.ts       # Tests: attempt & landing counters, undo history, setup snapshot immutability
```

---

## Supported Trick Rules

1. **Stance System**:
   - `regular`: Rider's standard forward stance.
   - `fakie`: Backward motion popped off the tail.
   - `switch`: Unnatural foot positioning forward.
   - `nollie`: Popped directly off the forward nose.

2. **Rotations & Direction Context**:
   - **Shuvits**: Direction reflects board rotation. Backside pop shuvit is the canonical clockwise (regular) 180° spin; frontside pop shuvit is counter-clockwise.
   - **Flips & 180s**: Direction reflects rider and board turning together (e.g. BS 180 Kickflip, Half Cab Kickflip in fakie).
   - **Obstacles**: Approach side (Frontside vs. Backside) dictates how the obstacle is mounted (e.g. FS 50-50, BS Boardslide).

3. **Body Varials (Sex Change)**:
   - Treated as a body rotation modifier. "Sex Change" is formatted as an alias for Kickflip + BS Body Varial, not an independently stacked random modifier.

4. **Landing Positions & Exits**:
   - `normal` (all four wheels)
   - `manual` (balances on rear wheels)
   - `nose_manual` (balances on nose wheels)
   - `revert` (180° surface pivot immediately upon landing)

5. **Combo Transition Engine**:
   - The stance of Step 2 is deterministically derived from Step 1's board rotation, body varials, and reverts.
   - Popping out of a manual restricts Step 2 to cataloged tricks compatible with manuals (Ollie, Kickflip, Heelflip, Pop Shuvit).
   - Contradictory manual locks produce a helpful error rather than silently altering a user lock.

---

## Known Catalog Limitations

- **Current Catalog Scope**: Ollie, Kickflip, Heelflip, Pop Shuvit, Frontside Pop Shuvit, 360 Shuvit, Tre Flip, Varial Kickflip, Hardflip, Inward Heelflip, and Impossible.
- **Unsupported Combinations**: Multi-flip variations (Double Flips, Tre Double Flips), Late Flips, and 360 inward variations are currently outside this catalog version (v1.0.0). When requested or locked, the system marks them as outside the current catalog rather than asserting they are impossible in skateboarding.
- **Grind/Slide Limitations**: Current obstacles cover 50-50, 5-0, Nosegrind, Boardslide, Noseslide, and Tailslide. Crooked grinds, Smith, Feeble, and Bluntslides will be introduced in subsequent catalog versions.

---

## Local Prototype & Storage Service

This release is explicitly configured as a **Local Demo Prototype**:
- Uses browser `localStorage` behind an `IStorageService` interface.
- Includes pre-seeded demo profiles with separate storage keys (`fb_app_sessions_v1_${profileId}`).
- Setup snapshots are cloned into every practice session so subsequent hardware changes do not mutate historical records.
- Ready to be swapped with Firebase Authentication and Cloud Firestore without modifying UI components.

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run automated test suite (Vitest)
npm test

# Typecheck and lint
npm run lint

# Build static files for deployment (e.g. Cloudflare Pages)
npm run build
```
