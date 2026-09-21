/*
# Create admin config table for PIN hash storage

## Overview
Creates a secure table to store the admin PIN hash. This table is only accessible
to the service role (used by the edge function), not to anon or authenticated roles.
This avoids needing a custom edge function secret while keeping the PIN hash
completely invisible to the frontend.

## New Tables
1. **admin_config** — Single-row configuration table for admin secrets
   - `key` (text, PK) — config key name
   - `value` (text, not null) — the stored value (e.g. SHA-256 hash)
   - `updated_at` (timestamptz)

## Security
- RLS enabled with NO policies for anon or authenticated roles.
- Only the service role (which bypasses RLS) can read/write this table.
- The frontend cannot query this table at all.

## Notes
1. The PIN hash is inserted as a pre-computed SHA-256 value.
2. To change the PIN, update the `admin_pin_hash` row in this table using
   a SQL query with a new SHA-256 hash. This can only be done via the
   database management interface, not through the app itself.
*/

CREATE TABLE IF NOT EXISTS admin_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- No policies for anon or authenticated — only service role can access.
-- The service role bypasses RLS entirely.

-- Insert the PIN hash (SHA-256 of "102938")
INSERT INTO admin_config (key, value)
VALUES ('admin_pin_hash', '1ae1522db9452eb11cc84ed16cc8e8098064e8f602317c7ab7946a7d6b53c732')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
