'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Project } from '@/types/projects';
import { MeasurementBill } from '@/types/measurements';
import { ProjectLocation } from '@/types/projects';
import { Quotation } from '@/types/sales';
import { LayoutDashboard, Ruler, FileText, ShoppingCart, Wrench, ChevronRight, PenTool, Image as ImageIcon, Trash2, MapPin, Filter, PackageSearch, FileEdit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddMeasurementBillModal from './AddMeasurementBillModal';
import { deleteMeasurementBill, deleteQuotation } from './actions';
import { createSpecSheetFromBill, deleteSpecSheet } from './spec-sheets/actions';
import ProjectLocationsTab from './ProjectLocationsTab';
import { SpecSheet } from '@/types/spec-sheets';

interface ProjectTabsProps {
    project: Project;
    measurementBills: MeasurementBill[];
    locations: ProjectLocation[];
    quotations: Quotation[];
    specSheets: SpecSheet[];
}

export default function ProjectTabs({ project, measurementBills, locations, quotations, specSheets }: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'measurements' | 'spec-sheets' | 'quotations' | 'orders' | 'installations'>('overview');
    const [isDeleting, startTransition] = useTransition();
    const [billFilter, setBillFilter] = useState<string>('all');
    const router = useRouter();

    const [showSpecSheetModal, setShowSpecSheetModal] = useState(false);

    // Custom confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: 'danger' | 'primary';
        onConfirm: () => void;
    }>({ show: false, title: '', message: '', onConfirm: () => { } });

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const showConfirm = (opts: { title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'danger' | 'primary'; onConfirm: () => void }) => {
        setConfirmModal({ show: true, ...opts });
    };

    const handleCreateQuotation = (e: React.MouseEvent, billId: string) => {
        e.preventDefault();
        e.stopPropagation();

        showConfirm({
            title: 'สร้างใบเลือกสเปก',
            message: 'คุณต้องการสร้างใบเลือกสเปก (เพื่อเลือกสินค้าก่อนสร้างใบเสนอราคา) จากบิลวัดพื้นที่นี้ใช่หรือไม่?',
            confirmText: 'สร้าง',
            variant: 'primary',
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        const res = await createSpecSheetFromBill(project.id, billId);
                        if (res.success && res.specSheetId) {
                            router.push(`/projects/${project.project_number || project.id}/spec-sheets/${res.specSheetId}`);
                        }
                    } catch (error) {
                        console.error('Error creating spec sheet:', error);
                        showToast('เกิดข้อผิดพลาดในการสร้างใบเลือกสเปก', 'error');
                    }
                });
            }
        });
    };

    const handleDeleteBill = (e: React.MouseEvent, billId: string) => {
        e.preventDefault();
        e.stopPropagation();

        showConfirm({
            title: 'ลบบิลวัดพื้นที่',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบบิลวัดพื้นที่นี้? ข้อมูลภายในบิลจะถูกลบทั้งหมดและไม่สามารถกู้คืนได้',
            confirmText: 'ลบ',
            variant: 'danger',
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        await deleteMeasurementBill(billId, project.id);
                    } catch (error) {
                        console.error('Error deleting measurement bill:', error);
                        showToast('เกิดข้อผิดพลาดในการลบบิลวัดพื้นที่', 'error');
                    }
                });
            }
        });
    };

    const handleDeleteSpecSheet = (e: React.MouseEvent, specSheetId: string) => {
        e.preventDefault();
        e.stopPropagation();

        showConfirm({
            title: 'ลบใบเลือกสเปก',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบใบเลือกสเปกนี้? ข้อมูลภายในจะถูกลบทั้งหมดและไม่สามารถกู้คืนได้',
            confirmText: 'ลบ',
            variant: 'danger',
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        await deleteSpecSheet(specSheetId, project.id);
                    } catch (error) {
                        console.error('Error deleting spec sheet:', error);
                        showToast('เกิดข้อผิดพลาดในการลบใบเลือกสเปก', 'error');
                    }
                });
            }
        });
    };

    const handleDeleteQuotation = (e: React.MouseEvent, quotationId: string) => {
        e.preventDefault();
        e.stopPropagation();

        showConfirm({
            title: 'ลบใบเสนอราคา',
            message: 'คุณต้องการลบใบเสนอราคานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้',
            confirmText: 'ลบ',
            variant: 'danger',
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        await deleteQuotation(quotationId, project.id);
                    } catch (error) {
                        console.error('Error deleting quotation:', error);
                        showToast('เกิดข้อผิดพลาดในการลบใบเสนอราคา', 'error');
                    }
                });
            }
        });
    };

    const tabs = [
        { id: 'overview', label: 'ภาพรวม', icon: <LayoutDashboard size={16} /> },
        { id: 'locations', label: 'ตำแหน่งงาน', icon: <MapPin size={16} /> },
        { id: 'measurements', label: 'บิลวัดพื้นที่', icon: <Ruler size={16} /> },
        { id: 'spec-sheets', label: 'ใบเลือกสเปก', icon: <PackageSearch size={16} /> },
        { id: 'quotations', label: 'ใบเสนอราคา', icon: <FileText size={16} /> },
        { id: 'orders', label: 'สั่งของ', icon: <ShoppingCart size={16} /> },
        { id: 'installations', label: 'คิวติดตั้ง', icon: <Wrench size={16} /> },
    ] as const;

    const filteredBills = measurementBills.filter(bill => {
        if (billFilter === 'all') return true;
        return bill.measurement_mode === billFilter;
    });

    return (
        <>
            <div style={{ marginTop: '2rem' }}>
                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

                    {activeTab === 'spec-sheets' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ใบเลือกสเปก</h3>
                                <button
                                    onClick={() => setShowSpecSheetModal(true)}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    <FileText size={16} /> สร้างใบเลือกสเปก
                                </button>
                            </div>

                            {specSheets.length === 0 ? (
                                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <PackageSearch size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีใบเลือกสเปก</h3>
                                    <p style={{ fontSize: '0.85rem' }}>รายการใบเลือกสเปกที่เชื่อมโยงกับโปรเจกต์นี้จะแสดงที่นี่<br />สามารถสร้างใบเลือกสเปกจากเมนู <b>เลือกสเปก & สร้างใบเสนอราคา</b> ในบิลวัดพื้นที่</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {specSheets.map(ss => (
                                        <div key={ss.id} style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', transition: 'all 0.2s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                        วันที่สร้าง: {new Date(ss.created_at).toLocaleDateString('th-TH')}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                                                            ใบเลือกสเปก
                                                        </h4>
                                                        <span style={{
                                                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem',
                                                            background: ss.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                                            color: ss.status === 'completed' ? '#16a34a' : '#d97706'
                                                        }}>
                                                            {ss.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังเลือก'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={(e) => handleDeleteSpecSheet(e, ss.id)}
                                                    disabled={isDeleting}
                                                    className="btn-outline"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger-light)', background: 'transparent', cursor: 'pointer', zIndex: 10, borderRadius: '0.4rem', pointerEvents: isDeleting ? 'none' : 'auto', opacity: isDeleting ? 0.5 : 1 }}
                                                >
                                                    <Trash2 size={14} /> ลบ
                                                </button>
                                                <Link href={`/projects/${project.project_number || project.id}/spec-sheets/${ss.id}`}
                                                    className="btn-outline"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                                                    <FileEdit size={14} /> ดูรายละเอียด
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showSpecSheetModal && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>สร้างใบเลือกสเปก</h2>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                            เลือกบิลวัดพื้นที่ที่ต้องการนำมาสร้างใบเลือกสเปก
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                                            {measurementBills.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    ไม่พบบิลวัดพื้นที่ในโปรเจกต์นี้
                                                </div>
                                            ) : (
                                                measurementBills.map(bill => (
                                                    <button
                                                        key={bill.id}
                                                        onClick={(e) => handleCreateQuotation(e, bill.id)}
                                                        className="btn-outline"
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', textAlign: 'left', width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white' }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {bill.bill_number}
                                                                <span style={{
                                                                    fontSize: '0.65rem',
                                                                    padding: '0.15rem 0.4rem',
                                                                    borderRadius: '0.25rem',
                                                                    background: bill.measurement_mode === 'curtain' ? '#f0f9ff' :
                                                                        bill.measurement_mode === 'wallpaper' ? '#fdf4ff' : '#f0fdf4',
                                                                    color: bill.measurement_mode === 'curtain' ? '#0284c7' :
                                                                        bill.measurement_mode === 'wallpaper' ? '#c026d3' : '#16a34a',
                                                                    fontWeight: 500,
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {bill.measurement_mode === 'curtain' ? 'ผ้าม่าน' :
                                                                        bill.measurement_mode === 'wallpaper' ? 'วอลเปเปอร์' :
                                                                            bill.measurement_mode === 'film' ? 'ฟิล์ม' : bill.measurement_mode}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {new Date(bill.created_at).toLocaleDateString('th-TH')}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                                                            เลือกสร้าง
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setShowSpecSheetModal(false)}
                                                style={{ padding: '0.5rem 1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                                <button
                                                    onClick={(e) => handleCreateQuotation(e, bill.id)}
                                                    disabled={isDeleting}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s', zIndex: 10 }}
                                                >
                                                    <FileText size={14} /> เลือกสเปก & สร้างใบเสนอราคา
                                                </button>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                        {bill.notes ? 'มีหมายเหตุ' : 'ไม่มีหมายเหตุ'}
                                                    </span>
                                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : measurementBills.length > 0 ? (
                                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <Ruler size={48} style={{ color: 'var(--border)', opacity: 0.5, marginBottom: '1rem' }} />
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ไม่มีบิลวัดพื้นที่ในหมวดหมู่นี้</h4>
                                    <p style={{ fontSize: '0.85rem' }}>ลองเปลี่ยนตัวกรองเป็นประเภทอื่น หรือเลือก &quot;ทั้งหมด&quot;</p>
                                </div>
                            ) : (
                                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <Ruler size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีบิลวัดพื้นที่</h4>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>คลิกปุ่ม &quot;สร้างบิลวัดพื้นที่&quot; เพื่อเริ่มบันทึกข้อมูลหน้างาน</p>
                                    <AddMeasurementBillModal projectId={project.id} customerId={project.customer_id || ''} />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'quotations' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ใบเสนอราคาทั้งหมด</h3>
                            </div>

                            {quotations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {quotations.map((qt) => (
                                        <Link href={`/projects/${project.project_number || project.id}/quotations/${qt.quotation_number || qt.id}`} key={qt.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--bg-main)', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.2s', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingRight: '2rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', display: 'block' }}>{qt.quotation_number}</span>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {qt.created_at ? new Date(qt.created_at).toLocaleDateString('th-TH') : '-'}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                                    background: qt.status === 'draft' ? '#f1f5f9' : qt.status === 'sent' ? '#dbeafe' : qt.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                                    color: qt.status === 'draft' ? '#64748b' : qt.status === 'sent' ? '#2563eb' : qt.status === 'approved' ? '#16a34a' : '#dc2626'
                                                }}>
                                                    {qt.status === 'draft' ? 'ร่าง' : qt.status === 'sent' ? 'ส่งแล้ว' : qt.status === 'approved' ? 'อนุมัติ' : qt.status === 'cancelled' ? 'ยกเลิก' : qt.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ยอดรวมสุทธิ: </span>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                                                        ฿{Number(qt.grand_total || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={(e) => handleDeleteQuotation(e, qt.id)}
                                                        disabled={isDeleting}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', borderRadius: '0.5rem', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', zIndex: 10 }}
                                                        title="ลบใบเสนอราคา"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: 'var(--text-muted)', background: 'var(--border)', borderRadius: '0.5rem' }}>
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <FileText size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีใบเสนอราคา</h3>
                                    <p style={{ fontSize: '0.85rem' }}>รายการใบเสนอราคาที่เชื่อมโยงกับโปรเจกต์นี้จะแสดงที่นี่<br />การสร้างใบเสนอราคาให้เริ่มจากการกดปุ่ม <b>สร้างใบเสนอราคา</b> ในบิลวัดพื้นที่</p>
                                </div>
                            )}
                        </div>
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

            {/* Custom Confirm Modal */}
            {confirmModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.15s ease-out'
                }}
                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                >
                    <div
                        className="card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90%', maxWidth: '420px', padding: '0', overflow: 'hidden',
                            animation: 'slideUp 0.2s ease-out',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ padding: '1.75rem 1.75rem 1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: confirmModal.variant === 'danger' ? '#fef2f2' : '#eff6ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                {confirmModal.variant === 'danger' ? (
                                    <Trash2 size={22} style={{ color: '#ef4444' }} />
                                ) : (
                                    <FileText size={22} style={{ color: '#3b82f6' }} />
                                )}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
                                {confirmModal.title}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {confirmModal.message}
                            </p>
                        </div>
                        <div style={{
                            padding: '1rem 1.75rem 1.5rem',
                            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
                        }}>
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                style={{
                                    padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 500,
                                    border: '1px solid var(--border)', borderRadius: '0.5rem',
                                    background: 'white', color: 'var(--text)', cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {confirmModal.cancelText || 'ยกเลิก'}
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmModal(prev => ({ ...prev, show: false }));
                                    confirmModal.onConfirm();
                                }}
                                style={{
                                    padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 500,
                                    border: 'none', borderRadius: '0.5rem',
                                    background: confirmModal.variant === 'danger' ? '#ef4444' : 'var(--primary)',
                                    color: 'white', cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {confirmModal.confirmText || 'ยืนยัน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 3000, animation: 'slideUp 0.25s ease-out'
                }}>
                    <div style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                        color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        fontSize: '0.85rem', fontWeight: 500,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
