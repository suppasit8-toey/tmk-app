import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { hasAccess, AppRole } from '@/utils/rbac';
import { FolderKanban, Briefcase } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/projects';
import { Customer } from '@/types/sales';
import AddProjectModal from './AddProjectModal';
import DeleteProjectButton from './DeleteProjectButton';

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/customers')) { // Using customers role level access for now
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: customersData } = await supabase.from('customers').select('*').order('first_name');
    const customers = (customersData || []) as Customer[];

    const { data: referrersData } = await supabase.from('referrers').select('id, name').order('name');
    const referrers = (referrersData || []) as { id: string, name: string }[];

    // Fetch projects with customer details
    const { data: projectsData } = await supabase
        .from('projects')
        .select(`*, customer:customers(first_name, last_name)`)
        .order('created_at', { ascending: false });

    const projects = (projectsData || []) as unknown as Project[];

    // Generate preview of next project number
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2); // Use AD year
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PJ${yy}${mm}`;

    const { data: latestProject } = await supabase
        .from('projects')
        .select('project_number')
        .like('project_number', `${prefix}%`)
        .order('project_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    let runningNo = 1;
    if (latestProject?.project_number) {
        const lastNoStr = latestProject.project_number.slice(-3);
        const lastNo = parseInt(lastNoStr, 10);
        if (!isNaN(lastNo)) runningNo = lastNo + 1;
    }
    const nextProjectNumber = `${prefix}${runningNo.toString().padStart(3, '0')}`;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header + Add Modal Trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    โปรเจกต์ทำงาน (Projects)
                </h1>
                <AddProjectModal customers={customers} referrers={referrers} nextProjectNumber={nextProjectNumber} />
            </div>

            {/* Projects Table */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><Briefcase size={18} /></div>
                    <h2 className="section-title">รายการโปรเจกต์งานทั้งหมด</h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>ทั้งหมด {projects.length} โปรเจกต์</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>หมายเลขโปรเจกต์</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ชื่อโปรเจกต์</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ลูกค้า</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>วันที่เริ่ม</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>สถานะ</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>รายละเอียด</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{p.project_number || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500, color: 'var(--primary)' }}>{p.name}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>{p.customer?.first_name} {p.customer?.last_name}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>
                                        {p.start_date ? new Date(p.start_date).toLocaleDateString('th-TH') : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}><ProjectStatusBadge status={p.status} /></td>
                                    <td style={{ padding: '0.75rem 1.5rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description || '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <AddProjectModal project={p} customers={customers} referrers={referrers} />
                                            <Link href={`/projects/${p.project_number || p.id}`} style={{
                                                fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
                                                color: '#3b82f6', background: '#eef3ff', border: 'none', cursor: 'pointer',
                                                textDecoration: 'none'
                                            }}>
                                                ดูข้อมูล
                                            </Link>
                                            <DeleteProjectButton id={p.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <FolderKanban size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem auto' }} />
                                        <p>ยังไม่มีข้อมูลโปรเจกต์</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
    const cfg: Record<string, { bg: string, text: string, label: string }> = {
        planning: { bg: '#f1f5f9', text: '#64748b', label: 'รอวางแผน' },
        in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'กำลังดำเนินการ' },
        completed: { bg: '#dcfce7', text: '#16a34a', label: 'เสร็จสิ้น' },
        on_hold: { bg: '#fee2e2', text: '#ea580c', label: 'ระงับชั่วคราว' },
        cancelled: { bg: '#f1f5f9', text: '#94a3b8', label: 'ยกเลิก' },
    };
    const c = cfg[status] || cfg.planning;
    return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>;
}
