'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Project } from '@/types/projects';
import { MeasurementBill } from '@/types/measurements';
import { ProjectLocation } from '@/types/projects';
import { LayoutDashboard, Ruler, FileText, ShoppingCart, Wrench, ChevronRight, PenTool, Image as ImageIcon, Trash2, MapPin, Filter } from 'lucide-react';
import AddMeasurementBillModal from './AddMeasurementBillModal';
import { deleteMeasurementBill } from './actions';
import ProjectLocationsTab from './ProjectLocationsTab';

interface ProjectTabsProps {
    project: Project;
    measurementBills: MeasurementBill[];
    locations: ProjectLocation[];
}

export default function ProjectTabs({ project, measurementBills, locations }: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'measurements' | 'quotations' | 'orders' | 'installations'>('overview');
    const [isDeleting, startTransition] = useTransition();
    const [billFilter, setBillFilter] = useState<string>('all');

    const handleDeleteBill = (e: React.MouseEvent, billId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบิลวัดพื้นที่นี้? ข้อมูลภายในบิลจะถูกลบทั้งหมดและไม่สามารถกู้คืนได้')) {
            startTransition(async () => {
                try {
                    await deleteMeasurementBill(billId, project.id);
                } catch (error) {
                    console.error('Error deleting measurement bill:', error);
                    alert('เกิดข้อผิดพลาดในการลบบิลวัดพื้นที่');
                }
            });
        }
    };

    const tabs = [
        { id: 'overview', label: 'ภาพรวม', icon: <LayoutDashboard size={16} /> },
        { id: 'locations', label: 'ตำแหน่งงาน', icon: <MapPin size={16} /> },
        { id: 'measurements', label: 'บิลวัดพื้นที่', icon: <Ruler size={16} /> },
        { id: 'quotations', label: 'ใบเสนอราคา', icon: <FileText size={16} /> },
        { id: 'orders', label: 'สั่งของ', icon: <ShoppingCart size={16} /> },
        { id: 'installations', label: 'คิวติดตั้ง', icon: <Wrench size={16} /> },
    ] as const;

    const filteredBills = measurementBills.filter(bill => {
        if (billFilter === 'all') return true;
        return bill.measurement_mode === billFilter;
    });

    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Tabs Header */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                {activeTab === 'overview' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>รายละเอียดโปรเจกต์</h3>
                        <p style={{ marginBottom: '0.5rem' }}><strong>ชื่อโปรเจกต์:</strong> {project.name}</p>
                        <p style={{ marginBottom: '0.5rem' }}><strong>สถานะ:</strong> {project.status}</p>
                        <p style={{ marginBottom: '0.5rem' }}><strong>รายละเอียด:</strong> {project.description || '-'}</p>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>วันที่เริ่ม:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString('th-TH') : '-'}
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                            <strong>วันที่สิ้นสุด:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString('th-TH') : '-'}
                        </p>
                    </div>
                )}

                {activeTab === 'locations' && (
                    <ProjectLocationsTab projectId={project.id} locations={locations || []} />
                )}

                {activeTab === 'measurements' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>บิลวัดพื้นที่</h3>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0 0.5rem' }}>
                                    <Filter size={16} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
                                    <select
                                        value={billFilter}
                                        onChange={(e) => setBillFilter(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', padding: '0.6rem', fontSize: '0.85rem', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="curtain">ม่านทั่วไป</option>
                                        <option value="wallpaper">วอลล์เปเปอร์</option>
                                        <option value="film">ฟิล์ม</option>
                                    </select>
                                </div>
                                <AddMeasurementBillModal projectId={project.id} customerId={project.customer_id || ''} />
                            </div>
                        </div>

                        {filteredBills.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {filteredBills.map((bill) => (
                                    <Link href={`/projects/${project.project_number || project.id}/measurements/${bill.bill_number || bill.id}`} key={bill.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--bg-main)', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.2s', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                                        <button
                                            onClick={(e) => handleDeleteBill(e, bill.id)}
                                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', opacity: isDeleting ? 0.5 : 1 }}
                                            disabled={isDeleting}
                                            title="ลบบิล"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingRight: '2rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', display: 'block' }}>{bill.bill_number}</span>
                                                    <span style={{
                                                        fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                                        background: bill.measurement_mode === 'wallpaper' ? '#fef3c7' : bill.measurement_mode === 'film' ? '#e0e7ff' : '#dbeafe',
                                                        color: bill.measurement_mode === 'wallpaper' ? '#d97706' : bill.measurement_mode === 'film' ? '#4f46e5' : '#2563eb'
                                                    }}>
                                                        {bill.measurement_mode === 'wallpaper' ? 'วอลล์เปเปอร์' : bill.measurement_mode === 'film' ? 'ฟิล์ม' : 'ม่านทั่วไป'}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {bill.created_at ? new Date(bill.created_at).toLocaleDateString('th-TH') : '-'}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                                background: bill.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                                                color: bill.status === 'completed' ? '#16a34a' : '#64748b'
                                            }}>
                                                {bill.status === 'draft' ? 'แบบร่าง' : bill.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                {bill.notes ? 'มีหมายเหตุ' : 'ไม่มีหมายเหตุ'}
                                            </span>
                                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : measurementBills.length > 0 ? (
                            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Ruler size={48} style={{ color: 'var(--border)', opacity: 0.5, marginBottom: '1rem' }} />
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ไม่มีบิลวัดพื้นที่ในหมวดหมู่นี้</h4>
                                <p style={{ fontSize: '0.85rem' }}>ลองเปลี่ยนตัวกรองเป็นประเภทอื่น หรือเลือก "ทั้งหมด"</p>
                            </div>
                        ) : (
                            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Ruler size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีบิลวัดพื้นที่</h4>
                                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>คลิกปุ่ม "สร้างบิลวัดพื้นที่" เพื่อเริ่มบันทึกข้อมูลหน้างาน</p>
                                <AddMeasurementBillModal projectId={project.id} customerId={project.customer_id || ''} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quotations' && (
                    <>
                        <FileText size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีใบเสนอราคา</h3>
                        <p style={{ fontSize: '0.85rem' }}>รายการใบเสนอราคาที่เชื่อมโยงกับโปรเจกต์นี้จะแสดงที่นี่</p>
                    </>
                )}

                {activeTab === 'orders' && (
                    <>
                        <ShoppingCart size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีการสั่งของ</h3>
                        <p style={{ fontSize: '0.85rem' }}>ประวัติการสั่งซื้อวัสดุ/สินค้าของโปรเจกต์นี้จะแสดงที่นี่</p>
                    </>
                )}

                {activeTab === 'installations' && (
                    <>
                        <Wrench size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีคิวติดตั้ง</h3>
                        <p style={{ fontSize: '0.85rem' }}>ตารางคิวและประวัติการติดตั้งที่อัปเดตจากช่างจะแสดงที่นี่</p>
                    </>
                )}
            </div>
        </div>
    );
}
