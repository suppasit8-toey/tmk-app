'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { MeasurementMode } from '@/types/measurements';

export async function createMeasurementBill(projectId: string, customerId: string, mode: MeasurementMode) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Generate running bill number MBYYMM-XXX
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `MB${yy}${mm}-`;

    const { data: latestBill } = await supabase
        .from('measurement_bills')
        .select('bill_number')
        .like('bill_number', `${prefix}%`)
        .order('bill_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    let runningNo = 1;
    if (latestBill?.bill_number) {
        const lastNoStr = latestBill.bill_number.split('-')[1];
        if (lastNoStr) {
            const lastNo = parseInt(lastNoStr, 10);
            if (!isNaN(lastNo)) runningNo = lastNo + 1;
        }
    }
    const bill_number = `${prefix}${runningNo.toString().padStart(3, '0')}`;

    const { error } = await supabase.from('measurement_bills').insert({
        bill_number,
        project_id: projectId,
        customer_id: customerId,
        measurement_mode: mode,
        status: 'draft',
        created_by: user.id
    });

    if (error) {
        console.error('Error creating measurement bill:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`); // Attempt to revalidate by ID
    return { success: true };
}

export async function createMeasurementItem(
    billId: string,
    projectId: string,
    locationName: string,
    details?: string,
    locationData?: {
        locationId: string;
        customFloor: string;
        customRoom: string;
        customLocationDetails: string;
        windowId: string;
        customWindow: string;
        customWindowDetails?: string;
    },
    categoryId?: string | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    let finalLocationId = locationData?.locationId;

    if (locationData) {
        // 1. Create project location if custom
        if (locationData.locationId === 'อื่นๆ' && locationData.customRoom) {
            const { data: newLoc, error: locError } = await supabase
                .from('project_locations')
                .insert({
                    project_id: projectId,
                    room_name: locationData.customRoom,
                    floor: locationData.customFloor,
                    details: locationData.customLocationDetails || null,
                })
                .select()
                .single();

            if (locError) {
                console.error('Error creating project location:', locError);
                throw new Error(locError.message);
            }
            finalLocationId = newLoc.id;
        }

        // 2. Create location window if custom
        if (locationData.windowId === 'อื่นๆ' && locationData.customWindow && finalLocationId && finalLocationId !== 'อื่นๆ') {
            const { error: winError } = await supabase
                .from('location_windows')
                .insert({
                    location_id: finalLocationId,
                    name: locationData.customWindow,
                    details: locationData.customWindowDetails || null,
                });

            if (winError) {
                console.error('Error creating location window:', winError);
                throw new Error(winError.message);
            }
        }
    }

    const { error } = await supabase.from('measurement_items').insert({
        bill_id: billId,
        location_name: locationName,
        details: details || null,
        ...(categoryId && { category_id: categoryId })
    });

    if (error) {
        console.error('Error creating measurement item:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteMeasurementBill(billId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('measurement_bills').delete().eq('id', billId);

    if (error) {
        console.error('Error deleting measurement bill:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updateMeasurementItem(
    itemId: string,
    projectId: string,
    locationName: string,
    details?: string,
    locationData?: {
        locationId: string;
        customFloor: string;
        customRoom: string;
        customLocationDetails: string;
        windowId: string;
        customWindow: string;
        customWindowDetails?: string;
    },
    measurementDetails?: any,
    categoryId?: string | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    let finalLocationId = locationData?.locationId;

    if (locationData) {
        // 1. Create project location if custom
        if (locationData.locationId === 'อื่นๆ' && locationData.customRoom) {
            const { data: newLoc, error: locError } = await supabase
                .from('project_locations')
                .insert({
                    project_id: projectId,
                    room_name: locationData.customRoom,
                    floor: locationData.customFloor,
                    details: locationData.customLocationDetails || null,
                })
                .select()
                .single();

            if (locError) {
                console.error('Error creating project location:', locError);
                throw new Error(locError.message);
            }
            finalLocationId = newLoc.id;
        }

        // 2. Create location window if custom
        if (locationData.windowId === 'อื่นๆ' && locationData.customWindow && finalLocationId && finalLocationId !== 'อื่นๆ') {
            const { error: winError } = await supabase
                .from('location_windows')
                .insert({
                    location_id: finalLocationId,
                    name: locationData.customWindow,
                    details: locationData.customWindowDetails || null,
                });

            if (winError) {
                console.error('Error creating location window:', winError);
                throw new Error(winError.message);
            }
        }
    }

    const { error } = await supabase
        .from('measurement_items')
        .update({
            location_name: locationName,
            details: details || null,
            measurement_details: measurementDetails || null,
            ...(categoryId !== undefined && { category_id: categoryId })
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error updating measurement item:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteMeasurementItem(itemId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('measurement_items').delete().eq('id', itemId);

    if (error) {
        console.error('Error deleting measurement item:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
