'use client';

import { useState } from 'react';
import { Users, ArrowRight, Building2 } from 'lucide-react';
import { Customer, CorporateCustomer } from '@/types/sales';
import { createDraftQuotation } from './actions';

export default function CustomerTabs({
    individuals,
    companies
}: {
    individuals: Customer[],
    companies: CorporateCustomer[]
}) {
    const [activeTab, setActiveTab] = useState<'individual' | 'company'>('individual');

    return (
        <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
            {/* Custom Tabs Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('individual')}
                    style={{
                        flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: activeTab === 'individual' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'individual' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'individual' ? 600 : 500,
                        transition: 'all 0.2s'
                    }}
                >
                    <Users size={18} />
                    ลูกค้าทั่วไป ({individuals.length})
                </button>
                <button
                    onClick={() => setActiveTab('company')}
                    style={{
                        flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: activeTab === 'company' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'company' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'company' ? 600 : 500,
                        transition: 'all 0.2s'
                    }}
                >
                    <Building2 size={18} />
                    ลูกค้าองค์กร / บริษัท ({companies.length})
                </button>
            </div>

            {/* Customers Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                        <tr>
                            {activeTab === 'individual' ? (
                                <>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อ - นามสกุล</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เบอร์โทร</th>
                                </>
                            ) : (
                                <>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อบริษัท</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เลขประจำตัวผู้เสียภาษี</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ที่อยู่บริษัท</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>พิกัดที่ตั้ง</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อผู้ประสานงาน</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>เบอร์โทร</th>
                                </>
                            )}
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab === 'individual' && individuals.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{c.first_name} {c.last_name}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>{c.phone || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                    <form action={async () => { await createDraftQuotation(c.id, null); }}>
                                        <button type="submit" style={{
                                            fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '999px',
                                            color: '#3b82f6', background: '#eef3ff', border: 'none', cursor: 'pointer',
                                        }}>
                                            สร้างใบเสนอราคา <ArrowRight size={12} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'company' && companies.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{c.company_name}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>{c.tax_id || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    {c.location_url ? <a href={c.location_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>ดูพิกัด</a> : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>{c.contact_person || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem' }}>{c.phone || '-'}</td>
                                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                    <form action={async () => { await createDraftQuotation(null, c.id); }}>
                                        <button type="submit" style={{
                                            fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '999px',
                                            color: '#3b82f6', background: '#eef3ff', border: 'none', cursor: 'pointer',
                                        }}>
                                            สร้างใบเสนอราคา <ArrowRight size={12} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'individual' && individuals.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Users size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem auto' }} />
                                    <p>ยังไม่มีข้อมูลลูกค้าทั่วไป</p>
                                </td>
                            </tr>
                        )}
                        {activeTab === 'company' && companies.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Building2 size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem auto' }} />
                                    <p>ยังไม่มีข้อมูลลูกค้าองค์กร</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
