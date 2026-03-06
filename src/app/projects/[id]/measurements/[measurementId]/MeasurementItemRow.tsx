'use client';

import { useState, useTransition } from 'react';
import { Edit2, Trash2, X, Check, ChevronDown, ChevronUp, FileText, Plus, Minus, Copy } from 'lucide-react';
import { updateMeasurementItem, deleteMeasurementItem, createMeasurementItem } from '../../actions';

interface MeasurementItemRowProps {
    item: any;
    index: number;
    projectId: string;
    categories?: any[];
    isGrouped?: boolean;
}

export default function MeasurementItemRow({ item, index, projectId, categories = [], isGrouped = false }: MeasurementItemRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [categoryId, setCategoryId] = useState<string>(item.category_id || '');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<'frame' | 'ceiling' | 'side' | 'order' | 'calc' | null>(null);
    const [locationName, setLocationName] = useState(item.location_name);
    const [details, setDetails] = useState(item.details || '');

    const [measurementDetails, setMeasurementDetails] = useState(item.measurement_details || {
        frame: { width: '', height: '', topToFloor: '' },
        ceiling: { left: '', center: [''], right: '', gen: '', fullWidth: '' },
        side: { left: '', right: '' },
        order: { width: '', height: '' }
    });

    const [widthFormula, setWidthFormula] = useState('');
    const [heightFormula, setHeightFormula] = useState('');
    const [calcMessage, setCalcMessage] = useState({ width: '', height: '' });

    const handleDelete = () => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
            startTransition(async () => {
                try {
                    await deleteMeasurementItem(item.id, projectId);
                } catch (error) {
                    console.error('Error deleting item', error);
                    alert('เกิดข้อผิดพลาดในการลบรายการ');
                }
            });
        }
    };

    const handleSaveMain = () => {
        if (!locationName.trim()) return;
        startTransition(async () => {
            try {
                await updateMeasurementItem(item.id, projectId, locationName, details, undefined, item.measurement_details, categoryId || null);
                setIsEditing(false);
            } catch (error) {
                console.error('Error updating item', error);
                alert('เกิดข้อผิดพลาดในการอัปเดตรายการ');
            }
        });
    };

    const handleQuickSave = () => {
        startTransition(async () => {
            try {
                const finalDetails = {
                    ...measurementDetails,
                    ceiling: {
                        ...measurementDetails.ceiling,
                        gen: computedGen
                    }
                };
                await updateMeasurementItem(item.id, projectId, item.location_name, item.details, undefined, finalDetails, categoryId || null);
                setMeasurementDetails(finalDetails);
                setIsDirty(false);
            } catch (error) {
                console.error('Error updating quick inputs', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลด่วน');
            }
        });
    };

    const handleDuplicate = () => {
        startTransition(async () => {
            try {
                await createMeasurementItem(
                    item.bill_id,
                    projectId,
                    item.location_name,
                    "",
                    undefined,
                    categoryId || item.category_id || null
                );
            } catch (error) {
                console.error('Error duplicating item', error);
                alert('เกิดข้อผิดพลาดในการเพิ่มรายการใหม่');
            }
        });
    };

    const computedGen = (() => {
        const ceilings = [
            measurementDetails.ceiling?.left,
            measurementDetails.ceiling?.right,
            ...(measurementDetails.ceiling?.center || [])
        ].map((v: string) => parseFloat(v)).filter((v: number) => !isNaN(v));
        return ceilings.length > 0 ? Math.min(...ceilings).toString() : '';
    })();

    const pNum = (val: string | undefined | null) => {
        const n = parseFloat(val || '');
        return isNaN(n) ? 0 : n;
    };

    const handleApplyWidthFormula = (formula: string) => {
        setWidthFormula(formula);
        if (!formula) return;

        let newWidth = '';
        let msg = '';
        const frameW = pNum(measurementDetails.frame?.width);
        const fullW = pNum(measurementDetails.ceiling?.fullWidth);
        const cLeftStr = measurementDetails.side?.left || '';
        const cRightStr = measurementDetails.side?.right || '';

        const hasClearanceWarnings = cLeftStr || cRightStr;
        const warningText = hasClearanceWarnings ? ` (ระวังระยะติด: ${cLeftStr ? 'ซ้าย ' + cLeftStr : ''} ${cRightStr ? 'ขวา ' + cRightStr : ''})` : '';

        if (formula.startsWith('กว้างวงกบ+')) {
            const offset = parseInt(formula.replace('กว้างวงกบ+', ''), 10);
            if (frameW > 0) {
                newWidth = (frameW + (offset * 2)).toString();
                msg = `สูตร: กว้างวงกบ + ข้างละ ${offset}cm${warningText}`;
            } else {
                msg = 'กรุณาระบุความกว้างวงกบก่อนคำนวณ';
            }
        } else if (formula === 'กว้างเต็มผนัง') {
            if (fullW > 0) {
                newWidth = fullW.toString();
                msg = `สูตร: กว้างเต็มผนัง (ใช้ระยะกว้างเต็ม)${warningText}`;
            } else if (frameW > 0) {
                const matchL = cLeftStr.match(/\d+/);
                const matchR = cRightStr.match(/\d+/);
                const numL = matchL ? parseInt(matchL[0], 10) : 0;
                const numR = matchR ? parseInt(matchR[0], 10) : 0;
                newWidth = (frameW + numL + numR).toString();
                msg = `สูตร: กว้างเต็มผนัง (ใช้วงกบ + ซ้าย ${numL} + ขวา ${numR})${warningText}`;
            } else {
                msg = 'กรุณาระบุความกว้างวงกบ หรือ กว้างเต็มผนังก่อนคำนวณ';
            }
        }

        if (newWidth) {
            updateOrder('width', newWidth);
        }
        setCalcMessage(prev => ({ ...prev, width: msg }));
    };

    const handleApplyHeightFormula = (formula: string) => {
        setHeightFormula(formula);
        if (!formula) return;

        let newHeight = '';
        let msg = '';

        const frameH = pNum(measurementDetails.frame?.height);
        const topFloor = pNum(measurementDetails.frame?.topToFloor);
        const cGen = pNum(computedGen);

        if (formula.startsWith('สูงขึ้น') && formula.includes('ลง') && !formula.includes('ลงพื้น')) {
            const parts = formula.match(/สูงขึ้น(\d+)ลง(\d+)/);
            if (parts && frameH > 0) {
                const up = parseInt(parts[1], 10);
                const down = parseInt(parts[2], 10);
                newHeight = (frameH + up + down).toString();

                if (topFloor > 0) {
                    const floatCm = topFloor - frameH - down;
                    let floatText = `ลอยพื้น ${floatCm} cm`;
                    if (floatCm < 0) {
                        floatText = `กองพื้น ${Math.abs(floatCm)} cm`;
                    } else if (floatCm === 0) {
                        floatText = `พอดีพื้น`;
                    }
                    msg = `สูตร: วงกบ + ขึ้น ${up} ลง ${down} (${floatText})`;
                } else {
                    msg = `สูตร: วงกบ + ขึ้น ${up} ลง ${down} (ไม่สามารถคำนวณระยะลอยได้เนื่องจากไม่มีระยะ บน-พื้น)`;
                }
            } else {
                msg = 'กรุณาระบุความสูงวงกบก่อนคำนวณ';
            }
        } else if (formula === 'สูงขึ้น15ลงพื้น') {
            const up = 15;
            if (topFloor > 0) {
                newHeight = (topFloor + up).toString();
                msg = `สูตร: บน-พื้น + ขึ้น ${up} (แนะนำทำลอยพื้น 1-2 cm)`;
            } else {
                msg = 'กรุณาระบุระยะ บน-พื้น ก่อนคำนวณ';
            }
        } else if (formula.startsWith('สูงเพดานถึงพื้น-')) {
            const minus = parseInt(formula.replace('สูงเพดานถึงพื้น-', ''), 10);
            if (cGen > 0) {
                newHeight = (cGen - minus).toString();
                msg = `สูตร: ค่าเพดานน้อยที่สุด (Gen) - ${minus}`;
            } else {
                msg = 'กรุณาระบุระยะเพดานก่อนคำนวณ';
            }
        } else if (formula.startsWith('สูงเพดานถึงวงกบล่าง+')) {
            const plus = parseInt(formula.replace('สูงเพดานถึงวงกบล่าง+', ''), 10);
            if (cGen > 0 && topFloor > 0 && frameH > 0) {
                newHeight = (cGen - (topFloor - frameH) + plus).toString();
                msg = `สูตร: เพดานถึงวงกบล่าง + ${plus}`;
            } else {
                msg = 'กรุณาระบุ ระยะเพดาน, บน-พื้น และ ความสูงวงกบให้ครบถ้วนก่อนคำนวณ';
            }
        }

        if (newHeight) {
            updateOrder('height', newHeight);
        }
        setCalcMessage(prev => ({ ...prev, height: msg }));
    };

    const handleSaveDetails = () => {
        const finalDetails = {
            ...measurementDetails,
            ceiling: {
                ...measurementDetails.ceiling,
                gen: computedGen
            }
        };

        startTransition(async () => {
            try {
                await updateMeasurementItem(item.id, projectId, item.location_name, item.details, undefined, finalDetails, categoryId || null);
                setMeasurementDetails(finalDetails);
                setIsDetailsOpen(false);
            } catch (error) {
                console.error('Error updating details', error);
                alert('เกิดข้อผิดพลาดในการบันทึกรายละเอียด');
            }
        });
    };

    const handleCancelMain = () => {
        setLocationName(item.location_name);
        setDetails(item.details || '');
        setCategoryId(item.category_id || '');
        setIsDirty(false);
        setIsEditing(false);
    };

    // Helper functions to update nested state
    const updateFrame = (field: string, value: string) => {
        setMeasurementDetails({ ...measurementDetails, frame: { ...measurementDetails.frame, [field]: value } });
        setIsDirty(true);
    };

    const updateCeiling = (field: string, value: string) => {
        setMeasurementDetails({ ...measurementDetails, ceiling: { ...measurementDetails.ceiling, [field]: value } });
        setIsDirty(true);
    };

    const updateSide = (field: string, value: string) => {
        setMeasurementDetails({ ...measurementDetails, side: { ...measurementDetails.side, [field]: value } });
        setIsDirty(true);
    };

    const updateOrder = (field: string, value: string) => {
        setMeasurementDetails({ ...measurementDetails, order: { ...measurementDetails.order, [field]: value } });
        setIsDirty(true);
    };

    const updateCeilingCenter = (index: number, value: string) => {
        const newCenter = [...measurementDetails.ceiling.center];
        newCenter[index] = value;
        setMeasurementDetails({ ...measurementDetails, ceiling: { ...measurementDetails.ceiling, center: newCenter } });
        setIsDirty(true);
    };

    const addCeilingCenter = () => {
        setMeasurementDetails({
            ...measurementDetails,
            ceiling: { ...measurementDetails.ceiling, center: [...measurementDetails.ceiling.center, ''] }
        });
        setIsDirty(true);
    };

    const removeCeilingCenter = (index: number) => {
        const newCenter = measurementDetails.ceiling.center.filter((_: any, i: number) => i !== index);
        setMeasurementDetails({
            ...measurementDetails,
            ceiling: { ...measurementDetails.ceiling, center: newCenter }
        });
        setIsDirty(true);
    };

    // Production requirements logic
    const category = categories.find((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => c.id === categoryId);
    const reqs = category?.production_reqs || {};

    // User requested to show all fields and tabs regardless of category selection for now
    const showAll = true; // !category || !category.production_reqs || Object.keys(category.production_reqs).length === 0;

    const isReq = (key: string) => showAll || !!reqs[key];

    const showFrame = isReq('frame_width') || isReq('frame_height') || isReq('frame_top_floor');
    const showCeiling = isReq('ceiling_left') || isReq('ceiling_center') || isReq('ceiling_right') || isReq('ceiling_full_width');
    const showSide = isReq('clearance_left') || isReq('clearance_right');
    const showOrder = isReq('production_width') || isReq('production_height');

    const innerContent = (
        <>
            {/* Top Row - Main Info */}
            <div style={{ padding: isGrouped ? '0' : '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', position: 'relative', background: isEditing ? 'var(--bg-subtle)' : 'transparent' }}>
                {!isGrouped && (
                    <div style={{ background: isEditing ? 'var(--primary)' : 'var(--bg-subtle)', color: isEditing ? '#fff' : 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.1rem', flexShrink: 0, transition: 'all 0.2s' }}>
                        {index + 1}
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="ชื่อตำแหน่ง..."
                                    autoFocus
                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="รายละเอียด (ไม่บังคับ)..."
                                    rows={2}
                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    ประเภทสินค้า
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 500, color: categoryId ? 'var(--text)' : 'var(--text-muted)' }}
                                >
                                    <option value="">-- ไม่ระบุประเภทสินค้า --</option>
                                    {categories.map((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button onClick={handleCancelMain} disabled={isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'var(--bg-main)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <X size={14} /> ยกเลิก
                                </button>
                                <button onClick={handleSaveMain} disabled={isPending || !locationName.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.85rem', opacity: isPending ? 0.7 : 1 }}>
                                    <Check size={14} /> {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    {item.category_id && categories.find(c => c.id === item.category_id) && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                {categories.find(c => c.id === item.category_id)?.name}
                                            </div>
                                            {(measurementDetails.order?.width || measurementDetails.order?.height) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>ขนาดสั่งผลิต:</span>
                                                    <span style={{ color: '#10b981' }}>{measurementDetails.order?.width || '-'} x {measurementDetails.order?.height || '-'} cm</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{item.location_name}</h3>
                                </div>
                                <div className="item-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                                            borderRadius: '2rem', background: isDetailsOpen ? 'var(--primary)' : 'var(--bg-subtle)',
                                            color: isDetailsOpen ? '#fff' : 'var(--primary)', border: 'none', cursor: 'pointer',
                                            fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', marginRight: '0.5rem',
                                            minHeight: '44px'
                                        }}
                                    >
                                        <FileText size={18} />
                                        {isDetailsOpen ? 'ปิดรายละเอียด' : 'ลงรายละเอียดเต็มด่วน'}
                                    </button>
                                    <button onClick={handleDuplicate} disabled={isPending} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="เพิ่มรายการในจุดเดียวกันนี้">
                                        <Copy size={20} />
                                    </button>
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="แก้ไขชื่อ">
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={handleDelete} disabled={isPending} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', opacity: isPending ? 0.5 : 1, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="ลบ">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Measurement Mode (Always visible on Standard View) */}
                            {!isDetailsOpen && (
                                <div style={{ marginTop: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>⚡ โหมดป้อนข้อมูลแบบรวดเร็ว (เฉพาะขนาดสั่งผลิต)</div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => { setCategoryId(e.target.value); setIsDirty(true); }}
                                            style={{ padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', maxWidth: '220px', minHeight: '44px' }}
                                        >
                                            <option value="">เลือกประเภทสินค้า</option>
                                            {categories.map((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>กว้าง</span>
                                            <input
                                                type="number"
                                                value={measurementDetails.order?.width || ''}
                                                onChange={(e) => updateOrder('width', e.target.value)}
                                                placeholder="0.0"
                                                style={{ width: '90px', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.95rem', fontWeight: 600, color: '#10b981', minHeight: '44px' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>x สูง</span>
                                            <input
                                                type="number"
                                                value={measurementDetails.order?.height || ''}
                                                onChange={(e) => updateOrder('height', e.target.value)}
                                                placeholder="0.0"
                                                style={{ width: '90px', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.95rem', fontWeight: 600, color: '#10b981', minHeight: '44px' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>cm</span>
                                        </div>

                                        {isDirty && (
                                            <button
                                                onClick={handleQuickSave}
                                                disabled={isPending}
                                                style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, minHeight: '44px' }}
                                            >
                                                <Check size={18} /> {isPending ? 'กำลังบันทึก...' : 'บันทึกด่วน'}
                                            </button>
                                        )}

                                        {!isDirty && (
                                            <button
                                                onClick={handleDuplicate}
                                                disabled={isPending}
                                                style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', background: '#fef2f2', color: '#ef4444', border: 'none', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, transition: 'all 0.2s', minHeight: '44px' }}
                                            >
                                                <Plus size={18} /> {isPending ? 'กำลังเพิ่ม...' : 'เพิ่มรายการนี้อีกชิ้น'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                {item.details ? (
                                    item.details
                                ) : (
                                    <span style={{ fontStyle: 'italic', opacity: 0.7 }}>ไม่มีรายละเอียดเพิ่มเติมสถานที่</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Details Flyout Section */}
            {isDetailsOpen && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
                    {(() => {
                        const availableTabs = [];

                        availableTabs.push({ id: 'category', label: 'ประเภทสินค้า', color: '#6366f1' });


                        let frameLabel = 'วงกบ-ประตูหน้าต่าง';
                        if (showFrame && showSide) frameLabel = 'วงกบ-หน้าต่าง / ออกข้าง';
                        else if (!showFrame && showSide) frameLabel = 'ระยะออกข้าง';

                        if (showFrame || showSide) availableTabs.push({ id: 'frame', label: frameLabel, color: '#3b82f6' });
                        if (showCeiling) availableTabs.push({ id: 'ceiling', label: 'กว้างสุด-สูงสุด', color: '#8b5cf6' });
                        if (showOrder) availableTabs.push({ id: 'order', label: 'ขนาดสั่งผลิต', color: '#10b981' });
                        availableTabs.push({ id: 'calc', label: 'คำนวณอัตโนมัติ', color: '#a855f7' });

                        const currentTab = (activeTab && availableTabs.some(t => t.id === activeTab)) ? activeTab : availableTabs[0]?.id;

                        return (
                            <div>
                                {/* Tab Navigation */}
                                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', gap: '0.25rem', WebkitOverflowScrolling: 'touch' }}>
                                    {availableTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            style={{
                                                padding: '0.75rem 1.25rem',
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: currentTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                                                color: currentTab === tab.id ? tab.color : 'var(--text-muted)',
                                                fontWeight: currentTab === tab.id ? 600 : 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s',
                                                minHeight: '48px',
                                                fontSize: '0.9rem'
                                            }}
                                            className="hover-effect"
                                        >
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: currentTab === tab.id ? tab.color : 'var(--border)' }}></div>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Area */}
                                <div style={{ padding: '0.5rem 0.5rem 1rem 0.5rem', minHeight: '180px' }}>

                                    {/* Category Tab Content */}
                                    {currentTab === 'category' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', margin: '0 0.5rem', paddingTop: '0.5rem' }}>
                                            <div className="input-group">
                                                <label>ประเภทสินค้า</label>
                                                <select
                                                    value={categoryId}
                                                    onChange={(e) => { setCategoryId(e.target.value); setIsDirty(true); }}
                                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem', cursor: 'pointer' }}
                                                >
                                                    <option value="">-- ไม่ระบุประเภทสินค้า --</option>
                                                    {categories.map((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                                    * เลือกประเภทสินค้าเพื่อแสดงช่องระบุขนาดที่เกี่ยวข้อง
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Frame & Side Tab Content */}
                                    {currentTab === 'frame' && (showFrame || showSide) && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                                {isReq('frame_width') && (
                                                    <div className="input-group">
                                                        <label>กว้าง (cm)</label>
                                                        <input type="number" step="0.1" value={measurementDetails.frame?.width || ''} onChange={(e) => updateFrame('width', e.target.value)} placeholder="0.0" />
                                                    </div>
                                                )}
                                                {isReq('frame_height') && (
                                                    <div className="input-group">
                                                        <label>สูง (cm)</label>
                                                        <input type="number" step="0.1" value={measurementDetails.frame?.height || ''} onChange={(e) => updateFrame('height', e.target.value)} placeholder="0.0" />
                                                    </div>
                                                )}
                                                {isReq('frame_top_floor') && (
                                                    <div className="input-group">
                                                        <label>บน-พื้น (cm)</label>
                                                        <input type="number" step="0.1" value={measurementDetails.frame?.topToFloor || ''} onChange={(e) => updateFrame('topToFloor', e.target.value)} placeholder="0.0" />
                                                    </div>
                                                )}
                                                {isReq('clearance_left') && (
                                                    <div className="input-group" style={{ borderLeft: '2px solid #fdf6e3', paddingLeft: '1rem' }}>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>ถ้าไม่ใส่แสดงว่าไม่ติดอะไร</p>
                                                        <label style={{ color: '#d97706' }}>ระยะซ้าย</label>
                                                        <input type="text" value={measurementDetails.side?.left || ''} onChange={(e) => updateSide('left', e.target.value)} placeholder="เช่น ติดแอร์..." />
                                                    </div>
                                                )}
                                                {isReq('clearance_right') && (
                                                    <div className="input-group" style={{ borderLeft: '2px solid #fdf6e3', paddingLeft: '1rem' }}>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>ถ้าไม่ใส่แสดงว่าไม่ติดอะไร</p>
                                                        <label style={{ color: '#d97706' }}>ระยะขวา</label>
                                                        <input type="text" value={measurementDetails.side?.right || ''} onChange={(e) => updateSide('right', e.target.value)} placeholder="เช่น ชนตู้..." />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Embedded Simulate Content */}
                                            <div style={{ width: '100%', maxWidth: '600px', margin: '2rem auto 0 auto' }}>
                                                {(() => {
                                                    const w = parseFloat(measurementDetails.frame?.width || '0');
                                                    const h = parseFloat(measurementDetails.frame?.height || '0');
                                                    const t2f = parseFloat(measurementDetails.frame?.topToFloor || '0');

                                                    const dLeft = measurementDetails.side?.left || '';
                                                    const dRight = measurementDetails.side?.right || '';

                                                    // Proportion math
                                                    const maxDim = Math.max(w, h, 200, t2f > h ? t2f : h); // ensure container scale
                                                    const scale = maxDim > 0 ? 150 / maxDim : 1;

                                                    // pixel dimensions
                                                    const pxW = w * scale;
                                                    const pxH = h * scale;
                                                    const pxT2F = t2f * scale;
                                                    const pxBottomToFloor = Math.max(0, pxT2F - pxH);

                                                    return (
                                                        <div style={{ background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minHeight: '300px', position: 'relative', overflow: 'hidden' }}>
                                                            <h4 style={{ position: 'absolute', top: '1rem', left: '1rem', margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> จำลองระยะสเกลจริง
                                                            </h4>

                                                            <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%', justifyContent: 'center', height: '100%', paddingBottom: '10px' }}>

                                                                {/* Window Frame Box */}
                                                                {w > 0 && h > 0 ? (
                                                                    <div style={{ position: 'relative', marginBottom: `${pxBottomToFloor}px` }}> {/* Push up considering distance from bottom to floor */}

                                                                        {/* Left Clearance Indicator */}
                                                                        {dLeft && (
                                                                            <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
                                                                                <span style={{ fontSize: '0.65rem', color: '#d97706', whiteSpace: 'nowrap', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{dLeft}</span>
                                                                                <div style={{ height: '1px', width: '20px', background: '#d97706', marginLeft: '4px' }}></div>
                                                                            </div>
                                                                        )}

                                                                        {/* The Window Itself */}
                                                                        <div style={{
                                                                            width: `${pxW}px`,
                                                                            height: `${pxH}px`,
                                                                            border: '4px solid #475569',
                                                                            borderRadius: '2px',
                                                                            background: 'linear-gradient(135deg, rgba(224,242,254,0.8) 0%, rgba(186,230,253,0.9) 100%)',
                                                                            position: 'relative',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 2px 4px rgba(255,255,255,0.5)'
                                                                        }}>
                                                                            {/* Inner panes (cross bars) */}
                                                                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', background: 'rgba(71,85,105,0.8)', transform: 'translateX(-50%)' }}></div>
                                                                            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '2px', background: 'rgba(71,85,105,0.8)', transform: 'translateY(-50%)' }}></div>

                                                                            {/* Gloss effect */}
                                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', bottom: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)' }}></div>

                                                                            <div style={{ background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: '4px', zIndex: 10, border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                                <span style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 600 }}>{w}x{h}</span>
                                                                            </div>

                                                                            {/* Top-To-Floor Indicator */}
                                                                            {t2f > 0 && (
                                                                                <div style={{ position: 'absolute', top: '-4px', left: '100%', marginLeft: '12px', height: `${Math.max(pxT2F, pxH)}px`, width: '1px', borderLeft: '1px dashed #64748b', display: 'flex', alignItems: 'center', zIndex: 0 }}>
                                                                                    {/* Top tick */}
                                                                                    <div style={{ position: 'absolute', top: 0, left: '-5px', width: '10px', height: '1px', background: '#64748b' }}></div>
                                                                                    {/* Label */}
                                                                                    <span style={{ fontSize: '0.65rem', color: '#475569', background: '#f8fafc', padding: '2px 6px', whiteSpace: 'nowrap', borderRadius: '4px', marginLeft: '10px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>บน-พื้น: {t2f}</span>
                                                                                    {/* Bottom tick */}
                                                                                    <div style={{ position: 'absolute', bottom: 0, left: '-5px', width: '10px', height: '1px', background: '#64748b' }}></div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Right Clearance Indicator */}
                                                                        {dRight && (
                                                                            <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                                                                                <div style={{ height: '1px', width: '20px', background: '#d97706', marginRight: '4px' }}></div>
                                                                                <span style={{ fontSize: '0.65rem', color: '#d97706', whiteSpace: 'nowrap', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{dRight}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6, paddingBottom: '2rem' }}>
                                                                        <div style={{ width: '80px', height: '60px', border: '2px dashed #94a3b8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', background: '#e2e8f0' }}>
                                                                            <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>🖼️</span>
                                                                        </div>
                                                                        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>ระบุกว้าง/สูง เพื่อดูภาพจำลอง</span>
                                                                    </div>
                                                                )}

                                                                {/* Floor Line */}
                                                                <div style={{ position: 'absolute', bottom: '0', left: '2%', right: '2%', height: '10px', background: 'linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)', borderTop: '2px solid #94a3b8', borderRadius: '2px 2px 0 0' }}></div>
                                                                <div style={{ position: 'absolute', bottom: '10px', left: '2%', right: '2%', height: '4px', background: 'rgba(0,0,0,0.15)', filter: 'blur(2px)' }}></div> {/* Floor shadow */}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </>
                                    )}

                                    {/* Ceiling Tab Content */}
                                    {currentTab === 'ceiling' && showCeiling && (
                                        <div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                                {isReq('ceiling_left') && (
                                                    <div className="input-group">
                                                        <label>เพดานซ้าย</label>
                                                        <input type="text" value={measurementDetails.ceiling?.left || ''} onChange={(e) => updateCeiling('left', e.target.value)} placeholder="ระยะ..." />
                                                    </div>
                                                )}
                                                {isReq('ceiling_center') && (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>เพดานกลาง</label>
                                                        {measurementDetails.ceiling?.center?.map((val: string, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <input type="text" value={val} onChange={(e) => updateCeilingCenter(idx, e.target.value)} placeholder="ระยะ..." style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                                                                {idx > 0 && (
                                                                    <button onClick={() => removeCeilingCenter(idx)} style={{ padding: '0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
                                                                        <Minus size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button onClick={addCeilingCenter} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0' }}>
                                                            <Plus size={14} /> เพิ่มระยะกลาง
                                                        </button>
                                                    </div>
                                                )}
                                                {isReq('ceiling_right') && (
                                                    <div className="input-group">
                                                        <label>เพดานขวา</label>
                                                        <input type="text" value={measurementDetails.ceiling?.right || ''} onChange={(e) => updateCeiling('right', e.target.value)} placeholder="ระยะ..." />
                                                    </div>
                                                )}
                                                {isReq('ceiling_full_width') && (
                                                    <div className="input-group">
                                                        <label>กว้างเต็ม (cm)</label>
                                                        <input type="number" step="0.1" value={measurementDetails.ceiling?.fullWidth || ''} onChange={(e) => updateCeiling('fullWidth', e.target.value)} placeholder="0.0" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Simulator below */}
                                            <div style={{ width: '100%', maxWidth: '600px', margin: '1.5rem auto 0 auto' }}>
                                                {(() => {
                                                    const cLeft = parseFloat(measurementDetails.ceiling?.left || '0');
                                                    const cRight = parseFloat(measurementDetails.ceiling?.right || '0');
                                                    const cFullWidth = parseFloat(measurementDetails.ceiling?.fullWidth || '0');
                                                    const centerVals = (measurementDetails.ceiling?.center || []).map((v: string) => parseFloat(v || '0'));

                                                    const allPoints: { label: string; value: number; color: string; bg: string; textColor: string }[] = [];
                                                    if (cLeft > 0) allPoints.push({ label: 'ซ้าย', value: cLeft, color: '#3b82f6', bg: 'linear-gradient(to top, #dbeafe, #bfdbfe)', textColor: '#1e40af' });
                                                    centerVals.forEach((val: number, idx: number) => {
                                                        if (val > 0) {
                                                            const centerColors = [
                                                                { color: '#f59e0b', bg: 'linear-gradient(to top, #fef3c7, #fde68a)', textColor: '#92400e' },
                                                                { color: '#10b981', bg: 'linear-gradient(to top, #d1fae5, #a7f3d0)', textColor: '#065f46' },
                                                                { color: '#ec4899', bg: 'linear-gradient(to top, #fce7f3, #fbcfe8)', textColor: '#9d174d' },
                                                                { color: '#8b5cf6', bg: 'linear-gradient(to top, #e0e7ff, #c7d2fe)', textColor: '#3730a3' },
                                                            ];
                                                            const c = centerColors[idx % centerColors.length];
                                                            allPoints.push({ label: centerVals.length > 1 ? `กลาง ${idx + 1}` : 'กลาง', value: val, ...c });
                                                        }
                                                    });
                                                    if (cRight > 0) allPoints.push({ label: 'ขวา', value: cRight, color: '#e91e63', bg: 'linear-gradient(to top, #fce4ec, #f8bbd0)', textColor: '#ad1457' });

                                                    const hasAnyValue = allPoints.length > 0 || cFullWidth > 0;
                                                    const maxHeight = Math.max(...allPoints.map(p => p.value), 1);
                                                    const minHeight = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.value)) : 0;

                                                    const maxPx = 160;
                                                    const heightScale = maxPx / maxHeight;

                                                    const barWidth = Math.max(40, Math.min(60, 300 / Math.max(allPoints.length, 1)));
                                                    const barGap = Math.max(12, Math.min(24, 120 / Math.max(allPoints.length, 1)));

                                                    return (
                                                        <div style={{ background: 'linear-gradient(to bottom, #f8fafc, #ede9fe)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #c4b5fd', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '240px', position: 'relative', overflow: 'hidden' }}>
                                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <div style={{ width: 7, height: 7, background: '#8b5cf6', borderRadius: '50%' }}></div> จำลองระยะสูง (เพดาน-พื้น)
                                                            </h4>

                                                            {hasAnyValue ? (
                                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                    {allPoints.length > 0 && (
                                                                        <div style={{ position: 'relative', width: '100%' }}>
                                                                            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', borderTop: '3px solid #64748b', zIndex: 2 }}>
                                                                                <span style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#475569', fontWeight: 600, background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>เพดาน ▼</span>
                                                                            </div>

                                                                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: `${maxPx + 16}px`, paddingTop: '16px', paddingLeft: '8%', paddingRight: '8%' }}>
                                                                                {allPoints.map((point, idx) => (
                                                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                                                                        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: '3px', border: `1px solid ${point.color}`, marginBottom: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', zIndex: 3 }}>
                                                                                            <span style={{ fontSize: '0.7rem', color: point.textColor, fontWeight: 700 }}>{point.value}</span>
                                                                                        </div>
                                                                                        <div style={{
                                                                                            width: `${barWidth}px`,
                                                                                            height: `${point.value * heightScale}px`,
                                                                                            background: point.bg,
                                                                                            border: `2px solid ${point.color}`,
                                                                                            borderRadius: '4px 4px 0 0',
                                                                                            position: 'relative',
                                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                            boxShadow: `0 2px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)`,
                                                                                            transition: 'height 0.3s ease'
                                                                                        }}>
                                                                                            <div style={{ position: 'absolute', left: '50%', top: '4px', bottom: '4px', width: '1px', borderLeft: '1px dashed rgba(0,0,0,0.15)' }}></div>
                                                                                        </div>
                                                                                        <span style={{ fontSize: '0.65rem', color: point.textColor, fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap' }}>{point.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            <div style={{ marginLeft: '5%', marginRight: '5%', height: '8px', background: 'linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)', borderTop: '2px solid #94a3b8', borderRadius: '0 0 2px 2px' }}></div>
                                                                        </div>
                                                                    )}

                                                                    {cFullWidth > 0 && (
                                                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', width: '85%' }}>
                                                                            <div style={{ width: '1px', height: '8px', background: '#8b5cf6' }}></div>
                                                                            <div style={{ flex: 1, height: '1px', background: '#8b5cf6' }}></div>
                                                                            <span style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 600, background: '#ede9fe', padding: '1px 6px', borderRadius: '3px', border: '1px solid #c4b5fd', margin: '0 4px', whiteSpace: 'nowrap' }}>
                                                                                กว้างเต็ม: {cFullWidth} cm
                                                                            </span>
                                                                            <div style={{ flex: 1, height: '1px', background: '#8b5cf6' }}></div>
                                                                            <div style={{ width: '1px', height: '8px', background: '#8b5cf6' }}></div>
                                                                        </div>
                                                                    )}

                                                                    {allPoints.length > 1 && (
                                                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                                            <span style={{ fontSize: '0.65rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #a7f3d0' }}>
                                                                                ค่าน้อยสุด (Gen): {minHeight.toFixed(1)} cm
                                                                            </span>
                                                                            {maxHeight !== minHeight && (
                                                                                <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                                                                                    ต่างกัน: {(maxHeight - minHeight).toFixed(1)} cm
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.6, padding: '2rem 0' }}>
                                                                    <div style={{ width: '60px', height: '45px', border: '2px dashed #a78bfa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', background: '#ede9fe' }}>
                                                                        <span style={{ fontSize: '1rem', opacity: 0.8 }}>📏</span>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 500 }}>ระบุระยะเพดาน เพื่อดูภาพจำลอง</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Size Content */}
                                    {currentTab === 'order' && showOrder && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                            {isReq('production_width') && (
                                                <div className="input-group">
                                                    <label style={{ color: '#047857' }}>กว้าง (cm)</label>
                                                    <input type="number" step="0.1" value={measurementDetails.order?.width || ''} onChange={(e) => updateOrder('width', e.target.value)} placeholder="0.0" style={{ fontWeight: 600, color: '#047857', borderColor: '#a7f3d0', background: '#f0fdf4' }} />
                                                </div>
                                            )}
                                            {isReq('production_height') && (
                                                <div className="input-group">
                                                    <label style={{ color: '#047857' }}>สูง (cm)</label>
                                                    <input type="number" step="0.1" value={measurementDetails.order?.height || ''} onChange={(e) => updateOrder('height', e.target.value)} placeholder="0.0" style={{ fontWeight: 600, color: '#047857', borderColor: '#a7f3d0', background: '#f0fdf4' }} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Auto Calculate Content */}
                                    {currentTab === 'calc' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            {isReq('ceiling_gen') && (
                                                <div className="input-group">
                                                    <label>เพดานน้อยสุด (Gen)</label>
                                                    <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                                        {computedGen || '-'}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="input-group">
                                                <label>สูตรความกว้าง</label>
                                                <select
                                                    value={widthFormula}
                                                    onChange={(e) => handleApplyWidthFormula(e.target.value)}
                                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                                >
                                                    <option value="">-- กว้างอัตโนมัติ --</option>
                                                    <option value="กว้างวงกบ+5">กว้างวงกบ + 5</option>
                                                    <option value="กว้างวงกบ+10">กว้างวงกบ + 10</option>
                                                    <option value="กว้างวงกบ+15">กว้างวงกบ + 15</option>
                                                    <option value="กว้างวงกบ+20">กว้างวงกบ + 20</option>
                                                    <option value="กว้างเต็มผนัง">กว้างเต็มผนัง</option>
                                                </select>
                                                {calcMessage.width && (
                                                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#d97706', lineHeight: '1.2' }}>{calcMessage.width}</div>
                                                )}
                                            </div>

                                            <div className="input-group">
                                                <label>สูตรความสูง</label>
                                                <select
                                                    value={heightFormula}
                                                    onChange={(e) => handleApplyHeightFormula(e.target.value)}
                                                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                                >
                                                    <option value="">-- สูงอัตโนมัติ --</option>
                                                    <option value="สูงขึ้น15ลง30">ขึ้น 15 ลง 30</option>
                                                    <option value="สูงขึ้น10ลง5">ขึ้น 10 ลง 5</option>
                                                    <option value="สูงขึ้น15ลง10">ขึ้น 15 ลง 10</option>
                                                    <option value="สูงขึ้น20ลง10">ขึ้น 20 ลง 10</option>
                                                    <option value="สูงขึ้น30ลง10">ขึ้น 30 ลง 10</option>
                                                    <option value="สูงขึ้น15ลงพื้น">บน-พื้น+ขึ้น 15 ลงพื้น</option>
                                                    <option value="สูงเพดานถึงพื้น-1">เพดานพื้น - 1</option>
                                                </select>
                                                {calcMessage.height && (
                                                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#d97706', lineHeight: '1.2' }}>{calcMessage.height}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                        <button onClick={() => setIsDetailsOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--bg-main)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500 }}>
                            ปิด
                        </button>
                        <button onClick={handleSaveDetails} disabled={isPending} className="btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isPending ? 0.7 : 1 }}>
                            <Check size={16} />
                            {isPending ? 'กำลังบันทึก...' : 'บันทึกรายละเอียด'}
                        </button>
                    </div>
                </div>
            )
            }

            <style>{`
                .item-row .item-actions button:not(:first-child) {
                    opacity: 0.4;
                    transition: opacity 0.2s;
                }
                .item-row:hover .item-actions button:not(:first-child) {
                    opacity: 1;
                }
                .item-row .item-actions button:hover:not(:first-child) {
                    color: var(--primary);
                }
                .detail-group {
                    background: #fff;
                    padding: 1.25rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .detail-group.compact {
                    padding: 1rem;
                    min-width: 200px;
                    flex: 1;
                }
                .input-group label {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-bottom: 0.4rem;
                    font-weight: 500;
                }
                .input-group input {
                    width: 100%;
                    padding: 0.6rem 0.75rem;
                    border-radius: 0.4rem;
                    border: 1px solid var(--border);
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-group-compact label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-bottom: 0.3rem;
                    font-weight: 500;
                }
                .input-group-compact input {
                    width: 100%;
                    padding: 0.4rem 0.5rem;
                    border-radius: 0.3rem;
                    border: 1px solid var(--border);
                    font-size: 0.85rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-group input:focus, .input-group-compact input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
                /* Custom Scrollbar for horizontal scrolling area */
                div::-webkit-scrollbar {
                    height: 6px;
                }
                div::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card item-row" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: isEditing || isDetailsOpen ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                {innerContent}
            </div>
        </div>
    );
}
