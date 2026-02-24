'use client';

import { useRef, useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { createCustomer, createCorporateCustomer } from './actions';

export default function AddCustomerModal({ referrers }: { referrers: { id: string, name: string }[] }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (formData: FormData) => {
        if (customerType === 'individual') {
            await createCustomer(formData);
        } else {
            await createCorporateCustomer(formData);
        }
        closeModal();
    };

    return (
        <>
            <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> เพิ่มลูกค้าใหม่
            </button>

            <dialog ref={dialogRef} style={{ padding: 0, borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <div style={{ padding: '1.5rem', width: '100%', minWidth: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Users size={18} /></div>
                            <h2 className="section-title" style={{ margin: 0 }}>เพิ่มลูกค้าใหม่</h2>
                        </div>
                        <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ประเภทลูกค้า *</label>
                            <select
                                name="customerType"
                                required
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value as 'individual' | 'company')}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                            >
                                <option value="individual">ลูกค้าทั่วไป (Individual)</option>
                                <option value="company">ลูกค้าองค์กร / บริษัท (Company)</option>
                            </select>
                        </div>

                        {customerType === 'individual' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อ - นามสกุล *</label>
                                    <input name="firstName" type="text" required placeholder="ชื่อ - นามสกุล" style={{ width: '100%' }} />
                                    <input type="hidden" name="lastName" value="" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เบอร์โทร</label>
                                    <input name="phone" type="tel" placeholder="08X-XXX-XXXX" style={{ width: '100%' }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อบริษัท *</label>
                                    <input name="companyName" type="text" required placeholder="เช่น บริษัท ทีเอ็มเค เฟอร์นิเจอร์ จำกัด" style={{ width: '100%' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เลขประจำตัวผู้เสียภาษี</label>
                                        <input name="taxId" type="text" placeholder="0123456789012" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>พิกัดที่ตั้ง (Location URL)</label>
                                        <input name="locationUrl" type="url" placeholder="https://maps.app.goo.gl/..." style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ที่อยู่บริษัท</label>
                                    <textarea name="address" rows={2} placeholder="ที่อยู่บริษัท..." style={{ width: '100%', resize: 'none' }}></textarea>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อผู้ประสานงาน</label>
                                        <input name="contactPerson" type="text" placeholder="ชื่อผู้ติดต่อ" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เบอร์โทร</label>
                                        <input name="phone" type="tel" placeholder="08X-XXX-XXXX" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <input type="hidden" name="lineId" value="" />
                            </>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>คนแนะนำ (ไม่บังคับ)</label>
                            <select name="referrerId" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                <option value="">-- เลือกคนแนะนำ --</option>
                                {referrers.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            บันทึกลูกค้า
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
}
