'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    const phone = formData.get('phone') as string
    const lineId = formData.get('lineId') as string
    const address = formData.get('address') as string
    const locationUrl = formData.get('locationUrl') as string
    const referrerId = formData.get('referrerId') as string

    const { data, error } = await supabase
        .from('customers')
        .insert({
            first_name: firstName || null,
            last_name: lastName || null,
            phone,
            line_id: lineId,
            address,
            location_url: locationUrl || null,
            referrer_id: referrerId || null,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating customer:', error)
        return { error: 'Failed to create customer' }
    }

    revalidatePath('/customers')
    return { success: true, customer: data }
}

export async function createCorporateCustomer(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const companyName = formData.get('companyName') as string
    const contactPerson = formData.get('contactPerson') as string
    const taxId = formData.get('taxId') as string

    const phone = formData.get('phone') as string
    const lineId = formData.get('lineId') as string
    const address = formData.get('address') as string
    const locationUrl = formData.get('locationUrl') as string
    const referrerId = formData.get('referrerId') as string

    const { data, error } = await supabase
        .from('corporate_customers')
        .insert({
            company_name: companyName,
            contact_person: contactPerson || null,
            tax_id: taxId || null,
            phone,
            line_id: lineId,
            address,
            location_url: locationUrl || null,
            referrer_id: referrerId || null,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating corporate customer:', error)
        return { error: 'Failed to create corporate customer' }
    }

    revalidatePath('/customers')
    return { success: true, customer: data }
}

export async function createDraftQuotation(customerId: string | null = null, corporateCustomerId: string | null = null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Generate a simple quotation number (In production, use a more robust sequence generator)
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const qtNumber = `QT-${datePrefix}-${randomSuffix}`

    const { data, error } = await supabase
        .from('quotations')
        .insert({
            quotation_number: qtNumber,
            customer_id: customerId,
            corporate_customer_id: corporateCustomerId,
            salesperson_id: user.id,
            status: 'draft'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating quotation:', error)
        return { error: 'Failed to create quotation draft' }
    }

    revalidatePath('/customers')
    // In a real flow, you'd probably redirect them to the quotation edit page now
    return { success: true, quotationId: data.id }
}
