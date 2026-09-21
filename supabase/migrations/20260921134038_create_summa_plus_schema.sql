/*
# Create Summa Plus full database schema

## Overview
Creates the complete database for the Summa Plus platform — a school internal
system with three modules: Uitleensysteem (lending), Servicesysteem (service
tickets), and Horeca & Catering (meal ordering). The app is single-tenant with
no user authentication (admin access is gated by a PIN in the frontend), so all
policies allow both `anon` and `authenticated` roles.

## New Tables

1. **categories** — Material categories (e.g. "Servies & Keuken")
   - `id` (text, PK) — app-generated string ID
   - `name` (text, not null)
   - `created_at` (timestamptz)

2. **materials** — Lendable items / services
   - `id` (text, PK)
   - `name` (text, not null)
   - `category_id` (text, FK → categories.id, ON DELETE SET NULL)
   - `total_quantity` (int, not null, default 0)
   - `optional_barcode` (text) — e.g. "SUM-SRV-001"
   - `optional_image_url` (text)
   - `notes` (text)
   - `created_at` (timestamptz)

3. **loans** — Lending records (uitgeleend / teruggebracht)
   - `id` (text, PK)
   - `material_id` (text, FK → materials.id, ON DELETE SET NULL)
   - `material_name` (text, not null) — denormalized snapshot
   - `category_name` (text) — denormalized snapshot
   - `borrower_name` (text, not null)
   - `borrower_team` (text, not null)
   - `quantity` (int, not null, default 1)
   - `borrowed_at_date` (text) — Dutch date string e.g. "25 augustus 2026"
   - `borrowed_at_time` (text) — e.g. "13:08"
   - `status` (text, not null, default 'uitgeleend') — 'uitgeleend' | 'teruggebracht'
   - `returned_at` (timestamptz)
   - `condition_at_return` (text) — 'goed' | 'opmerking' | 'defect'
   - `return_notes` (text)
   - `linked_ticket_number` (text) — if a service ticket was created on return
   - `created_at` (timestamptz)

4. **student_workers** — Student team members
   - `id` (text, PK)
   - `name` (text, not null)
   - `role` (text)
   - `team` (text)
   - `active` (boolean, not null, default true)
   - `created_at` (timestamptz)

5. **supervising_teachers** — Supervising teachers
   - `id` (text, PK)
   - `name` (text, not null)
   - `department` (text)
   - `email` (text)
   - `phone` (text)
   - `active` (boolean, not null, default true)
   - `created_at` (timestamptz)

6. **menu_items** — Horeca weekly menu dishes
   - `id` (text, PK)
   - `name` (text, not null)
   - `description` (text)
   - `price` (text) — e.g. "€ 4,50" or "Gratis"
   - `category` (text) — 'hoofdgerecht' | 'soep' | 'broodje' | 'snack' | 'dessert' | 'overig'
   - `image_url` (text)
   - `max_daily_portions` (int, not null, default 0)
   - `active` (boolean, not null, default true)
   - `dietary_tag` (text)
   - `created_at` (timestamptz)

7. **service_tickets** — Service / horeca / meeting tickets
   - `id` (text, PK)
   - `ticket_number` (text, unique) — e.g. "TKT-1042" or "HC-2001"
   - `title` (text, not null)
   - `description` (text)
   - `category` (text) — 'ict_av' | 'facilitair' | 'meubilair' | 'reparatie' | 'evenement' | 'horeca' | 'overig'
   - `priority` (text, not null, default 'normaal') — 'laag' | 'normaal' | 'hoog' | 'spoed'
   - `location` (text)
   - `requester_name` (text)
   - `requester_team` (text)
   - `requester_contact` (text)
   - `desired_date` (text)
   - `assigned_to` (text) — legacy fallback
   - `assigned_teacher` (text)
   - `assigned_student` (text)
   - `photos` (jsonb) — array of base64 data URLs
   - `status` (text, not null, default 'open') — 'open' | 'in_behandeling' | 'wacht_op_onderdelen' | 'wachtlijst' | 'afgerond' | 'geannuleerd'
   - `archived` (boolean, not null, default false)
   - `archived_at` (timestamptz)
   - `resolution_notes` (text)
   - `completed_at` (timestamptz)
   - `meal_pickup_time` (text) — e.g. "12:30"
   - `meal_dietary_notes` (text)
   - `total_portions` (int)
   - `created_at` (timestamptz)

8. **meal_order_items** — Individual dish entries within a horeca ticket
   - `id` (uuid, PK, default gen_random_uuid())
   - `ticket_id` (text, FK → service_tickets.id, ON DELETE CASCADE)
   - `menu_item_id` (text)
   - `name` (text, not null) — dish name snapshot
   - `portions` (int, not null, default 1)
   - `price` (text)
   - `category` (text)
   - `created_at` (timestamptz)

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` — the app has no sign-in screen,
  so the frontend operates as the `anon` role. Data is intentionally shared
  across all users of this single-tenant system.

## Notes
1. Text primary keys are used (except meal_order_items which uses uuid) so the
   app's existing string-based ID generation continues to work unchanged.
2. Denormalized `material_name` and `category_name` on loans preserve the
   historical record even if a material or category is later renamed/deleted.
3. Meal order items are stored as a separate table rather than a JSONB column
   on service_tickets, enabling future querying of dish popularity.
*/

