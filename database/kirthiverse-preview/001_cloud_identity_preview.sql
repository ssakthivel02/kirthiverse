-- KirthiVerse Cloud Identity Preview v1
-- Target database: kirthiverse_preview (Aiven MySQL 8.4)
-- PREVIEW ONLY. Do not apply to production child data until the cloud-identity release gate is approved.
-- Authentication secrets and raw passwords MUST NOT be stored in this schema.
-- Sensitive contact/display fields are application-encrypted before persistence.

CREATE TABLE adult_accounts (
  id CHAR(36) NOT NULL,
  auth_provider VARCHAR(32) NOT NULL,
  provider_subject_hash BINARY(32) NOT NULL,
  account_status VARCHAR(24) NOT NULL DEFAULT 'active',
  preferred_locale VARCHAR(16) NOT NULL DEFAULT 'en-GB',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_adult_provider_subject (auth_provider, provider_subject_hash),
  CONSTRAINT chk_adult_status CHECK (account_status IN ('active','suspended','pending_deletion'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE adult_private_contacts (
  adult_account_id CHAR(36) NOT NULL,
  email_ciphertext VARBINARY(1024) NULL,
  email_lookup_hash BINARY(32) NULL,
  encryption_key_version SMALLINT UNSIGNED NOT NULL,
  verified_at TIMESTAMP(6) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (adult_account_id),
  UNIQUE KEY uq_adult_email_lookup (email_lookup_hash),
  CONSTRAINT fk_private_contact_adult FOREIGN KEY (adult_account_id) REFERENCES adult_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learner_profiles (
  id CHAR(36) NOT NULL,
  owner_guardian_id CHAR(36) NOT NULL,
  display_name_ciphertext VARBINARY(1024) NOT NULL,
  encryption_key_version SMALLINT UNSIGNED NOT NULL,
  age_band VARCHAR(16) NOT NULL,
  locale VARCHAR(16) NOT NULL DEFAULT 'en-GB',
  cloud_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  profile_status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_learner_owner (owner_guardian_id),
  CONSTRAINT fk_learner_owner FOREIGN KEY (owner_guardian_id) REFERENCES adult_accounts(id),
  CONSTRAINT chk_learner_age_band CHECK (age_band IN ('3-5','6-8','9-11','12-13','14-16')),
  CONSTRAINT chk_learner_status CHECK (profile_status IN ('active','paused','pending_deletion'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE guardian_learner_links (
  guardian_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  relationship_type VARCHAR(24) NOT NULL DEFAULT 'guardian',
  link_status VARCHAR(24) NOT NULL DEFAULT 'active',
  can_view_progress BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_learning BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (guardian_id, learner_id),
  CONSTRAINT fk_guardian_link_adult FOREIGN KEY (guardian_id) REFERENCES adult_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_guardian_link_learner FOREIGN KEY (learner_id) REFERENCES learner_profiles(id) ON DELETE CASCADE,
  CONSTRAINT chk_guardian_link_status CHECK (link_status IN ('pending','active','revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE teacher_profiles (
  adult_account_id CHAR(36) NOT NULL,
  profile_status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (adult_account_id),
  CONSTRAINT fk_teacher_adult FOREIGN KEY (adult_account_id) REFERENCES adult_accounts(id) ON DELETE CASCADE,
  CONSTRAINT chk_teacher_status CHECK (profile_status IN ('active','suspended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE schools (
  id CHAR(36) NOT NULL,
  school_name VARCHAR(180) NOT NULL,
  country_code CHAR(2) NOT NULL,
  tenant_status VARCHAR(24) NOT NULL DEFAULT 'preview',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT chk_school_tenant_status CHECK (tenant_status IN ('preview','active','suspended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE school_memberships (
  school_id CHAR(36) NOT NULL,
  adult_account_id CHAR(36) NOT NULL,
  role_code VARCHAR(32) NOT NULL,
  membership_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (school_id, adult_account_id),
  CONSTRAINT fk_school_member_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_school_member_adult FOREIGN KEY (adult_account_id) REFERENCES adult_accounts(id) ON DELETE CASCADE,
  CONSTRAINT chk_school_role CHECK (role_code IN ('teacher','school_admin','guardian_approved_tutor')),
  CONSTRAINT chk_school_membership_status CHECK (membership_status IN ('pending','active','revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE assignments (
  id CHAR(36) NOT NULL,
  school_id CHAR(36) NULL,
  created_by_adult_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  instructions TEXT NULL,
  lesson_id VARCHAR(80) NULL,
  due_at TIMESTAMP(6) NULL,
  assignment_status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_assignment_creator (created_by_adult_id),
  CONSTRAINT fk_assignment_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_creator FOREIGN KEY (created_by_adult_id) REFERENCES adult_accounts(id),
  CONSTRAINT chk_assignment_status CHECK (assignment_status IN ('draft','assigned','closed','archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE assignment_targets (
  assignment_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  target_status VARCHAR(24) NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  completed_at TIMESTAMP(6) NULL,
  PRIMARY KEY (assignment_id, learner_id),
  CONSTRAINT fk_assignment_target_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_target_learner FOREIGN KEY (learner_id) REFERENCES learner_profiles(id) ON DELETE CASCADE,
  CONSTRAINT chk_assignment_target_status CHECK (target_status IN ('assigned','started','completed','withdrawn'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE consent_ledger (
  id CHAR(36) NOT NULL,
  guardian_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  purpose_code VARCHAR(64) NOT NULL,
  policy_version VARCHAR(32) NOT NULL,
  decision VARCHAR(16) NOT NULL,
  decided_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  revoked_at TIMESTAMP(6) NULL,
  evidence_ref VARCHAR(120) NULL,
  PRIMARY KEY (id),
  KEY ix_consent_learner_purpose (learner_id, purpose_code, decided_at),
  CONSTRAINT fk_consent_guardian FOREIGN KEY (guardian_id) REFERENCES adult_accounts(id),
  CONSTRAINT fk_consent_learner FOREIGN KEY (learner_id) REFERENCES learner_profiles(id) ON DELETE CASCADE,
  CONSTRAINT chk_consent_decision CHECK (decision IN ('granted','denied'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learner_progress_sync (
  learner_id CHAR(36) NOT NULL,
  content_id VARCHAR(96) NOT NULL,
  content_type VARCHAR(24) NOT NULL,
  state_version BIGINT UNSIGNED NOT NULL,
  progress_payload JSON NOT NULL,
  source_device_hash BINARY(32) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (learner_id, content_type, content_id),
  CONSTRAINT fk_progress_sync_learner FOREIGN KEY (learner_id) REFERENCES learner_profiles(id) ON DELETE CASCADE,
  CONSTRAINT chk_progress_content_type CHECK (content_type IN ('lesson','quiz','mastery','practice','milestone'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_events (
  id CHAR(36) NOT NULL,
  actor_adult_id CHAR(36) NULL,
  action_code VARCHAR(80) NOT NULL,
  target_type VARCHAR(48) NOT NULL,
  target_id CHAR(36) NULL,
  request_id VARCHAR(96) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_audit_created (created_at),
  KEY ix_audit_target (target_type, target_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_adult_id) REFERENCES adult_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE data_subject_requests (
  id CHAR(36) NOT NULL,
  requested_by_adult_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NULL,
  request_type VARCHAR(24) NOT NULL,
  request_status VARCHAR(24) NOT NULL DEFAULT 'received',
  requested_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  completed_at TIMESTAMP(6) NULL,
  PRIMARY KEY (id),
  KEY ix_dsr_requester (requested_by_adult_id, requested_at),
  CONSTRAINT fk_dsr_requester FOREIGN KEY (requested_by_adult_id) REFERENCES adult_accounts(id),
  CONSTRAINT fk_dsr_learner FOREIGN KEY (learner_id) REFERENCES learner_profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_dsr_type CHECK (request_type IN ('export','delete','correct')),
  CONSTRAINT chk_dsr_status CHECK (request_status IN ('received','verified','processing','completed','rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
