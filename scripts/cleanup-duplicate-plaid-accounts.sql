-- Cleanup Duplicate Plaid Accounts
-- Run this in Supabase SQL Editor to remove duplicate plaid_items and plaid_accounts
-- This script keeps the most recent entry for each duplicate

-- OPTION 1: CLEAN SLATE (Recommended for testing)
-- Delete all Plaid data and start fresh
-- Uncomment to use:
/*
DELETE FROM plaid_transactions;
DELETE FROM plaid_accounts;
DELETE FROM plaid_items;
*/

-- OPTION 2: REMOVE DUPLICATES ONLY
-- Keep the most recent entry for each duplicate

-- Step 1: Find duplicate plaid_items (preview)
SELECT
  item_id,
  COUNT(*) as duplicate_count
FROM plaid_items
GROUP BY item_id
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicate plaid_items (keep most recent)
-- WARNING: This will permanently delete duplicate entries!
DELETE FROM plaid_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at DESC) as rn
    FROM plaid_items
  ) t
  WHERE rn > 1
);

-- Step 3: Find duplicate plaid_accounts (preview)
SELECT
  account_id,
  COUNT(*) as duplicate_count
FROM plaid_accounts
GROUP BY account_id
HAVING COUNT(*) > 1;

-- Step 4: Delete duplicate plaid_accounts (keep most recent)
-- WARNING: This will permanently delete duplicate entries!
DELETE FROM plaid_accounts
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at DESC) as rn
    FROM plaid_accounts
  ) t
  WHERE rn > 1
);

-- Step 5: Verify cleanup was successful
-- Should return 0 rows if all duplicates are removed
SELECT
  'plaid_items' as table_name,
  item_id,
  COUNT(*) as count
FROM plaid_items
GROUP BY item_id
HAVING COUNT(*) > 1

UNION ALL

SELECT
  'plaid_accounts' as table_name,
  account_id,
  COUNT(*) as count
FROM plaid_accounts
GROUP BY account_id
HAVING COUNT(*) > 1;
