'use client';

import { useRef, useState } from 'react';
import { Plus, X, FolderKanban } from 'lucide-react';
import { createProject, updateProject } from './actions';
import { Project } from '@/types/projects';
import { Customer } from '@/types/sales';

interface AddProjectModalProps {
    project?: Project;
    customers: Customer[];
    referrers: { id: string, name: string }[];
    nextProjectNumber?: string;
}

export default function AddProjectModal({ project, customers, referrers, nextProjectNumber }: AddProjectModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (project) {
                await updateProject(project.id, formData);
            } else {
                await createProject(formData);
            }
            closeModal();
            if (!project) {
                const form = dialogRef.current?.querySelector('form');
                form?.reset();
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {project ? (
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
                    <Plus size={16} /> สร้างโปรเจกต์ใหม่
                </button>
            )}

            <dialog ref={dialogRef} style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', width: '100%', minWidth: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><FolderKanban size={18} /></div>
                            <h2 className="section-title" style={{ margin: 0 }}>{project ? `แก้ไขโปรเจกต์ ${project.project_number || ''}` : 'สร้างโปรเจกต์ใหม่'}</h2>
                        </div>
                        <button type="button" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>รหัสโปรเจกต์</label>
                                <input type="text" value={project?.project_number || nextProjectNumber || 'สร้างอัตโนมัติ'} disabled style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ชื่อโปรเจกต์ *</label>
                                <input name="name" type="text" defaultValue={project?.name || ''} required placeholder="เช่น งานบ้านตึก A, รีโนเวทออฟฟิศชั้น 2" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ลูกค้า *</label>
                                <select name="customerId" required defaultValue={project?.customer_id || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                    <option value="">-- เลือกลูกค้า --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>คนแนะนำ (ไม่บังคับ)</label>
                                <select name="referrerId" defaultValue={project?.referrer_id || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                    <option value="">-- เลือกคนแนะนำ --</option>
                                    {referrers.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {project && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>สถานะโปรเจกต์</label>
                                <select name="status" defaultValue={project.status} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                    <option value="planning">รอวางแผน (Planning)</option>
                                    <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                                    <option value="completed">เสร็จสิ้น (Completed)</option>
                                    <option value="on_hold">ระงับชั่วคราว (On Hold)</option>
                                    <option value="cancelled">ยกเลิก (Cancelled)</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>วันที่เริ่ม (โดยประมาณ)</label>
                                <input name="startDate" type="date" defaultValue={project?.start_date || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>วันที่คาดว่าจะเสร็จ</label>
                                <input name="endDate" type="date" defaultValue={project?.end_date || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-main)' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>รายละเอียดเพิ่มเติม</label>
                            <textarea name="description" defaultValue={project?.description || ''} rows={3} placeholder="ระบุรายละเอียดงานของโปรเจกต์นี้..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกโปรเจกต์'}
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
}
