export type SupportRequestType = 'bug' | 'feature' | 'account' | 'question' | 'other';

export type SupportRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportRequest {
  id: string;
  user_id: string;
  email: string;
  type: SupportRequestType;
  description: string;
  status: SupportRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateSupportRequestPayload {
  type: SupportRequestType;
  description: string;
}
