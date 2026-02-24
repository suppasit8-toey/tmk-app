import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { AccountingDoc, DOC_TYPE_CONFIG, DOC_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, DocType, DocStatus, PaymentMethod } from '@/types/accounting';
import { createDoc, updateDocStatus, markAsPaid, deleteDoc } from './actions';
import { FileText, Plus, DollarSign, TrendingUp, TrendingDown, Receipt, Trash2, Check, CreditCard } from 'lucide-react';

export default async function AccountingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/accounting')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: docsData } = await supabase
        .from('accounting_docs')
        .select(`*, customer:customers(first_name, last_name), quotation:quotations(quotation_number)`)
        .order('created_at', { ascending: false });
    const docs = (docsData || []) as unknown as AccountingDoc[];

    const { data: customersData } = await supabase.from('customers').select('id, first_name, last_name').order('created_at', { ascending: false });
    const customers = customersData || [];

    const { data: quotationsData } = await supabase.from('quotations').select('id, quotation_number, grand_total').order('created_at', { ascending: false });
    const quotations = quotationsData || [];

    // Stats
    const totalIncome = docs.filter(d => d.doc_type === 'receipt' && d.status === 'paid').reduce((s, d) => s + Number(d.grand_total), 0);
    const totalExpense = docs.filter(d => d.doc_type === 'expense' && d.status === 'paid').reduce((s, d) => s + Number(d.grand_total), 0);
    const pendingInvoices = docs.filter(d => d.doc_type === 'invoice' && (d.status === 'issued' || d.status === 'draft')).length;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 className="page-title">
                เอกสารบัญชี
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#22c55e', width: '2.5rem', height: '2.5rem' }}><TrendingUp size={16} /></div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>รายรับทั้งหมด</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>฿{totalIncome.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444', width: '2.5rem', height: '2.5rem' }}><TrendingDown size={16} /></div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>ค่าใช้จ่ายทั้งหมด</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>฿{totalExpense.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6', width: '2.5rem', height: '2.5rem' }}><Receipt size={16} /></div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>ใบแจ้งหนี้รอชำระ</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{pendingInvoices}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '2.5rem', height: '2.5rem' }}><DollarSign size={16} /></div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>กำไร/ขาดทุน</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700, color: totalIncome - totalExpense >= 0 ? '#22c55e' : '#ef4444' }}>
                            ฿{(totalIncome - totalExpense).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Documents Table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="header-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FileText size={18} /></div>
                        <h2 className="section-title">รายการเอกสาร</h2>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{docs.length} รายการ</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={thStyle}>เลขที่</th>
                                    <th style={thStyle}>ประเภท</th>
                                    <th style={thStyle}>ลูกค้า/รายละเอียด</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>จำนวนเงิน</th>
                                    <th style={thStyle}>สถานะ</th>
                                    <th style={thStyle}>วันที่</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map(doc => {
                                    const typeCfg = DOC_TYPE_CONFIG[doc.doc_type];
                                    const statusCfg = DOC_STATUS_CONFIG[doc.status];
                                    return (
                                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem 1.5rem' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-dim)', background: 'var(--bg-input)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{doc.doc_number}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span className="badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>{typeCfg.label}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 500 }}>
                                                    {doc.customer ? `${doc.customer.first_name} ${doc.customer.last_name}` : (doc.description || '-')}
                                                </div>
                                                {doc.quotation && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{doc.quotation.quotation_number}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                <span className="font-outfit" style={{ fontWeight: 600 }}>฿{Number(doc.grand_total).toLocaleString()}</span>
                                                {doc.tax_amount > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>VAT ฿{Number(doc.tax_amount).toLocaleString()}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                                                {doc.payment_method && doc.status === 'paid' && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                                                        {PAYMENT_METHOD_CONFIG[doc.payment_method]}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(doc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                {doc.due_date && <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>ครบ {new Date(doc.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</div>}
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                    {doc.status === 'draft' && (
                                                        <form action={async () => { 'use server'; await updateDocStatus(doc.id, 'issued'); }}>
                                                            <button type="submit" title="ออกเอกสาร" style={actionBtnStyle('#dbeafe', '#3b82f6')}>
                                                                <FileText size={12} />
                                                            </button>
                                                        </form>
                                                    )}
                                                    {(doc.status === 'issued' || doc.status === 'overdue') && (
                                                        <form action={markAsPaid} style={{ display: 'flex', gap: '0.25rem' }}>
                                                            <input type="hidden" name="docId" value={doc.id} />
                                                            <select name="paymentMethod" style={{ width: '5rem', fontSize: '0.65rem', padding: '0.2rem' }}>
                                                                <option value="transfer">โอนเงิน</option>
                                                                <option value="cash">เงินสด</option>
                                                                <option value="credit">บัตรเครดิต</option>
                                                                <option value="other">อื่นๆ</option>
                                                            </select>
                                                            <button type="submit" title="ชำระแล้ว" style={actionBtnStyle('#dcfce7', '#22c55e')}>
                                                                <Check size={12} />
                                                            </button>
                                                        </form>
                                                    )}
                                                    {doc.status === 'draft' && (
                                                        <form action={async () => { 'use server'; await deleteDoc(doc.id); }}>
                                                            <button type="submit" title="ลบ" style={actionBtnStyle('#fee2e2', '#ef4444')}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {docs.length === 0 && (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <FileText size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                                        <p>ยังไม่มีเอกสาร</p>
                                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>สร้างเอกสารจากฟอร์มด้านขวา</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Document Form */}
                <div className="card" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Plus size={18} /></div>
                        <h2 className="section-title">สร้างเอกสาร</h2>
                    </div>
                    <form action={createDoc} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>ประเภท *</label>
                            <select name="docType" required style={{ width: '100%' }}>
                                <option value="invoice">ใบแจ้งหนี้</option>
                                <option value="receipt">ใบเสร็จรับเงิน</option>
                                <option value="expense">ค่าใช้จ่าย</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>ลูกค้า</label>
                            <select name="customerId" style={{ width: '100%' }}>
                                <option value="">ไม่ระบุ</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>ใบเสนอราคา</label>
                            <select name="quotationId" style={{ width: '100%' }}>
                                <option value="">ไม่ระบุ</option>
                                {quotations.map(q => (
                                    <option key={q.id} value={q.id}>{q.quotation_number} (฿{Number(q.grand_total).toLocaleString()})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>จำนวนเงิน (ก่อน VAT) *</label>
                                <input name="amount" type="number" step="0.01" required placeholder="0.00" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>VAT %</label>
                                <input name="taxRate" type="number" step="0.01" defaultValue="7" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>วันครบกำหนด</label>
                            <input name="dueDate" type="date" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>รายละเอียด</label>
                            <input name="description" type="text" placeholder="รายละเอียดเอกสาร..." style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>หมายเหตุ</label>
                            <textarea name="notes" rows={2} placeholder="หมายเหตุเพิ่มเติม..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                            <Plus size={16} /> สร้างเอกสาร
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.65rem 1rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-dim)',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.3rem',
};

function actionBtnStyle(bg: string, color: string): React.CSSProperties {
    return {
        padding: '0.3rem',
        borderRadius: '0.35rem',
        border: 'none',
        color,
        background: bg,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
    };
}
