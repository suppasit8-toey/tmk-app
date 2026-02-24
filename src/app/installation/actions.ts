'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { JobStatus } from '@/types/installation'

export async function createJob(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const customerId = formData.get('customerId') as string
    const quotationId = formData.get('quotationId') as string | null
    const scheduledDate = formData.get('scheduledDate') as string | null
    const scheduledTime = formData.get('scheduledTime') as string | null
    const address = formData.get('address') as string | null
    const notes = formData.get('notes') as string | null
    const assignedTo = formData.get('assignedTo') as string | null

    // Generate job number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const jobNumber = `JOB-${datePrefix}-${randomSuffix}`

    const { error } = await supabase
        .from('installation_jobs')
        .insert({
            job_number: jobNumber,
            customer_id: customerId || null,
            quotation_id: quotationId || null,
            assigned_to: assignedTo || null,
            scheduled_date: scheduledDate || null,
            scheduled_time: scheduledTime || null,
            address: address || null,
            notes: notes || null,
            created_by: user.id,
            status: 'pending',
        })

    if (error) {
        console.error('Error creating job:', error)
        return { error: 'Failed to create job' }
    }

    revalidatePath('/installation')
    redirect('/installation')
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('installation_jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId)

    if (error) {
        console.error('Error updating job status:', error)
        return
    }

    revalidatePath('/installation')
    revalidatePath(`/installation/${jobId}`)
}

export async function assignTechnician(jobId: string, userId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('installation_jobs')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', jobId)

    if (error) {
        console.error('Error assigning technician:', error)
        return
    }

    revalidatePath('/installation')
    revalidatePath(`/installation/${jobId}`)
}

export async function updateJobNotes(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const jobId = formData.get('jobId') as string
    const notes = formData.get('notes') as string

    const { error } = await supabase
        .from('installation_jobs')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', jobId)

    if (error) {
        console.error('Error updating notes:', error)
        return
    }

    revalidatePath(`/installation/${jobId}`)
}

export async function deleteJob(jobId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
        .from('installation_jobs')
        .delete()
        .eq('id', jobId)

    if (error) {
        console.error('Error deleting job:', error)
        return
    }

    revalidatePath('/installation')
    redirect('/installation')
}
