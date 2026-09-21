/*
# Create admin_sessions table for server-side session management

## Overview
Creates a table to store admin session tokens. When the PIN is verified
successfully, a session token is created and stored here. Every admin
action must be accompanied by a valid session token that is checked
against this table server-side.

## New Tables
1. **admin_sessions** — Server-side admin session tracking
   - `id` (uuid, PK)
   - `token_hash` (text, not null, unique) — SHA-256 hash of the session token
   - `created_at` (timestamptz) — when the session was created
   - `last_activity_at` (timestamptz) — updated on each session validation
   - `expires_at` (timestamptz) — hard expiry (30 minutes after last activity)

## Security
- RLS enabled with NO policies for anon or authenticated roles.
- Only the service role (edge functions, which bypass RLS) can read/write.
- The session token itself is never stored — only its SHA-256 hash.
- Sessions auto-expire after 30 minutes of inactivity.

## Notes
1. The raw token is returned to the frontend once at login and kept in memory
   (never in localStorage/sessionStorage/cookies).
2. Each admin API call must include the token; the server validates it against
   the stored hash and checks the expiry time.
3. Logout deletes the session row entirely.
*/

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (edge functions) can access this table.

-- Index for fast lookups by token hash
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(token_hash);
