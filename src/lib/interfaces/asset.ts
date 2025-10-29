// Manual asset-related type definitions

export type EntryType = 'asset' | 'liability';

// Asset categories
export type AssetCategory =
  | 'real_estate'
  | 'vehicle'
  | 'private_equity'
  | 'collectibles'
  | 'cash'
  | 'investment'
  | 'private_stock'
  | 'bonds'
  | 'p2p_lending'
  | 'other';

// Liability categories
export type LiabilityCategory =
  | 'mortgage'
  | 'personal_loan'
  | 'business_debt'
  | 'credit_debt'
  | 'other_debt';

// Combined type for all categories
export type ManualEntryCategory = AssetCategory | LiabilityCategory;

export interface ManualAsset {
  id: string;
  user_id: string;
  asset_name: string;
  current_value: number;
  category: ManualEntryCategory;
  entry_type: EntryType;
  notes?: string;
  loan_term_years?: number | null; // For liabilities: loan term in years (0 = revolving credit)
  interest_rate?: number | null; // For liabilities: annual rate as decimal (e.g., 0.06 = 6%)
  created_at: string;
  updated_at: string;
}

export interface ManualAssetHistory {
  id: string;
  manual_asset_id: string;
  user_id: string;
  old_value?: number;
  new_value: number;
  changed_at: string;
}

export interface AssetFormData {
  asset_name: string;
  current_value: number;
  category: ManualEntryCategory;
  entry_type: EntryType;
  notes?: string;
  loan_term_years?: number | null;
  interest_rate?: number | null;
}
