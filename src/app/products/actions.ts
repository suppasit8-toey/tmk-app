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

    // Query categories with designs and design_options
    const { data: categories, error } = await supabase
        .from('product_categories')
        .select('*, category_designs(*), category_design_options(*)')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`Supabase error: ${error.message}`);
    }

    // Query fabric_price_codes separately and merge
    const { data: fabricCodes } = await supabase
        .from('fabric_price_codes')
        .select('*')
        .order('sort_order', { ascending: true });

    const fabricCodesByCategory = (fabricCodes || []).reduce((acc: Record<string, any[]>, fc: any) => {
        if (!acc[fc.category_id]) acc[fc.category_id] = [];
        acc[fc.category_id].push(fc);
        return acc;
    }, {});

    return (categories || []).map(c => ({
        ...c,
        designs: c.category_designs ? (c.category_designs as any[]).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
        category_designs: undefined,
        design_options: c.category_design_options ? (c.category_design_options as any[]).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : [],
        category_design_options: undefined,
        fabric_price_codes: fabricCodesByCategory[c.id] || [],
    }));
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

// --- Designs --- //

export async function createDesign(data: {
    category_id: string;
    name: string;
    width_source: string;
    width_offset_left: number;
    width_offset_right: number;
    height_source: string;
    height_offset_top: number;
    height_offset_bottom: number;
    floor_clearance_options?: { name: string; value: number }[];
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_designs')
        .insert([data]);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function updateDesign(id: string, data: {
    name?: string;
    width_source?: string;
    width_offset_left?: number;
    width_offset_right?: number;
    height_source?: string;
    height_offset_top?: number;
    height_offset_bottom?: number;
    floor_clearance_options?: { name: string; value: number }[];
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_designs')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function deleteDesign(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_designs')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

// --- Fabric Price Codes --- //

export async function createFabricCode(data: {
    category_id: string;
    code_name: string;
    code_color?: string;
    fabric_width: number;
    normal_sell_price: number;
    normal_cost_price: number;
    rotated_cost_per_yard: number;
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('fabric_price_codes')
        .insert([data]);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function updateFabricCode(id: string, data: {
    code_name?: string;
    code_color?: string;
    fabric_width?: number;
    normal_sell_price?: number;
    normal_cost_price?: number;
    rotated_cost_per_yard?: number;
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('fabric_price_codes')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function deleteFabricCode(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('fabric_price_codes')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

// --- Design Options --- //

export async function createDesignOption(data: {
    category_id: string;
    option_name: string;
    choices: string[];
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_design_options')
        .insert([data]);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function updateDesignOption(id: string, data: {
    option_name?: string;
    choices?: string[];
    sort_order?: number;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_design_options')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}

export async function deleteDesignOption(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('category_design_options')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/products');
}
