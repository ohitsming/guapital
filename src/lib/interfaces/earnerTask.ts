import { SurveyQuestion } from './survey';

export interface EarnerTask {
    id: string;
    title: string;
    description: string;
    campaign_budget: number;
    participant_quota: number;
    businesses: Array<{ business_name: string }>;
}

export interface FormattedEarnerTask {
    id: string;
    title: string;
    business: string;
    payout: number;
    timeEstimate: string;
    questions: number;
    category: string;
}

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  payout: number;
  timeEstimate: string;
  questions: SurveyQuestion[];
  expires_at: string;
}