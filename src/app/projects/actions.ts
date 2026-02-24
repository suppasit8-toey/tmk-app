'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const customerId = formData.get('customerId') as string;
    const referrerId = formData.get('referrerId') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;

    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;

    const start_date = startDateRaw ? startDateRaw : null;
    const end_date = endDateRaw ? endDateRaw : null;

    if (!name || !customerId) {
        throw new Error('Name and Customer are required');
    }

    // Generate running project number PJYYMMXXX
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // Use AD year
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PJ${yy}${mm}`;

    const { data: latestProject } = await supabase
        .from('projects')
        .select('project_number')
        .like('project_number', `${prefix}%`)
        .order('project_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    let runningNo = 1;
    if (latestProject?.project_number) {
        const lastNoStr = latestProject.project_number.slice(-3);
        const lastNo = parseInt(lastNoStr, 10);
        if (!isNaN(lastNo)) runningNo = lastNo + 1;
    }
    const project_number = `${prefix}${runningNo.toString().padStart(3, '0')}`;

    const { error } = await supabase.from('projects').insert({
        project_number,
        name,
        customer_id: customerId,
        referrer_id: referrerId || null,
        status: status || 'planning',
        description,
        start_date,
        end_date,
        created_by: user.id
    });

    if (error) {
        console.error('Error creating project:', error);
        throw new Error(error.message);
    }

    revalidatePath('/projects');
    return { success: true };
}

export async function updateProject(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const customerId = formData.get('customerId') as string;
    const referrerId = formData.get('referrerId') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;

    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;

    const start_date = startDateRaw ? startDateRaw : null;
    const end_date = endDateRaw ? endDateRaw : null;

    if (!name || !customerId) {
        throw new Error('Name and Customer are required');
    }

    const { error } = await supabase.from('projects').update({
        name,
        customer_id: customerId,
        referrer_id: referrerId || null,
        status,
        description,
        start_date,
        end_date,
        updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
        console.error('Error updating project:', error);
        throw new Error(error.message);
    }

    revalidatePath('/projects');
    return { success: true };
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
        console.error('Error deleting project:', error);
        throw new Error(error.message);
    }

    revalidatePath('/projects');
    return { success: true };
}
