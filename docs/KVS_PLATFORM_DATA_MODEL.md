# KirthiVerse Account, Profile and Learning Record Model

## Why profiles are required

A profile is required for persistent scores, cross-device access, parent oversight, school assignments and tutor support. Guest mode remains available for local-only learning.

## Account hierarchy

- Adult account
  - Parent/guardian
  - School administrator
  - Teacher
  - Tutor
- Child profile
  - Owned by parent/guardian or school tenant
  - Never public
  - No personal email required

## Core entities

### Account

- id
- email
- email_verified_at
- account_type
- locale
- status
- created_at
- last_login_at
- security_version

### SchoolTenant

- id
- legal_name
- display_name
- status
- locale
- created_at

### Membership

- account_id
- tenant_id
- role
- status
- created_at

### ChildProfile

- id
- owner_type
- owner_id
- nickname
- avatar_id
- age_band
- learning_level
- preferred_language
- accessibility_preferences
- status
- created_at
- deleted_at

### ApprovedDevice

- id
- account_or_profile_id
- random_device_id
- display_name
- approved_at
- revoked_at
- last_seen_at

### ConsentRecord

- id
- adult_account_id
- child_profile_id
- purpose
- notice_version
- consent_version
- status
- captured_at
- withdrawn_at
- evidence_reference

### LessonAttempt

- id
- child_profile_id
- lesson_id
- started_at
- completed_at
- duration_seconds
- source_device_id
- content_version

### QuizAttempt

- id
- child_profile_id
- quiz_id
- attempt_number
- score
- maximum_score
- answers_summary
- started_at
- submitted_at
- source_device_id
- content_version

### MasteryState

- child_profile_id
- subject_id
- topic_id
- mastery_level
- evidence_count
- updated_at

### RewardEvent

- id
- child_profile_id
- reward_type
- source_event_id
- xp_delta
- created_at

### Assignment

- id
- tenant_id
- class_id
- teacher_id
- content_type
- content_id
- due_at
- created_at

### AssignmentProgress

- assignment_id
- child_profile_id
- status
- score
- completed_at

### AuditEvent

- id
- actor_id
- actor_role
- tenant_id
- action
- target_type
- target_id
- result
- created_at
- security_metadata

## Score and progress rules

- Quiz score is immutable per submitted attempt.
- Best score is a derived projection, not overwritten history.
- XP is created through idempotent reward events.
- Completing the same lesson again does not create duplicate completion XP.
- Streaks are calculated from unique active calendar days in the learner's configured timezone.
- Parent, teacher and tutor dashboards use projections derived from authorised learning records.
- Deleted profiles must disappear from active reports and follow the deletion workflow.

## Guest-to-account migration

1. Adult signs in and creates a child profile.
2. Browser generates a migration preview.
3. Adult confirms the target child profile.
4. Server validates content IDs and schema version.
5. Events are imported idempotently.
6. Existing cloud records are preserved.
7. A migration receipt is recorded.
8. Local data is retained or cleared according to adult choice.

## Access rules

- Parent can access only profiles owned by that parent account.
- School staff can access only learners in their tenant and authorised class scope.
- Tutor can access only explicitly assigned profiles within the approval period.
- Child can access only the active profile on an approved device/session.
- Platform support has no default access to learning content; elevated access must be time-bound and audited.

## API boundaries

Suggested services:

- identity
- profile
- consent
- learning records
- reporting
- assignments
- audit

Every API request must carry authenticated actor context and enforce ownership, role and tenant scope server-side.
