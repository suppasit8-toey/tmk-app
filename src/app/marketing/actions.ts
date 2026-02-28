'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ═══════════════════════════════════════════════════════
// Campaigns
// ═══════════════════════════════════════════════════════

export async function getCampaigns() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(`
            *,
            marketing_tasks(*),
            marketing_evaluations(*),
            marketing_expenses(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }

    return (data || []).map(c => ({
        ...c,
        tasks: c.marketing_tasks || [],
        evaluations: c.marketing_evaluations || [],
        expenses: c.marketing_expenses || [],
        marketing_tasks: undefined,
        marketing_evaluations: undefined,
        marketing_expenses: undefined,
    }));
}

export async function createCampaign(data: {
    name: string;
    description?: string;
    strategy?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
    expected_sales?: number;
    expected_leads?: number;
    notes?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('marketing_campaigns')
        .insert([{
            name: data.name,
            description: data.description || null,
            strategy: data.strategy || null,
            status: data.status || 'draft',
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            budget: data.budget || 0,
            expected_sales: data.expected_sales || 0,
            expected_leads: data.expected_leads || 0,
            notes: data.notes || null,
            created_by: user?.id || null,
        }]);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function updateCampaign(id: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_campaigns')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function deleteCampaign(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

// ═══════════════════════════════════════════════════════
// Tasks
// ═══════════════════════════════════════════════════════

export async function createTask(data: {
    campaign_id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    status?: string;
    due_date?: string;
    priority?: string;
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_tasks')
        .insert([{
            campaign_id: data.campaign_id,
            title: data.title,
            description: data.description || null,
            assigned_to: data.assigned_to || null,
            status: data.status || 'pending',
            due_date: data.due_date || null,
            priority: data.priority || 'medium',
            sort_order: data.sort_order || 0,
        }]);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function updateTask(id: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_tasks')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function deleteTask(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_tasks')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

// ═══════════════════════════════════════════════════════
// Evaluations
// ═══════════════════════════════════════════════════════

export async function createEvaluation(data: {
    campaign_id: string;
    evaluation_date?: string;
    sales_result?: number;
    leads_result?: number;
    spend_result?: number;
    roi?: number;
    summary?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('marketing_evaluations')
        .insert([{
            campaign_id: data.campaign_id,
            evaluation_date: data.evaluation_date || new Date().toISOString().split('T')[0],
            sales_result: data.sales_result || 0,
            leads_result: data.leads_result || 0,
            spend_result: data.spend_result || 0,
            roi: data.roi || 0,
            summary: data.summary || null,
            created_by: user?.id || null,
        }]);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function deleteEvaluation(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_evaluations')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

// ═══════════════════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════════════════

export async function createExpense(data: {
    campaign_id: string;
    description: string;
    amount: number;
    expense_date?: string;
    category?: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_expenses')
        .insert([{
            campaign_id: data.campaign_id,
            description: data.description,
            amount: data.amount,
            expense_date: data.expense_date || new Date().toISOString().split('T')[0],
            category: data.category || 'other',
        }]);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('marketing_expenses')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/marketing');
}

// ═══════════════════════════════════════════════════════
// Helper: Get profiles for assignment
// ═══════════════════════════════════════════════════════

export async function getProfiles() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data || [];
}
