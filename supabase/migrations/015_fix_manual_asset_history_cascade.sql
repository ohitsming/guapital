-- Fix missing ON DELETE CASCADE on manual_asset_history.user_id foreign key
-- This was blocking user deletion via cascade

-- Drop the existing constraint
ALTER TABLE manual_asset_history
DROP CONSTRAINT IF EXISTS manual_asset_history_user_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE manual_asset_history
ADD CONSTRAINT manual_asset_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT manual_asset_history_user_id_fkey ON manual_asset_history IS 'Cascade delete manual asset history when user is deleted';
