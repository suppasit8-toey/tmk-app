import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { InstallationJob, JOB_STATUS_CONFIG, JobStatus } from '@/types/installation';
import { ArrowLeft, Calendar, MapPin, User, FileText, Phone, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateJobStatus, assignTechnician, updateJobNotes, deleteJob } from './actions';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/installation')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const jobId = params.id;

    const { data: jobData, error: jobError } = await supabase
        .from('installation_jobs')
        .select(`*, customer:customers(first_name, last_name, phone, line_id, address), quotation:quotations(quotation_number, grand_total, status), assignee:profiles!installation_jobs_assigned_to_fkey(first_name, last_name)`)
        .eq('id', jobId)
        .single();

    if (jobError || !jobData) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger)' }}>ไม่พบงานนี้</p>
                <Link href="/installation" style={{ color: 'var(--primary)', fontWeight: 500 }}>กลับหน้าหลัก</Link>
            </div>
        );
    }

    const job = jobData as unknown as InstallationJob;
    const statusCfg = JOB_STATUS_CONFIG[job.status];

    // Fetch technicians for assignment
    const { data: techData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['technician', 'supervisor', 'admin', 'sales_measurement']);
    const technicians = techData || [];

    // Status flow
    const statusFlow: { from: JobStatus; to: JobStatus; label: string }[] = [
        { from: 'pending', to: 'measuring', label: 'เริ่มวัดงาน' },
        { from: 'measuring', to: 'measured', label: 'วัดเสร็จแล้ว' },
        { from: 'measured', to: 'installing', label: 'เริ่มติดตั้ง' },
        { from: 'installing', to: 'completed', label: 'ติดตั้งเสร็จ' },
    ];
    const nextStep = statusFlow.find(s => s.from === job.status);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/installation" style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--border)', display: 'inline-flex' }}>
                        <ArrowLeft size={18} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                    <div>
                        <h1 className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            งาน #{job.job_number}
                            <span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            สร้างเมื่อ {new Date(job.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {nextStep && (
                        <form action={async () => { 'use server'; await updateJobStatus(jobId, nextStep.to); }}>
                            <button type="submit" className="btn-primary">{nextStep.label}</button>
                        </form>
                    )}
                    {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <form action={async () => { 'use server'; await updateJobStatus(jobId, 'cancelled'); }}>
                            <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'white', color: 'var(--danger)', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}>
                                ยกเลิกงาน
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Status Progress Bar */}
            <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {(['pending', 'measuring', 'measured', 'installing', 'completed'] as JobStatus[]).map((s, i, arr) => {
                        const cfg = JOB_STATUS_CONFIG[s];
                        const isActive = s === job.status;
                        const isPast = arr.indexOf(job.status) > i;
                        const isCancelled = job.status === 'cancelled';
                        return (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    flex: 1,
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: isCancelled ? '#f1f5f9' : (isPast || isActive) ? cfg.color : '#e8ecf1',
                                    transition: 'background 0.3s',
                                }} />
                                {i < arr.length - 1 && <div style={{ width: '4px' }} />}
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    {(['pending', 'measuring', 'measured', 'installing', 'completed'] as JobStatus[]).map(s => (
                        <span key={s} style={{ fontSize: '0.6rem', color: s === job.status ? JOB_STATUS_CONFIG[s].color : 'var(--text-dim)', fontWeight: s === job.status ? 600 : 400, textAlign: 'center', flex: 1 }}>
                            {JOB_STATUS_CONFIG[s].label}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Customer Info */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={16} style={{ color: 'var(--primary)' }} /> ข้อมูลลูกค้า
                    </h2>
                    {job.customer ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <p style={{ fontWeight: 600 }}>{job.customer.first_name} {job.customer.last_name}</p>
                            {job.customer.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <Phone size={14} /> {job.customer.phone}
                                </div>
                            )}
                            {job.customer.line_id && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <MessageSquare size={14} /> {job.customer.line_id}
                                </div>
                            )}
                            {(job.address || job.customer.address) && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <MapPin size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                    <span>{job.address || job.customer.address}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>ไม่มีข้อมูลลูกค้า</p>
                    )}
                </div>

                {/* Quotation Info */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={16} style={{ color: '#f59e0b' }} /> ใบเสนอราคา
                    </h2>
                    {job.quotation ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <span className="pill" style={{ fontSize: '0.7rem', fontFamily: 'monospace', width: 'fit-content' }}>{job.quotation.quotation_number}</span>
                            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }} className="font-outfit">
                                ฿{Number(job.quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>ไม่ได้เชื่อมกับใบเสนอราคา</p>
                    )}
                </div>

                {/* Schedule & Assignment */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={16} style={{ color: '#8b5cf6' }} /> นัดหมาย & ช่าง
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>วันนัดหมาย</p>
                            <p style={{ fontSize: '0.875rem' }}>
                                {job.scheduled_date
                                    ? `${new Date(job.scheduled_date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ${job.scheduled_time || ''}`
                                    : 'ยังไม่กำหนด'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>ช่างที่มอบหมาย</p>
                            {job.assignee ? (
                                <span className="pill" style={{ display: 'inline-flex', width: 'fit-content' }}>
                                    <User size={14} /> {job.assignee.first_name} {job.assignee.last_name}
                                </span>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>ยังไม่มอบหมาย</p>
                            )}
                        </div>
                        {/* Assign Technician Form */}
                        {job.status !== 'completed' && job.status !== 'cancelled' && (
                            <form action={async (formData) => { 'use server'; const userId = formData.get('userId') as string; await assignTechnician(jobId, userId || null); }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <select name="userId" style={{ flex: 1 }} defaultValue={job.assigned_to || ''}>
                                    <option value="">ไม่ระบุช่าง</option>
                                    {technicians.map(t => (
                                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                    ))}
                                </select>
                                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>บันทึก</button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MessageSquare size={16} style={{ color: '#22c55e' }} /> บันทึก / หมายเหตุ
                    </h2>
                    <form action={updateJobNotes} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input type="hidden" name="jobId" value={jobId} />
                        <textarea name="notes" rows={4} defaultValue={job.notes || ''} placeholder="เพิ่มบันทึก..." style={{ width: '100%', resize: 'vertical' }}></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>บันทึกหมายเหตุ</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete */}
            {job.status === 'cancelled' && (
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--danger)' }}>ลบงานนี้</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ลบงานนี้ออกจากระบบถาวร</p>
                    </div>
                    <form action={async () => { 'use server'; await deleteJob(jobId); }}>
                        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Trash2 size={14} /> ลบงาน
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
