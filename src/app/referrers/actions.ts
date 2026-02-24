'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createReferrer(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const line_id = formData.get('line_id') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase.from('referrers').insert({
        name,
        phone,
        line_id,
        notes
    });

    if (error) {
        console.error('Error creating referrer:', error);
        throw new Error(error.message);
    }

    revalidatePath('/referrers');
    return { success: true };
}

export async function updateReferrer(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const line_id = formData.get('line_id') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase.from('referrers').update({
        name,
        phone,
        line_id,
        notes,
        updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
        console.error('Error updating referrer:', error);
        throw new Error(error.message);
    }

    revalidatePath('/referrers');
    return { success: true };
}

export async function deleteReferrer(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('referrers').delete().eq('id', id);

    if (error) {
        console.error('Error deleting referrer:', error);
        throw new Error(error.message);
    }

    revalidatePath('/referrers');
    return { success: true };
}
