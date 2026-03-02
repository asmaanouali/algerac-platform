-- Fix constraints for Documentary Review workflow statuses

-- 1. Update accreditation_requests status constraint to include new DOC_REVIEW_* statuses
ALTER TABLE accreditation_requests DROP CONSTRAINT IF EXISTS accreditation_requests_status_check;
ALTER TABLE accreditation_requests ADD CONSTRAINT accreditation_requests_status_check CHECK (
  status::text = ANY (ARRAY[
    'DRAFT', 'SUBMITTED',
    'AWAITING_REGISTRATION_FEE', 'PENDING_PAYMENT', 'PAYMENT_PROOF_SUBMITTED', 'PAYMENT_COMPLETED',
    'ASSIGNED_TO_RA', 'RECEIVABILITY_STUDY',
    'RECEIVABILITY_PENDING_CD_REVIEW', 'RECEIVABLE', 'NOT_RECEIVABLE',
    'RECEIVABILITY_CORRECTION', 'RECEIVABILITY_RESUBMITTED',
    'PRELIMINARY_VISIT_PROPOSED', 'PRELIMINARY_VISIT_ACCEPTED', 'PRELIMINARY_VISIT_DECLINED',
    'PRELIMINARY_VISIT_SCHEDULED', 'PRELIMINARY_VISIT_COMPLETED', 'PRELIMINARY_VISIT_REPORT_PENDING',
    'PROCESS_SUSPENDED_OBSTACLES',
    'QUOTATION_PREPARATION', 'QUOTATION_SENT_TO_DAG', 'QUOTATION_APPROVED_BY_DAG',
    'CONVENTION_PREPARATION', 'QUOTATION_CONVENTION_PENDING_CD', 'QUOTATION_CONVENTION_CD_MODIF',
    'QUOTATION_SENT_TO_OEC', 'QUOTATION_OEC_REMINDER', 'QUOTATION_VALIDATED', 'QUOTATION_EXPIRED',
    'TEAM_DESIGNATION', 'TEAM_SENT_TO_CD', 'TEAM_CD_APPROVED', 'TEAM_CD_CHANGES_REQUESTED',
    'TEAM_SENT_TO_OEC', 'TEAM_DATE_REFUSED', 'TEAM_MEMBER_RECUSED',
    'TEAM_RECUSATION_INVALID', 'TEAM_RECUSED', 'TEAM_VALIDATED',
    -- New Documentary Review workflow statuses
    'DOC_REVIEW_AWAITING_FEE', 'DOC_REVIEW_FEE_PENDING_PAYMENT',
    'DOC_REVIEW_PAYMENT_SUBMITTED', 'DOC_REVIEW_PAYMENT_VALIDATED',
    'DOC_REVIEW_IN_PROGRESS', 'DOC_REVIEW_RESULTS_SUBMITTED',
    'DOC_REVIEW_RESULTS_SENT_TO_CD', 'DOC_REVIEW_RESULTS_SENT_TO_OEC',
    'DOC_REVIEW_CD_DECISION',
    -- Legacy documentary review statuses (kept for backward compatibility)
    'DOCUMENTARY_REVIEW', 'DOCUMENTARY_REVIEW_DEFICIENCIES',
    'AWAITING_OEC_DOC_RESPONSE', 'DOCUMENTARY_REVIEW_COMPLETED',
    -- Evaluation and beyond
    'EVALUATION_PLAN_PREPARATION', 'EVALUATION_PLAN_VALIDATION', 'EVALUATION_PLANNED',
    'EVALUATION_IN_PROGRESS', 'EVALUATION_COMPLETED',
    'AWAITING_ACTION_PLANS', 'ACTION_PLANS_EVALUATION', 'ACTION_PLANS_IMPLEMENTATION',
    'COMPLEMENTARY_EVALUATION_NEEDED', 'COMPLEMENTARY_EVALUATION_PLANNED', 'COMPLEMENTARY_EVALUATION_PROGRESS',
    'GAPS_RESOLVED',
    'REPORT_DRAFTING', 'REPORT_VALIDATION', 'REPORT_VALIDATED',
    'CAS_PREPARATION', 'CAS_SCHEDULED',
    'CAS_DECISION_GRANT', 'CAS_DECISION_REFUSAL', 'CAS_DECISION_POSTPONEMENT',
    'CERTIFICATE_PREPARATION', 'CERTIFICATE_ISSUED',
    'ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'CLOSED',
    'SURVEILLANCE_SCHEDULED', 'SURVEILLANCE_IN_PROGRESS', 'SURVEILLANCE_COMPLETED',
    'RESOURCE_CHECK', 'FOREIGN_EXPERT_PROPOSED',
    'OBSTACLES_IDENTIFIED', 'PENDING_DG_VALIDATION', 'DG_VALIDATED'
  ]::text[])
);

-- 2. Update documentary_reviews status constraint to include all new statuses
ALTER TABLE documentary_reviews DROP CONSTRAINT IF EXISTS documentary_reviews_status_check;
ALTER TABLE documentary_reviews ADD CONSTRAINT documentary_reviews_status_check CHECK (
  status::text = ANY (ARRAY[
    'PENDING', 'IN_PROGRESS',
    'COMPLETED_NO_ISSUES', 'DEFICIENCIES_FOUND',
    'AWAITING_OEC_RESPONSE', 'OEC_RESPONSE_ACCEPTED', 'OEC_RESPONSE_REJECTED',
    'FILE_CLOSED',
    -- New statuses for detailed workflow
    'AWAITING_FEE', 'FEE_SET',
    'PAYMENT_SUBMITTED', 'PAYMENT_VALIDATED',
    'RESULTS_SUBMITTED', 'RESULTS_SENT_TO_CD',
    'RESULTS_SENT_TO_OEC',
    'CD_DECISION_CONTINUE', 'CD_DECISION_STOP'
  ]::text[])
);

-- 3. Add new columns to documentary_reviews if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='payment_id') THEN
    ALTER TABLE documentary_reviews ADD COLUMN payment_id BIGINT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='team_results_deadline') THEN
    ALTER TABLE documentary_reviews ADD COLUMN team_results_deadline TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='team_results') THEN
    ALTER TABLE documentary_reviews ADD COLUMN team_results TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='results_sent_to_cd') THEN
    ALTER TABLE documentary_reviews ADD COLUMN results_sent_to_cd TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='cd_synthesis') THEN
    ALTER TABLE documentary_reviews ADD COLUMN cd_synthesis TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='cd_sent_as_is') THEN
    ALTER TABLE documentary_reviews ADD COLUMN cd_sent_as_is BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='oec_decision') THEN
    ALTER TABLE documentary_reviews ADD COLUMN oec_decision VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='oec_correction_deadline') THEN
    ALTER TABLE documentary_reviews ADD COLUMN oec_correction_deadline TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='cd_final_decision') THEN
    ALTER TABLE documentary_reviews ADD COLUMN cd_final_decision VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='cd_decision_comments') THEN
    ALTER TABLE documentary_reviews ADD COLUMN cd_decision_comments TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='oec_response_deadline') THEN
    ALTER TABLE documentary_reviews ADD COLUMN oec_response_deadline TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documentary_reviews' AND column_name='oec_response') THEN
    ALTER TABLE documentary_reviews ADD COLUMN oec_response TEXT;
  END IF;
END $$;
