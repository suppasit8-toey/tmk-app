'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ==================== SUPPLIERS ====================

export async function getSuppliers() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('suppliers')
        .select('*, supplier_products(*)')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(supplier => ({
        ...supplier,
        products: supplier.supplier_products || [],
        supplier_products: undefined
    }));
}

export async function createSupplier(data: {
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('suppliers').insert([data]);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}

export async function updateSupplier(id: string, data: {
    name?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    is_active?: boolean;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('suppliers').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}

export async function deleteSupplier(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}

// ==================== SUPPLIER PRODUCTS ====================

export async function getSupplierProducts(supplierId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createSupplierProduct(data: {
    supplier_id: string;
    category: string;
    product_code: string;
    name: string;
    description?: string;
    tags?: string[];
    unit: string;
    price_per_unit: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('supplier_products').insert([data]);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}

export async function updateSupplierProduct(id: string, data: {
    category?: string;
    product_code?: string;
    name?: string;
    description?: string;
    tags?: string[];
    unit?: string;
    price_per_unit?: number;
    is_active?: boolean;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('supplier_products').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}

export async function deleteSupplierProduct(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('supplier_products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/suppliers');
}
