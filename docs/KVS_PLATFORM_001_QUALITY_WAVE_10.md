# KVS-PLATFORM-001 Quality Wave 10 — Entry recovery and one-click local preview

## Trigger

A manual review screenshot showed `https://kirthiverse.omsaravanabhava.org/index.html` rendering the application 404 page with duplicate global navigation and footer. The intended local preview URL, `http://127.0.0.1:4173/`, was not being used.

## Root cause

1. `/index.html` was treated as an application route instead of a legacy entry alias.
2. The not-found page rendered its own Header and Footer even though the application shell already rendered them.
3. The downloadable preview required the reviewer to open PowerShell in the correct extracted directory and manually open the local URL.
4. The previous instructions did not prevent confusion between the production `/index.html` address and the local preview server.

## Completed quality tasks

1. Added a declarative `/index.html` route.
2. Redirected `/index.html` to `/` with history replacement.
3. Prevented the legacy entry from rendering the 404 experience.
4. Removed Header from the not-found page.
5. Removed Footer from the not-found page.
6. Removed duplicate global navigation on unknown routes.
7. Removed duplicate global footer content on unknown routes.
8. Added a single semantic main landmark to the not-found page.
9. Connected the not-found heading with `aria-labelledby`.
10. Added a clear Home recovery action.
11. Added a Learning Worlds recovery action.
12. Improved the not-found explanation to match the current product.
13. Added a Windows command-file preview launcher.
14. Added a PowerShell preview launcher.
15. Added a plain-text local preview guide.
16. Made both launchers serve the directory in which the extracted artifact resides.
17. Made the launcher open `http://127.0.0.1:4173/` automatically.
18. Added a Node.js availability check.
19. Added a clear failure message when Node.js is unavailable.
20. Pinned the local preview server package version.
21. Disabled clipboard mutation by the preview server.
22. Added explicit instructions not to use the production `/index.html` URL for preview testing.
23. Added privacy-safe test-profile guidance.
24. Added an automated entry-recovery validator.
25. Added checks against Header/Footer imports inside NotFound.
26. Added checks for the semantic not-found main region.
27. Added checks for one-click launcher generation.
28. Added checks that the launchers always serve the extracted directory.
29. Added the entry-recovery gate to the aggregate quality command.
30. Added the entry-recovery gate to GitHub Actions diagnostics.
31. Added pull-request-only preview packaging.
32. Kept preview launcher files out of the production Pages artifact.
33. Added `/index.html` to live custom-domain verification.
34. Added legacy-entry recovery to the live verification summary.

## Review procedure after this wave

1. Download the latest PR preview artifact.
2. Extract the ZIP completely.
3. Double-click `START_KIRTHIVERSE_PREVIEW.cmd`.
4. Keep the command window open.
5. Review the site at `http://127.0.0.1:4173/`.

No PowerShell navigation or manually typed `npx` command is required for the normal Windows review path.

## Release boundary

This wave fixes the reported preview and routing defect but does not by itself complete the physical screen-reader review or authorise production promotion. PR #15 remains Draft until the latest CI run is green and the remaining approval gate is recorded.
