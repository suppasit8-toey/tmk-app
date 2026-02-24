'use client';

import { useRef, useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { createReferrer, updateReferrer } from './actions';
import { Referrer } from '@/types/sales';

interface AddReferrerModalProps {
    referrer?: Referrer; // If provided, acts as Edit Modal
}

export default function AddReferrerModal({ referrer }: AddReferrerModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (referrer) {
                await updateReferrer(referrer.id, formData);
            } else {
                await createReferrer(formData);
            }
            closeModal();
            // Reset form if it is an Add mode
            if (!referrer) {
                const form = dialogRef.current?.querySelector('form');
                form?.reset();
            }
        } catch (error) {
            console.error('Error saving referrer:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {referrer ? (
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
                    <Plus size={16} /> เพิ่มคนแนะนำ
                </button>
            )}

            <dialog ref={dialogRef} style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', width: '100%', minWidth: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Users size={18} /></div>
                            <h2 className="section-title" style={{ margin: 0 }}>{referrer ? 'แก้ไขข้อมูลคนแนะนำ' : 'เพิ่มคนแนะนำใหม่'}</h2>
                        </div>
                        <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อ *</label>
                            <input name="name" type="text" defaultValue={referrer?.name || ''} required placeholder="ชื่อคนแนะนำ" style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เบอร์โทร</label>
                                <input name="phone" type="tel" defaultValue={referrer?.phone || ''} placeholder="08X-XXX-XXXX" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Line ID</label>
                                <input name="line_id" type="text" defaultValue={referrer?.line_id || ''} placeholder="@lineid" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>รายละเอียดเพิ่มเติม</label>
                            <textarea name="notes" defaultValue={referrer?.notes || ''} rows={3} placeholder="เช่น เงื่อนไขค่าคอมมิชชั่น..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
}
