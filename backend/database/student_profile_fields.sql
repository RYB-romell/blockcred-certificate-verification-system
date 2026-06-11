-- BlockCred student profile fields
-- Run this in the Supabase SQL Editor before enabling student profile edits.
-- These fields are optional and do not replace id, student_id, email,
-- firebase_uid, subscription_status, or any payment/blockchain fields.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS programme text,
  ADD COLUMN IF NOT EXISTS level text;
