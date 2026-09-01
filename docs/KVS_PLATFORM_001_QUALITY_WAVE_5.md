# KVS-PLATFORM-001 Quality Wave 5

## Objective

Close release-control gaps before browser QA and production promotion. This wave does not introduce cloud child accounts, school rosters or remote monitoring.

## Completed controls

1. Published a machine-readable release status.
2. Declared the release channel and readiness state.
3. Declared the local-first data boundary.
4. Explicitly disabled cloud child profiles.
5. Explicitly disabled school rosters.
6. Explicitly disabled remote teacher monitoring.
7. Published the validated 10-subject catalogue total.
8. Published the validated 77-lesson catalogue total.
9. Published the validated 64-question catalogue total.
10. Listed all automated quality gates.
11. Listed all remaining human and production gates.
12. Added an independent release-readiness validation script.
13. Verified required quality scripts are registered.
14. Verified premium routes are registered.
15. Verified personalised routes remain excluded from indexing.
16. Verified public trust and support resources remain discoverable.
17. Verified required security, privacy, retention and PWA files exist.
18. Verified the workflow executes release-readiness validation.
19. Preserved release-readiness diagnostics as a workflow artifact.
20. Rejected unsupported production-ready or compliance claims in the public shell.
21. Added the release gate to the aggregate `pnpm check` command.
22. Added the release gate to GitHub Actions.
23. Preserved failure logs for seven days.
24. Kept the production deployment job disabled for pull-request runs.
25. Kept PR preview artifact retention at fourteen days.

## Remaining manual gates

- visual review at 320 px, 390 px, tablet and desktop widths;
- keyboard-only smoke testing;
- screen-reader spot checks;
- learner onboarding to lesson, quiz, mistake review and parent review journey;
- direct-route refresh validation;
- offline recovery and update-notification validation;
- controlled merge and live deployment verification.

## Release rule

KVS-PLATFORM-001 may not be described as production-ready until the remaining manual gates are recorded as passed. KVS-PLATFORM-002 must establish verified adult ownership, consent, secure sessions, deletion and audit controls before cloud learner profiles or cross-device score synchronisation are enabled.
