-- Guapital Phase 1 Database Schema
-- This migration creates all tables needed for the MVP features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PLAID ACCOUNTS & TRANSACTIONS
-- =====================================================

-- Store Plaid access tokens and item metadata
CREATE TABLE plaid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'active', -- active, error, disconnected
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store individual accounts from Plaid
CREATE TABLE plaid_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plaid_item_id UUID NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- depository, credit, investment, loan
    account_subtype TEXT, -- checking, savings, credit card, 401k, etc.
    current_balance DECIMAL(15, 2),
    available_balance DECIMAL(15, 2),
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store transactions from Plaid
CREATE TABLE plaid_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plaid_account_id UUID NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    authorized_date DATE,
    merchant_name TEXT,
    category TEXT[], -- Array of category hierarchy
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    pending BOOLEAN DEFAULT false,
    ai_category TEXT, -- AI-suggested category
    ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    is_hidden BOOLEAN DEFAULT false, -- For "guilt-free spending" feature
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CRYPTO WALLETS
-- =====================================================

-- Store crypto wallet addresses
CREATE TABLE crypto_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_name TEXT, -- User-friendly name
    blockchain TEXT NOT NULL, -- ethereum, polygon, base, etc.
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'active',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store crypto holdings (snapshot from API)
CREATE TABLE crypto_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crypto_wallet_id UUID NOT NULL REFERENCES crypto_wallets(id) ON DELETE CASCADE,
    token_symbol TEXT NOT NULL, -- ETH, USDC, etc.
    token_name TEXT NOT NULL,
    token_address TEXT, -- Contract address (null for native tokens)
    balance DECIMAL(30, 18) NOT NULL, -- Large precision for crypto
    usd_value DECIMAL(15, 2) NOT NULL,
    usd_price DECIMAL(15, 2), -- Price per token
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. MANUAL ASSETS
-- =====================================================

-- Store manually entered assets
CREATE TABLE manual_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL,
    category TEXT NOT NULL, -- real_estate, vehicle, private_equity, collectibles, other
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track edit history for manual assets
CREATE TABLE manual_asset_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manual_asset_id UUID NOT NULL REFERENCES manual_assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    old_value DECIMAL(15, 2),
    new_value DECIMAL(15, 2) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. NET WORTH SNAPSHOTS
-- =====================================================

-- Daily snapshots of net worth for historical tracking
CREATE TABLE net_worth_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_assets DECIMAL(15, 2) NOT NULL,
    total_liabilities DECIMAL(15, 2) NOT NULL,
    net_worth DECIMAL(15, 2) NOT NULL,
    breakdown JSONB NOT NULL, -- {cash: 0, investments: 0, crypto: 0, real_estate: 0, other: 0}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- =====================================================
-- 5. PERCENTILE RANKINGS
-- =====================================================

-- Store user demographics for percentile calculations
CREATE TABLE user_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    date_of_birth DATE,
    age_bracket TEXT, -- 24-25, 26-27, 28-30, 31-33, 34-35
    opt_in_rankings BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. USER SETTINGS
-- =====================================================

-- Store user preferences and settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_currency TEXT DEFAULT 'USD',
    budget_hidden_categories TEXT[], -- Categories to hide from budget view
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX idx_plaid_accounts_user_id ON plaid_accounts(user_id);
CREATE INDEX idx_plaid_accounts_plaid_item_id ON plaid_accounts(plaid_item_id);
CREATE INDEX idx_plaid_transactions_user_id ON plaid_transactions(user_id);
CREATE INDEX idx_plaid_transactions_account_id ON plaid_transactions(plaid_account_id);
CREATE INDEX idx_plaid_transactions_date ON plaid_transactions(transaction_date DESC);
CREATE INDEX idx_crypto_wallets_user_id ON crypto_wallets(user_id);
CREATE INDEX idx_crypto_holdings_user_id ON crypto_holdings(user_id);
CREATE INDEX idx_crypto_holdings_wallet_id ON crypto_holdings(crypto_wallet_id);
CREATE INDEX idx_manual_assets_user_id ON manual_assets(user_id);
CREATE INDEX idx_net_worth_snapshots_user_id ON net_worth_snapshots(user_id);
CREATE INDEX idx_net_worth_snapshots_date ON net_worth_snapshots(snapshot_date DESC);
CREATE INDEX idx_user_demographics_age_bracket ON user_demographics(age_bracket);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own plaid_items" ON plaid_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid_items" ON plaid_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid_items" ON plaid_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid_items" ON plaid_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own plaid_accounts" ON plaid_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid_accounts" ON plaid_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid_accounts" ON plaid_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid_accounts" ON plaid_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own plaid_transactions" ON plaid_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid_transactions" ON plaid_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid_transactions" ON plaid_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid_transactions" ON plaid_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own crypto_wallets" ON crypto_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crypto_wallets" ON crypto_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crypto_wallets" ON crypto_wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crypto_wallets" ON crypto_wallets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own crypto_holdings" ON crypto_holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crypto_holdings" ON crypto_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crypto_holdings" ON crypto_holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crypto_holdings" ON crypto_holdings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own manual_assets" ON manual_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own manual_assets" ON manual_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own manual_assets" ON manual_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own manual_assets" ON manual_assets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own manual_asset_history" ON manual_asset_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own manual_asset_history" ON manual_asset_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own net_worth_snapshots" ON net_worth_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own net_worth_snapshots" ON net_worth_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own net_worth_snapshots" ON net_worth_snapshots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_demographics" ON user_demographics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_demographics" ON user_demographics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_demographics" ON user_demographics FOR UPDATE USING (auth.uid() = user_id);

