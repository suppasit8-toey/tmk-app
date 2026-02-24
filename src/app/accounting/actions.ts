'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { DOC_TYPE_CONFIG, DocType } from '@/types/accounting'

export async function createDoc(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const docType = formData.get('docType') as DocType
    const customerId = formData.get('customerId') as string
    const quotationId = formData.get('quotationId') as string
    const amount = parseFloat(formData.get('amount') as string) || 0
    const taxRate = parseFloat(formData.get('taxRate') as string) || 7
    const description = formData.get('description') as string
    const dueDate = formData.get('dueDate') as string
    const notes = formData.get('notes') as string

    const taxAmount = Math.round(amount * taxRate) / 100
    const grandTotal = amount + taxAmount

    const prefix = DOC_TYPE_CONFIG[docType]?.prefix || 'DOC'
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const docNumber = `${prefix}-${datePrefix}-${randomSuffix}`

    const { error } = await supabase
        .from('accounting_docs')
        .insert({
            doc_number: docNumber,
            doc_type: docType,
            customer_id: customerId || null,
            quotation_id: quotationId || null,
            amount,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            description: description || null,
            due_date: dueDate || null,
            notes: notes || null,
            created_by: user.id,
            status: 'draft',
        })

    if (error) {
        console.error('Error creating doc:', error)
        return
    }

    revalidatePath('/accounting')
}

export async function updateDocStatus(docId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('accounting_docs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', docId)

    if (error) {
        console.error('Error updating doc status:', error)
        return
    }

    revalidatePath('/accounting')
}

export async function markAsPaid(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const docId = formData.get('docId') as string
    const paymentMethod = formData.get('paymentMethod') as string

    const { error } = await supabase
        .from('accounting_docs')
        .update({
            status: 'paid',
            payment_method: paymentMethod,
            payment_date: new Date().toISOString().slice(0, 10),
            updated_at: new Date().toISOString(),
        })
        .eq('id', docId)

    if (error) {
        console.error('Error marking as paid:', error)
        return
    }

    revalidatePath('/accounting')
}

export async function deleteDoc(docId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('accounting_docs')
        .delete()
        .eq('id', docId)

    if (error) {
        console.error('Error deleting doc:', error)
        return
    }

    revalidatePath('/accounting')
}
