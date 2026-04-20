-- Add notes column to tickets (used for transfer notes, etc.)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes TEXT;
