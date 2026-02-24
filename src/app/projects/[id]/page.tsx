import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FolderKanban, Ruler, FileText, ShoppingCart, Wrench } from 'lucide-react';
import { hasAccess, AppRole } from '@/utils/rbac';
import { Project } from '@/types/projects';
import ProjectTabs from './ProjectTabs';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!hasAccess(profile?.role as AppRole, '/projects')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const isProjectNumber = id.startsWith('PJ');
    let query = supabase.from('projects').select('*, customer:customers(first_name, last_name)').single();

    if (isProjectNumber) {
        query = query.eq('project_number', id);
    } else {
        query = query.eq('id', id);
    }

    const { data: project, error } = await query;
    if (error || !project) {
        notFound();
    }

    const { data: measurementBills } = await supabase
        .from('measurement_bills')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

    const { data: projectLocations } = await supabase
        .from('project_locations')
        .select('*, windows:location_windows(*)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem', background: 'var(--bg-main)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>
                    <ChevronLeft size={16} /> กลับหน้ารวมโปรเจกต์
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: '#fef3e2', color: '#f59e0b', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                                <FolderKanban size={24} />
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                {project.name}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '3.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{project.project_number || 'ไม่มีรหัส'}</span>
                            <span>|</span>
                            <span>ลูกค้า: {project.customer?.first_name} {project.customer?.last_name || ''}</span>
                            <span>|</span>
                            <span>สถานะ: <ProjectStatusBadge status={project.status} /></span>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectTabs
                project={project as Project}
                measurementBills={measurementBills || []}
                locations={projectLocations || []}
            />
        </div>
    );
}

function ProjectStatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string, text: string, label: string }> = {
        planning: { bg: '#f1f5f9', text: '#64748b', label: 'รอวางแผน' },
        in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'กำลังดำเนินการ' },
        completed: { bg: '#dcfce7', text: '#16a34a', label: 'เสร็จสิ้น' },
        on_hold: { bg: '#fee2e2', text: '#ea580c', label: 'ระงับชั่วคราว' },
        cancelled: { bg: '#f1f5f9', text: '#94a3b8', label: 'ยกเลิก' },
    };
    const c = cfg[status] || cfg.planning;
    return <span className="badge" style={{ background: c.bg, color: c.text, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{c.label}</span>;
}
