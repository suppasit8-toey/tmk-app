// Additional actions for Quotation Details
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// We add these to the existing actions.ts file

export async function updateQuotationStore(quotationId: string, storeId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('quotations')
        .update({ store_id: storeId })
        .eq('id', quotationId)

    if (error) {
        console.error('Error updating quotation store:', error)
        return { error: 'Failed to update store' }
    }
    revalidatePath(`/customers/${quotationId}`)
    return { success: true }
}

export async function addQuotationItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const quotationId = formData.get('quotationId') as string
    const productName = formData.get('productName') as string
    const description = formData.get('description') as string
    const widthStr = formData.get('width') as string
    const heightStr = formData.get('height') as string
    const quantityStr = formData.get('quantity') as string
    const unitPriceStr = formData.get('unitPrice') as string

    // Parsing numbers carefully
    const width = widthStr ? parseFloat(widthStr) : null
    const height = heightStr ? parseFloat(heightStr) : null
    const quantity = parseInt(quantityStr) || 1
    const unitPrice = parseFloat(unitPriceStr) || 0
    const totalPrice = unitPrice * quantity

    // 1. Insert the item
    const { error: itemError } = await supabase
        .from('quotation_items')
        .insert({
            quotation_id: quotationId,
            product_name: productName,
            description,
            width,
            height,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice
        })

    if (itemError) {
        console.error('Error adding item:', itemError)
        return { error: 'Failed to add item' }
    }

    // 2. Recalculate totals
    await updateQuotationTotals(quotationId)

    revalidatePath(`/sales/${quotationId}`)
    return { success: true }
}

export async function deleteQuotationItem(itemId: string, quotationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('quotation_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        return { error: 'Failed to delete item' }
    }

    // Recalculate
    await updateQuotationTotals(quotationId)

    revalidatePath(`/sales/${quotationId}`)
    return { success: true }
}

export async function updateQuotationTotals(quotationId: string) {
    const supabase = await createClient()

    // Fetch all items for this quotation
    const { data: items, error: fetchError } = await supabase
        .from('quotation_items')
        .select('total_price')
        .eq('quotation_id', quotationId)

    if (fetchError || !items) return { error: 'Failed to calculate' }

    // Sum up totals
    const totalAmount = items.reduce((sum, item) => sum + Number(item.total_price), 0)

    // For V1, no tax calculation by default, just grand total
    const grandTotal = totalAmount

    // Update Quotation
    const { error: updateError } = await supabase
        .from('quotations')
        .update({
            total_amount: totalAmount,
            grand_total: grandTotal
        })
        .eq('id', quotationId)

    return { success: !updateError }
}

export async function updateQuotationStatus(quotationId: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('quotations')
        .update({ status })
        .eq('id', quotationId)

    if (error) return { error: 'Failed to update status' }

    revalidatePath('/sales')
    revalidatePath(`/sales/${quotationId}`)
    return { success: true }
}
