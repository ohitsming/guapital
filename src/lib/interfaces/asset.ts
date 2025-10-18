// Manual asset-related type definitions

export type AssetCategory =
  | 'real_estate'
  | 'vehicle'
  | 'private_equity'
  | 'collectibles'
  | 'other';

export interface ManualAsset {
  id: string;
  user_id: string;
  asset_name: string;
  current_value: number;
  category: AssetCategory;
  notes?: string;
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
  category: AssetCategory;
  notes?: string;
}
