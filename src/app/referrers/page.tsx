import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { Users, FileText, Share2 } from 'lucide-react';
import { Referrer, Customer } from '@/types/sales';
import AddReferrerModal from './AddReferrerModal';

export default async function ReferrersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/customers')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: referrersData } = await supabase.from('referrers').select('*').order('created_at', { ascending: false });
    const referrers = (referrersData || []) as Referrer[];

    // Let's also fetch how many customers each referrer has
    const { data: _customersData } = await supabase.from('customers').select('referrer_id');
    const customersData = (_customersData || []) as { referrer_id: string | null }[];

    // Calculate customer counts
    const referrerCustomerCounts = referrers.map(r => ({
        ...r,
        customerCount: customersData.filter((c) => c.referrer_id === r.id).length
    }));

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header + Add Modal Trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    ตัวแทนขาย / คนแนะนำ
                </h1>
                <AddReferrerModal />
            </div>

            {/* Referrers Table */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Share2 size={18} /></div>
                    <h2 className="section-title">รายชื่อคนแนะนำ</h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>ทั้งหมด {referrers.length} รายการ</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อคนแนะนำ</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เบอร์โทร</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Line ID</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>จำนวนลูกค้า (ราย)</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>รายละเอียด</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrerCustomerCounts.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{r.name}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>{r.phone || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>{r.line_id || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary)', background: '#eef3ff', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                                            {r.customerCount}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                        <AddReferrerModal referrer={r} />
                                    </td>
                                </tr>
                            ))}
                            {referrerCustomerCounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <Share2 size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem auto' }} />
                                        <p>ยังไม่มีข้อมูลคนแนะนำ</p>
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
