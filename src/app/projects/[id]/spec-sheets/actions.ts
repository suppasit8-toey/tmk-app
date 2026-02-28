'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSpecSheetFromBill(projectId: string, billId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Fetch measurement items from the bill
    const { data: bill, error: billError } = await supabase
        .from('measurement_bills')
        .select(`*, measurement_items (*)`)
        .eq('id', billId)
        .single();

    if (billError || !bill) {
        console.error('Error fetching bill:', billError);
        throw new Error('Measurement bill not found');
    }

    // 2. Create spec sheet
    const { data: specSheet, error: ssError } = await supabase
        .from('spec_sheets')
        .insert({
            project_id: projectId,
            bill_id: billId,
            status: 'draft'
        })
        .select()
        .single();

    if (ssError || !specSheet) {
        console.error('Error creating spec sheet:', ssError);
        throw new Error('Failed to create spec sheet');
    }

    // We no longer auto-create spec sheet items here. 
    // The spec sheet is created empty, and the user will add items later.

    revalidatePath(`/projects/${projectId}`);

    revalidatePath(`/projects/${projectId}`);
    return { success: true, specSheetId: specSheet.id };
}

export async function updateSpecSheetItem(
    itemId: string,
    data: {
        product_id: string | null;
        product_name: string;
        unit_price: number;
        notes?: string;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('spec_sheet_items')
        .update({
            product_id: data.product_id,
            product_name: data.product_name,
            unit_price: data.unit_price,
            notes: data.notes || null
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error updating spec sheet item:', error);
        throw new Error(error.message);
    }

    return { success: true };
}

export async function createQuotationFromSpecSheet(specSheetId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Get spec sheet with items
    const { data: specSheet, error: ssError } = await supabase
        .from('spec_sheets')
        .select(`*, spec_sheet_items (*)`)
        .eq('id', specSheetId)
        .single();

    if (ssError || !specSheet) {
        throw new Error('Spec sheet not found');
    }

    // 2. Get bill for customer info
    const { data: bill } = await supabase
        .from('measurement_bills')
        .select('customer_id')
        .eq('id', specSheet.bill_id)
        .single();

    // 3. Generate quotation number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const qtNumber = `QT-${datePrefix}-${randomSuffix}`;

    // 4. Create quotation
    const { data: quotation, error: qtError } = await supabase
        .from('quotations')
        .insert({
            quotation_number: qtNumber,
            customer_id: bill?.customer_id || null,
            salesperson_id: user.id,
            status: 'draft',
            project_id: specSheet.project_id
        })
        .select()
        .single();

    if (qtError || !quotation) {
        console.error('Error creating quotation:', qtError);
        throw new Error('Failed to create quotation');
    }

    // 5. Create quotation items from spec sheet items
    const quotationItems = (specSheet.spec_sheet_items || [])
        .filter((item: any) => item.product_id) // Only items with product selected
        .map((item: any) => ({
            quotation_id: quotation.id,
            product_name: item.product_name || item.location_name,
            description: item.notes || null,
            width: item.order_width || null,
            height: item.order_height || null,
            quantity: 1,
            unit_price: item.unit_price || 0,
            total_price: item.unit_price || 0
        }));

    if (quotationItems.length > 0) {
        const { error: itemsError } = await supabase
            .from('quotation_items')
            .insert(quotationItems);

        if (itemsError) {
            console.error('Error creating quotation items:', itemsError);
            throw new Error('Failed to create quotation items');
        }
    }

    // 6. Mark spec sheet as completed
    await supabase
        .from('spec_sheets')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', specSheetId);

    revalidatePath(`/projects/${specSheet.project_id}`);
    return { success: true, quotationId: quotation.id };
}

export async function deleteSpecSheet(specSheetId: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('spec_sheets')
        .delete()
        .eq('id', specSheetId);

    if (error) {
        console.error('Error deleting spec sheet:', error);
        throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function addItemsToSpecSheet(specSheetId: string, projectId: string, measurementItemIds: string[]) {
    if (!measurementItemIds.length) return { success: true };
    const supabase = await createClient();

    // Fetch the measurement items
    const { data: measurementItems, error: itemsError } = await supabase
        .from('measurement_items')
        .select('*')
        .in('id', measurementItemIds);

    if (itemsError || !measurementItems) {
        console.error('Error fetching measurement items:', itemsError);
        throw new Error('Failed to fetch items');
    }

    // Create spec sheet items
    const specItems = measurementItems.map((item: any) => {
        let categoryName = null;
        if (item.measurement_details?.category?.name) {
            categoryName = item.measurement_details.category.name;
        }

        return {
            spec_sheet_id: specSheetId,
            measurement_item_id: item.id,
            location_name: item.location_name,
            category_name: categoryName,
            order_width: item.measurement_details?.order?.width ? parseFloat(item.measurement_details.order.width) : 0,
            order_height: item.measurement_details?.order?.height ? parseFloat(item.measurement_details.order.height) : 0,
            product_id: null,
            product_name: '',
            unit_price: 0,
            notes: item.details || null
        };
    });

    const { error: insertError } = await supabase
        .from('spec_sheet_items')
        .insert(specItems);

    if (insertError) {
        console.error('Error adding items to spec sheet:', insertError);
        throw new Error('Failed to add items to spec sheet');
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
