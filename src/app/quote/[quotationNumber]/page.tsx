import { createClient } from '@supabase/supabase-js';
import { Quotation, QuotationItem, Store } from '@/types/sales';
import '../quote.css';

export default async function PublicQuotationPage({ params }: { params: Promise<{ quotationNumber: string }> }) {
    const resolvedParams = await params;
    const quotationNumber = resolvedParams.quotationNumber;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch quotation by quotation_number
    const { data: qtData, error: qtError } = await supabase
        .from('quotations')
        .select(`*, customer:customers(*), store:stores(*)`)
        .eq('quotation_number', quotationNumber)
        .single();

    if (qtError || !qtData) {
        return (
            <div className="quote-page">
                <div className="quote-not-found">
                    <div className="quote-not-found-icon">📄</div>
                    <div>ไม่พบใบเสนอราคานี้</div>
                    <div style={{ fontSize: '0.8rem' }}>กรุณาตรวจสอบลิงก์อีกครั้ง</div>
                </div>
            </div>
        );
    }

    const quotation = qtData as unknown as Quotation;

    // Fetch items
    const { data: itemsData } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', quotation.id)
        .order('created_at', { ascending: true });
    const items = (itemsData || []) as QuotationItem[];

    // Get store info
    const store = quotation.store && !Array.isArray(quotation.store)
        ? quotation.store
        : Array.isArray(quotation.store) && quotation.store.length > 0
            ? (quotation.store as unknown as Store[])[0]
            : null;

    // Get customer info
    const customer = quotation.customer && !Array.isArray(quotation.customer)
        ? quotation.customer
        : Array.isArray(quotation.customer) && quotation.customer.length > 0
            ? (quotation.customer as unknown as any[])[0]
            : null;

    const formatCurrency = (num: number) => {
        return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        draft: { bg: '#f1f5f9', text: '#64748b', label: 'ฉบับร่าง' },
        sent: { bg: '#dbeafe', text: '#2563eb', label: 'ส่งแล้ว' },
        approved: { bg: '#dcfce7', text: '#16a34a', label: 'อนุมัติ' },
        rejected: { bg: '#fee2e2', text: '#dc2626', label: 'ปฏิเสธ' },
        cancelled: { bg: '#f1f5f9', text: '#94a3b8', label: 'ยกเลิก' },
    };
    const statusCfg = statusConfig[quotation.status] || statusConfig.draft;

    return (
        <div className="quote-page">
            {/* ── Store Header ── */}
            <div className="quote-header-bar">
                {store?.logo_url && (
                    <img src={store.logo_url} alt="Logo" className="quote-store-logo" />
                )}
                <div className="store-name">{store?.name || 'TMK TEAM'}</div>
                <div className="store-details">
                    {store?.address && <div>{store.address}</div>}
                    {store?.phone && <div>โทร: {store.phone}</div>}
                </div>
            </div>

            {/* ── Main Card ── */}
            <div className="quote-card">
                <div className="quote-doc-title">
                    ใบเสนอราคา / QUOTATION
                </div>
                <div className="quote-doc-number">
                    เลขที่: {quotation.quotation_number}
                    <span style={{ margin: '0 0.5rem' }}>•</span>
                    <span
                        className="quote-status-badge"
                        style={{ background: statusCfg.bg, color: statusCfg.text }}
                    >
                        {statusCfg.label}
                    </span>
                </div>

                {/* ── Info Grid ── */}
                <div className="quote-info-grid">
                    <div className="quote-info-box">
                        <div className="quote-info-box-title">ข้อมูลเอกสาร</div>
                        <div className="quote-info-row">
                            <span className="quote-info-label">วันที่:</span>
                            <span className="quote-info-value">{formatDate(quotation.created_at)}</span>
                        </div>
                        {quotation.valid_until && (
                            <div className="quote-info-row">
                                <span className="quote-info-label">ใช้ได้ถึง:</span>
                                <span className="quote-info-value">{formatDate(quotation.valid_until)}</span>
                            </div>
                        )}
                    </div>
                    <div className="quote-info-box">
                        <div className="quote-info-box-title">ข้อมูลลูกค้า</div>
                        {customer && (
                            <>
                                <div className="quote-info-row">
                                    <span className="quote-info-label">ชื่อ:</span>
                                    <span className="quote-info-value">{customer.first_name} {customer.last_name}</span>
                                </div>
                                {customer.phone && (
                                    <div className="quote-info-row">
                                        <span className="quote-info-label">โทร:</span>
                                        <span className="quote-info-value">{customer.phone}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Items Table ── */}
                <div style={{ padding: '0 1.5rem' }}>
                    <table className="quote-items-table">
                        <thead>
                            <tr>
                                <th className="quote-col-no">ลำดับ</th>
                                <th className="quote-col-name">รายการ</th>
                                <th className="quote-col-size">ขนาด (ซม.)</th>
                                <th className="quote-col-qty">จำนวน</th>
                                <th className="quote-col-price">ราคา/หน่วย</th>
                                <th className="quote-col-total">รวม (บาท)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="quote-col-no">{idx + 1}</td>
                                    <td className="quote-col-name">
                                        {item.location_name && <div className="quote-item-location">{item.location_name}</div>}
                                        <div>{item.product_name}</div>
                                        {item.description && <div className="quote-item-desc">{item.description}</div>}
                                    </td>
                                    <td className="quote-col-size">
                                        {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
                                    </td>
                                    <td className="quote-col-qty">{item.quantity}</td>
                                    <td className="quote-col-price">฿{formatCurrency(item.unit_price)}</td>
                                    <td className="quote-col-total">฿{formatCurrency(item.total_price)}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="quote-empty">ไม่มีรายการสินค้า</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Totals ── */}
                <div className="quote-totals-section">
                    <div className="quote-totals-box">
                        <div className="quote-totals-row">
                            <span>จำนวนรายการ:</span>
                            <span>{items.length} รายการ</span>
                        </div>
                        <div className="quote-totals-row">
                            <span>รวมเป็นเงิน:</span>
                            <span>฿{formatCurrency(quotation.total_amount)}</span>
                        </div>
                        {quotation.tax_amount > 0 && (
                            <div className="quote-totals-row">
                                <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                                <span>฿{formatCurrency(quotation.tax_amount)}</span>
                            </div>
                        )}
                        <div className="quote-totals-grand">
                            <span>ยอดสุทธิ</span>
                            <span>฿{formatCurrency(quotation.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Notes ── */}
                {quotation.notes && (
                    <div className="quote-notes-section">
                        <div className="quote-notes-title">หมายเหตุ:</div>
                        <div>{quotation.notes}</div>
                    </div>
                )}

                <div className="quote-notes-section">
                    <div className="quote-notes-title">เงื่อนไข:</div>
                    <div>• ราคานี้รวมค่าติดตั้งแล้ว (ถ้ามี)</div>
                    <div>• ราคาอาจเปลี่ยนแปลงได้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า</div>
                </div>

                {/* ── Footer ── */}
                <div className="quote-footer">
                    เอกสารนี้ออกโดยระบบ {store?.name || 'TMK TEAM'}
                </div>
            </div>
        </div>
    );
}
