// Percentile ranking type definitions

/**
 * Age brackets for percentile comparisons
 * Aligned with Federal Reserve SCF 2022 data structure
 */
export type AgeBracket = '18-21' | '22-25' | '26-28' | '29-32' | '33-35' | '36-40' | '41+';

export interface UserDemographics {
  id: string;
  user_id: string;
  date_of_birth?: string;
  age_bracket?: AgeBracket;
  percentile_opt_in: boolean;
  uses_seed_data?: boolean;
  last_percentile_calculation?: string;
  created_at: string;
  updated_at: string;
}

export interface PercentileRanking {
  percentile: number;
  age_bracket: AgeBracket;
  total_users_in_bracket: number;
  rank_position: number;
  uses_seed_data: boolean;
}

export interface PercentileMilestone {
  id: string;
  user_id: string;
  milestone_type: 'top_50' | 'top_25' | 'top_10' | 'top_5' | 'top_1';
  achieved_at?: string;
  net_worth_at_achievement?: number;
  shared_publicly: boolean;
  created_at: string;
}

export interface NextMilestone {
  type: string;
  label: string;
  required_net_worth: number;
  gap: number;
  current_progress: number;
}

export interface PercentileInsights {
  percentile_change_30d: number | null;
  is_climbing: boolean | null;
}

export interface PercentileDistributionPoint {
  percentile: number;
  min_net_worth: number;
  label: string;
  formatted_value: string;
}

export interface PercentileDistribution {
  age_bracket: AgeBracket;
  total_users: number;
  distribution: PercentileDistributionPoint[];
  source: 'scf_2022' | 'blended' | 'real_users';
  stats: {
    median: number;
    median_formatted: string;
    p90_threshold: number;
    p10_threshold: number;
    range: number;
  };
  disclaimer: string;
}

export interface PercentileResponse {
  opted_in: boolean;
  age_bracket?: AgeBracket;
  current_percentile?: number | null;
  rank_position?: number | null;
  total_users?: number | null;
  net_worth?: number;
  uses_seed_data?: boolean;
  last_updated?: string;
  message?: string;
  has_demographics?: boolean;
  milestones?: {
    achieved: string[];
    next: NextMilestone | null;
    total_unlocked: number;
  };
  distribution?: PercentileDistributionPoint[];
  insights?: PercentileInsights;
}

export interface OptInRequest {
  age_bracket: AgeBracket;
  birth_year?: number;
}

export interface OptInResponse {
  success: boolean;
  message: string;
  age_bracket: AgeBracket;
  percentile_available: boolean;
  current_percentile?: number | null;
  rank_position?: number | null;
  total_users?: number | null;
  uses_seed_data?: boolean | null;
}
