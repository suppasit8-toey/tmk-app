export interface MarketingCampaign {
    id: string;
    name: string;
    description: string | null;
    strategy: string | null;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    start_date: string | null;
    end_date: string | null;
    budget: number;
    expected_sales: number;
    expected_leads: number;
    actual_sales: number;
    actual_leads: number;
    actual_spend: number;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    tasks?: MarketingTask[];
    evaluations?: MarketingEvaluation[];
    expenses?: MarketingExpense[];
    creator?: { full_name: string } | null;
}

export interface MarketingTask {
    id: string;
    campaign_id: string;
    title: string;
    description: string | null;
    assigned_to: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null;
    priority: 'low' | 'medium' | 'high';
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Joined
    assignee?: { full_name: string } | null;
}

export interface MarketingEvaluation {
    id: string;
    campaign_id: string;
    evaluation_date: string;
    sales_result: number;
    leads_result: number;
    spend_result: number;
    roi: number;
    summary: string | null;
    created_by: string | null;
    created_at: string;
}

export interface MarketingExpense {
    id: string;
    campaign_id: string;
    description: string;
    amount: number;
    expense_date: string;
    category: string;
    created_at: string;
}
