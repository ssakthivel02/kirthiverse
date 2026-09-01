# KVS-PLATFORM-001 Quality Wave 14 — Stale runtime recovery and production drift assurance

## Status

Implemented on `hotfix/kvs-runtime-cache-recovery` after the product owner reported that the visible production page still showed a legacy KirthiVerse shell even though the earlier deployment workflow had passed.

## Evidence-derived problem

The current repository and deployed release pipeline contained the premium React application, but the reported browser experience could still display an older static shell. The previous live check accepted generic KirthiVerse HTML and therefore did not prove that the exact current application shell reached every verification path. A previously installed service worker or cached HTML could also continue controlling an existing browser.

## Completed quality tasks

1. Added an exact `KVS-PLATFORM-001` runtime shell marker.
2. Added a dated cache-generation marker to the application shell.
3. Required the live homepage to expose the exact shell marker.
4. Required the live homepage to expose compiled JavaScript.
5. Required the live homepage to expose compiled CSS.
6. Rejected source TypeScript references in live HTML.
7. Added unique cache-busting parameters to every live verification request.
8. Added no-cache and no-store request headers to live verification.
9. Captured cache-control, ETag and Age headers in live evidence.
10. Added the dated runtime cache `kirthiverse-shell-v4-runtime-20260729`.
11. Preserved browser-smoke compatibility with the validated v4 cache prefix.
12. Required the service worker to validate the exact release shell marker.
13. Required application-route HTML to contain compiled JavaScript and CSS.
14. Rejected stale or incomplete network application shells.
15. Bypassed browser HTTP cache for navigation fetches.
16. Bypassed browser HTTP cache for runtime asset refreshes.
17. Required complete recovery-shell precaching before controlled activation.
18. Claimed open KirthiVerse pages after worker activation.
19. Removed obsolete KirthiVerse caches while leaving unrelated caches untouched.
20. Notified open pages when the new worker became active.
21. Registered the worker with `updateViaCache: none`.
22. Requested a service-worker update on every production startup.
23. Activated an already-waiting worker through the controlled update message.
24. Observed newly installing workers.
25. Reloaded once after controlled worker takeover.
26. Added a session guard to prevent reload loops.
27. Added `/reset-site.html` as a one-click browser recovery page.
28. Unregistered stale KirthiVerse service workers from the recovery page.
29. Deleted only cache names beginning with `kirthiverse-`.
30. Preserved learner profile, progress, quiz attempts, bookmarks and family settings.
31. Reopened production with a cache-busting URL after repair.
32. Added accessible live repair status announcements.
33. Excluded the repair page from search indexing.
34. Added the repair page to the offline precache.
35. Added the repair page to the production Pages artifact checks.
36. Added a 40-plus-control runtime recovery validator.
37. Added runtime recovery to the aggregate local and GitHub Actions gates.
38. Added exact-shell, recovery-page and stale-worker checks to live verification.
39. Added a scheduled production drift watch every two hours.
40. Added retained evidence and issue reporting for confirmed production drift.
41. Prevented drift alerts from triggering unrelated DNS, Worker or certificate changes.
42. Corrected release metadata so completed production and rollback gates are no longer marked pending.
43. Kept the physical Narrator/NVDA review as the sole manual gate.
44. Preserved local-first operation and disabled cloud child profiles.
45. Preserved disabled school rosters and remote teacher monitoring.

## Promotion rule

The hotfix may be promoted only after pull-request validation passes. The main workflow must then pass build, artifact validation, GitHub Pages deployment and exact-shell live verification for the merged commit. A generic KirthiVerse page is not sufficient evidence; production must expose the exact runtime marker, dated recovery worker, recovery page and deployment metadata for the current commit.

## User recovery path

After the successful production deployment, a browser that still displays the old shell should open:

`https://kirthiverse.omsaravanabhava.org/reset-site.html`

Selecting **Repair and reopen KirthiVerse** removes old KirthiVerse service workers and caches without deleting learner progress stored in local storage.
