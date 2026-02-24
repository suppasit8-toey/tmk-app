'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { AppRole } from '@/utils/rbac'

export async function createEmployee(formData: FormData) {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Double check that the creator is an Admin
    const { data: creatorProfile } = await supabaseUser
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (creatorProfile?.role !== 'admin') {
        return { error: 'Only admins can create employees.' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as AppRole

    const adminAuthClient = createAdminClient()

    // 1. Create the user in Supabase Auth bypassing RLS
    const { data: newUserAuth, error: createError } = await adminAuthClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirm so they can login immediately
        user_metadata: {
            first_name: firstName,
            last_name: lastName
        }
    })

    if (createError) {
        console.error('Error creating user auth:', createError)
        return { error: createError.message }
    }

    if (!newUserAuth.user) {
        return { error: 'Failed to create user.' }
    }

    // 2. The trigger creates the profile row automatically. 
    // Now we update that row with the specific Role and Phone number.
    const { error: profileUpdateError } = await adminAuthClient
        .from('profiles')
        .update({
            role: role,
            phone: phone
        })
        .eq('id', newUserAuth.user.id)

    if (profileUpdateError) {
        console.error('Error updating new user profile:', profileUpdateError)
        // Note: Even if this fails, the user can still login, but they won't have the right role.
        // In a production app, you might want to handle rollback.
        return { error: 'Account created, but failed to assign role.' }
    }

    revalidatePath('/settings/employees')
    return { success: 'Employee created successfully!' }
}

export async function deleteEmployee(userId: string) {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: creatorProfile } = await supabaseUser
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (creatorProfile?.role !== 'admin') {
        return { error: 'Only admins can delete employees.' }
    }

    const adminAuthClient = createAdminClient()

    // Deleting from auth.users will cascade and delete the profile too
    const { error } = await adminAuthClient.auth.admin.deleteUser(userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings/employees')
    return { success: 'Employee deleted.' }
}

export async function updateEmployeeRole(formData: FormData) {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    if (!user) return

    const { data: creatorProfile } = await supabaseUser
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (creatorProfile?.role !== 'admin') return

    const userId = formData.get('userId') as string
    const role = formData.get('role') as AppRole

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        console.error('Error updating role:', error)
        return
    }

    revalidatePath('/settings/employees')
}
