-- Add transfer history to service tickets (JSONB array of {date, fromTeacher, fromStudent, toTeacher, toStudent, transferredBy})
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS transfer_history jsonb DEFAULT '[]'::jsonb;

-- Add available pickup days to menu items (JSONB array of weekday numbers 0-6, null = all days)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_pickup_days jsonb DEFAULT '[]'::jsonb;