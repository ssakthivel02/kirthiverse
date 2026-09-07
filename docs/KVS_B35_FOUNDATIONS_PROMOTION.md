# KVS B35 foundations production promotion

## Purpose

Promote a bounded early-foundations tranche from KVS staging into the existing KirthiVerse runtime after source/provenance reconciliation. The release does not declare the full B1–B39 staging corpus canonical.

## Promoted B35 tranche

- 6 lessons
- 24 questions
- exactly 4 questions per lesson
- stable KVS IDs preserved
- worlds mapped to existing runtime subjects: Mathematics, Science, Tamil, English and Coding

The promoted lessons cover:

- common 2D shapes and orientation-invariant recognition;
- safe observation, description and sorting;
- Tamil மெய்யெழுத்துகள் and pulli distinction;
- early rhyme and syllable-beat awareness;
- number bonds to 10;
- input/output foundations.

## Authoritative source reconciliation

Every promoted B35 lesson has a source-verification entry in `src/content/kvsProductionFoundationsProvenance.ts`.

Sources include:

- UK Department for Education Development Matters;
- UK national curriculum mathematics programmes of study;
- UK national curriculum science programmes of study;
- Tamil Virtual Academy;
- National Centre for Computing Education.

The source layer is used as evidence for the school-level claims in this release; it is not a declaration that KirthiVerse has adopted a UK-only curriculum mapping.

## Runtime totals after promotion

- 101 lessons
- 173 quiz questions
- 10 existing learning worlds
- KVS promoted tranche: 24 lessons / 96 questions from B35, B37, B38 and B39

## Validation

`validate:kvs-supplement` must pass before merge and verifies:

- exactly 24 promoted KVS lessons and 96 questions;
- exactly four questions per promoted lesson;
- unique KVS IDs and valid lesson references;
- runtime-supported question types and answer indices;
- six B35 foundation lesson IDs present;
- authoritative provenance present for every B35 lesson;
- authoritative provenance retained for the B39 Science tranche;
- the corrected mitosis wording remains intact;
- basic B35 safety/source boundaries do not regress.

TypeScript, lint, production build and output guards remain required by CI.

## Privacy boundary

This release remains local-first and does not enable cloud child profiles, school rosters or remote teacher monitoring.

## PWA/cache

The service-worker generation is rotated to `kirthiverse-shell-v7-kvs-b35-foundations-20260907` so installed clients receive a fresh production shell after deployment.

## Rollback

If production regression is observed, revert the B35 promotion merge on `main`, allow Pages to redeploy the previous source, and preserve the source-verified staging package for controlled re-promotion.

## Remaining manual gate

A physical assistive-technology listening pass with Narrator or NVDA remains a manual accessibility evidence task and is not replaced by automated semantic checks.
