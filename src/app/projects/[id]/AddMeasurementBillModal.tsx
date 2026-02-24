'use client';

import { useState, useTransition, useRef } from 'react';
import { Plus, X, Ruler } from 'lucide-react';
import { createMeasurementBill } from './actions';
import { MeasurementMode } from '@/types/measurements';

interface AddMeasurementBillModalProps {
    projectId: string;
    customerId: string;
}

const MODES: { value: MeasurementMode, label: string }[] = [
    { value: 'curtain', label: 'วัดม่านทั่วไป' },
    { value: 'wallpaper', label: 'วัดวอลล์เปเปอร์' },
    { value: 'film', label: 'วัดฟิล์ม' }
];

export default function AddMeasurementBillModal({ projectId, customerId }: AddMeasurementBillModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedMode, setSelectedMode] = useState<MeasurementMode>('curtain');

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    const handleCreateMeasurementBill = () => {
        if (!customerId) {
            alert('ไม่สามารถสร้างบิลได้เนื่องจากไม่พบข้อมูลลูกค้าในโปรเจกต์นี้');
            return;
        }

        startTransition(async () => {
            try {
                await createMeasurementBill(projectId, customerId, selectedMode);
                closeModal();
            } catch (error) {
                console.error('Error creating measurement bill:', error);
                alert('เกิดข้อผิดพลาดในการสร้างบิลวัดพื้นที่');
            }
        });
    };

    return (
        <>
            <button
                onClick={openModal}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Plus size={16} /> สร้างบิลวัดพื้นที่
            </button>

            <dialog ref={dialogRef} className="modal" style={{ padding: 0, border: 'none', borderRadius: '0.75rem', maxWidth: '400px', width: '100%', outline: 'none', background: 'var(--bg-main)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                        สร้างบิลวัดพื้นที่
                    </h3>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>กรุณาเลือกประเภทของงานวัดพื้นที่</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {MODES.map(mode => (
                            <label key={mode.value} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                                border: `2px solid ${selectedMode === mode.value ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: '0.5rem', cursor: 'pointer',
                                background: selectedMode === mode.value ? 'var(--bg-subtle)' : 'var(--bg-main)',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="measurement_mode"
                                    value={mode.value}
                                    checked={selectedMode === mode.value}
                                    onChange={(e) => setSelectedMode(e.target.value as MeasurementMode)}
                                    style={{ margin: 0 }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Ruler size={18} style={{ color: selectedMode === mode.value ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <span style={{ fontWeight: selectedMode === mode.value ? 600 : 400, color: selectedMode === mode.value ? 'var(--text)' : 'var(--text-muted)' }}>
                                        {mode.label}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={isPending}
                            style={{
                                padding: '0.6rem 1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)',
                                borderRadius: '0.5rem', fontWeight: 500, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleCreateMeasurementBill}
                            disabled={isPending}
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', opacity: isPending ? 0.7 : 1 }}
                        >
                            {isPending ? 'กำลังสร้าง...' : 'สร้างบิล'}
                        </button>
                    </div>
                </div>
            </dialog>

            <style>{`
                dialog::backdrop {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                }
            `}</style>
        </>
    );
}
