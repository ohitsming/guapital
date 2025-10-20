-- =====================================================
-- GENERATE TEST SNAPSHOTS - 365 Days of Historical Data
-- =====================================================
-- This script generates realistic historical snapshots for testing
-- Run this in Supabase SQL Editor
--
-- Usage: Replace 'YOUR_USER_ID' with your actual user_id below
-- =====================================================

DO $$
DECLARE
    v_user_id UUID := 'f306bec6-1ee0-4977-89fe-555bded5488f'; -- Replace with your user_id
    v_days INTEGER := 365;
    v_current_date DATE;
    v_snapshot_date DATE;

    -- Current baseline values (ending point)
    v_base_net_worth DECIMAL := 1824567.00;
    v_base_assets DECIMAL := 1924567.00;
    v_base_liabilities DECIMAL := 100000.00;
    v_base_investments DECIMAL := 1900000.00;
    v_base_other DECIMAL := 24567.00;
    v_base_loans DECIMAL := 100000.00;

    -- Calculated values for each day
    v_net_worth DECIMAL;
    v_total_assets DECIMAL;
    v_total_liabilities DECIMAL;
    v_investments DECIMAL;
    v_other DECIMAL;
    v_loans DECIMAL;
    v_breakdown JSONB;

    -- Growth and variance factors
    v_growth_factor DECIMAL;
    v_daily_variance DECIMAL;
    v_liability_variance DECIMAL;
BEGIN
    v_current_date := CURRENT_DATE;

    -- Loop through each day from 365 days ago to yesterday (exclude today)
    FOR i IN REVERSE v_days..1 LOOP
        v_snapshot_date := v_current_date - i;

        -- Calculate growth factor (gradual increase from past to present)
        -- Start at 85% of current value 365 days ago, grow to 100% today
        v_growth_factor := 0.85 + (0.15 * (v_days - i) / v_days);

        -- Add realistic daily variance (±1.5%)
        v_daily_variance := 1.0 + (random() - 0.5) * 0.03;

        -- Calculate values with growth + variance
        v_investments := v_base_investments * v_growth_factor * v_daily_variance;
        v_other := v_base_other * v_growth_factor * v_daily_variance;

        -- Liabilities stay relatively stable with small variance
        v_liability_variance := 1.0 + (random() - 0.5) * 0.05;
        v_loans := v_base_loans * v_liability_variance;

        -- Calculate totals
        v_total_assets := v_investments + v_other;
        v_total_liabilities := v_loans;
        v_net_worth := v_total_assets - v_total_liabilities;

        -- Build breakdown JSON
        v_breakdown := jsonb_build_object(
            'cash', 0.00,
            'investments', ROUND(v_investments, 2),
            'crypto', 0.00,
            'real_estate', 0.00,
            'other', ROUND(v_other, 2),
            'credit_card_debt', 0.00,
            'loans', ROUND(v_loans, 2)
        );

        -- Insert snapshot
        INSERT INTO net_worth_snapshots (
            user_id,
            snapshot_date,
            total_assets,
            total_liabilities,
            net_worth,
            breakdown
        )
        VALUES (
            v_user_id,
            v_snapshot_date,
            ROUND(v_total_assets, 2),
            ROUND(v_total_liabilities, 2),
            ROUND(v_net_worth, 2),
            v_breakdown
        )
        ON CONFLICT (user_id, snapshot_date)
        DO UPDATE SET
            total_assets = EXCLUDED.total_assets,
            total_liabilities = EXCLUDED.total_liabilities,
            net_worth = EXCLUDED.net_worth,
            breakdown = EXCLUDED.breakdown;
    END LOOP;

    RAISE NOTICE 'Successfully generated % snapshots for user %', v_days, v_user_id;
    RAISE NOTICE 'Date range: % to %', v_current_date - v_days, v_current_date - 1;
END $$;

-- =====================================================
-- VERIFY THE DATA
-- =====================================================
-- Run this to check the generated snapshots
SELECT
    COUNT(*) as total_snapshots,
    MIN(snapshot_date) as earliest_date,
    MAX(snapshot_date) as latest_date,
    MIN(net_worth) as min_net_worth,
    MAX(net_worth) as max_net_worth,
    ROUND(AVG(net_worth), 2) as avg_net_worth
FROM net_worth_snapshots
WHERE user_id = 'f306bec6-1ee0-4977-89fe-555bded5488f'; -- Replace with your user_id

-- =====================================================
-- VIEW SAMPLE DATA (Last 30 days)
-- =====================================================
SELECT
    snapshot_date,
    total_assets,
    total_liabilities,
    net_worth
FROM net_worth_snapshots
WHERE user_id = 'f306bec6-1ee0-4977-89fe-555bded5488f' -- Replace with your user_id
ORDER BY snapshot_date DESC
LIMIT 30;
