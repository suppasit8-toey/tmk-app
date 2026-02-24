import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { Store as StoreIcon, Building } from 'lucide-react';
import { Store } from '@/types/sales';
import AddStoreModal from './AddStoreModal';

export default async function StoresPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/settings')) { // Using settings role access since setting up store addresses feels like an admin task.
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: storesData } = await supabase
        .from('stores')
        .select('*')
        .order('name');

    const stores = (storesData || []) as Store[];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header + Add Modal Trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    ข้อมูลบริษัท / สาขา (Stores)
                </h1>
                <AddStoreModal />
            </div>

            {/* Stores Table */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><Building size={18} /></div>
                    <h2 className="section-title">รายชื่อสาขา / ร้านค้าทั้งหมด</h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>ทั้งหมด {stores.length} แห่ง</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อร้าน/สาขา</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เลขประจำตัวผู้เสียภาษี</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เบอร์ติดต่อ</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ที่อยู่</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500, color: 'var(--primary)' }}>{s.name}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>{s.tax_id || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>{s.phone || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.address || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <AddStoreModal store={s} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stores.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <StoreIcon size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem auto' }} />
                                        <p>ยังไม่มีข้อมูลสาขา/ร้านค้า</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
