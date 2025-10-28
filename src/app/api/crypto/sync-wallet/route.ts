import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import axios from 'axios';
import { logger } from '@/utils/logger';

// Alchemy API endpoint builder
const getAlchemyEndpoint = (blockchain: string) => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const baseUrls: Record<string, string> = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`,
    base: `https://base-mainnet.g.alchemy.com/v2/${apiKey}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`,
  };
  return baseUrls[blockchain] || baseUrls.ethereum;
};

// Get native token symbol for blockchain
const getNativeTokenSymbol = (blockchain: string): string => {
  const symbols: Record<string, string> = {
    ethereum: 'ETH',
    polygon: 'MATIC',
    base: 'ETH',
    arbitrum: 'ETH',
    optimism: 'ETH',
  };
  return symbols[blockchain] || 'ETH';
};

// Fetch token prices from CoinGecko (free API)
const getTokenPrices = async (tokenIds: string[]): Promise<Record<string, number>> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
      },
    });

    const prices: Record<string, number> = {};
    Object.entries(response.data).forEach(([id, data]: [string, any]) => {
      prices[id] = data.usd || 0;
    });
    return prices;
  } catch (error: any) {
    logger.warn('Error fetching token prices', { error: error.message });
    return {};
  }
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { wallet_id } = await request.json();

    if (!wallet_id) {
      return NextResponse.json({ error: 'Missing wallet_id' }, { status: 400 });
    }

    // Debug: Check if API key exists
    if (!process.env.ALCHEMY_API_KEY) {
      logger.error('ALCHEMY_API_KEY is not set in environment variables', {
        userId: user.id,
        walletId: wallet_id,
      });
      return NextResponse.json({ error: 'Alchemy API key not configured' }, { status: 500 });
    }

    // Get wallet details
    const { data: wallet, error: walletError } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('id', wallet_id)
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const alchemyEndpoint = getAlchemyEndpoint(wallet.blockchain);
    console.log('Syncing wallet:', wallet.wallet_address, 'on', wallet.blockchain);
    console.log('Alchemy endpoint:', alchemyEndpoint);

    try {
      // Get native token balance (ETH, MATIC, etc.)
      const balanceResponse = await axios.post(alchemyEndpoint, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [wallet.wallet_address, 'latest'],
      });

      console.log('Balance response:', balanceResponse.data);

      const nativeBalance =
        parseInt(balanceResponse.data.result || '0x0', 16) / 1e18;

      console.log('Native balance:', nativeBalance);

      // Get ERC20 token balances
      const tokensResponse = await axios.post(alchemyEndpoint, {
        jsonrpc: '2.0',
        id: 2,
        method: 'alchemy_getTokenBalances',
        params: [wallet.wallet_address],
      });

      const tokenBalances = tokensResponse.data.result?.tokenBalances || [];

      // Get token metadata for top tokens (limit to top 20 by balance)
      const topTokens = tokenBalances
        .filter((t: any) => parseInt(t.tokenBalance || '0x0', 16) > 0)
        .slice(0, 20);

      const holdings = [];

      // Fetch prices for native token and top ERC20 tokens
      const nativeTokenId = getNativeTokenSymbol(wallet.blockchain).toLowerCase();
      const priceIds = [nativeTokenId === 'matic' ? 'matic-network' : 'ethereum'];

      console.log('Fetching prices for:', priceIds);
      const prices = await getTokenPrices(priceIds);
      console.log('Prices received:', prices);
      const nativePrice = prices[priceIds[0]] || 0;
      console.log('Native price:', nativePrice);

      // Add native token holding
      holdings.push({
        user_id: user.id,
        crypto_wallet_id: wallet.id,
        token_symbol: getNativeTokenSymbol(wallet.blockchain),
        token_name: getNativeTokenSymbol(wallet.blockchain),
        token_address: null,
        balance: nativeBalance,
        usd_price: nativePrice,
        usd_value: nativeBalance * nativePrice,
      });

      // Add ERC20 token holdings
      for (const token of topTokens) {
        try {
          const metadataResponse = await axios.post(alchemyEndpoint, {
            jsonrpc: '2.0',
            id: 3,
            method: 'alchemy_getTokenMetadata',
            params: [token.contractAddress],
          });

          const metadata = metadataResponse.data.result;
          const balance =
            parseInt(token.tokenBalance || '0x0', 16) /
            Math.pow(10, metadata.decimals || 18);

          // For now, we'll use $0 for ERC20 tokens unless we have specific price data
          // In production, you'd want to fetch prices for major tokens from CoinGecko
          holdings.push({
            user_id: user.id,
            crypto_wallet_id: wallet.id,
            token_symbol: metadata.symbol || 'UNKNOWN',
            token_name: metadata.name || 'Unknown Token',
            token_address: token.contractAddress,
            balance: balance,
            usd_price: 0, // Would need additional API call to get price
            usd_value: 0,
          });
        } catch (metadataError: any) {
          logger.warn('Error fetching token metadata', {
            userId: user.id,
            walletId: wallet.id,
            tokenAddress: token.contractAddress,
            error: metadataError.message,
          });
        }
      }

      // Delete old holdings
      await supabase
        .from('crypto_holdings')
        .delete()
        .eq('crypto_wallet_id', wallet.id);

      // Insert new holdings
      if (holdings.length > 0) {
        console.log('Inserting holdings:', holdings.length);
        console.log('Holdings data:', JSON.stringify(holdings, null, 2));
        const { error: holdingsError } = await supabase
          .from('crypto_holdings')
          .insert(holdings);

        if (holdingsError) {
          logger.error('Error inserting crypto holdings', {
            userId: user.id,
            walletId: wallet.id,
            error: holdingsError.message,
            code: holdingsError.code,
          });
        }
      }

      // Update wallet sync status
      await supabase
        .from('crypto_wallets')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'active',
          error_message: null,
        })
        .eq('id', wallet.id);

      return NextResponse.json({
        success: true,
        holdings_count: holdings.length,
        total_value_usd: holdings.reduce((sum, h) => sum + h.usd_value, 0),
      });
    } catch (alchemyError: any) {
      logger.error('Alchemy API error', alchemyError, {
        userId: user.id,
        walletId: wallet.id,
        blockchain: wallet.blockchain,
        walletAddress: wallet.wallet_address,
      });

      // Update wallet with error status
      await supabase
        .from('crypto_wallets')
        .update({
          sync_status: 'error',
          error_message: alchemyError.message || 'Failed to sync wallet',
        })
        .eq('id', wallet.id);

      throw alchemyError;
    }
  } catch (error: any) {
    logger.error('Error syncing crypto wallet', error, {
      userId: user?.id,
      route: '/api/crypto/sync-wallet',
    });
    return NextResponse.json(
      { error: 'Failed to sync wallet', details: error.message },
      { status: 500 }
    );
  }
}
