// Percentile ranking type definitions

export type AgeBracket = '24-25' | '26-27' | '28-30' | '31-33' | '34-35';

export interface UserDemographics {
  id: string;
  user_id: string;
  date_of_birth?: string;
  age_bracket?: AgeBracket;
  opt_in_rankings: boolean;
  created_at: string;
  updated_at: string;
}

export interface PercentileRanking {
  percentile: number;
  age_bracket: AgeBracket;
  total_users_in_bracket: number;
  users_below: number;
  users_above: number;
}

export interface RankingStats {
  your_net_worth: number;
  age_bracket: AgeBracket;
  percentile: number;
  message: string; // "You're in the top X% of users in your age group"
  bracket_stats: {
    median: number;
    p25: number;
    p75: number;
    p90: number;
  };
}
