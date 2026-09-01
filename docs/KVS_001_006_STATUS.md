# KirthiVerse Platform Release Status

| Release | Scope | Status | Dependency |
|---|---|---|---|
| KVS-PLATFORM-001 | Premium learner experience | Feature complete in draft PR; automated gates green; final browser QA pending | Current production baseline |
| KVS-PLATFORM-002 | Secure adult identity and child-profile foundation | Planned | KVS-PLATFORM-001 final acceptance |
| KVS-PLATFORM-003 | Family console and cross-device progress | Planned | KVS-PLATFORM-002 |
| KVS-PLATFORM-004 | School and tutor multi-tenant console | Planned | KVS-PLATFORM-002 |
| KVS-PLATFORM-005 | Private safe competition | Planned | KVS-PLATFORM-003/004 |
| KVS-PLATFORM-006 | India compliance and production hardening | Continuous / final gate | All releases |

## Current active branch

`feature/kvs-platform-001-premium-experience`

## KVS-PLATFORM-001 implemented foundations

- premium learner, parent and teacher journeys;
- lessons, quizzes, practice and mastery reporting;
- local learner profile and progress persistence;
- Today mission, achievements, saved lessons and guided practice;
- mistake review and retry workflow;
- seven-day study planning;
- learning activity timeline;
- family goals, weekly review and wellbeing controls;
- local parent/teacher learning notes;
- complete local export, import and reset;
- child-readable privacy, parent guide, acceptable-use, accessibility, retention, storage and grievance information;
- installable PWA, offline recovery and controlled update notification;
- content, experience, trust, data-lifecycle, accessibility, type, lint, build and distribution gates.

## Current architecture documents

- `docs/KVS_PLATFORM_ROADMAP.md`
- `docs/KVS_RELEASE_EXECUTION_PLAN_001_006.md`
- `docs/KVS_INDIA_IDENTITY_PRIVACY_ARCHITECTURE.md`
- `docs/KVS_PLATFORM_DATA_MODEL.md`
- `docs/KVS_INDIA_COMPLIANCE_CHECKLIST.md`
- `docs/KVS_PLATFORM_001_QUALITY_WAVE_4.md`

## Execution rule

KVS-PLATFORM-001 remains local-first. KVS-PLATFORM-002 must establish verified adult ownership, consent, secure sessions, deletion and audit controls before persistent child scores are synchronised to the cloud. KVS-PLATFORM-004 must establish school tenancy and role isolation before school rosters or remote teacher reporting are enabled.

## Remaining KVS-PLATFORM-001 release gate

- human visual review at mobile, tablet and desktop widths;
- keyboard-only browser smoke testing;
- complete learner → quiz → mistake review → parent review journey testing;
- direct-route refresh and offline-recovery testing;
- controlled merge, production deployment and live post-deployment verification.
