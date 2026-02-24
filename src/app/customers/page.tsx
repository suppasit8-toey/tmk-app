import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { createDraftQuotation } from './actions';
import { Users, ArrowRight } from 'lucide-react';
import { Customer, CorporateCustomer } from '@/types/sales';
import AddCustomerModal from './AddCustomerModal';
import CustomerTabs from './CustomerTabs';

export default async function SalesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/customers')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: customersData } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(20);
    const customers = (customersData || []) as Customer[];

    const { data: corporateData } = await supabase.from('corporate_customers').select('*').order('created_at', { ascending: false }).limit(20);
    const corporateCustomers = (corporateData || []) as CorporateCustomer[];

    const { data: referrersData } = await supabase.from('referrers').select('id, name').order('name');
    const referrers = (referrersData || []) as { id: string, name: string }[];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header + Add Customer Modal Trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    ลูกค้า และ งานขาย
                </h1>
                <AddCustomerModal referrers={referrers} />
            </div>

            <CustomerTabs individuals={customers} companies={corporateCustomers} />

        </div>
    );
}


