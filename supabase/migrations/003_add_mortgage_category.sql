-- Migration: Add 'mortgage' to liability categories
-- Allows users to track mortgage debt alongside other liabilities

-- Drop existing constraint
ALTER TABLE manual_assets
DROP CONSTRAINT IF EXISTS manual_assets_category_check;

-- Add updated constraint with 'mortgage' included
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
        'mortgage',
        'personal_loan',
        'business_debt',
        'credit_debt',
        'other_debt'
    )
);

-- Update comment for documentation
COMMENT ON COLUMN manual_assets.category IS 'Category of the entry. Asset categories: real_estate, vehicle, private_equity, collectibles, cash, investment, private_stock, bonds, p2p_lending, other. Liability categories: mortgage, personal_loan, business_debt, credit_debt, other_debt.';
