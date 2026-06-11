-- BlockCred admin activity logs
-- Run this file in the Supabase SQL Editor before using the admin activity log page.
-- This table is written by the backend using the Supabase service role key.
-- Do not expose the service role key to the frontend.

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid text,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_label text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_actor_email_idx
  ON activity_logs (actor_email);

CREATE INDEX IF NOT EXISTS activity_logs_action_idx
  ON activity_logs (action);

CREATE INDEX IF NOT EXISTS activity_logs_entity_type_idx
  ON activity_logs (entity_type);

CREATE INDEX IF NOT EXISTS activity_logs_entity_id_idx
  ON activity_logs (entity_id);

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
  ON activity_logs (created_at);
