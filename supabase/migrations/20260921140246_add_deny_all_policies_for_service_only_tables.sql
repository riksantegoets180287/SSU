/*
# Add explicit deny-all RLS policies for service-role-only tables

## Purpose
The tables `admin_config`, `admin_pin_attempts`, and `admin_sessions` are accessed
exclusively by Supabase Edge Functions using the service role key, which bypasses RLS.
The frontend (anon key) must never read or write these tables directly.

RLS was already enabled on all three tables with no policies, which defaults to deny-all
for anon/authenticated roles. This migration adds explicit deny-all policies to document
that intent clearly and satisfy the database linter.

## Changes
For each of the three tables, four policies are created (SELECT, INSERT, UPDATE, DELETE),
all scoped to `anon, authenticated` with `USING (false)` / `WITH CHECK (false)`.

## Security
- No access for anon or authenticated roles — only the service role (edge functions) can use these tables.
- No data is modified or lost.
*/

-- admin_config
DROP POLICY IF EXISTS "deny_select_admin_config" ON admin_config;
CREATE POLICY "deny_select_admin_config" ON admin_config
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_insert_admin_config" ON admin_config;
CREATE POLICY "deny_insert_admin_config" ON admin_config
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_admin_config" ON admin_config;
CREATE POLICY "deny_update_admin_config" ON admin_config
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_admin_config" ON admin_config;
CREATE POLICY "deny_delete_admin_config" ON admin_config
  FOR DELETE TO anon, authenticated USING (false);

-- admin_pin_attempts
DROP POLICY IF EXISTS "deny_select_admin_pin_attempts" ON admin_pin_attempts;
CREATE POLICY "deny_select_admin_pin_attempts" ON admin_pin_attempts
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_insert_admin_pin_attempts" ON admin_pin_attempts;
CREATE POLICY "deny_insert_admin_pin_attempts" ON admin_pin_attempts
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_admin_pin_attempts" ON admin_pin_attempts;
CREATE POLICY "deny_update_admin_pin_attempts" ON admin_pin_attempts
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_admin_pin_attempts" ON admin_pin_attempts;
CREATE POLICY "deny_delete_admin_pin_attempts" ON admin_pin_attempts
  FOR DELETE TO anon, authenticated USING (false);

-- admin_sessions
DROP POLICY IF EXISTS "deny_select_admin_sessions" ON admin_sessions;
CREATE POLICY "deny_select_admin_sessions" ON admin_sessions
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_insert_admin_sessions" ON admin_sessions;
CREATE POLICY "deny_insert_admin_sessions" ON admin_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_admin_sessions" ON admin_sessions;
CREATE POLICY "deny_update_admin_sessions" ON admin_sessions
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_admin_sessions" ON admin_sessions;
CREATE POLICY "deny_delete_admin_sessions" ON admin_sessions
  FOR DELETE TO anon, authenticated USING (false);