'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
    const supabase = await createClient();
    const { data: products, error } = await supabase
        .from('products')
        .select('*, product_price_tiers(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    // Rename product_price_tiers to price_tiers and sort by sort_order
    return (products || []).map(p => ({
        ...p,
        price_tiers: p.product_price_tiers ? (p.product_price_tiers as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order) : [],
        product_price_tiers: undefined
    }));
}

export async function createProduct(data: {
    name: string;
    category_id: string;
    description?: string;
    base_price: number;
    srr_price: number;
    cost_price: number;
    unit: string;
    price_tiers?: {
        min_width: number;
        max_width: number;
        price: number;
        platform_price: number;
        sort_order: number;
    }[];
}) {
    const supabase = await createClient();
    const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            base_price: data.base_price,
            srr_price: data.srr_price,
            cost_price: data.cost_price,
            unit: data.unit,
            is_active: true
        }])
        .select('id')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    if (newProduct && data.price_tiers && data.price_tiers.length > 0) {
        const tiersToInsert = data.price_tiers.map(tier => ({
            ...tier,
            product_id: newProduct.id,
        }));
        const { error: tiersError } = await supabase
            .from('product_price_tiers')
            .insert(tiersToInsert);

        if (tiersError) {
            console.error('Error saving price tiers:', tiersError);
        }
    }
    revalidatePath('/products');
}

export async function updateProduct(id: string, data: {
    name: string;
    category_id: string;
    description?: string;
    base_price: number;
    srr_price: number;
    cost_price: number;
    unit: string;
    is_active: boolean;
    price_tiers?: {
        min_width: number;
        max_width: number;
        price: number;
        platform_price: number;
        sort_order: number;
    }[];
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('products')
        .update({
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            base_price: data.base_price,
            srr_price: data.srr_price,
            cost_price: data.cost_price,
            unit: data.unit,
            is_active: data.is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    // Handle price tiers - easiest way is delete all and re-insert
    if (data.price_tiers !== undefined) {
        const { error: deleteError } = await supabase
            .from('product_price_tiers')
            .delete()
            .eq('product_id', id);

        if (deleteError) {
            console.error('Error deleting old price tiers:', deleteError);
        } else if (data.price_tiers.length > 0) {
            const tiersToInsert = data.price_tiers.map(tier => ({
                ...tier,
                product_id: id,
            }));
            const { error: tiersError } = await supabase
                .from('product_price_tiers')
                .insert(tiersToInsert);

            if (tiersError) {
                console.error('Error inserting new price tiers:', tiersError);
            }
        }
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
