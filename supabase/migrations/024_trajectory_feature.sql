-- =====================================================
-- TRAJECTORY FEATURE - FINANCIAL INDEPENDENCE CALCULATOR
-- =====================================================
-- This migration creates all tables and functions needed for
-- the Trajectory feature (FIRE calculator with path to financial independence)
--
-- Created: October 2025
-- Phase: Phase 2 Priority #3 Feature
-- =====================================================

-- =====================================================
-- 1. TRAJECTORY SNAPSHOTS TABLE
-- =====================================================
-- Stores daily calculations of user's path to financial independence

CREATE TABLE IF NOT EXISTS trajectory_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,

    -- Input metrics
    monthly_income NUMERIC(15,2) NOT NULL,
    monthly_expenses NUMERIC(15,2) NOT NULL,
    monthly_savings NUMERIC(15,2) NOT NULL,
    savings_rate NUMERIC(5,2) NOT NULL, -- Percentage (e.g., 45.50)

    -- Current status
    current_net_worth NUMERIC(15,2) NOT NULL,
    annual_expenses NUMERIC(15,2) NOT NULL,
    fire_number NUMERIC(15,2) NOT NULL, -- 25x annual expenses

    -- Projections
    years_to_fire NUMERIC(5,2), -- Can be NULL if already FI
    months_to_fire INTEGER,
    projected_fire_date DATE,

    -- Scenario analysis (using average market return 7%)
    conservative_years NUMERIC(5,2), -- 5% return
    aggressive_years NUMERIC(5,2),   -- 9% return

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX idx_trajectory_snapshots_user_date
    ON trajectory_snapshots(user_id, snapshot_date DESC);

-- RLS policies
ALTER TABLE trajectory_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trajectory history"
    ON trajectory_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert trajectory snapshots"
    ON trajectory_snapshots FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update trajectory snapshots"
    ON trajectory_snapshots FOR UPDATE
    USING (true);

COMMENT ON TABLE trajectory_snapshots IS 'Daily snapshots of user trajectory to financial independence. Calculated by nightly cron job or on-demand.';

-- =====================================================
-- 2. TRAJECTORY MILESTONES TABLE
-- =====================================================
-- Tracks achievement of FIRE milestones

CREATE TABLE IF NOT EXISTS trajectory_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL CHECK (milestone_type IN ('coast_fire', 'lean_fire', 'fire', 'fat_fire')),
    achieved_at TIMESTAMPTZ,
    net_worth_at_achievement NUMERIC(15,2),
    annual_expenses_at_achievement NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_type)
);

-- RLS policies
ALTER TABLE trajectory_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
    ON trajectory_milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert milestones"
    ON trajectory_milestones FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update milestones"
    ON trajectory_milestones FOR UPDATE
    USING (true);

COMMENT ON TABLE trajectory_milestones IS 'Tracks achievement of financial independence milestones: Coast FIRE, Lean FIRE, FIRE, and Fat FIRE.';

-- =====================================================
-- 3. CALCULATE TRAJECTORY FUNCTION
-- =====================================================
-- Core calculation logic for financial independence projections

CREATE OR REPLACE FUNCTION calculate_trajectory(
    p_user_id UUID,
    p_monthly_income NUMERIC,
    p_monthly_expenses NUMERIC,
    p_current_net_worth NUMERIC,
    p_expected_return NUMERIC DEFAULT 0.07 -- 7% default annual return
) RETURNS TABLE(
    years_to_fire NUMERIC,
    months_to_fire INTEGER,
    fire_number NUMERIC,
    savings_rate NUMERIC,
    projected_date DATE
) AS $$
DECLARE
    v_monthly_savings NUMERIC;
    v_savings_rate NUMERIC;
    v_annual_expenses NUMERIC;
    v_fire_number NUMERIC;
    v_months INTEGER;
    v_years NUMERIC;
    v_monthly_return NUMERIC;
BEGIN
    -- Calculate monthly savings
    v_monthly_savings := p_monthly_income - p_monthly_expenses;

    -- Calculate savings rate
    IF p_monthly_income > 0 THEN
        v_savings_rate := ROUND((v_monthly_savings / p_monthly_income) * 100, 2);
    ELSE
        v_savings_rate := 0;
    END IF;

    -- Calculate FIRE number (25x annual expenses - 4% safe withdrawal rate)
    v_annual_expenses := p_monthly_expenses * 12;
    v_fire_number := v_annual_expenses * 25;

    -- Calculate months to FIRE using compound interest formula
    -- Future Value = Present Value * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    -- Where: FV = FIRE number, PV = current net worth, PMT = monthly savings, r = monthly return
    v_monthly_return := p_expected_return / 12;

    -- Check if already at FIRE or if savings rate is negative
    IF p_current_net_worth >= v_fire_number THEN
        -- Already financially independent
        v_months := 0;
        v_years := 0;
    ELSIF v_monthly_savings <= 0 THEN
        -- Cannot reach FIRE with negative or zero savings
        v_months := NULL;
        v_years := NULL;
    ELSIF v_monthly_return = 0 THEN
        -- Simple calculation without compound interest
        v_months := CEIL((v_fire_number - p_current_net_worth) / v_monthly_savings);
        v_years := ROUND(v_months / 12.0, 2);
    ELSE
        -- Logarithmic calculation with compound interest
        -- Solving for n in: FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]
        v_months := CEIL(
            LN((v_fire_number + (v_monthly_savings / v_monthly_return)) /
               (p_current_net_worth + (v_monthly_savings / v_monthly_return)))
            / LN(1 + v_monthly_return)
        );
        v_years := ROUND(v_months / 12.0, 2);
    END IF;

    RETURN QUERY SELECT
        v_years,
        v_months,
        v_fire_number,
        v_savings_rate,
        CASE
            WHEN v_months IS NULL THEN NULL
            WHEN v_months = 0 THEN CURRENT_DATE
            ELSE (CURRENT_DATE + (v_months || ' months')::INTERVAL)::DATE
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_trajectory IS 'Calculates years to financial independence based on savings rate and expected returns using 25x expenses rule (4% safe withdrawal rate).';

