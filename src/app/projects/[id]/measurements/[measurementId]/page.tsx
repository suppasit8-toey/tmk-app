import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Ruler, Plus } from 'lucide-react';
import { hasAccess, AppRole } from '@/utils/rbac';
import AddMeasurementItemModal from './AddMeasurementItemModal';
import MeasurementItemRow from './MeasurementItemRow';

interface PageProps {
    params: Promise<{
        id: string;
        measurementId: string;
    }>;
}

export default async function MeasurementBillPage({ params }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!hasAccess(profile?.role as AppRole, '/projects')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { id, measurementId } = await params;

    const isBillNumber = measurementId.toUpperCase().startsWith('MB');

    let query = supabase.from('measurement_bills').select('*, project:projects(*, customer:customers(first_name, last_name))');
    if (isBillNumber) {
        query = query.eq('bill_number', measurementId.toUpperCase());
    } else {
        query = query.eq('id', measurementId);
    }

    const { data: bill, error: billError } = await query.single();

    if (billError || !bill) {
        notFound();
    }

    const { data: items } = await supabase
        .from('measurement_items')
        .select('*')
        .eq('bill_id', bill.id)
        .order('created_at', { ascending: true });

    const { data: projectLocationsRaw } = await supabase
        .from('project_locations')
        .select('*, windows:location_windows(*)')
        .eq('project_id', bill.project_id)
        .order('created_at', { ascending: false });

    const projectLocations = projectLocationsRaw || [];

    const { data: productCategories } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
    const categories = productCategories || [];

    const groupedItems: Record<string, any[]> = {};
    const locationOrder: string[] = [];

    (items || []).forEach(item => {
        if (!item.location_name) return;
        if (!groupedItems[item.location_name]) {
            groupedItems[item.location_name] = [];
            locationOrder.push(item.location_name);
        }
        groupedItems[item.location_name].push(item);
    });

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href={`/projects/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem', background: 'var(--bg-main)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>
                    <ChevronLeft size={16} /> กลับหน้าโปรเจกต์
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                                <Ruler size={24} />
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                บิลวัดพื้นที่ {bill.bill_number}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '3.25rem' }}>
                            <span>โปรเจกต์: <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{bill.project?.name}</span></span>
                            <span>|</span>
                            <span>ลูกค้า: {bill.project?.customer?.first_name} {bill.project?.customer?.last_name || ''}</span>
                            <span>|</span>
                            <span style={{
                                padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem',
                                background: bill.measurement_mode === 'wallpaper' ? '#fef3c7' : bill.measurement_mode === 'film' ? '#e0e7ff' : '#dbeafe',
                                color: bill.measurement_mode === 'wallpaper' ? '#d97706' : bill.measurement_mode === 'film' ? '#4f46e5' : '#2563eb'
                            }}>
                                {bill.measurement_mode === 'wallpaper' ? 'วอลล์เปเปอร์' : bill.measurement_mode === 'film' ? 'ฟิล์ม' : 'ม่านทั่วไป'}
                            </span>
                            <span>|</span>
                            <span style={{
                                padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem',
                                background: bill.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                                color: bill.status === 'completed' ? '#16a34a' : '#64748b'
                            }}>
                                {bill.status === 'draft' ? 'แบบร่าง' : bill.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>รายการพื้นที่ที่วัด</h2>
                <AddMeasurementItemModal billId={bill.id} projectId={bill.project_id!} projectLocations={projectLocations} />
            </div>

            {items && items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {locationOrder.map((locationName, index) => {
                        const groupItems = groupedItems[locationName];
                        return (
                            <div key={locationName} className="card loc-group" style={{ padding: '0', display: 'flex', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <div style={{ width: '80px', background: 'var(--bg-subtle)', borderRight: '1px solid var(--border)', display: 'flex', justifyContent: 'center', paddingTop: '1.5rem', flexShrink: 0 }}>
                                    <div style={{ background: '#fff', color: 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.1rem', border: '1px solid var(--border)' }}>
                                        {index + 1}
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    {groupItems.map((item, subIndex) => (
                                        <div key={item.id} style={{ borderBottom: subIndex < groupItems.length - 1 ? '1px solid var(--border)' : 'none', padding: '1.5rem' }}>
                                            <MeasurementItemRow
                                                item={item}
                                                index={index}
                                                projectId={bill.project_id!}
                                                categories={categories}
                                                isGrouped={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)' }}>
                    <Ruler size={48} style={{ color: 'var(--border)', marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีรายการพื้นที่หน้างาน</h3>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', maxWidth: '400px' }}>เริ่มเพิ่มตำแหน่งห้อง หรือจุดที่ต้องการวัดได้ที่ปุ่มด้านบน เพื่อบันทึกขนาดและสเปคสินค้า</p>
                    <AddMeasurementItemModal billId={bill.id} projectId={bill.project_id!} projectLocations={projectLocations} />
                </div>
            )}
        </div>
    );
}
