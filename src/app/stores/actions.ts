'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createStore(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const tax_id = formData.get('taxId') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;

    if (!name) throw new Error('Store name is required');

    const { error } = await supabase.from('stores').insert({
        name,
        tax_id,
        address,
        phone
    });

    if (error) {
        console.error('Error creating store:', error);
        throw new Error(error.message);
    }

    revalidatePath('/stores');
    return { success: true };
}

export async function updateStore(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const tax_id = formData.get('taxId') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;

    if (!name) throw new Error('Store name is required');

    const { error } = await supabase.from('stores').update({
        name,
        tax_id,
        address,
        phone,
        updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
        console.error('Error updating store:', error);
        throw new Error(error.message);
    }

    revalidatePath('/stores');
    return { success: true };
}

export async function deleteStore(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('stores').delete().eq('id', id);

    if (error) {
        console.error('Error deleting store:', error);
        throw new Error(error.message);
    }

    revalidatePath('/stores');
    return { success: true };
}