-- =====================================================
-- 4. CALCULATE SCENARIO PROJECTIONS FUNCTION
-- =====================================================
-- Calculates conservative and aggressive scenarios

CREATE OR REPLACE FUNCTION calculate_trajectory_scenarios(
    p_user_id UUID,
    p_monthly_income NUMERIC,
    p_monthly_expenses NUMERIC,
    p_current_net_worth NUMERIC
) RETURNS TABLE(
    conservative_years NUMERIC,
    conservative_date DATE,
    base_years NUMERIC,
    base_date DATE,
    aggressive_years NUMERIC,
    aggressive_date DATE
) AS $$
DECLARE
    v_conservative RECORD;
    v_base RECORD;
    v_aggressive RECORD;
BEGIN
    -- Conservative scenario (5% annual return)
    SELECT * INTO v_conservative FROM calculate_trajectory(
        p_user_id, p_monthly_income, p_monthly_expenses, p_current_net_worth, 0.05
    );

    -- Base scenario (7% annual return)
    SELECT * INTO v_base FROM calculate_trajectory(
        p_user_id, p_monthly_income, p_monthly_expenses, p_current_net_worth, 0.07
    );

    -- Aggressive scenario (9% annual return)
    SELECT * INTO v_aggressive FROM calculate_trajectory(
        p_user_id, p_monthly_income, p_monthly_expenses, p_current_net_worth, 0.09
    );

    RETURN QUERY SELECT
        v_conservative.years_to_fire,
        v_conservative.projected_date,
        v_base.years_to_fire,
        v_base.projected_date,
        v_aggressive.years_to_fire,
        v_aggressive.projected_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CALCULATE FIRE MILESTONES FUNCTION
-- =====================================================
-- Determines which FIRE milestones have been achieved

CREATE OR REPLACE FUNCTION calculate_fire_milestones(
    p_current_net_worth NUMERIC,
    p_annual_expenses NUMERIC,
    p_age INTEGER DEFAULT NULL
) RETURNS TABLE(
    coast_fire_achieved BOOLEAN,
    coast_fire_amount NUMERIC,
    lean_fire_achieved BOOLEAN,
    lean_fire_amount NUMERIC,
    fire_achieved BOOLEAN,
    fire_amount NUMERIC,
    fat_fire_achieved BOOLEAN,
    fat_fire_amount NUMERIC
) AS $$
DECLARE
    v_coast_fire_amount NUMERIC;
    v_lean_fire_amount NUMERIC;
    v_fire_amount NUMERIC;
    v_fat_fire_amount NUMERIC;
    v_years_to_retirement INTEGER;
BEGIN
    -- Calculate milestone amounts
    v_lean_fire_amount := p_annual_expenses * 20;  -- 5% withdrawal rate for lean lifestyle
    v_fire_amount := p_annual_expenses * 25;        -- 4% withdrawal rate (standard FIRE)
    v_fat_fire_amount := p_annual_expenses * 37.5;  -- 2.67% withdrawal rate for luxury

    -- Coast FIRE: Current savings can compound to FIRE by age 65
    -- Assumes 7% annual return and retirement at 65
    IF p_age IS NOT NULL AND p_age < 65 THEN
        v_years_to_retirement := 65 - p_age;
        -- PV = FV / (1 + r)^n
        v_coast_fire_amount := v_fire_amount / POWER(1.07, v_years_to_retirement);
    ELSE
        v_coast_fire_amount := v_fire_amount; -- If age unknown or >= 65, same as FIRE
    END IF;

    RETURN QUERY SELECT
        p_current_net_worth >= v_coast_fire_amount,
        v_coast_fire_amount,
        p_current_net_worth >= v_lean_fire_amount,
        v_lean_fire_amount,
        p_current_net_worth >= v_fire_amount,
        v_fire_amount,
        p_current_net_worth >= v_fat_fire_amount,
        v_fat_fire_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. DAILY TRAJECTORY CALCULATION FUNCTION
