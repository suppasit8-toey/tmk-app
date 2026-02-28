import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SpecSheetPageClient from './SpecSheetPageClient';

export default async function SpecSheetPage({ params }: { params: Promise<{ id: string; specSheetId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const specSheetId = resolvedParams.specSheetId;

    // Resolve project number to project id if needed
    let realProjectId = projectId;
    const { data: project } = await supabase
        .from('projects')
        .select('id, project_number')
        .or(`id.eq.${projectId},project_number.eq.${projectId}`)
        .single();

    if (project) {
        realProjectId = project.id;
    }

    // Fetch spec sheet
    const { data: specSheet, error: ssError } = await supabase
        .from('spec_sheets')
        .select('*')
        .eq('id', specSheetId)
        .single();

    if (ssError || !specSheet) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>ไม่พบใบเลือกสเปก</p>
                <a href={`/projects/${projectId}`} style={{ color: 'var(--primary)' }}>กลับหน้าโปรเจกต์</a>
            </div>
        );
    }

    // Fetch spec sheet items
    const { data: items } = await supabase
        .from('spec_sheet_items')
        .select('*')
        .eq('spec_sheet_id', specSheetId)
        .order('created_at', { ascending: true });

    // Fetch measurement items from the original bill (with category name)
    const { data: measurementItems } = await supabase
        .from('measurement_items')
        .select('*, product_categories(id, name)')
        .eq('bill_id', specSheet.bill_id)
        .order('created_at', { ascending: true });

    return (
        <SpecSheetPageClient
            specSheet={specSheet}
            items={items || []}
            measurementItems={measurementItems || []}
            projectId={realProjectId}
            projectNumber={project?.project_number || projectId}
        />
    );
}
