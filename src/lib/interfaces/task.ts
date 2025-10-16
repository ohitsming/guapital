import { TargetingCriteria } from './criteria';
import { SurveyQuestion } from './survey';

export interface Task {
    id: string;
    created_at: string;
    title: string;
    description: string;
    business_id: string;
    is_active: boolean;
    participant_quota: number;
    campaign_budget: number;
    targeting_criteria: TargetingCriteria | null;
    questions: SurveyQuestion[];
    business_name?: string; // Optional because it's added in the RPC, not in the table
}