import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Quotation, QuotationItem, Store } from '@/types/sales';
import PrintTrigger from './PrintTrigger';
import './print.css';

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string; quotationId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const resolvedParams = await params;
    const quotationIdParam = resolvedParams.quotationId;

    const isQtNumber = quotationIdParam.startsWith('QT');
    let query = supabase.from('quotations').select(`*, customer:customers(*), store:stores(*)`);

    if (isQtNumber) {
        query = query.eq('quotation_number', quotationIdParam);
    } else {
        query = query.eq('id', quotationIdParam);
    }

    const { data: qtData, error: qtError } = await query.single();

    if (qtError || !qtData) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
                <p>ไม่พบข้อมูลใบเสนอราคา</p>
            </div>
        );
    }

    const quotation = qtData as unknown as Quotation;
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

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <div className="print-page">
                {/* ── Store Header ── */}
                <div className="print-header">
                    <div className="store-info">
                        <div className="store-name">{store?.name || 'บริษัท'}</div>
                        <div className="store-details">
                            {store?.address && <div>{store.address}</div>}
                            {store?.phone && <div>โทร: {store.phone}</div>}
                            {store?.tax_id && <div>เลขผู้เสียภาษี: {store.tax_id}</div>}
                        </div>
                    </div>
                    {store?.logo_url && (
                        <img src={store.logo_url} alt="Logo" className="store-logo" />
                    )}
                </div>

                {/* ── Document Title ── */}
                <div className="doc-title">ใบเสนอราคา / QUOTATION</div>

                {/* ── Info Grid ── */}
                <div className="info-grid">
                    <div className="info-box">
                        <div className="info-box-title">ข้อมูลเอกสาร</div>
                        <div className="info-row">
                            <span className="info-label">เลขที่:</span>
                            <span className="info-value">{quotation.quotation_number}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">วันที่:</span>
                            <span className="info-value">{formatDate(quotation.created_at)}</span>
                        </div>
                        {quotation.valid_until && (
                            <div className="info-row">
                                <span className="info-label">ใช้ได้ถึง:</span>
                                <span className="info-value">{formatDate(quotation.valid_until)}</span>
                            </div>
                        )}
                    </div>
                    <div className="info-box">
                        <div className="info-box-title">ข้อมูลลูกค้า</div>
                        {customer && (
                            <>
                                <div className="info-row">
                                    <span className="info-label">ชื่อ:</span>
                                    <span className="info-value">{customer.first_name} {customer.last_name}</span>
                                </div>
                                {customer.phone && (
                                    <div className="info-row">
                                        <span className="info-label">โทร:</span>
                                        <span className="info-value">{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="info-row">
                                        <span className="info-label">ที่อยู่:</span>
                                        <span className="info-value" style={{ maxWidth: '60%', textAlign: 'right' }}>{customer.address}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Items Table ── */}
                <table className="items-table">
                    <thead>
                        <tr>
                            <th className="col-no">ลำดับ</th>
                            <th className="col-name">รายการ</th>
                            <th className="col-size">ขนาด (ซม.)</th>
                            <th className="col-qty">จำนวน</th>
                            <th className="col-price">ราคา/หน่วย</th>
                            <th className="col-total">รวม (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.id}>
                                <td className="col-no">{idx + 1}</td>
                                <td className="col-name">
                                    {item.location_name && <div className="item-location">{item.location_name}</div>}
                                    <div>{item.product_name}</div>
                                    {item.description && <div className="item-desc">{item.description}</div>}
                                </td>
                                <td className="col-size">
                                    {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
                                </td>
                                <td className="col-qty">{item.quantity}</td>
                                <td className="col-price">{formatCurrency(item.unit_price)}</td>
                                <td className="col-total">{formatCurrency(item.total_price)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '20pt', color: '#9ca3af' }}>
                                    ไม่มีรายการสินค้า
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ── Totals ── */}
                <div className="totals-section">
                    <div className="totals-box">
                        <div className="totals-row">
                            <span>จำนวนรายการ:</span>
                            <span>{items.length} รายการ</span>
                        </div>
                        <div className="totals-row">
                            <span>รวมเป็นเงิน:</span>
                            <span>฿{formatCurrency(quotation.total_amount)}</span>
                        </div>
                        {quotation.tax_amount > 0 && (
                            <div className="totals-row">
                                <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                                <span>฿{formatCurrency(quotation.tax_amount)}</span>
                            </div>
                        )}
                        <div className="totals-grand">
                            <span>ยอดสุทธิ</span>
                            <span>฿{formatCurrency(quotation.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Notes ── */}
                {quotation.notes && (
                    <div className="notes-section">
                        <div className="notes-title">หมายเหตุ:</div>
                        <div>{quotation.notes}</div>
                    </div>
                )}

                <div className="notes-section">
                    <div className="notes-title">เงื่อนไข:</div>
                    <div>• ราคานี้รวมค่าติดตั้งแล้ว (ถ้ามี)</div>
                    <div>• ราคาอาจเปลี่ยนแปลงได้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า</div>
                </div>

                {/* ── Signatures ── */}
                <div className="signatures">
                    <div className="sig-box">
                        <div className="sig-line">
                            ลงชื่อ ....................................
                        </div>
                        <div className="sig-role">ผู้เสนอราคา</div>
                    </div>
                    <div className="sig-box">
                        <div className="sig-line">
                            ลงชื่อ ....................................
                        </div>
                        <div className="sig-role">ผู้อนุมัติ / ลูกค้า</div>
                    </div>
                </div>
            </div>

            <PrintTrigger />
        </>
    );
}
