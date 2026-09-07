# KVS B39 production progression

## Purpose

Promote only runtime-compatible, source-reconciled KirthiVerse content from the `KVS-STAGING-2026-09-B39` corpus into the existing website while preserving the stable local-first production shell and refusing bulk publication of unreconciled staging material.

## Staging baseline

- Staging batches: B1–B39
- Staging records: 1,003
- Approved standard lessons in staging: 193
- Staging questions: 774
- Staging projects: 32
- Minimum approved staging question density: 4 questions per standard lesson

The full 1,003-record staging corpus is not declared canonical or production-ready by this release.

## Production tranche

Source batches: B37, B38 and source-verified B39.

- 18 promoted KVS lessons
- 72 promoted KVS questions
- exactly 4 questions per promoted lesson
- subjects: Mathematics, Tamil, English, Coding and Science
- stable KVS record IDs preserved
- existing local-first privacy boundaries unchanged

Runtime totals after this release:

- 95 lessons
- 149 questions
- 10 existing learning worlds

## B39 Science reconciliation

The six B39 Biology/Science lessons and their 24 questions were held out of the first production seed until their externally dependent claims were checked against authoritative or established educational references.

The production source-provenance register maps every B39 Science lesson to one or more of:

- UK Department for Education science programmes of study;
- OpenStax Biology 2e / Anatomy & Physiology 2e;
- NIDDK/NIH digestive-system guidance;
- NIH/NIGMS cell-division guidance;
- NCBI Bookshelf genetics/mitosis reference.

A substantive reconciliation correction is preserved in the mitosis lesson: DNA replication occurs during S phase before mitosis; mitosis separates the copied chromosomes. The validator rejects regression to wording that treats DNA replication as occurring during mitosis.

## Release gates

`pnpm run validate:kvs-supplement` verifies:

- exactly 18 promoted lessons and 72 promoted questions;
- unique KVS lesson/question IDs;
- valid lesson references;
- runtime-compatible question types;
- valid MCQ answer indices;
- exactly four questions per promoted lesson;
- exactly six B39 Science lessons;
- authoritative provenance for all six B39 Science lesson IDs;
- HTTPS source URLs restricted to the approved authoritative/reference hosts;
- corrected mitosis wording.

The pull-request workflow additionally runs TypeScript, lint, production build and production-output guards. The main Pages workflow repeats the KVS production validator before deployment.

## Privacy and identity boundary

This release remains local-first. It does not enable cloud child profiles, school rosters or remote teacher monitoring.

## PWA/cache safety

The service-worker cache generation is rotated for the B39 Science deployment so installed clients receive the updated production shell and release metadata.

## Rollback

If the B39 Science release causes a production regression:

1. revert the B39 Science merge on `main`;
2. allow GitHub Pages to redeploy the previous main source;
3. rotate the service-worker generation again if necessary;
4. keep the source-verified B1–B39 package preserved for controlled re-promotion.

## Remaining manual/evidence gates

- Physical assistive-technology listening review with Narrator or NVDA remains a manual accessibility follow-up.
- Unpromoted records from the wider B1–B39 staging corpus still require controlled reconciliation/promotion before they can be treated as production content.
