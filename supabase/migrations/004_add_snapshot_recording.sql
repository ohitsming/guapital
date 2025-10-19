-- =====================================================
-- NET WORTH SNAPSHOT RECORDING SYSTEM
-- =====================================================
-- This migration adds automatic daily snapshot recording using pg_cron
-- and helper functions for manual snapshot creation

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- HELPER FUNCTION: Calculate Net Worth for a User
-- =====================================================
-- This function calculates net worth using the same logic as the API
CREATE OR REPLACE FUNCTION calculate_user_net_worth(target_user_id UUID)
RETURNS TABLE (
    total_assets DECIMAL(15, 2),
    total_liabilities DECIMAL(15, 2),
    net_worth DECIMAL(15, 2),
    breakdown JSONB
) AS $$
DECLARE
    v_cash DECIMAL(15, 2) := 0;
    v_investments DECIMAL(15, 2) := 0;
    v_crypto DECIMAL(15, 2) := 0;
    v_real_estate DECIMAL(15, 2) := 0;
    v_other DECIMAL(15, 2) := 0;
    v_credit_card_debt DECIMAL(15, 2) := 0;
    v_loans DECIMAL(15, 2) := 0;
    v_total_assets DECIMAL(15, 2);
    v_total_liabilities DECIMAL(15, 2);
    v_net_worth DECIMAL(15, 2);
    v_breakdown JSONB;
BEGIN
    -- 1. Calculate from Plaid accounts
    SELECT
        COALESCE(SUM(CASE WHEN account_type = 'depository' THEN current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN account_type = 'investment' THEN current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN account_type = 'credit' THEN ABS(current_balance) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN account_type = 'loan' THEN ABS(current_balance) ELSE 0 END), 0)
    INTO v_cash, v_investments, v_credit_card_debt, v_loans
    FROM plaid_accounts
    WHERE user_id = target_user_id AND is_active = true;

    -- 2. Calculate from crypto holdings
    SELECT COALESCE(SUM(usd_value), 0)
    INTO v_crypto
    FROM crypto_holdings
    WHERE user_id = target_user_id;

    -- 3. Add manual assets to existing values (don't overwrite!)
    -- Assets
    v_real_estate := COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'asset' AND category = 'real_estate'
    ), 0);

    v_cash := v_cash + COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'asset' AND category = 'cash'
    ), 0);

    v_investments := v_investments + COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'asset'
        AND category IN ('investment', 'private_equity', 'private_stock', 'bonds', 'p2p_lending')
    ), 0);

    v_other := COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'asset'
        AND category IN ('vehicle', 'collectibles', 'other')
    ), 0);

    -- Liabilities from manual assets
    v_credit_card_debt := v_credit_card_debt + COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'liability' AND category = 'credit_debt'
    ), 0);

    v_loans := v_loans + COALESCE((
        SELECT SUM(current_value)
        FROM manual_assets
        WHERE user_id = target_user_id AND entry_type = 'liability'
        AND category IN ('mortgage', 'personal_loan', 'business_debt', 'other_debt')
    ), 0);

    -- Calculate totals
    v_total_assets := v_cash + v_investments + v_crypto + v_real_estate + v_other;
    v_total_liabilities := v_credit_card_debt + v_loans;
    v_net_worth := v_total_assets - v_total_liabilities;

    -- Create breakdown JSON
    v_breakdown := jsonb_build_object(
        'cash', v_cash,
        'investments', v_investments,
        'crypto', v_crypto,
        'real_estate', v_real_estate,
        'other', v_other,
        'credit_card_debt', v_credit_card_debt,
        'loans', v_loans
    );

    -- Return results
    RETURN QUERY SELECT v_total_assets, v_total_liabilities, v_net_worth, v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Record Snapshot for a Specific User
-- =====================================================
CREATE OR REPLACE FUNCTION record_user_snapshot(
    target_user_id UUID,
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_assets DECIMAL(15, 2);
    v_total_liabilities DECIMAL(15, 2);
    v_net_worth DECIMAL(15, 2);
    v_breakdown JSONB;
BEGIN
    -- Calculate net worth for the user
    SELECT * INTO v_total_assets, v_total_liabilities, v_net_worth, v_breakdown
    FROM calculate_user_net_worth(target_user_id);

    -- Insert snapshot (or update if already exists for this date)
    INSERT INTO net_worth_snapshots (
        user_id,
        snapshot_date,
        total_assets,
        total_liabilities,
        net_worth,
        breakdown
    )
    VALUES (
        target_user_id,
        p_snapshot_date,
        v_total_assets,
        v_total_liabilities,
        v_net_worth,
        v_breakdown
    )
    ON CONFLICT (user_id, snapshot_date)
    DO UPDATE SET
        total_assets = EXCLUDED.total_assets,
        total_liabilities = EXCLUDED.total_liabilities,
        net_worth = EXCLUDED.net_worth,
        breakdown = EXCLUDED.breakdown,
        created_at = NOW();

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the entire job
        RAISE WARNING 'Failed to record snapshot for user %: %', target_user_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Record Snapshots for All Users
-- =====================================================
-- This function is called by the cron job daily
CREATE OR REPLACE FUNCTION record_daily_snapshots()
RETURNS TABLE (
    processed_user_id UUID,
    success BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_success BOOLEAN;
BEGIN
    -- Loop through all users who have at least one account, asset, or wallet
    FOR v_user_id IN
        SELECT DISTINCT u.id
        FROM auth.users u
        WHERE EXISTS (
            SELECT 1 FROM plaid_accounts pa WHERE pa.user_id = u.id AND pa.is_active = true
        ) OR EXISTS (
            SELECT 1 FROM manual_assets ma WHERE ma.user_id = u.id
        ) OR EXISTS (
            SELECT 1 FROM crypto_wallets cw WHERE cw.user_id = u.id
        )
    LOOP
        -- Record snapshot for this user
        v_success := record_user_snapshot(v_user_id, CURRENT_DATE);

        -- Return result for logging
        RETURN QUERY SELECT v_user_id, v_success;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEDULE DAILY SNAPSHOT JOB
-- =====================================================
-- Schedule the job to run daily at midnight UTC (00:00)
-- Note: Adjust the cron schedule based on your timezone preference
SELECT cron.schedule(
    'record-daily-net-worth-snapshots',  -- Job name
    '0 0 * * *',                         -- Cron expression: midnight UTC every day
    $$SELECT record_daily_snapshots();$$ -- Command to run
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow authenticated users to call the snapshot function manually (via API)
GRANT EXECUTE ON FUNCTION record_user_snapshot(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_net_worth(UUID) TO authenticated;

-- Note: The parameter name change (snapshot_date -> p_snapshot_date) doesn't affect
-- the function signature, so the GRANT statement remains the same
