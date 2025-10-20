-- Add unique constraints to prevent duplicate Plaid items and accounts
-- This migration must be run AFTER cleaning up existing duplicates

-- Step 1: Add unique constraint to plaid_items.item_id
-- This ensures each Plaid institution connection is only stored once per user
ALTER TABLE plaid_items
ADD CONSTRAINT plaid_items_item_id_unique UNIQUE (item_id);

-- Step 2: Add unique constraint to plaid_accounts.account_id
-- This ensures each Plaid account is only stored once
ALTER TABLE plaid_accounts
ADD CONSTRAINT plaid_accounts_account_id_unique UNIQUE (account_id);

-- Step 3: Add unique constraint to plaid_transactions.transaction_id
-- This prevents duplicate transactions from being synced
ALTER TABLE plaid_transactions
ADD CONSTRAINT plaid_transactions_transaction_id_unique UNIQUE (transaction_id);

-- Step 4: Add unique constraint to crypto_wallets (wallet_address per blockchain per user)
-- This prevents duplicate wallet addresses
ALTER TABLE crypto_wallets
ADD CONSTRAINT crypto_wallets_address_blockchain_user_unique UNIQUE (user_id, wallet_address, blockchain);
