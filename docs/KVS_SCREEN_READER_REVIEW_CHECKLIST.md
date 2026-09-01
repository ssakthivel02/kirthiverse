# KirthiVerse screen-reader review checklist

## Purpose

This is the remaining manual assistive-technology gate for KVS-PLATFORM-001. Automated accessibility checks already cover landmarks, labels, headings, ARIA references, focus order and keyboard traversal. This review confirms that the rendered experience is understandable when spoken by a real screen reader.

## Recommended Windows review order

1. Use Microsoft Narrator first because it is built into Windows.
2. Repeat the critical learner journey with NVDA when available.
3. Use a current browser with normal zoom and no browser extensions that rewrite pages.
4. Do not enter a real child's legal name, date of birth, address, phone number, Aadhaar or APAAR data.
5. Use a temporary nickname such as `QA Learner`.

## Evidence header

Record the following before testing:

- Date and local time:
- Tester:
- Browser and version:
- Screen reader and version:
- Website URL:
- Tested commit from `deployment-metadata.json`:
- Device and operating system:

## Journey A — Home and primary navigation

- [ ] Start the screen reader before opening KirthiVerse.
- [ ] Confirm the page title is announced.
- [ ] Confirm the skip link is the first meaningful keyboard target.
- [ ] Activate the skip link and confirm focus moves to the main content.
- [ ] Navigate by headings and confirm there is one clear page-level heading.
- [ ] Confirm Student, Parent and Teacher journeys have understandable names.
- [ ] Confirm decorative artwork is not announced as meaningless file names.
- [ ] Confirm buttons and links are announced with their purpose.
- [ ] Open and close the mobile menu using only the keyboard at a narrow window width.
- [ ] Confirm focus returns to the menu button after closing.

## Journey B — Learner onboarding and Today

- [ ] Open Onboarding.
- [ ] Confirm every field has a spoken label and instructions.
- [ ] Confirm validation errors are announced and identify the affected field.
- [ ] Create a temporary `QA Learner` local profile.
- [ ] Open Today.
- [ ] Confirm the daily mission, recommendation and progress summaries are understandable without seeing the layout.
- [ ] Confirm XP, streak and level values are announced with context rather than as unexplained numbers.

## Journey C — Learning Worlds, lesson and quiz

- [ ] Open Learning Worlds.
- [ ] Navigate the subject cards and confirm each subject name, progress state and action are understandable.
- [ ] Open Mathematics and then one lesson.
- [ ] Confirm objectives, examples and lesson sections are announced in a logical order.
- [ ] Confirm bookmark state is announced as selected or not selected.
- [ ] Complete the lesson and open the linked quiz.
- [ ] Confirm question number, question text, answer choices and selected state are announced.
- [ ] Submit one intentionally incorrect answer.
- [ ] Confirm the result, explanation and retry options are announced.
- [ ] Open Mistake Review and confirm the incorrect answer, correct answer and explanation are understandable.
- [ ] Retry with the correct answer and confirm the mistake is announced as resolved.

## Journey D — Parent and teacher value

- [ ] Open Parent View.
- [ ] Confirm completed lessons, quiz score, XP and open mistakes are announced with labels.
- [ ] Confirm charts or visual summaries have equivalent text or table information.
- [ ] Open Progress Report and Weekly Review.
- [ ] Confirm headings and table headers make sense when navigating by table.
- [ ] Open Teacher Workspace and Teacher Resources.
- [ ] Confirm local-only and no-cloud limitations are spoken clearly.
- [ ] Confirm no fake school, class or learner data is presented as real.

## Journey E — Settings, privacy and recovery

- [ ] Open Settings.
- [ ] Confirm larger-text and reduced-motion settings have clear names and current states.
- [ ] Confirm export, import and reset controls explain their consequences.
- [ ] Confirm destructive reset requires an explicit confirmation.
- [ ] Open child-readable privacy, Parent Guide, Accessibility and Security pages.
- [ ] Confirm headings, lists and contact information are readable in a logical order.
- [ ] Disconnect the network after the site has loaded once.
- [ ] Confirm the offline status is announced and local progress remains described as device-only.

## Failure conditions

Mark the gate FAIL when any of the following occurs:

- focus becomes trapped or disappears;
- a required control has no spoken name;
- a form error is not announced;
- the quiz cannot be completed using the keyboard and screen reader;
- important progress information is available only visually;
- a route change is not announced and leaves the user disoriented;
- the offline or update notice repeatedly interrupts reading;
- private learner information is exposed in a public or indexed route.

## Result

- [ ] PASS — no blocking issue found.
- [ ] PASS WITH MINOR ISSUES — no blocker; issues recorded for a later release.
- [ ] FAIL — one or more blocking issues must be fixed before production promotion.

## Issue record

For each problem record:

- Route:
- Screen reader:
- Exact keyboard action:
- Expected announcement:
- Actual announcement:
- Severity: blocker / major / minor
- Screenshot or recording reference:
- GitHub issue number:

## Approval

- Tester name:
- Result:
- Date:
- Evidence location:
- Product-owner acknowledgement:
