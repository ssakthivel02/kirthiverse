# KVS-PLATFORM-001 Quality Wave 9 — Controlled release operations

## Status

Implemented on `feature/kvs-platform-001-premium-experience` without merging or deploying PR #15.

## Completed quality tasks

1. Added a live custom-domain verification script.
2. Added deployment-propagation retry handling.
3. Added request timeouts for live verification.
4. Added durable JSON live-verification evidence.
5. Added a human-readable live-verification summary.
6. Added homepage HTTP and content-type checks.
7. Added compiled JavaScript verification.
8. Added compiled CSS verification.
9. Added a block against source TypeScript references in production.
10. Added production canonical-domain verification.
11. Added behavioural-tracking marker checks.
12. Added production release-channel verification.
13. Added expected deployed-commit verification.
14. Added production local-first boundary verification.
15. Added cloud-child-profile disabled verification.
16. Added school-roster disabled verification.
17. Added remote-teacher-monitoring disabled verification.
18. Added production catalogue-total verification.
19. Added manifest and service-worker availability checks.
20. Added robots, sitemap and OpenSearch availability checks.
21. Added child privacy, Parent Guide and security-resource checks.
22. Added security-contact availability verification.
23. Added direct Learning Worlds route verification.
24. Added direct Search route verification.
25. Added direct Mathematics route verification.
26. Added direct Help route verification.
27. Added build-time preview versus production channel stamping.
28. Added build commit, workflow run and source-ref metadata.
29. Added generated `deployment-metadata.json`.
30. Added distribution consistency checks between release status and deployment metadata.
31. Added a release operations validator.
32. Added a screen-reader acceptance checklist and evidence template.
33. Added a controlled PR #15 merge and production runbook.
34. Added a Git-revert-based rollback runbook.
35. Added a rule prohibiting unrelated DNS, Worker and certificate changes during application rollback.
36. Added a main-only post-deployment live verification job.
37. Added live verification artifact retention for 30 days.
38. Added release-operations diagnostic retention in GitHub Actions.
39. Added explicit preview and production build steps.
40. Added operations, deployment metadata, live smoke, rollback and screen-reader evidence gates to release status.

## Manual boundary retained

The following remain manual approval gates:

1. assistive-technology review;
2. controlled production deployment;
3. live post-deployment verification;
4. rollback-readiness verification.

Automated preparation does not constitute approval of these gates.

## Production promotion rule

- PR #15 remains Draft until the screen-reader review is recorded.
- Pull-request workflows never deploy.
- A main-branch deployment must stamp the production channel and merged commit.
- The post-deployment job must confirm the custom domain serves that exact commit.
- A failed release is reverted through an auditable PR; `main` is never force-pushed.
