-- Migration: Add entry_type to manual_assets and expand categories
-- This allows tracking both assets and liabilities with expanded categories

-- Add entry_type column to distinguish between assets and liabilities
ALTER TABLE manual_assets
ADD COLUMN entry_type TEXT NOT NULL DEFAULT 'asset' CHECK (entry_type IN ('asset', 'liability'));

-- Set existing entries to 'asset' (already done via DEFAULT, but explicit for clarity)
UPDATE manual_assets SET entry_type = 'asset' WHERE entry_type IS NULL;

-- Add check constraint for valid categories
-- Assets: real_estate, vehicle, private_equity, collectibles, cash, investment, private_stock, bonds, p2p_lending, other
-- Liabilities: personal_loan, business_debt, credit_debt, other_debt
ALTER TABLE manual_assets
DROP CONSTRAINT IF EXISTS manual_assets_category_check;

ALTER TABLE manual_assets
ADD CONSTRAINT manual_assets_category_check CHECK (
    category IN (
        -- Asset categories
        'real_estate',
        'vehicle',
        'private_equity',
        'collectibles',
        'cash',
        'investment',
        'private_stock',
        'bonds',
        'p2p_lending',
        'other',
        -- Liability categories
        'personal_loan',
        'business_debt',
        'credit_debt',
        'other_debt'
    )
);

-- Create index for faster filtering by entry_type
CREATE INDEX IF NOT EXISTS idx_manual_assets_entry_type ON manual_assets(entry_type);

-- Add comment for documentation
COMMENT ON COLUMN manual_assets.entry_type IS 'Distinguishes between assets and liabilities. Assets have positive impact on net worth, liabilities have negative impact.';
COMMENT ON COLUMN manual_assets.category IS 'Category of the entry. Asset categories: real_estate, vehicle, private_equity, collectibles, cash, investment, private_stock, bonds, p2p_lending, other. Liability categories: personal_loan, business_debt, credit_debt, other_debt.';
