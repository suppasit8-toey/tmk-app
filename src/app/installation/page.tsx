import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { InstallationJob, JOB_STATUS_CONFIG, JobStatus } from '@/types/installation';
import { Plus, Calendar, MapPin, User, Wrench, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default async function InstallationPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/installation')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    // Fetch all jobs with joined data
    const { data: jobsData } = await supabase
        .from('installation_jobs')
        .select(`*, customer:customers(first_name, last_name, phone, address), quotation:quotations(quotation_number, grand_total, status), assignee:profiles!installation_jobs_assigned_to_fkey(first_name, last_name)`)
        .order('created_at', { ascending: false });

    const jobs = (jobsData || []) as unknown as InstallationJob[];

    // Fetch customers for the create form
    const { data: customersData } = await supabase.from('customers').select('id, first_name, last_name').order('created_at', { ascending: false });
    const customers = customersData || [];

    // Fetch approved quotations for linking
    const { data: quotationsData } = await supabase
        .from('quotations')
        .select('id, quotation_number, customer_id, grand_total')
        .in('status', ['approved', 'sent'])
        .order('created_at', { ascending: false });
    const quotations = quotationsData || [];

    // Fetch technicians/supervisors
    const { data: techData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['technician', 'supervisor', 'admin', 'sales_measurement']);
    const technicians = techData || [];

    // Group jobs by status for the board
    const columns: { status: JobStatus; label: string; icon: React.ReactNode; color: string }[] = [
        { status: 'pending', label: 'รอดำเนินการ', icon: <ClipboardList size={16} />, color: '#f59e0b' },
        { status: 'measuring', label: 'วัดงาน', icon: <Wrench size={16} />, color: '#3b82f6' },
        { status: 'installing', label: 'ติดตั้ง', icon: <Wrench size={16} />, color: '#f97316' },
        { status: 'completed', label: 'เสร็จสิ้น', icon: <Wrench size={16} />, color: '#22c55e' },
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    วัดงาน / ติดตั้ง
                </h1>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {(['pending', 'measuring', 'installing', 'completed'] as JobStatus[]).map(s => {
                    const cfg = JOB_STATUS_CONFIG[s];
                    const count = jobs.filter(j => j.status === s).length;
                    return (
                        <div key={s} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="stat-icon" style={{ background: cfg.bg, color: cfg.color, width: '2.5rem', height: '2.5rem' }}>
                                <ClipboardList size={16} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{cfg.label}</p>
                                <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                {/* Job Board */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
                    {columns.map(col => {
                        const colJobs = jobs.filter(j => j.status === col.status);
                        return (
                            <div key={col.status}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{col.label}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{colJobs.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {colJobs.map(job => (
                                        <Link key={job.id} href={`/installation/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s', borderLeft: `3px solid ${col.color}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-dim)', background: 'var(--bg-input)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                                        {job.job_number}
                                                    </span>
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                                    {job.customer?.first_name} {job.customer?.last_name}
                                                </p>
                                                {job.scheduled_date && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                        <Calendar size={12} />
                                                        {new Date(job.scheduled_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                        {job.scheduled_time && ` ${job.scheduled_time}`}
                                                    </div>
                                                )}
                                                {job.address && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                                        <MapPin size={12} style={{ flexShrink: 0 }} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.address}</span>
                                                    </div>
                                                )}
                                                {job.assignee && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: col.color, marginTop: '0.35rem' }}>
                                                        <User size={12} />
                                                        {job.assignee.first_name} {job.assignee.last_name}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                    {colJobs.length === 0 && (
                                        <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                                            ไม่มีงาน
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Create Job Form */}
                <div className="card" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Plus size={18} /></div>
                        <h2 className="section-title">สร้างงานใหม่</h2>
                    </div>

                    <form action={async (formData) => { 'use server'; const { createJob } = await import('./actions'); await createJob(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ลูกค้า *</label>
                            <select name="customerId" required style={{ width: '100%' }}>
                                <option value="">เลือกลูกค้า...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ใบเสนอราคา</label>
                            <select name="quotationId" style={{ width: '100%' }}>
                                <option value="">ไม่ระบุ</option>
                                {quotations.map(q => (
                                    <option key={q.id} value={q.id}>{q.quotation_number} (฿{Number(q.grand_total).toLocaleString()})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>มอบหมายช่าง</label>
                            <select name="assignedTo" style={{ width: '100%' }}>
                                <option value="">ยังไม่ระบุ</option>
                                {technicians.map(t => (
                                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.role})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>วันนัดหมาย</label>
                                <input name="scheduledDate" type="date" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>เวลา</label>
                                <input name="scheduledTime" type="time" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ที่อยู่ติดตั้ง</label>
                            <textarea name="address" rows={2} placeholder="ที่อยู่สำหรับติดตั้ง..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>บันทึก</label>
                            <textarea name="notes" rows={2} placeholder="หมายเหตุเพิ่มเติม..." style={{ width: '100%', resize: 'none' }}></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                            <Plus size={16} /> สร้างงาน
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