-- Special policy for percentile rankings - users can view age_bracket and opt_in_rankings for ranking calculation
CREATE POLICY "Users can view rankings data" ON user_demographics FOR SELECT USING (opt_in_rankings = true);

CREATE POLICY "Users can view own user_settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate age bracket from date of birth
CREATE OR REPLACE FUNCTION calculate_age_bracket(dob DATE)
RETURNS TEXT AS $$
DECLARE
    age INTEGER;
BEGIN
    age := EXTRACT(YEAR FROM AGE(dob));

    IF age >= 24 AND age <= 25 THEN RETURN '24-25';
    ELSIF age >= 26 AND age <= 27 THEN RETURN '26-27';
    ELSIF age >= 28 AND age <= 30 THEN RETURN '28-30';
    ELSIF age >= 31 AND age <= 33 THEN RETURN '31-33';
    ELSIF age >= 34 AND age <= 35 THEN RETURN '34-35';
    ELSE RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update age_bracket when date_of_birth changes
CREATE OR REPLACE FUNCTION update_age_bracket()
RETURNS TRIGGER AS $$
BEGIN
    NEW.age_bracket := calculate_age_bracket(NEW.date_of_birth);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_age_bracket
BEFORE INSERT OR UPDATE OF date_of_birth ON user_demographics
FOR EACH ROW
EXECUTE FUNCTION update_age_bracket();

-- Function to calculate current net worth
CREATE OR REPLACE FUNCTION calculate_current_net_worth(p_user_id UUID)
RETURNS TABLE(
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
    v_total_assets DECIMAL(15, 2) := 0;
    v_total_liabilities DECIMAL(15, 2) := 0;
BEGIN
    -- Calculate cash (checking, savings accounts)
    SELECT COALESCE(SUM(current_balance), 0) INTO v_cash
    FROM plaid_accounts
    WHERE user_id = p_user_id
    AND account_type = 'depository'
    AND is_active = true;

    -- Calculate investments (brokerage, retirement accounts)
    SELECT COALESCE(SUM(current_balance), 0) INTO v_investments
    FROM plaid_accounts
    WHERE user_id = p_user_id
    AND account_type = 'investment'
    AND is_active = true;

    -- Calculate crypto
    SELECT COALESCE(SUM(usd_value), 0) INTO v_crypto
    FROM crypto_holdings
    WHERE user_id = p_user_id;

    -- Calculate real estate and other manual assets
    SELECT COALESCE(SUM(CASE WHEN category = 'real_estate' THEN current_value ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN category != 'real_estate' THEN current_value ELSE 0 END), 0)
    INTO v_real_estate, v_other
    FROM manual_assets
    WHERE user_id = p_user_id;

    -- Calculate credit card debt (negative balances)
    SELECT COALESCE(ABS(SUM(current_balance)), 0) INTO v_credit_card_debt
    FROM plaid_accounts
    WHERE user_id = p_user_id
    AND account_type = 'credit'
    AND is_active = true;

    -- Calculate loans
    SELECT COALESCE(SUM(current_balance), 0) INTO v_loans
    FROM plaid_accounts
    WHERE user_id = p_user_id
    AND account_type = 'loan'
    AND is_active = true;

    v_total_assets := v_cash + v_investments + v_crypto + v_real_estate + v_other;
    v_total_liabilities := v_credit_card_debt + v_loans;

    RETURN QUERY SELECT
        v_total_assets,
        v_total_liabilities,
        v_total_assets - v_total_liabilities,
        jsonb_build_object(
            'cash', v_cash,
            'investments', v_investments,
            'crypto', v_crypto,
            'real_estate', v_real_estate,
            'other', v_other,
            'credit_card_debt', v_credit_card_debt,
            'loans', v_loans
        );
END;
$$ LANGUAGE plpgsql;
