# KVS-PLATFORM-001 Quality Wave 8 — Metadata, search and discoverability assurance

## Status

Implemented on `feature/kvs-platform-001-premium-experience`.

This wave improves public discovery and direct search without introducing analytics, behavioural tracking, cloud learner profiles or public child data. Personalised routes remain excluded from indexing.

## Completed quality tasks

1. Removed the viewport maximum-scale restriction so browser zoom remains available.
2. Replaced the generic homepage description with an accurate local-first learning description.
3. Added explicit public crawler metadata.
4. Added a canonical production-domain URL.
5. Added the Education application category.
6. Added mobile web-application capability metadata.
7. Added Open Graph website type metadata.
8. Added the KirthiVerse Open Graph site name.
9. Added the en-GB Open Graph locale.
10. Added a concise Open Graph title.
11. Added an accurate Open Graph description.
12. Added the production Open Graph URL.
13. Added Twitter summary-card metadata.
14. Added the Twitter title.
15. Added the Twitter description.
16. Added Schema.org WebApplication structured data.
17. Added the EducationalApplication structured-data category.
18. Marked the current public web experience as free to access.
19. Published English and Tamil language intent without claiming complete bilingual coverage.
20. Added a production-domain OpenSearch descriptor.
21. Added the KirthiVerse icon to OpenSearch discovery.
22. Added direct `/search?q=` query support.
23. Bounded search queries to 120 characters.
24. Added browser-native search input semantics.
25. Removed automatic search focus that could unexpectedly move focus on mobile or assistive technology.
26. Added polite search-result announcements.
27. Corrected the Search page catalogue statement from 64 to 77 quiz questions.
28. Added route-specific document titles.
29. Added route-specific descriptions.
30. Added route-specific canonical URL management.
31. Added explicit public versus personalised route robot policies.
32. Added route-specific Open Graph updates.
33. Added route-specific Twitter metadata updates.
34. Added a deterministic rendered-route marker for diagnostics.
35. Added strict noindex, nofollow, noarchive and nosnippet handling for personalised routes.
36. Canonicalised personalised routes to the public root rather than exposing learner-specific URLs.
37. Added a tracking-free public-shell validation gate.
38. Added a block against third-party script loading in the application shell.
39. Added a block against embedded iframe content in the application shell.
40. Added a block against common behavioural tracking markers.
41. Added sitemap duplicate detection.
42. Added sitemap production-domain enforcement.
43. Added sitemap personalised-route exclusion checks.
44. Added sitemap coverage checks for all ten public subject worlds.
45. Added robots.txt checks for every personalised learner, family and teacher route.
46. Added CNAME production-domain validation.
47. Added OpenSearch metadata to the offline application cache.
48. Expanded compiled distribution validation for canonical, crawler, social, structured-data and OpenSearch contracts.
49. Added `web-quality.log` to retained GitHub Actions diagnostics.
50. Published metadata, tracking-free, search-deep-link and crawler-boundary gates in `release-status.json`.

## Automated gate

The new command is:

```text
pnpm run validate:web
```

It validates the source shell, route metadata, local search, sitemap, robots.txt, OpenSearch, CNAME, release status and CI wiring before build promotion.

## Privacy boundary

- Search remains entirely in the browser.
- Search text is not transmitted to a KirthiVerse server or third party.
- No analytics or behavioural-advertising script was added.
- No public learner profiles or personalised URLs were made discoverable.
- Cloud child profiles and school rosters remain disabled.

## Remaining release gates

1. Assistive-technology review using at least one screen reader.
2. Controlled production deployment.
3. Live custom-domain verification.
4. Rollback-readiness confirmation.

## Promotion rule

Do not merge PR #15 solely because automated metadata and browser gates are green. Production deployment and assistive-technology verification remain separate approval controls.
