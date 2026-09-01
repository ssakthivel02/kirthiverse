# KVS-PLATFORM-001 Quality Wave 13 — Pages artifact composition correction

## Status

Implemented on `hotfix/kvs-pages-manual-artifact` after the second live verification proved that the `include-hidden-files` input was not honoured by the deployed `upload-pages-artifact@v4` composite action version.

## Evidence-derived root cause

The generated `dist` directory contained `.nojekyll` and `.well-known/security.txt`. The deployed `github-pages` artifact contained `/security.txt` but still omitted both hidden paths. Inspection of the composite action implementation showed that its tar command excludes dot-prefixed paths. Therefore, the fix must control the tar creation directly rather than pass an unsupported or ignored input.

## Completed quality tasks

1. Removed the composite Pages upload action from production packaging.
2. Added an explicit pre-packaging `.nojekyll` existence check.
3. Added an explicit canonical security-contact existence check.
4. Added an explicit fallback security-contact existence check.
5. Added byte-for-byte comparison of both security-contact files.
6. Added manual tar creation from the validated `dist` directory.
7. Preserved dot-prefixed directories in the tar.
8. Preserved `.nojekyll` in the tar.
9. Preserved `.well-known/security.txt` in the tar.
10. Preserved the visible `/security.txt` fallback in the tar.
11. Excluded `.git` from the tar.
12. Excluded `.github` from the tar.
13. Used dereferenced regular files only.
14. Added tar-list verification for `.nojekyll`.
15. Added tar-list verification for canonical `security.txt`.
16. Added tar-list verification for fallback `security.txt`.
17. Uploaded the single tar as artifact `github-pages`.
18. Used a one-day artifact retention period.
19. Disabled redundant compression for the tar upload.
20. Kept `deploy-pages@v4` unchanged.
21. Kept exact deployed-commit verification.
22. Kept production-channel stamping.
23. Kept deployment metadata validation.
24. Kept live canonical security-contact verification.
25. Kept live fallback security-contact verification.
26. Kept live canonical-field validation.
27. Kept live equality validation.
28. Updated PWA contract validation for manual packaging.
29. Updated release-operations validation for manual packaging.
30. Blocked reintroduction of the hidden-file-excluding composite action.
31. Kept local-first privacy boundaries unchanged.
32. Kept cloud child profiles disabled.
33. Kept school rosters disabled.
34. Kept remote teacher monitoring disabled.
35. Kept content, accessibility and browser gates unchanged.
36. Kept offline recovery unchanged.
37. Kept direct-route recovery unchanged.
38. Kept rollback through an auditable revert PR.
39. Preserved retained deployment and live-verification evidence.
40. Required a third controlled production deployment before closing the incident.

## Promotion rule

The hotfix is complete only when the GitHub Pages artifact itself contains `.nojekyll`, `.well-known/security.txt` and `security.txt`, and the live custom-domain verification passes for the exact merged commit.
