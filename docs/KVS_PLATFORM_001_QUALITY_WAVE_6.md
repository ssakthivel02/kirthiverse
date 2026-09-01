# KVS-PLATFORM-001 Quality Wave 6 — Real-browser release assurance

## Status

Implemented on `feature/kvs-platform-001-premium-experience`.

This wave converts several previously manual release checks into repeatable Chrome-based CI controls. It does not replace final human visual review, assistive-technology review or production verification.

## Completed quality tasks

1. Added a dependency-free Chrome DevTools Protocol smoke-test runner.
2. Added a production-artifact static server with single-page-route fallback.
3. Added direct-route HTTP status checks.
4. Added root-route browser rendering checks.
5. Added onboarding browser rendering checks.
6. Added learner Today-route checks.
7. Added Practice Hub checks.
8. Added Mistake Review checks.
9. Added Study Planner checks.
10. Added Activity Timeline checks.
11. Added Learning Notes checks.
12. Added Saved Lessons checks.
13. Added Progress Report checks.
14. Added Weekly Review checks.
15. Added Family Goals checks.
16. Added Wellbeing checks.
17. Added Help Centre checks.
18. Added Platform Health checks.
19. Added learner, parent and teacher dashboard checks.
20. Added Teacher Resources checks.
21. Added Learning Worlds and dynamic subject-route checks.
22. Added 320×720 mobile validation.
23. Added 390×844 mobile validation.
24. Added 768×1024 tablet validation.
25. Added 1440×1000 desktop validation.
26. Added page-title validation.
27. Added exactly-one-H1 validation.
28. Added exactly-one-main-landmark validation.
29. Added horizontal-overflow detection.
30. Added duplicate-ID detection.
31. Added unnamed-button detection.
32. Added unnamed-link detection.
33. Added skip-link and focus-target checks.
34. Added console-error collection.
35. Added uncaught-runtime-error collection.
36. Added mobile-menu visibility and open-state checks.
37. Added local learner-profile persistence check.
38. Added learner-world → subject → lesson navigation check.
39. Added Settings export/import/reset control check.
40. Added real keyboard Tab traversal.
41. Added responsive screenshots for Home, Today, Learning Worlds and Parent View.
42. Added JSON browser-test evidence.
43. Added Markdown browser-test summary.
44. Added Chrome setup to GitHub Actions.
45. Added browser-smoke evidence retention for 14 days.
46. Added browser-smoke release-status publication.
47. Added release-readiness enforcement for the browser suite.
48. Added explicit remaining human-review boundaries.
49. Corrected the Local Progress Board to use a page-level main landmark.
50. Added a table caption, scoped headers and explicit private-board wording.
51. Corrected Guided Tutor to use a page-level main landmark.
52. Removed untyped tutor-content access and added accessible subject/topic states.
53. Corrected Subject World to use a page-level main landmark.
54. Fixed subject statistics that previously counted global completions and bookmarks.
55. Added accessible names and pressed states to lesson bookmark controls.
56. Rebuilt subject mission cards to prevent narrow-mobile overflow.
57. Updated browser navigation tests to exercise the actual button-driven routes.
58. Added an asynchronous React render wait before validating the mobile drawer.
59. Aligned Settings journey checks with the complete local-data control labels.
60. Preserved the rule that a failed browser gate blocks preview promotion.

## Defects exposed by the first real-browser run

The first Chrome run was intentionally treated as a release audit, not as a test to bypass. It found missing semantic landmarks in Local Progress Board, Guided Tutor and Subject World; unnamed bookmark controls; subject-card overflow at narrow mobile widths; and stale test assumptions about button-driven navigation and current Settings labels.

The product defects were corrected. Test assumptions were updated only where the actual user interaction was valid and intentional. The suite remains blocking until the corrected browser run passes.

## Automated coverage

The suite evaluates 27 routes across four viewports: 108 route/viewport combinations, plus a learner-profile, navigation, Settings and keyboard journey.

The test fails the pull request when it finds:

- an HTTP failure;
- a missing KirthiVerse page title;
- zero or multiple primary headings;
- zero or multiple page-level main landmarks;
- horizontal viewport overflow;
- duplicate DOM IDs;
- visible buttons or links without accessible names;
- a missing skip link or main-content focus target;
- console errors or uncaught runtime exceptions;
- a missing mobile navigation trigger;
- a failed mobile-menu interaction;
- learner profile persistence failure;
- broken Learning Worlds → subject → lesson navigation;
- missing local-data controls;
- insufficient keyboard focus traversal.

## Evidence artifacts

GitHub Actions retains:

- `artifacts/browser-smoke/report.json`;
- `artifacts/browser-smoke/summary.md`;
- responsive PNG screenshots;
- existing product-validation diagnostics;
- existing type-check diagnostics;
- the compiled preview artifact.

## Remaining release gates

The following remain intentionally manual or production-bound:

1. human review of the captured screenshots for visual quality and text clipping;
2. complete learner → quiz → Mistake Review → Parent View review with realistic answers;
3. screen-reader and other assistive-technology review;
4. service-worker offline recovery review in a production-like browser session;
5. controlled merge and deployment;
6. live post-deployment verification and rollback readiness.

## Promotion rule

Do not merge PR #15 merely because the browser suite is green. Merge only after the remaining human gates are recorded as passed. KVS-PLATFORM-002 identity work must not enable cloud learner profiles until verified adult ownership, consent, secure sessions, deletion and audit controls are implemented.
