import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Quotation, QuotationItem, Store } from '@/types/sales';
import { ArrowLeft, CheckCircle, Plus, Printer, Trash2, Building } from 'lucide-react';
import Link from 'next/link';
import { addQuotationItem, deleteQuotationItem, updateQuotationStatus, updateQuotationStore } from './actions';
import QuotationStoreSelect from './QuotationStoreSelect';

export default async function QuotationDetailsPage({ params }: { params: Promise<{ id: string; quotationId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const quotationIdParam = resolvedParams.quotationId;

    const isQtNumber = quotationIdParam.startsWith('QT');
    let query = supabase.from('quotations').select(`*, customer:customers(*)`);

    if (isQtNumber) {
        query = query.eq('quotation_number', quotationIdParam);
    } else {
        query = query.eq('id', quotationIdParam);
    }

    const { data: qtData, error: qtError } = await query.single();

    if (qtError || !qtData) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>Quotation not found.</p>
                <Link href={`/projects/${projectId}`} style={{ color: 'var(--primary)' }}>Back to Project</Link>
            </div>
        );
    }

    const quotation = qtData as unknown as Quotation;
    // We still use quotation.id for items because items are linked by the UUID
    const { data: itemsData } = await supabase.from('quotation_items').select('*').eq('quotation_id', quotation.id).order('created_at', { ascending: true });
    const items = (itemsData || []) as QuotationItem[];

    const { data: storesData } = await supabase.from('stores').select('*').order('name');
    const stores = (storesData || []) as Store[];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href={`/projects/${projectId}`} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--border)', display: 'inline-flex' }}>
                        <ArrowLeft size={18} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                    <div>
                        <h1 className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            ใบเสนอราคา #{quotation.quotation_number}
                            <StatusBadge status={quotation.status} />
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ลูกค้า: {quotation.customer && Array.isArray(quotation.customer) ? quotation.customer[0]?.first_name : quotation.customer?.first_name} {quotation.customer && Array.isArray(quotation.customer) ? quotation.customer[0]?.last_name : quotation.customer?.last_name}
                            {(quotation.customer && Array.isArray(quotation.customer) ? quotation.customer[0]?.phone : quotation.customer?.phone) && ` (${quotation.customer && Array.isArray(quotation.customer) ? quotation.customer[0]?.phone : quotation.customer?.phone})`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="pill" style={{ cursor: 'pointer', gap: '0.3rem' }}>
                        <Printer size={16} /> พิมพ์/PDF
                    </button>
                    {quotation.status === 'draft' && (
                        <form action={async () => { 'use server'; await updateQuotationStatus(quotation.id, 'sent'); }}>
                            <button type="submit" className="btn-primary"><CheckCircle size={16} /> บันทึก & ส่ง</button>
                        </form>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Items Table */}
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 className="section-title">รายการสินค้า</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>รายการ</th>
                                        <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center' }}>ขนาด</th>
                                        <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>จำนวน</th>
                                        <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>ราคา/หน่วย</th>
                                        <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>รวม</th>
                                        <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center' }}>ลบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem 1.5rem' }}>
                                                <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                                {item.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                {item.width && item.height ? `${item.width}×${item.height}` : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500 }}>{item.quantity}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>฿{Number(item.unit_price).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>฿{Number(item.total_price).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <form action={async () => { 'use server'; await deleteQuotationItem(item.id, quotation.id); }}>
                                                    <button type="submit" style={{ padding: '0.3rem', borderRadius: '0.35rem', border: 'none', color: '#ef4444', background: '#fee2e2', cursor: 'pointer' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr><td colSpan={6} style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>ยังไม่มีรายการ</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Item Form */}
                    {(quotation.status === 'draft' || quotation.status === 'sent') && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                                <Plus size={16} style={{ color: 'var(--primary)' }} /> เพิ่มรายการ
                            </h3>
                            <form action={async (formData) => { 'use server'; formData.append('quotationId', quotation.id); await addQuotationItem(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>รายการ / ชนิดผ้าม่าน</label>
                                        <input name="productName" type="text" required placeholder="เช่น ม่านจีบทึบแสง ห้องนอนใหญ่" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>กว้าง (ซม.)</label>
                                        <input name="width" type="number" step="0.1" placeholder="กว้าง" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>สูง (ซม.)</label>
                                        <input name="height" type="number" step="0.1" placeholder="สูง" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>จำนวน</label>
                                        <input name="quantity" type="number" required defaultValue="1" min="1" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ราคา/หน่วย</label>
                                        <input name="unitPrice" type="number" required min="0" step="0.01" placeholder="บาท" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                                    <button type="submit" className="btn-primary">บันทึกเพิ่มรายการ</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="card" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <h2 className="section-title" style={{ marginBottom: '1rem' }}>สรุปยอดรวม</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>จำนวนรายการ:</span><span>{items.length} รายการ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>รวมเป็นเงิน:</span><span>฿{Number(quotation.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>ยอดสุทธิ:</span>
                            <span className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                ฿{Number(quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '1.25rem 0' }} />

                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        <Building size={14} style={{ color: 'var(--text-muted)' }} /> ข้อมูลร้านค้าที่ออกเอกสาร
                    </h3>

                    <QuotationStoreSelect
                        quotationId={quotation.id}
                        currentStoreId={quotation.store_id}
                        status={quotation.status}
                        stores={stores}
                    />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string, text: string, label: string }> = {
        draft: { bg: '#f1f5f9', text: '#64748b', label: 'ฉบับร่าง' },
        sent: { bg: '#dbeafe', text: '#2563eb', label: 'ส่งแล้ว' },
        approved: { bg: '#dcfce7', text: '#16a34a', label: 'อนุมัติ' },
        rejected: { bg: '#fee2e2', text: '#dc2626', label: 'ปฏิเสธ' },
        cancelled: { bg: '#f1f5f9', text: '#94a3b8', label: 'ยกเลิก' },
    };
    const c = cfg[status] || cfg.draft;
    return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>;
}
