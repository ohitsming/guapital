// Plaid-related type definitions

export interface PlaidItem {
  id: string;
  user_id: string;
  item_id: string;
  access_token: string;
  institution_id: string;
  institution_name: string;
  last_sync_at?: string;
  sync_status: 'active' | 'error' | 'disconnected';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaidAccount {
  id: string;
  user_id: string;
  plaid_item_id: string;
  account_id: string;
  account_name: string;
  account_type: 'depository' | 'credit' | 'investment' | 'loan';
  account_subtype?: string;
  current_balance: number;
  available_balance?: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaidTransaction {
  id: string;
  user_id: string;
  plaid_account_id: string;
  transaction_id: string;
  transaction_date: string;
  authorized_date?: string;
  merchant_name?: string;
  category?: string[];
  amount: number;
  currency: string;
  pending: boolean;
  ai_category?: string;
  ai_confidence?: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaidLinkMetadata {
  institution?: {
    name: string;
    institution_id: string;
  };
  account?: {
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  };
  link_session_id: string;
}
