import posthog from 'posthog-js';

/**
 * PostHog Event Tracking for Guapital
 *
 * Key Events to Track:
 * - User lifecycle (signup, login, logout)
 * - Account connections (Plaid, crypto wallets, manual assets)
 * - Subscription events (upgrade, downgrade, cancel)
 * - Feature usage (percentile opt-in, reports, transactions)
 * - Engagement (net worth updates, asset additions)
 */

// ============================================================================
// User Lifecycle Events
// ============================================================================

export function trackSignup(userId: string, email: string) {
  posthog.identify(userId, {
    email,
    signup_date: new Date().toISOString(),
  });
  posthog.capture('signup_completed');
}

export function trackLogin(userId: string) {
  posthog.identify(userId);
  posthog.capture('login_completed');
}

export function trackLogout() {
  posthog.capture('logout_completed');
  posthog.reset(); // Clear user identification
}

// ============================================================================
// Account Connection Events
// ============================================================================

export function trackPlaidAccountLinked(data: {
  institution: string;
  account_type: string;
  account_count: number;
}) {
  posthog.capture('plaid_account_linked', data);
}

export function trackPlaidLinkFailed(data: {
  institution?: string;
  error_code?: string;
  error_message?: string;
}) {
  posthog.capture('plaid_link_failed', data);
}

export function trackPlaidAccountConverted(data: {
  institution: string;
  account_count: number;
  reason: 'downgrade' | 'manual';
}) {
  posthog.capture('plaid_account_converted_to_manual', data);
}

export function trackCryptoWalletAdded(data: {
  blockchain: string;
  wallet_count: number;
}) {
  posthog.capture('crypto_wallet_added', data);
}

export function trackManualAssetAdded(data: {
  category: string;
  entry_type: 'asset' | 'liability';
  value: number;
}) {
  posthog.capture('manual_asset_added', data);
}

export function trackManualAssetEdited(data: {
  category: string;
  entry_type: 'asset' | 'liability';
  old_value: number;
  new_value: number;
  value_change: number;
}) {
  posthog.capture('manual_asset_edited', data);
}

export function trackManualAssetDeleted(data: {
  category: string;
  entry_type: 'asset' | 'liability';
}) {
  posthog.capture('manual_asset_deleted', data);
}

// ============================================================================
// Subscription Events
// ============================================================================

export function trackPremiumUpgrade(data: {
  plan: 'monthly' | 'annual' | 'founding';
  amount: number;
  days_since_signup: number;
  accounts_linked: number;
  opted_into_percentile: boolean;
}) {
  posthog.capture('premium_upgrade', data);
  posthog.setPersonProperties({
    subscription_tier: 'premium',
    subscription_plan: data.plan,
  });
}

export function trackSubscriptionCancelled(data: {
  plan: 'monthly' | 'annual' | 'founding';
  days_subscribed: number;
  reason?: string;
}) {
  posthog.capture('subscription_cancelled', data);
}

export function trackSubscriptionReactivated(data: {
  plan: 'monthly' | 'annual' | 'founding';
}) {
  posthog.capture('subscription_reactivated', data);
  posthog.setPersonProperties({
    subscription_tier: 'premium',
    subscription_plan: data.plan,
  });
}

// ============================================================================
// Percentile Ranking Events (THE Killer Feature)
// ============================================================================

export function trackPercentileOptIn(data: {
  age_bracket: string;
  net_worth: number;
  days_since_signup: number;
}) {
  posthog.capture('percentile_opt_in', data);
  posthog.setPersonProperties({
    opted_into_percentile: true,
    age_bracket: data.age_bracket,
  });
}

export function trackPercentileLearnMore() {
  posthog.capture('percentile_learn_more_clicked');
}

export function trackPercentileViewed(data: {
  percentile: number;
  age_bracket: string;
  net_worth: number;
}) {
  posthog.capture('percentile_viewed', data);
}

// ============================================================================
// Feature Usage Events
// ============================================================================

export function trackTransactionsViewed(data: {
  transaction_count: number;
  date_range_days: number;
}) {
  posthog.capture('transactions_viewed', data);
}

export function trackReportsViewed() {
  posthog.capture('reports_viewed');
}

export function trackNetWorthUpdated(data: {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  account_count: number;
}) {
  posthog.capture('net_worth_updated', data);
  posthog.setPersonProperties({
    net_worth: data.net_worth,
    total_assets: data.total_assets,
    total_liabilities: data.total_liabilities,
    account_count: data.account_count,
  });
}

export function trackDashboardViewed() {
  posthog.capture('dashboard_viewed');
}

// ============================================================================
// Pricing & Marketing Events
// ============================================================================

export function trackPricingViewed() {
  posthog.capture('pricing_viewed');
}

export function trackFoundingMemberBannerClicked() {
  posthog.capture('founding_member_banner_clicked');
}

// ============================================================================
// Error Events
// ============================================================================

export function trackError(data: {
  error_type: string;
  error_message: string;
  page: string;
}) {
  posthog.capture('error_occurred', data);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}

export function updateUserProperties(properties: Record<string, any>) {
  posthog.setPersonProperties(properties);
}

export function captureCustomEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}
