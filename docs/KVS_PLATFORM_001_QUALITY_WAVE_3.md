# KVS-PLATFORM-001 Quality Wave 3

## Objective

Strengthen family control, learner wellbeing, weekly reflection, local-data lifecycle, support and operational transparency without introducing cloud child accounts.

## Delivered quality tasks

### Family planning and weekly evidence
1. Added a typed local family-goals model.
2. Added weekly lesson targets.
3. Added weekly quiz targets.
4. Added weekly learning-minute targets.
5. Added up to three focus subjects.
6. Added configurable break reminders.
7. Added configurable session limits.
8. Added a Family Goals route with actual progress indicators.
9. Added a seven-day activity aggregator.
10. Added a printable Weekly Review.
11. Added daily lesson, quiz and learning-time evidence.
12. Added weekly strength and next-focus signals.
13. Connected Parent View to family goals, weekly review and wellbeing.

### Wellbeing and healthy engagement
14. Added an optional local learning-session timer.
15. Added pause, resume, finish and reset controls.
16. Added break-due and session-limit guidance.
17. Added recent timed-session history.
18. Added a finite 90-day timed-session retention rule.
19. Added explicit stop-without-penalty wording.
20. Preserved the rule that missed goals never remove points.

### Data lifecycle and privacy
21. Added a complete local-data bundle covering learner progress, family goals and timed sessions.
22. Extended export to include all local KirthiVerse data.
23. Extended import to validate and restore family controls and sessions.
24. Extended confirmed reset to remove all KirthiVerse local keys.
25. Added local-data counts and size evidence to Settings.
26. Added a child-readable privacy notice.
27. Added a data-retention explanation.
28. Added support and grievance guidance.
29. Added an accessibility statement with an honest audit boundary.

### Support, diagnostics and resilience
30. Added a Help Centre for learner, parent and teacher journeys.
31. Added troubleshooting for local progress, cached builds, direct routes and XP behaviour.
32. Added Platform Health local diagnostics.
33. Added browser-storage, content-catalogue, service-worker and manifest checks.
34. Added privacy wording stating diagnostic results are not uploaded.
35. Added core trust pages to the offline cache.
36. Incremented the service-worker cache version for controlled refresh.

### Navigation, discoverability and quality gates
37. Added family, weekly review, wellbeing, help and diagnostics routes.
38. Removed the nested application-shell main landmark.
39. Added desktop and mobile help access.
40. Expanded mobile utility navigation.
41. Expanded footer navigation for family, wellbeing, support and trust.
42. Added accessible titles and route announcements.
43. Protected personalised routes from indexing.
44. Added public help and trust pages to the sitemap.
45. Expanded product-experience validation.
46. Expanded privacy and trust validation.
47. Expanded production-distribution validation.

## Privacy boundary

This wave does not create learner, parent, teacher or school accounts. It does not add cloud storage, remote monitoring, student rosters, direct messaging, behavioural advertising or public child profiles.

## Production gate

Required before merge:

- learning-content validation
- product-experience validation
- privacy and trust validation
- TypeScript validation
- lint
- production build
- distribution validation
- mobile, tablet and desktop visual review
- keyboard-only route smoke test
- controlled production merge and live verification
