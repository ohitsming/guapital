/**
 * Plaid Client Factory
 * Creates Plaid client instances lazily for better testability
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

/**
 * Get Plaid client instance
 * Creates a new instance each time for testability
 */
export function getPlaidClient(): PlaidApi {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  return new PlaidApi(configuration);
}
