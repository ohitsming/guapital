-- Add missing DELETE RLS policies to support user deletion via Supabase Auth
-- This ensures CASCADE DELETE works properly when deleting users from the dashboard

-- manual_asset_history
CREATE POLICY "Users can delete own manual_asset_history"
    ON manual_asset_history FOR DELETE
    USING (auth.uid() = user_id);

-- net_worth_snapshots
CREATE POLICY "Users can delete own net_worth_snapshots"
    ON net_worth_snapshots FOR DELETE
    USING (auth.uid() = user_id);

-- percentile_milestones
CREATE POLICY "Users can delete own milestones"
    ON percentile_milestones FOR DELETE
    USING (auth.uid() = user_id);

-- percentile_snapshots
CREATE POLICY "Users can delete own percentile snapshots"
    ON percentile_snapshots FOR DELETE
    USING (auth.uid() = user_id);

-- user_demographics
CREATE POLICY "Users can delete own user_demographics"
    ON user_demographics FOR DELETE
    USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "Users can delete own user_settings"
    ON user_settings FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own manual_asset_history" ON manual_asset_history IS 'Allow users to delete their own asset history records';
COMMENT ON POLICY "Users can delete own net_worth_snapshots" ON net_worth_snapshots IS 'Allow users to delete their own net worth snapshots';
COMMENT ON POLICY "Users can delete own milestones" ON percentile_milestones IS 'Allow users to delete their own percentile milestones';
COMMENT ON POLICY "Users can delete own percentile snapshots" ON percentile_snapshots IS 'Allow users to delete their own percentile snapshots';
COMMENT ON POLICY "Users can delete own user_demographics" ON user_demographics IS 'Allow users to delete their own demographics';
COMMENT ON POLICY "Users can delete own user_settings" ON user_settings IS 'Allow users to delete their own settings';
