'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addInventoryItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const sku = formData.get('sku') as string
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const quantity = parseFloat(formData.get('quantity') as string) || 0
    const minQuantity = parseFloat(formData.get('minQuantity') as string) || 0
    const costPrice = parseFloat(formData.get('costPrice') as string) || 0
    const sellPrice = parseFloat(formData.get('sellPrice') as string) || 0
    const supplier = formData.get('supplier') as string
    const location = formData.get('location') as string

    const { error } = await supabase
        .from('inventory_items')
        .insert({
            sku,
            name,
            category,
            unit,
            quantity,
            min_quantity: minQuantity,
            cost_price: costPrice,
            sell_price: sellPrice,
            supplier: supplier || null,
            location: location || null,
        })

    if (error) {
        console.error('Error adding inventory item:', error)
        return
    }

    revalidatePath('/inventory')
}

export async function updateStock(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const itemId = formData.get('itemId') as string
    const adjustment = parseFloat(formData.get('adjustment') as string) || 0

    // Get current quantity
    const { data: item } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single()

    if (!item) return

    const newQuantity = Number(item.quantity) + adjustment

    const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', itemId)

    if (error) {
        console.error('Error updating stock:', error)
        return
    }

    revalidatePath('/inventory')
}

export async function deleteInventoryItem(itemId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        console.error('Error deleting item:', error)
        return
    }

    revalidatePath('/inventory')
}

export async function createPurchaseOrder(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const supplier = formData.get('supplier') as string
    const notes = formData.get('notes') as string

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const poNumber = `PO-${datePrefix}-${randomSuffix}`

    const { error } = await supabase
        .from('purchase_orders')
        .insert({
            po_number: poNumber,
            supplier,
            notes: notes || null,
            ordered_by: user.id,
            status: 'draft',
        })

    if (error) {
        console.error('Error creating PO:', error)
        return
    }

    revalidatePath('/inventory')
}

export async function updatePOStatus(poId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('purchase_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', poId)

    if (error) {
        console.error('Error updating PO status:', error)
        return
    }

    revalidatePath('/inventory')
}
