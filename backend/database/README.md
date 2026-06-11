# BlockCred Database SQL

## payments.sql

`payments.sql` creates a Supabase/PostgreSQL `payments` table for future payment tracking. It includes payment identity fields, student references, gateway fields, status tracking, timestamps, metadata, a valid-status check constraint, and indexes for common lookups.

## activity_logs.sql

`activity_logs.sql` creates a Supabase/PostgreSQL `activity_logs` table for admin auditing. It records the actor, action, entity, description, metadata, and timestamp for important student, certificate, and payment events.

## institution_settings.sql

`institution_settings.sql` creates a Supabase/PostgreSQL `institution_settings` table for institution identity, support contacts, and safe certificate access/payment display configuration. It also inserts one default row only when the table is empty.

## student_profile_fields.sql

`student_profile_fields.sql` adds optional student profile fields to the existing `students` table: contact, phone, address, department, programme, and level.

## How to run

1. Open your Supabase project.
2. Go to the SQL Editor.
3. Paste the contents of the SQL file you need, for example `payments.sql`, `activity_logs.sql`, `institution_settings.sql`, or `student_profile_fields.sql`.
4. Run the SQL.

Run `activity_logs.sql` in the Supabase SQL Editor before using the admin Activity Log page.

Run `institution_settings.sql` in the Supabase SQL Editor before using the admin Institution Settings page.

Run `student_profile_fields.sql` in the Supabase SQL Editor before enabling student profile edits.

## Re-running

The table and indexes use `IF NOT EXISTS`, and the status constraint is defined inside `CREATE TABLE IF NOT EXISTS`, so the SQL is intended to be safe to re-run for this initial setup.

Do not manually modify or drop existing tables when running this phase.

## Payment provider status

This phase does not connect a real payment provider yet. Notch Pay, CamPay, Flutterwave, webhooks, backend payment routes, and frontend payment initiation will be handled in later phases.

Keep the Supabase service role key on the backend only. Do not expose it in React.
