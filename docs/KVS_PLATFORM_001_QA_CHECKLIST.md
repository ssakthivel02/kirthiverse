# KVS-PLATFORM-001 Quality Gates

## Build gates

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm run type-check`
- [ ] `pnpm run lint`
- [ ] `pnpm run build`
- [ ] `pnpm run validate:dist`

## Homepage checks

- [ ] Hero renders at 320px, tablet and desktop widths.
- [ ] Both primary calls to action navigate correctly.
- [ ] Learner name and avatar appear only from existing local profile data.
- [ ] Lessons completed, XP and streak show real stored values.
- [ ] No unsupported user-count, AI or school-partnership claims.
- [ ] Reduced-motion preference suppresses decorative motion.

## Learning Worlds checks

- [ ] All ten world cards render.
- [ ] Lesson and quiz counts match repository content.
- [ ] Search works by subject, world name and description.
- [ ] All, In progress and Completed filters work.
- [ ] Progress values use stored lesson completion only.
- [ ] Every world card opens the correct subject route.
- [ ] Empty search state and reset action work.

## Accessibility checks

- [ ] Keyboard reaches every action.
- [ ] Focus indicators remain visible.
- [ ] Search input has an accessible label.
- [ ] Buttons have meaningful names.
- [ ] Colour contrast is reviewed.
- [ ] Touch targets are at least 44px where practical.

## Regression checks

- [ ] Existing lessons remain available.
- [ ] Existing quizzes remain available.
- [ ] Dashboard, Parent View, Guided Tutor and Progress Board remain reachable.
- [ ] Direct route refresh works on GitHub Pages.
- [ ] `CNAME` and `.nojekyll` are present in `dist`.
- [ ] Browser console has no uncaught errors.

## Release decision

The branch remains non-production until every mandatory check is complete and GitHub Actions is green.