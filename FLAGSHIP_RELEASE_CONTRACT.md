# KirthiVerse Flagship Release Contract

## Identity
- New flagship repository: `ssakthivel02/kirthiverse`.
- Preserved legacy repository: `ssakthivel02/arivukids-legacy`.
- ArivuKids production must not be overwritten by this repository.

## Product boundary
- Ages 3–16, Tamil + English, age-aware learning.
- Parent/adult-owned identity architecture is the intended production direction.
- AI tutor preview is educational and bounded; it must not claim unrestricted autonomy or replace safeguarding, teaching, or parental judgment.
- No hidden paid-provider fallback.

## Launch gates
1. Exact-head CI green.
2. Responsive/mobile and reduced-motion checks green.
3. Accessibility/keyboard smoke green.
4. PWA/offline smoke green.
5. GitHub Pages deploy green before custom-domain cutover.
6. Custom domain configured only after independent deployment green.
7. HTTPS/canonical/direct-route production smoke green.
8. Rollback to last known-good commit recorded.

## Content quality
Do not inflate lesson/question counts. Production claims must match machine-readable corpus evidence. Generated learning material must be age-banded, answer-checked, provenance-aware where appropriate, and distinguish verified curriculum/source material from generated exercises.
