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
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem',
                                            borderRadius: '2rem', background: isDetailsOpen ? 'var(--primary)' : 'var(--bg-subtle)',
                                            color: isDetailsOpen ? '#fff' : 'var(--primary)', border: 'none', cursor: 'pointer',
                                            fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', marginRight: '0.5rem'
                                        }}
                                    >
                                        <FileText size={14} />
                                        {isDetailsOpen ? 'ปิดรายละเอียด' : 'ลงรายละเอียดเต็มด่วน'}
                                    </button>
                                    <button onClick={handleDuplicate} disabled={isPending} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="เพิ่มรายการในจุดเดียวกันนี้">
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="แก้ไขชื่อ">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={handleDelete} disabled={isPending} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem', opacity: isPending ? 0.5 : 1 }} title="ลบ">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Measurement Mode (Always visible on Standard View) */}
                            {!isDetailsOpen && (
                                <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>⚡ โหมดป้อนข้อมูลแบบรวดเร็ว (เฉพาะขนาดสั่งผลิต)</div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => { setCategoryId(e.target.value); setIsDirty(true); }}
                                            style={{ padding: '0.4rem 0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.85rem', maxWidth: '200px' }}
                                        >
                                            <option value="">เลือกประเภทสินค้า</option>
                                            {categories.map((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>กว้าง</span>
                                            <input
                                                type="number"
                                                value={measurementDetails.order?.width || ''}
                                                onChange={(e) => updateOrder('width', e.target.value)}
                                                placeholder="0.0"
                                                style={{ width: '70px', padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>x สูง</span>
                                            <input
                                                type="number"
                                                value={measurementDetails.order?.height || ''}
                                                onChange={(e) => updateOrder('height', e.target.value)}
                                                placeholder="0.0"
                                                style={{ width: '70px', padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>cm</span>
                                        </div>

                                        {isDirty && (
                                            <button
                                                onClick={handleQuickSave}
                                                disabled={isPending}
                                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                                            >
                                                <Check size={14} /> {isPending ? 'กำลังบันทึก...' : 'บันทึกด่วน'}
                                            </button>
                                        )}

                                        {!isDirty && (
                                            <button
                                                onClick={handleDuplicate}
                                                disabled={isPending}
                                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: '#fef2f2', color: '#ef4444', border: 'none', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, transition: 'all 0.2s' }}
                                            >
                                                <Plus size={14} /> {isPending ? 'กำลังเพิ่ม...' : 'เพิ่มรายการนี้อีกชิ้น'}
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
            {isDetailsOpen && (() => {
                const category = categories.find((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => c.id === categoryId);
                const reqs = category?.production_reqs || {};
                const showAll = !category || !category.production_reqs || Object.keys(category.production_reqs).length === 0;
                const isReq = (key: string) => showAll || !!reqs[key];

                const showFrame = isReq('frame_width') || isReq('frame_height') || isReq('frame_top_floor');
                const showCeiling = isReq('ceiling_left') || isReq('ceiling_center') || isReq('ceiling_right') || isReq('ceiling_full_width');
                const showSide = isReq('clearance_left') || isReq('clearance_right');
                const showOrder = isReq('production_width') || isReq('production_height');

                return (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                ประเภทสินค้า
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => { setCategoryId(e.target.value); setIsDirty(true); }}
                                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.95rem', minWidth: '250px', background: '#fff' }}
                            >
                                <option value="">-- ไม่ระบุประเภทสินค้า --</option>
                                {categories.map((c: { id: string; name: string; production_reqs?: Record<string, boolean> }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>

                            {/* Frame Section */}
                            {showFrame && (
                                <div className="detail-group">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
                                        <div style={{ width: 4, height: 16, background: '#3b82f6', borderRadius: 2 }}></div>
                                        วงกบ-ประตูหน้าต่าง
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                    </div>
                                </div>
                            )}

                            {/* Ceiling Section */}
                            {showCeiling && (
                                <div className="detail-group">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
                                        <div style={{ width: 4, height: 16, background: '#8b5cf6', borderRadius: 2 }}></div>
                                        กว้างสุด-สูงสุด
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                                        <input type="text" value={val} onChange={(e) => updateCeilingCenter(idx, e.target.value)} placeholder="ระยะ..." style={{ flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }} />
                                                        {idx > 0 && (
                                                            <button onClick={() => removeCeilingCenter(idx)} style={{ padding: '0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}>
                                                                <Minus size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={addCeilingCenter} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0' }}>
                                                    <Plus size={12} /> เพิ่มระยะกลาง
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
                                </div>
                            )}

                            {/* Swapped Column 3 (was Col 4) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Side Padding Section */}
                                {showSide && (
                                    <div className="detail-group">
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
                                            <div style={{ width: 4, height: 16, background: '#f59e0b', borderRadius: 2 }}></div>
                                            ระยะออกข้าง (บันทึกเพิ่มเติม)
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', paddingLeft: '28px' }}>ถ้าไม่ใส่แสดงว่าไม่ติดอะไร</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {isReq('clearance_left') && (
                                                <div className="input-group">
                                                    <label>ซ้าย</label>
                                                    <input type="text" value={measurementDetails.side?.left || ''} onChange={(e) => updateSide('left', e.target.value)} placeholder="เช่น ติดแอร์..." />
                                                </div>
                                            )}
                                            {isReq('clearance_right') && (
                                                <div className="input-group">
                                                    <label>ขวา</label>
                                                    <input type="text" value={measurementDetails.side?.right || ''} onChange={(e) => updateSide('right', e.target.value)} placeholder="เช่น ชนตู้..." />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Order Size Section */}
                                {showOrder && (
                                    <div className="detail-group">
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
                                            <div style={{ width: 4, height: 16, background: '#10b981', borderRadius: 2 }}></div>
                                            ขนาดสั่งผลิต <Check size={16} style={{ color: '#10b981', marginLeft: '4px' }} />
                                        </h4>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            {isReq('production_width') && (
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label>กว้าง (cm)</label>
                                                    <input type="number" step="0.1" value={measurementDetails.order?.width || ''} onChange={(e) => updateOrder('width', e.target.value)} placeholder="0.0" style={{ fontWeight: 600, color: '#10b981' }} />
                                                </div>
                                            )}
                                            {isReq('production_height') && (
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label>สูง (cm)</label>
                                                    <input type="number" step="0.1" value={measurementDetails.order?.height || ''} onChange={(e) => updateOrder('height', e.target.value)} placeholder="0.0" style={{ fontWeight: 600, color: '#10b981' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Swapped Column 4 (was Col 3) */}
                            <div className="detail-group">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>
                                    <div style={{ width: 4, height: 16, background: '#a855f7', borderRadius: 2 }}></div>
                                    คำนวนอัตโนมัติ
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {isReq('ceiling_gen') && (
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ค่าเพดานน้อยที่สุด (Gen)</label>
                                            <div style={{ padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                                                {computedGen || 'คำนวณอัตโนมัติ...'}
                                            </div>
                                        </div>
                                    )}

                                    <div className="input-group">
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>คำนวณความกว้างอัตโนมัติ</label>
                                        <select
                                            value={widthFormula}
                                            onChange={(e) => handleApplyWidthFormula(e.target.value)}
                                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                        >
                                            <option value="">-- เลือกสูตรคำนวณ --</option>
                                            <option value="กว้างวงกบ+5">กว้างวงกบ + 5 (ซ้าย 5 ขวา 5)</option>
                                            <option value="กว้างวงกบ+10">กว้างวงกบ + 10 (ซ้าย 10 ขวา 10)</option>
                                            <option value="กว้างวงกบ+15">กว้างวงกบ + 15 (ซ้าย 15 ขวา 15)</option>
                                            <option value="กว้างวงกบ+20">กว้างวงกบ + 20 (ซ้าย 20 ขวา 20)</option>
                                            <option value="กว้างเต็มผนัง">กว้างเต็มผนัง</option>
                                        </select>
                                        {calcMessage.width && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#d97706', background: '#fef3c7', padding: '0.5rem', borderRadius: '0.4rem', lineHeight: '1.4' }}>
                                                {calcMessage.width}
                                            </div>
                                        )}
                                    </div>

                                    <div className="input-group">
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>คำนวณความสูงอัตโนมัติ</label>
                                        <select
                                            value={heightFormula}
                                            onChange={(e) => handleApplyHeightFormula(e.target.value)}
                                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                        >
                                            <option value="">-- เลือกสูตรคำนวณ --</option>
                                            <option value="สูงขึ้น15ลง30">กว้างวงกบ + ขึ้น 15 ลง 30</option>
                                            <option value="สูงขึ้น10ลง5">กว้างวงกบ + ขึ้น 10 ลง 5</option>
                                            <option value="สูงขึ้น15ลง10">กว้างวงกบ + ขึ้น 15 ลง 10</option>
                                            <option value="สูงขึ้น20ลง10">กว้างวงกบ + ขึ้น 20 ลง 10</option>
                                            <option value="สูงขึ้น25ลง10">กว้างวงกบ + ขึ้น 25 ลง 10</option>
                                            <option value="สูงขึ้น30ลง10">กว้างวงกบ + ขึ้น 30 ลง 10</option>
                                            <option value="สูงขึ้น35ลง10">กว้างวงกบ + ขึ้น 35 ลง 10</option>
                                            <option value="สูงขึ้น15ลงพื้น">บน-พื้น + ขึ้น 15 ลงพื้น</option>
                                            <option value="สูงเพดานถึงพื้น-1">เพดานถึงพื้น - 1</option>
                                            <option value="สูงเพดานถึงพื้น-2">เพดานถึงพื้น - 2</option>
                                            <option value="สูงเพดานถึงพื้น-5">เพดานถึงพื้น - 5</option>
                                            <option value="สูงเพดานถึงวงกบล่าง+5">เพดานถึงวงกบล่าง + 5</option>
                                            <option value="สูงเพดานถึงวงกบล่าง+10">เพดานถึงวงกบล่าง + 10</option>
                                        </select>
                                        {calcMessage.height && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#d97706', background: '#fef3c7', padding: '0.5rem', borderRadius: '0.4rem', lineHeight: '1.4' }}>
                                                {calcMessage.height}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <button onClick={() => setIsDetailsOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--bg-main)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500 }}>
                                ปิด
                            </button>
                            <button onClick={handleSaveDetails} disabled={isPending} className="btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isPending ? 0.7 : 1 }}>
                                <Check size={16} />
                                {isPending ? 'กำลังบันทึก...' : 'บันทึกรายละเอียด'}
                            </button>
                        </div>
                    </div>
                );
            })()}

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
                .input-group input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </>
    );

    if (isGrouped) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {innerContent}
            </div>
        );
    }

    return (
        <div className="card item-row" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: isEditing || isDetailsOpen ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
            {innerContent}
        </div>
    );
}
