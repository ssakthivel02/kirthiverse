# KVS B39 production seed

## Purpose

Promote a deliberately bounded, runtime-compatible tranche from the `KVS-STAGING-2026-09-B39` corpus into the existing KirthiVerse website without exposing staging material that still requires authoritative-source reconciliation.

## Staging baseline

- Staging batches: B1–B39
- Staging records: 1,003
- Approved standard lessons in staging: 193
- Staging questions: 774
- Staging projects: 32
- Minimum approved staging question density: 4 questions per standard lesson

The staging corpus is not being bulk-published by this release.

## Production seed promoted

Source batches: B37 and B38 only.

- 12 lessons
- 48 questions
- 4 questions for every promoted lesson
- Subjects mapped to existing runtime worlds: Mathematics, Tamil, English and Coding
- Stable KVS record IDs are preserved
- Existing local-first privacy boundaries are unchanged

Runtime totals after promotion:

- 89 lessons
- 125 questions
- 10 existing learning worlds

## Deliberately blocked

B39 Science/Biology remains out of the production runtime until externally dependent biological claims receive authoritative-source verification and reconciliation. The seed validator explicitly rejects accidental B39 leakage.

This is a release boundary, not a claim that the full 1,003-record staging corpus is canonical or production-ready.

## Release gates

The branch adds `validate:kvs-supplement`, which verifies:

- exactly 12 seed lessons and 48 seed questions;
- unique KVS IDs;
- valid lesson references;
- runtime-compatible question types;
- valid MCQ answer indices;
- exactly four questions per promoted lesson;
- no B39 Science/Biology leakage.

The PR workflow additionally runs TypeScript, lint, production build and output guards. The main Pages workflow repeats the seed validator before deployment.

## PWA/cache safety

The service-worker cache is rotated to `kirthiverse-shell-v5-kvs-b39-seed-20260906` so previously installed clients are forced onto a fresh shell/cache generation after deployment.

## Rollback

If the seed causes a production regression:

1. revert the production-seed merge on `main`;
2. GitHub Pages redeploys the previous main source;
3. the service-worker change from the revert provides a new update event on subsequent deployment;
4. preserve the B1–B39 staging package for later controlled reconciliation.

## Remaining manual/evidence gates

- Physical assistive-technology listening review with Narrator or NVDA remains a manual accessibility follow-up.
- B39 and other staging records marked `needs_source_verification` remain blocked from automatic production promotion until their source claims are reconciled.
