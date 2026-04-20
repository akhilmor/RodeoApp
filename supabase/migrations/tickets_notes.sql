-- Add notes column to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fix status check constraint to include reserved and picked_up
-- (older schema may only have 'assigned','paid','checked_in')
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('reserved', 'assigned', 'paid', 'picked_up'));