-- ============================================================
-- 1. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. materials
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id text PRIMARY KEY,
  name text NOT NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  total_quantity int NOT NULL DEFAULT 0,
  optional_barcode text,
  optional_image_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_materials" ON materials;
CREATE POLICY "anon_select_materials" ON materials FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_materials" ON materials;
CREATE POLICY "anon_insert_materials" ON materials FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_materials" ON materials;
CREATE POLICY "anon_update_materials" ON materials FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_materials" ON materials;
CREATE POLICY "anon_delete_materials" ON materials FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 3. loans
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
  id text PRIMARY KEY,
  material_id text REFERENCES materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  category_name text,
  borrower_name text NOT NULL,
  borrower_team text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  borrowed_at_date text,
  borrowed_at_time text,
  status text NOT NULL DEFAULT 'uitgeleend',
  returned_at timestamptz,
  condition_at_return text,
  return_notes text,
  linked_ticket_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_loans" ON loans;
CREATE POLICY "anon_select_loans" ON loans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_loans" ON loans;
CREATE POLICY "anon_insert_loans" ON loans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_loans" ON loans;
CREATE POLICY "anon_update_loans" ON loans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_loans" ON loans;
CREATE POLICY "anon_delete_loans" ON loans FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. student_workers
-- ============================================================
CREATE TABLE IF NOT EXISTS student_workers (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text,
  team text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_student_workers" ON student_workers;
CREATE POLICY "anon_select_student_workers" ON student_workers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_student_workers" ON student_workers;
CREATE POLICY "anon_insert_student_workers" ON student_workers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_student_workers" ON student_workers;
CREATE POLICY "anon_update_student_workers" ON student_workers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_student_workers" ON student_workers;
CREATE POLICY "anon_delete_student_workers" ON student_workers FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. supervising_teachers
-- ============================================================
CREATE TABLE IF NOT EXISTS supervising_teachers (
  id text PRIMARY KEY,
  name text NOT NULL,
  department text,
  email text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supervising_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_supervising_teachers" ON supervising_teachers;
CREATE POLICY "anon_select_supervising_teachers" ON supervising_teachers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_supervising_teachers" ON supervising_teachers;
CREATE POLICY "anon_insert_supervising_teachers" ON supervising_teachers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_supervising_teachers" ON supervising_teachers;
CREATE POLICY "anon_update_supervising_teachers" ON supervising_teachers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_supervising_teachers" ON supervising_teachers;
CREATE POLICY "anon_delete_supervising_teachers" ON supervising_teachers FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 6. menu_items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price text,
  category text,
  image_url text,
  max_daily_portions int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  dietary_tag text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 7. service_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS service_tickets (
  id text PRIMARY KEY,
  ticket_number text UNIQUE,
  title text NOT NULL,
  description text,
  category text,
  priority text NOT NULL DEFAULT 'normaal',
  location text,
  requester_name text,
  requester_team text,
  requester_contact text,
  desired_date text,
  assigned_to text,
  assigned_teacher text,
  assigned_student text,
  photos jsonb,
  status text NOT NULL DEFAULT 'open',
  archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  resolution_notes text,
  completed_at timestamptz,
  meal_pickup_time text,
  meal_dietary_notes text,
  total_portions int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_service_tickets" ON service_tickets;
CREATE POLICY "anon_select_service_tickets" ON service_tickets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_service_tickets" ON service_tickets;
CREATE POLICY "anon_insert_service_tickets" ON service_tickets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_service_tickets" ON service_tickets;
CREATE POLICY "anon_update_service_tickets" ON service_tickets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_service_tickets" ON service_tickets;
CREATE POLICY "anon_delete_service_tickets" ON service_tickets FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 8. meal_order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  menu_item_id text,
  name text NOT NULL,
  portions int NOT NULL DEFAULT 1,
  price text,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meal_order_items" ON meal_order_items;
CREATE POLICY "anon_select_meal_order_items" ON meal_order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meal_order_items" ON meal_order_items;
CREATE POLICY "anon_insert_meal_order_items" ON meal_order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meal_order_items" ON meal_order_items;
CREATE POLICY "anon_update_meal_order_items" ON meal_order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meal_order_items" ON meal_order_items;
CREATE POLICY "anon_delete_meal_order_items" ON meal_order_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_loans_material_id ON loans(material_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_category ON service_tickets(category);
CREATE INDEX IF NOT EXISTS idx_service_tickets_archived ON service_tickets(archived);
CREATE INDEX IF NOT EXISTS idx_meal_order_items_ticket_id ON meal_order_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_student_workers_active ON student_workers(active);
CREATE INDEX IF NOT EXISTS idx_supervising_teachers_active ON supervising_teachers(active);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(active);
