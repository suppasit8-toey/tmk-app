'use client';

import { useTransition } from 'react';
import { updateQuotationStore } from './actions';

interface QuotationStoreSelectProps {
    quotationId: string;
    currentStoreId: string | null | undefined;
    status: string;
    stores: any[];
}

export default function QuotationStoreSelect({ quotationId, currentStoreId, status, stores }: QuotationStoreSelectProps) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const storeId = e.target.value;
        startTransition(async () => {
            try {
                await updateQuotationStore(quotationId, storeId === '' ? null : storeId);
            } catch (error) {
                console.error('Error updating store:', error);
                alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลร้านค้า');
            }
        });
    };

    return (
        <form>
            <select
                name="store_id"
                defaultValue={currentStoreId || ''}
                onChange={handleChange}
                disabled={status !== 'draft' || isPending}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)', fontSize: '0.8rem', opacity: isPending ? 0.7 : 1 }}
            >
                <option value="">-- ไม่ระบุ (ใช้ค่าเริ่มต้น) --</option>
                {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                {status === 'draft' ? '*ระบบจะบันทึกอัตโนมัติเมื่อเปลี่ยนค่า' : '*ไม่สามารถเปลี่ยนได้เนื่องจากไม่อยู่ในสถานะฉบับร่าง'}
            </p>
        </form>
    );
}
