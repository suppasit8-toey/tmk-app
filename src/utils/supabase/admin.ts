import { createClient } from '@supabase/supabase-js'

// We create a single Supabase client for admin operations 
// using the SERVICE_ROLE_KEY. This bypasses RLS.
// WARNING: NEVER use this client on the frontend or expose this key.
export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
