# KirthiVerse Platform Execution Plan — KVS-PLATFORM-001 to 006

## Delivery principle

Each release must be independently reviewable, testable and reversible. No release may combine visual redesign, identity, family, school, competition and compliance work into one uncontrolled deployment.

## KVS-PLATFORM-001 — Premium learner experience

### Goal
Transform the current functional site into an original, premium, child-friendly learning experience without introducing cloud child-data collection.

### Work packages

1. Product identity
   - Original KirthiVerse visual system
   - Original mascots and subject-world direction
   - Colour, typography, illustration and motion standards

2. Premium application shell
   - Responsive navigation
   - Learner-safe language
   - Premium homepage
   - Today page
   - Improved onboarding
   - Better mobile and tablet interaction

3. Learning interaction
   - Improved lesson progression
   - Interactive checks and explanations
   - Quiz feedback and retry flows
   - Subject-specific visual worlds
   - Achievement journey and progress map

4. Quality
   - route-level tests
   - visual regression tests
   - keyboard and accessibility tests
   - mobile/tablet/desktop tests
   - performance budget

### Exit gate
No cloud account dependency; all current learning functions remain usable locally.

## KVS-PLATFORM-002 — Secure identity foundation

### Goal
Introduce verified adult accounts and adult/school-owned child profiles.

### Work packages

1. Identity service
   - adult registration
   - email verification
   - passkeys and MFA
   - secure session cookies
   - recovery flows

2. Child profile provisioning
   - parent/school-owned profiles
   - nickname, avatar, age band, language and level
   - child PIN on approved devices
   - no personal child email requirement

3. Privacy controls
   - adult and child-readable notices
   - consent evidence
   - withdrawal
   - export
   - correction
   - deletion
   - guest-progress migration

4. Security controls
   - rate limiting
   - bot protection
   - audit logging
   - secure secrets
   - encryption
   - session rotation

### Exit gate
No child profile can be created without verified adult/school authority and recorded consent state.

## KVS-PLATFORM-003 — Family console

### Goal
Enable parents and guardians to manage multiple child profiles and persistent progress.

### Work packages

- parent dashboard
- child switching
- goals
- reports
- approved devices
- progress sync
- export and deletion
- parent-controlled tutor assignment
- notifications with safe defaults

### Exit gate
Parent can create, review, correct, export and delete each child profile and associated learning data.

## KVS-PLATFORM-004 — School and tutor console

### Goal
Support schools, classes, teachers and tutors through strict tenancy and role controls.

### Work packages

- school tenant provisioning
- school administrator console
- teacher and tutor roles
- classes and rosters
- join codes
- assignments
- reports
- CSV import with validation
- tenant isolation
- audit logs
- revocable tutor access

### Exit gate
Automated tests prove that no school, teacher or tutor can access an unauthorised learner or tenant.

## KVS-PLATFORM-005 — Safe competition

### Goal
Add motivating competition without public exposure or manipulative design.

### Work packages

- private family/class/school competitions
- pseudonymous display names
- daily limits
- wellbeing controls
- no public search
- no direct messaging
- moderation and safeguarding workflows
- adult/teacher controls

### Exit gate
Competition data is private to the authorised group and contains no publicly identifiable child profile.

## KVS-PLATFORM-006 — India compliance and production hardening

### Goal
Complete India-first legal, privacy, security, accessibility and operational readiness.

### Work packages

1. Privacy and legal
   - DPDP Act and Rules gap assessment
   - consent and notice review
   - data inventory
   - data-flow maps
   - retention schedule
   - processor register
   - grievance process
   - deletion verification

2. Security
   - threat model
   - penetration test
   - SAST and dependency scanning
   - secret scanning
   - access review
   - backup and recovery validation
   - incident exercises

3. Accessibility and safety
   - WCAG 2.2 AA audit target
   - child-readable UX review
   - dark-pattern review
   - reduced-motion and larger-text validation

4. Operations
   - SLOs
   - monitoring and alerting
   - incident runbooks
   - disaster recovery
   - rollback
   - release approval

### Exit gate
Recorded India launch approval from product, security, privacy and legal owners. No unsupported compliance claim.

## Sequence and dependency

KVS-PLATFORM-001 must complete before identity UI is introduced.
KVS-PLATFORM-002 is required before family, school, tutor or cross-device score sync.
KVS-PLATFORM-003 and 004 may proceed in parallel only after the identity and consent foundation is stable.
KVS-PLATFORM-005 depends on family/school authorisation.
KVS-PLATFORM-006 is continuous but becomes a formal release gate before India production launch of cloud child profiles.
