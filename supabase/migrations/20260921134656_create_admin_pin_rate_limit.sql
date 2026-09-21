/*
# Create admin PIN rate-limiting table

## Overview
Creates a table to track failed admin PIN verification attempts for rate limiting.
This prevents unlimited guessing of the admin PIN. The edge function that verifies
the PIN reads and writes to this table.

## New Tables
1. **admin_pin_attempts** — Tracks failed PIN attempts per IP address
   - `id` (uuid, PK)
   - `ip_hash` (text, not null) — SHA-256 hash of the client IP (never store raw IP)
   - `attempt_count` (int, not null, default 0)
   - `first_attempt_at` (timestamptz) — when the current attempt window started
   - `locked_until` (timestamptz) — if set, access is blocked until this time

## Security
- RLS enabled. Only the service role (edge function) can read/write; anon/authenticated
  get no policies, so the frontend cannot query this table directly.

## Notes
1. The IP is hashed so we never store raw visitor IPs in the database.
2. After 5 failed attempts within a 15-minute window, the IP is locked for 15 minutes.
*/

CREATE TABLE IF NOT EXISTS admin_pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL UNIQUE,
  attempt_count int NOT NULL DEFAULT 0,
  first_attempt_at timestamptz DEFAULT now(),
  locked_until timestamptz
);

ALTER TABLE admin_pin_attempts ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only the service role (used by the edge function,
-- which bypasses RLS) can read and write this table.