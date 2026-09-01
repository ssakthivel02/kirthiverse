# KirthiVerse India-First Identity, Privacy and Child-Safety Architecture

## Status

Architecture baseline for KVS-PLATFORM-001 through KVS-PLATFORM-006. This document is an engineering and product control plan, not legal advice or a claim of legal compliance.

## Product decision

KirthiVerse will support both guest learning and authenticated learning.

- Guest mode remains available for immediate, low-friction learning with progress stored only on the current device.
- Persistent scores, cross-device progress, family oversight, school assignments and tutor access require an authenticated account relationship.
- A child does not create an independent public account. A verified parent/guardian or authorised school provisions the child profile.

## India-first account model

### 1. Guest learner

- No sign-in.
- No cloud profile.
- Progress remains in local storage.
- Export/import available.
- Clear message that progress may be lost if browser data is cleared.

### 2. Family account

- Verified adult owns the account.
- Adult creates one or more child profiles.
- Child signs in using an approved device plus child-friendly PIN/profile selector.
- Adult can view scores, lesson completion, mastery, streaks, achievements, goals and device activity.
- Adult controls correction, export, deletion, tutor access and account recovery.

### 3. School account

- School organisation is a tenant.
- School administrator provisions teachers and classes.
- Students join through school-issued codes, roster import or approved SSO.
- Teacher access is limited to assigned classes.
- School administrators and teachers cannot access another school's data.
- All sensitive administration actions are audited.

### 4. Tutor account

- Tutor sees only explicitly assigned learners.
- Assignment requires verified parent or school approval.
- Access is time-bounded, revocable and logged.

## Minimum child profile

Required fields only:

- child_profile_id
- owner_account_id or school_tenant_id
- nickname
- avatar_id
- age_band
- learning_level
- preferred_language
- accessibility_preferences
- created_at

Do not require for normal learning:

- full legal name
- exact date of birth
- personal email address
- mobile number
- home address
- precise location
- photograph
- government identifier
- Aadhaar or APAAR identifier

## Learning data captured

- lesson completion events
- quiz attempts and scores
- mastery state
- XP and achievements
- streak events
- bookmarks
- assignments
- activity timestamps
- source device identifier using a privacy-preserving random ID

Every field must have a documented purpose, retention period and access policy.

## India legal and policy baseline

### Digital Personal Data Protection Act and Rules

KirthiVerse must be designed for the Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 implementation timeline.

Engineering controls:

- clear, specific and understandable notices before collection
- verifiable parent/guardian consent where required for child data
- evidence of consent and consent withdrawal
- no processing beyond the stated learning purpose
- data minimisation
- reasonable security safeguards
- breach-response procedure
- access, correction, erasure and grievance workflows
- deletion after the purpose or retention period ends
- processor and sub-processor controls

No release may claim legal compliance without recorded legal review against the provisions in force on the launch date.

### Information Technology Act and security rules

The platform must maintain reasonable security practices, including:

- encryption in transit and at rest
- secure authentication and session handling
- role-based access control
- tenant isolation
- access logging
- vulnerability management
- secure backups
- incident handling
- confidentiality controls

### Education-sector expectations

The product should follow data-minimising practices visible in Indian government education services and align with Ministry of Education digital-learning guidance. KirthiVerse should not collect academic identity information merely because another education system does so.

## Consent model

### Adult account creation

- verify email or approved school identity
- display adult privacy notice
- record terms and privacy versions
- capture consent purpose and timestamp

### Child profile creation

- adult confirms parent/guardian authority or school authority
- show child-profile notice in simple language
- capture only minimum profile information
- do not enable cloud processing until consent and authority checks succeed

### Consent withdrawal

- disable further cloud processing for the child profile
- preserve only data required for legal/security purposes
- provide export before deletion where requested
- delete profile data through a controlled workflow
- record completion without retaining unnecessary learning content

## Authentication architecture

### Adults and administrators

- passkeys preferred
- email verification mandatory
- MFA required for school administrators
- secure, HTTP-only, SameSite cookies
- short-lived sessions with rotation
- rate limiting and bot protection
- recovery flows with audit logging

### Children

- no personal email required
- profile selector plus child PIN on approved devices
- school code or managed SSO for school use
- lockout and adult recovery controls
- never expose child identifiers in public URLs

## Authorisation model

Roles:

- platform_admin
- school_admin
- teacher
- tutor
- parent_guardian
- learner

Controls:

- deny by default
- tenant scope on every school query
- ownership check on every family query
- assignment check on every tutor query
- field-level restrictions for child data
- audit all exports, deletions, role changes and consent changes

## Data-storage design

Recommended logical separation:

- identity database
- tenant and role database
- child profile database
- learning-event store
- consent and audit ledger
- reporting projections

Use opaque UUIDs. Avoid embedding names, emails or tenant names in IDs.

## Retention baseline

Final periods require legal and business approval. Proposed defaults:

- guest data: device-controlled only
- inactive family account: review after 24 months
- inactive child profile: notify adult before deletion
- raw security logs: short, defined operational period
- audit records: minimum necessary period
- deleted profile: purge from primary systems promptly and backups through documented expiry

## Prohibited product patterns

- behavioural advertising
- sale of child data
- public child profiles
- public child discovery
- open direct messaging
- precise geolocation
- facial recognition
- Aadhaar collection
- public identifiable leaderboards
- unlimited reward loops designed to compel prolonged use
- dark patterns that pressure consent

## Release controls

### KVS-PLATFORM-001

No new cloud child data. Build premium visual and learning interaction foundations only.

### KVS-PLATFORM-002

Implement verified adult identity, consent records, child-profile provisioning, secure sessions, deletion and guest migration.

### KVS-PLATFORM-003

Implement family dashboard, multiple profiles, approved devices, goals and reports.

### KVS-PLATFORM-004

Implement school tenancy, roles, classes, assignments, tutor access and audit logging.

### KVS-PLATFORM-005

Implement only private, pseudonymous competitions with wellbeing controls and no direct messaging.

### KVS-PLATFORM-006

Complete India legal review, DPIA-equivalent privacy assessment, retention schedule, security testing, accessibility audit, incident exercises and launch approval.

## Production evidence required

- data inventory
- data-flow diagrams
- threat model
- consent test evidence
- authorisation test evidence
- tenant-isolation tests
- deletion and export tests
- security scan results
- accessibility results
- incident-response runbook
- privacy notices
- processor register
- launch approval record
