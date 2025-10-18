// Crypto wallet-related type definitions

export interface CryptoWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_name?: string;
  blockchain: 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'optimism';
  last_sync_at?: string;
  sync_status: 'active' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CryptoHolding {
  id: string;
  user_id: string;
  crypto_wallet_id: string;
  token_symbol: string;
  token_name: string;
  token_address?: string;
  balance: number;
  usd_value: number;
  usd_price?: number;
  created_at: string;
  updated_at: string;
}

export interface CryptoPortfolioSummary {
  total_value_usd: number;
  wallets_count: number;
  top_holdings: {
    token_symbol: string;
    token_name: string;
    usd_value: number;
    percentage: number;
  }[];
}
