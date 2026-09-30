-- Add return_due_date column to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS return_due_date date;
