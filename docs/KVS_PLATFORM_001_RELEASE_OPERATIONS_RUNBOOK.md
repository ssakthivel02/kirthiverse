# KVS-PLATFORM-001 controlled release operations runbook

## Scope

This runbook promotes KVS-PLATFORM-001 and subsequent production hotfixes to the custom domain without bypassing automated quality, deployment or rollback controls.

Production target:

`https://kirthiverse.omsaravanabhava.org/`

## Current release decision

The product owner has asked to fix the remaining page failure and move to the next stage. The automated accessibility, keyboard, route, responsive, offline and release-operation gates are green. The physical screen-reader listening exercise remains an outstanding manual follow-up and must not be represented as completed.

The first production deployment succeeded at build and GitHub Pages deployment but exposed one packaging defect: GitHub Pages omitted the hidden `.well-known` directory from the uploaded artifact. The hotfix must preserve hidden files and also publish a visible `/security.txt` fallback whose canonical field continues to point to `/.well-known/security.txt`.

## Non-negotiable boundaries

- Do not merge while any GitHub Actions gate is failing, cancelled or pending.
- Do not change Cloudflare DNS, Workers, GitHub Pages custom-domain settings or certificates for this packaging defect.
- Do not enable cloud child profiles, school rosters or remote teacher monitoring in KVS-PLATFORM-001.
- Do not paste personal access tokens into chat, issues, commits or logs.
- Keep the hotfix branch until production and rollback checks pass.

## Gate 1 — Automated pre-merge verification

1. Confirm the release or hotfix pull request is mergeable.
2. Confirm the latest workflow completed successfully for the current head SHA.
3. Confirm preview artifact and browser evidence belong to that same head SHA.
4. Confirm the local-first privacy boundary remains documented.
5. Confirm no reviewer has requested unresolved blocking changes.
6. Confirm `actions/upload-pages-artifact@v4` has `include-hidden-files: true`.
7. Confirm both `public/.well-known/security.txt` and `public/security.txt` exist and match.
8. Record that physical screen-reader listening remains manual and incomplete.

## Gate 2 — Controlled merge

Preferred merge method: squash merge.

Procedure:

1. Re-check the latest Actions status.
2. Select **Squash and merge**.
3. Confirm the expected head SHA has not changed.
4. Keep the source branch until production and rollback checks pass.
5. Record the resulting main commit SHA.

The push to `main` starts the GitHub Pages workflow. Pull-request builds never deploy.

## Gate 3 — Production deployment

The main-branch workflow must:

1. install dependencies using the frozen lockfile;
2. run content, product, privacy, data, accessibility, metadata, release, PWA, operations and entry-recovery validators;
3. type-check and lint;
4. build the production artifact;
5. stamp `release-status.json` as `production`;
6. create `deployment-metadata.json` with the main commit SHA;
7. validate the distribution, including both security-contact paths;
8. run browser and offline tests;
9. upload the Pages artifact with hidden files included;
10. deploy the GitHub Pages artifact;
11. run live custom-domain verification with retry;
12. preserve live verification evidence.

Do not manually redeploy an older workflow while the controlled deployment is running.

## Gate 4 — Live custom-domain verification

After deployment, confirm the live verification job passes. It checks:

- homepage HTTP and compiled assets;
- canonical custom-domain metadata;
- `/index.html` redirect recovery;
- production release stamp;
- expected deployed commit;
- local-first and disabled cloud-child-profile boundaries;
- 10 subjects, 77 lessons and 77 quiz questions;
- manifest, service worker, robots, sitemap and OpenSearch;
- child privacy, parent and security guidance;
- `/.well-known/security.txt` returns HTTP 200;
- `/security.txt` returns HTTP 200;
- both security-contact files match and declare the canonical `.well-known` URL;
- direct Learning Worlds, Search, Mathematics and Help routes;
- absence of source TypeScript references and behavioural tracking markers.

Manual browser confirmation:

1. Open the production URL in a private window.
2. Hard refresh once.
3. Open `/index.html` and confirm it redirects to `/`.
4. Open `/.well-known/security.txt` and `/security.txt`.
5. Open Learning Worlds.
6. Open Mathematics and one lesson.
7. Open Search and search for `fractions`.
8. Open Parent View and Teacher Resources.
9. Confirm no console-blocking error is visible.
10. Confirm the site remains usable at mobile width.
11. Confirm `release-status.json` says `production`.
12. Confirm `deployment-metadata.json` contains the merged main commit SHA.

## Gate 5 — Release approval

Record:

- release or hotfix PR:
- merged main SHA:
- deployment workflow run:
- live verification result:
- canonical security contact result:
- fallback security contact result:
- browser verification result:
- rollback baseline SHA:
- physical screen-reader follow-up: pending / completed
- approver:
- date and time:

The production release is approved only when automated deployment and live verification pass. The screen-reader follow-up remains separately tracked until completed.

## Failure rule

When deployment or live verification fails:

1. do not change DNS or certificates based only on an application or artifact-packaging failure;
2. identify whether the failure is build, artifact packaging, Pages deployment, custom-domain propagation, service worker or application behaviour;
3. retry only when the evidence indicates a transient deployment delay;
4. use `docs/KVS_ROLLBACK_RUNBOOK.md` for a confirmed production regression;
5. retain logs and artifacts for the incident record.