-- =====================================================
-- Called by cron job to calculate and store daily trajectories

CREATE OR REPLACE FUNCTION calculate_daily_trajectories()
RETURNS void AS $$
DECLARE
    v_user RECORD;
    v_income NUMERIC;
    v_expenses NUMERIC;
    v_net_worth NUMERIC;
    v_trajectory RECORD;
    v_scenarios RECORD;
BEGIN
    -- Loop through all opted-in users
    FOR v_user IN
        SELECT DISTINCT u.id
        FROM auth.users u
        INNER JOIN user_demographics ud ON u.id = ud.user_id
        WHERE ud.opted_in_to_percentile = true
    LOOP
        -- Get user's average income/expenses from last 90 days of transactions
        SELECT
            COALESCE(AVG(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as avg_income,
            COALESCE(AVG(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as avg_expenses
        INTO v_income, v_expenses
        FROM plaid_transactions
        WHERE user_id = v_user.id
          AND date >= CURRENT_DATE - INTERVAL '90 days';

        -- Get current net worth
        SELECT COALESCE(total_assets - total_liabilities, 0)
        INTO v_net_worth
        FROM net_worth_snapshots
        WHERE user_id = v_user.id
        ORDER BY snapshot_date DESC
        LIMIT 1;

        -- Skip if no data
        IF v_income = 0 AND v_expenses = 0 THEN
            CONTINUE;
        END IF;

        -- Calculate base trajectory
        SELECT * INTO v_trajectory FROM calculate_trajectory(
            v_user.id, v_income, v_expenses, v_net_worth, 0.07
        );

        -- Calculate scenarios
        SELECT * INTO v_scenarios FROM calculate_trajectory_scenarios(
            v_user.id, v_income, v_expenses, v_net_worth
        );

        -- Insert or update trajectory snapshot
        INSERT INTO trajectory_snapshots (
            user_id, snapshot_date, monthly_income, monthly_expenses,
            monthly_savings, savings_rate, current_net_worth,
            annual_expenses, fire_number, years_to_fire, months_to_fire,
            projected_fire_date, conservative_years, aggressive_years
        ) VALUES (
            v_user.id, CURRENT_DATE, v_income, v_expenses,
            v_income - v_expenses, v_trajectory.savings_rate, v_net_worth,
            v_expenses * 12, v_trajectory.fire_number, v_trajectory.years_to_fire,
            v_trajectory.months_to_fire, v_trajectory.projected_date,
            v_scenarios.conservative_years, v_scenarios.aggressive_years
        )
        ON CONFLICT (user_id, snapshot_date)
        DO UPDATE SET
            monthly_income = EXCLUDED.monthly_income,
            monthly_expenses = EXCLUDED.monthly_expenses,
            monthly_savings = EXCLUDED.monthly_savings,
            savings_rate = EXCLUDED.savings_rate,
            current_net_worth = EXCLUDED.current_net_worth,
            annual_expenses = EXCLUDED.annual_expenses,
            fire_number = EXCLUDED.fire_number,
            years_to_fire = EXCLUDED.years_to_fire,
            months_to_fire = EXCLUDED.months_to_fire,
            projected_fire_date = EXCLUDED.projected_fire_date,
            conservative_years = EXCLUDED.conservative_years,
            aggressive_years = EXCLUDED.aggressive_years;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CRON JOB FOR DAILY CALCULATIONS
-- =====================================================
-- Runs at 1:30 AM UTC daily (after net worth snapshots)

-- Note: pg_cron must be enabled in Supabase dashboard first
-- This assumes pg_cron is already installed from previous migrations

DO $$
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule daily trajectory calculation
        PERFORM cron.schedule(
            'calculate-daily-trajectories',
            '30 1 * * *', -- 1:30 AM UTC daily
            'SELECT calculate_daily_trajectories();'
        );
    END IF;
END $$;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_trajectory TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trajectory_scenarios TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_fire_milestones TO authenticated;

-- Grant select permissions on tables to authenticated users
GRANT SELECT ON trajectory_snapshots TO authenticated;
GRANT SELECT ON trajectory_milestones TO authenticated;

-- =====================================================
-- 9. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE trajectory_snapshots IS 'Daily snapshots of user trajectory to financial independence using 25x expenses rule (4% safe withdrawal rate).';
COMMENT ON TABLE trajectory_milestones IS 'Tracks achievement of FIRE milestones: Coast FIRE (can coast to retirement), Lean FIRE (20x expenses), FIRE (25x expenses), Fat FIRE (37.5x expenses).';
COMMENT ON COLUMN trajectory_snapshots.fire_number IS 'Target net worth for financial independence (25x annual expenses).';
COMMENT ON COLUMN trajectory_snapshots.savings_rate IS 'Percentage of income saved each month.';
COMMENT ON COLUMN trajectory_milestones.milestone_type IS 'Type of FIRE milestone: coast_fire (can compound to FIRE by 65), lean_fire (20x expenses), fire (25x expenses), fat_fire (37.5x expenses).';