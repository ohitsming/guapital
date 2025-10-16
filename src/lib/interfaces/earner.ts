export interface Earnings {
    current_balance: number;
    total_earned: number;
    pending_payout: number;
}

export interface Activity {
    id: number;
    description: string;
    amount: number;
    created_at: string;
}

export interface Survey {
    id: number;
    title: string;
    reward: number;
    estimated_time: string;
}
