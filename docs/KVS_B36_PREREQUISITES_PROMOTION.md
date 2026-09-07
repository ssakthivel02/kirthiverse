# KVS B36 prerequisite-bridge production promotion

## Purpose

Promote a bounded prerequisite-bridge tranche from B36 into KirthiVerse after source/provenance reconciliation. This release does not bulk-publish the wider B1–B39 staging corpus.

## Promoted tranche

Six lessons and 24 questions, with exactly four questions per lesson:

- Mathematics — division by equal sharing/grouping and remainder interpretation;
- Tamil — பெயர்ச்சொல் / வினைச்சொல் distinction in context;
- English — evidence-based inference and word-choice analysis;
- Coding — tracing and debugging short algorithms;
- Mathematics — Pythagoras’ theorem for right triangles;
- Science — balanced/unbalanced forces and resultant-force reasoning.

The standalone B36 project remains in staging because the current runtime production supplement promotes lessons and assessment questions only.

## Source reconciliation

Every promoted lesson is mapped in `src/content/kvsProductionPrerequisitesProvenance.ts` to one or more authoritative educational references:

- UK Department for Education mathematics programmes of study;
- Tamil Virtual Academy;
- UK Department for Education English programmes of study;
- National Centre for Computing Education / Teach Computing;
- UK Department for Education science programmes of study.

These references support the factual/curriculum-level claims in the tranche; they do not make KirthiVerse a UK-only curriculum product.

## Runtime totals after promotion

- 107 lessons
- 197 quiz questions
- 10 existing learning worlds
- promoted KVS tranche: 30 lessons / 120 questions from B35, B36, B37, B38 and B39

## Quality gates

The production supplement validator requires:

- exactly 30 promoted KVS lessons and 120 questions;
- exactly four questions for every promoted lesson;
- unique IDs and valid lesson references;
- runtime-supported question types and valid MCQ answer indices;
- all six B36 lesson IDs present;
- source-verified provenance for all six B36 lessons;
- B35 and B39 provenance gates retained;
- corrected B39 mitosis wording retained;
- a Pythagoras non-example check;
- no regression to the misconception that zero resultant force necessarily means stationary.

TypeScript, lint, production build and output guards remain mandatory before merge.

## PWA/cache

The service-worker generation is rotated to `kirthiverse-shell-v8-kvs-b36-prerequisites-20260907` for a clean installed-client update.

## Privacy boundary

The release stays local-first. Cloud child profiles, school rosters and remote teacher monitoring remain disabled.

## Rollback

If a production regression is observed, revert the B36 merge on `main`, allow Pages to redeploy the previous release, and retain the source-verified staging package for later controlled re-promotion.

## Remaining manual evidence

A physical Narrator/NVDA listening pass remains the main manual accessibility evidence task.
