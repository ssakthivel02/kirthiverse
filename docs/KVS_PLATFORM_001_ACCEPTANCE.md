# KVS-PLATFORM-001 Acceptance Criteria

## Product outcome
Transform the current functional site into a distinctive, premium learner experience without introducing cloud identity or new child personal-data collection.

## Required experiences
- Premium responsive application shell.
- Original KirthiVerse visual identity and subject-world language.
- Learner onboarding stored locally.
- Today page with real progress-derived recommendations.
- Interactive Learning Worlds map for ten subjects.
- Improved subject, lesson, quiz, dashboard, Parent View and Guided Tutor experiences.
- Meaningful achievements and progression.
- Dark/light/system theme, larger text and reduced motion.
- Installable PWA and honest offline status.

## Prohibited content and behaviour
- No copied Times Tables Rock Stars characters, artwork or trade dress.
- No fake learner counts, reviews, schools or leaderboards.
- No unsupported AI claims.
- No public child profiles, chat or direct messaging.
- No cloud collection of child data in this release.
- No behavioural advertising or third-party trackers.

## Technical gates
- `pnpm install --frozen-lockfile` passes.
- Type-check, lint, build and dist validation pass.
- All routes work on direct refresh through GitHub Pages.
- No uncaught browser-console errors.
- No missing CSS, JavaScript, fonts or images.
- No secrets in repository or built assets.
- Route-level code splitting is implemented where beneficial.

## Test matrix
- Chrome, Edge and Firefox.
- Mobile width 320px and 390px.
- Tablet portrait and landscape.
- Desktop 1366px and 1920px.
- Keyboard-only navigation.
- Reduced-motion mode.
- Larger-text mode.
- Offline return visit.

## E2E flows
1. Guest onboarding → Today → recommended lesson.
2. Learning Worlds → subject → lesson completion → progress update.
3. Quiz attempt → explanation → retry incorrect → score persistence.
4. Guided Tutor subject/topic flow.
5. Dashboard, achievements and bookmark persistence after refresh.
6. Parent View local-device disclosure and progress report.
7. Export, validated import and reset confirmation.

## Production gate
The release remains on its feature branch until GitHub Actions, visual regression, accessibility checks and production-like preview validation pass. Merge through a reviewed pull request only.