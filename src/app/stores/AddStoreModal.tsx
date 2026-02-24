'use client';

import { useRef, useState } from 'react';
import { Plus, X, Store as StoreIcon } from 'lucide-react';
import { createStore, updateStore } from './actions';
import { Store } from '@/types/sales';

interface AddStoreModalProps {
    store?: Store;
}

export default function AddStoreModal({ store }: AddStoreModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (store) {
                await updateStore(store.id, formData);
            } else {
                await createStore(formData);
            }
            closeModal();
            if (!store) {
                const form = dialogRef.current?.querySelector('form');
                form?.reset();
            }
        } catch (error) {
            console.error('Error saving store:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลสาขา');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {store ? (
                <button
                    onClick={openModal}
                    style={{
                        fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
                        color: '#f59e0b', background: '#fef3e2', border: 'none', cursor: 'pointer', textDecoration: 'none'
                    }}
                >
                    แก้ไข
                </button>
            ) : (
                <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> ร้านค้าใหม่
                </button>
            )}

            <dialog ref={dialogRef} style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', width: '100%', minWidth: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><StoreIcon size={18} /></div>
                            <h2 className="section-title" style={{ margin: 0 }}>{store ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}</h2>
                        </div>
                        <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อร้าน/สาขา/บริษัท *</label>
                            <input name="name" type="text" defaultValue={store?.name || ''} required placeholder="เช่น บริษัท ทีเอ็มเค เฟอร์นิเจอร์ จำกัด" style={{ width: '100%' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เลขประจำตัวผู้เสียภาษี</label>
                                <input name="taxId" type="text" defaultValue={store?.tax_id || ''} placeholder="01234567890123" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เบอร์โทรติดต่อ</label>
                                <input name="phone" type="tel" defaultValue={store?.phone || ''} placeholder="02-XXX-XXXX" style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ที่อยู่</label>
                            <textarea name="address" defaultValue={store?.address || ''} rows={3} placeholder="ระบุที่อยู่ของร้านค้า..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสาขา'}
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
}
