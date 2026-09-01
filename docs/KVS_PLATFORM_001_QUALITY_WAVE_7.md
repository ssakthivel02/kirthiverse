# KVS-PLATFORM-001 Quality Wave 7 — PWA deployment and cache safety

## Status

Implemented on `feature/kvs-platform-001-premium-experience`.

This wave closes the ambiguity between custom-domain deployment and repository-subpath deployment. KirthiVerse KVS-PLATFORM-001 is explicitly validated for the custom-domain root contract. The release remains Draft and local-first.

## Completed quality tasks

1. Added a dedicated `validate:pwa` release gate.
2. Added a root-domain manifest `start_url` check.
3. Added a root-domain manifest `scope` check.
4. Added standalone-display validation.
5. Added manifest product-name validation.
6. Added manifest short-name validation.
7. Added theme-colour validation.
8. Added background-colour validation.
9. Added manifest icon-presence validation.
10. Added root-relative icon-path validation.
11. Added root manifest-link validation in the application shell.
12. Added root icon-link validation in the application shell.
13. Added application-shell theme-colour validation.
14. Added strict referrer-policy validation.
15. Added telephone-detection suppression validation.
16. Added a block against unsupported `/kirthiverse/` shell URLs.
17. Added expected service-worker cache-version validation.
18. Added compiled-asset-root validation.
19. Added a non-GET cache exclusion check.
20. Added a cross-origin cache exclusion check.
21. Added an `/api/` cache exclusion check.
22. Added explicit navigation-handler validation.
23. Added cached SPA-shell recovery validation.
24. Added dedicated offline-fallback validation.
25. Added controlled `SKIP_WAITING` support validation.
26. Added a guard against forced activation during installation.
27. Added activated-client claim validation.
28. Added scoped obsolete-cache cleanup validation.
29. Added offline connectivity-state validation.
30. Added offline-recovery client-notification validation.
31. Added connectivity-restored client-notification validation.
32. Added no-store validation for injected offline documents.
33. Added accessible offline-banner validation.
34. Added offline child-privacy availability validation.
35. Added offline parent-guide availability validation.
36. Added offline security-guidance availability validation.
37. Added offline release-status availability validation.
38. Added an explicit offline-recovery metadata marker.
39. Added a page-level main landmark to the dedicated offline page.
40. Added an announced offline status region.
41. Added accessible heading/description relationships on the offline page.
42. Added root service-worker registration validation.
43. Added a block against repository-subpath service-worker registration.
44. Added local-first release-contract validation.
45. Added cloud-child-profile disabled validation.
46. Added school-roster disabled validation.
47. Added PWA contract diagnostics to GitHub Actions artifacts.
48. Added the PWA contract to the aggregate release-readiness gate.

## Defect found and corrected

The first new gate correctly failed because the dedicated `offline.html` page did not expose the same machine-readable offline-recovery marker used by recovered SPA documents and did not explicitly identify its main/status semantics. The page was corrected rather than weakening the gate.

## Deployment contract

KVS-PLATFORM-001 supports:

- `https://kirthiverse.omsaravanabhava.org/` as the production application root;
- root-relative application assets, manifest, service worker and trust resources;
- GitHub Pages build/deploy behind the custom domain.

This release does not claim support for simultaneous deployment from `/kirthiverse/`. Adding that mode later requires a separate base-path design, build, service-worker scope and route-refresh test matrix.

## Promotion rule

Do not merge PR #15 solely because this gate passes. Assistive-technology review, controlled production deployment, live verification and rollback readiness remain separate gates.
