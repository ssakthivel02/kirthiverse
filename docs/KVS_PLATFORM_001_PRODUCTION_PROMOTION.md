# KVS-PLATFORM-001 controlled production promotion

## Promotion record

- Source pull request: #15
- Squash-merge commit: `6d1dcfacc6edfb599573e96d3bb35e96000d1991`
- Previous main baseline: `6adc5a64539d60edf195d65c855aa20eab4575db`
- Production target: `https://kirthiverse.omsaravanabhava.org/`
- Deployment mechanism: GitHub Actions → GitHub Pages
- Release boundary: local-first
- Cloud child profiles: disabled
- School rosters: disabled
- Remote teacher monitoring: disabled

## Pre-promotion evidence

The latest feature-head workflow completed successfully before merge and covered:

- learning-content integrity;
- 77 lessons and 77 quiz questions with complete coverage;
- product-experience validation;
- privacy and trust validation;
- local-data lifecycle validation;
- accessibility semantics;
- metadata and discoverability;
- release readiness;
- PWA root deployment and cache safety;
- release operations and rollback readiness;
- `/index.html` and NotFound entry recovery;
- TypeScript, lint, production build and distribution validation;
- responsive, keyboard, learner-recovery and offline browser journeys;
- dependency-free Windows preview packaging.

## Required post-deployment evidence

The main-branch workflow must publish a production-stamped artifact and verify:

1. the custom-domain homepage serves compiled JavaScript and CSS;
2. `/index.html` recovers to the homepage;
3. `release-status.json` declares the production channel;
4. `deployment-metadata.json` identifies the deployed main commit;
5. Learning Worlds, Search, Mathematics and Help direct routes recover;
6. local-first privacy boundaries remain unchanged;
7. no behavioural tracking markers or TypeScript source references are present.

## Manual follow-up

Physical listening with Microsoft Narrator or NVDA remains a separately tracked accessibility follow-up. It is not represented as completed by automated browser validation.
