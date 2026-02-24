'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
    const supabase = await createClient();
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return products || [];
}

export async function createProduct(data: {
    name: string;
    category_id: string;
    description?: string;
    base_price: number;
    unit: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('products')
        .insert([{
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            base_price: data.base_price,
            unit: data.unit,
            is_active: true
        }]);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}

export async function updateProduct(id: string, data: {
    name: string;
    category_id: string;
    description?: string;
    base_price: number;
    unit: string;
    is_active: boolean;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('products')
        .update({
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            base_price: data.base_price,
            unit: data.unit,
            is_active: data.is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}

// --- Categories --- //

export async function getProductCategories() {
    const supabase = await createClient();
    const { data: categories, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return categories || [];
}

export async function createProductCategory(name: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('product_categories')
        .insert([{
            name,
            sales_calc_method: 'area_sqm'
        }]);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}

export async function updateProductCategory(id: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('product_categories')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}

export async function deleteProductCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath('/products');
}
