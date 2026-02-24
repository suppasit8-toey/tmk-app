'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProjectLocation(projectId: string, floor: string, roomName: string, details?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('project_locations').insert({
        project_id: projectId,
        floor: floor || '',
        room_name: roomName,
        details: details || null,
    });

    if (error) {
        console.error('Error creating project location:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteProjectLocation(locationId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('project_locations').delete().eq('id', locationId);

    if (error) {
        console.error('Error deleting project location:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function createLocationWindow(locationId: string, projectId: string, name: string, details?: string, imageUrls?: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('location_windows').insert({
        location_id: locationId,
        name: name || 'หน้าต่าง',
        details: details || null,
        image_urls: imageUrls || [],
    });

    if (error) {
        console.error('Error creating location window:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteLocationWindow(windowId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('location_windows').delete().eq('id', windowId);

    if (error) {
        console.error('Error deleting location window:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
