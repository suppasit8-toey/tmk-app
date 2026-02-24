'use client';

import { useState, useTransition, useRef } from 'react';
import { MapPin, Building2, ChevronDown, ChevronRight, Square, Plus, X, ArrowLeft } from 'lucide-react';
import { createMeasurementItem } from '../../actions';
import { createProjectLocation, createLocationWindow } from '../../locations-actions';
import { ProjectLocation } from '@/types/projects';

const FLOORS = ['ชั้น 1', 'ชั้น 2', 'ชั้น 3', 'ชั้น 4', 'ชั้น 5', 'ชั้นลอย', 'ชั้นดาดฟ้า', 'ชั้นใต้ดิน', 'อื่นๆ'];
const ROOMS = ['ห้องรับแขก', 'ห้องนั่งเล่น', 'ห้องนอนใหญ่', 'ห้องนอนเล็ก', 'ห้องครัว', 'ห้องทำงาน', 'ห้องน้ำ', 'ห้องอาหาร', 'ระเบียง', 'ทางเดิน', 'บันได', 'ห้องเก็บของ', 'ห้องประชุม', 'ห้องพระ', 'อื่นๆ'];
const WINDOW_NAMES = ['หน้าต่าง', 'ประตู', 'ผนังซ้าย', 'ผนังขวา', 'อื่นๆ'];

interface AddMeasurementItemModalProps {
    billId: string;
    projectId: string;
    projectLocations: ProjectLocation[];
}

export default function AddMeasurementItemModal({ billId, projectId, projectLocations }: AddMeasurementItemModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isSubmitting, startTransition] = useTransition();
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
    const [itemDetails, setItemDetails] = useState('');

    // Inline Creation State
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [newFloor, setNewFloor] = useState('ชั้น 1');
    const [customFloor, setCustomFloor] = useState('');
    const [newRoom, setNewRoom] = useState('ห้องรับแขก');
    const [customRoom, setCustomRoom] = useState('');
    const [newLocationDetails, setNewLocationDetails] = useState('');

    const [addingWindowForLocId, setAddingWindowForLocId] = useState<string | null>(null);
    const [newWindowName, setNewWindowName] = useState('หน้าต่าง');
    const [customWindowName, setCustomWindowName] = useState('');
    const [newWindowDetails, setNewWindowDetails] = useState('');

    const openModal = () => {
        setSelectedLocationId(null);
        setSelectedWindowId(null);
        setItemDetails('');
        setIsAddingLocation(false);
        setAddingWindowForLocId(null);
        dialogRef.current?.showModal();
    };
    const closeModal = () => dialogRef.current?.close();

    const toggleRoom = (id: string) => {
        setExpandedRooms(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectLocation = (locationId: string, windowId?: string) => {
        setSelectedLocationId(locationId);
        setSelectedWindowId(windowId || null);
    };

    const handleBackToList = () => {
        setSelectedLocationId(null);
        setSelectedWindowId(null);
        setItemDetails('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLocationId) return;

        const loc = projectLocations.find(l => l.id === selectedLocationId);
        if (!loc) return;

        let finalLocationName = loc.floor ? `${loc.floor}-${loc.room_name}` : loc.room_name;
        if (loc.details) finalLocationName += ` (${loc.details})`;

        if (selectedWindowId) {
            const win = loc.windows?.find((w: any) => w.id === selectedWindowId);
            if (win) {
                finalLocationName += ` - ${win.name}`;
                if (win.details) finalLocationName += ` (${win.details})`;
            }
        }

        startTransition(async () => {
            try {
                // Since user is selecting an existing location, locationData is not custom.
                // We'll pass the IDs just in case, but custom fields are empty.
                const locationData = {
                    locationId: selectedLocationId,
                    customFloor: '',
                    customRoom: '',
                    customLocationDetails: '',
                    windowId: selectedWindowId || '',
                    customWindow: '',
                    customWindowDetails: ''
                };

                await createMeasurementItem(billId, projectId, finalLocationName, itemDetails, locationData);
                closeModal();
            } catch (error) {
                console.error('Error adding measurement item:', error);
                alert('เกิดข้อผิดพลาดในการเพิ่มตำแหน่งหน้างาน');
            }
        });
    };

    const handleCreateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const floorToSave = newFloor === 'อื่นๆ' ? customFloor : newFloor;
        const roomToSave = newRoom === 'อื่นๆ' ? customRoom : newRoom;
        if (!roomToSave) return;

        startTransition(async () => {
            try {
                await createProjectLocation(projectId, floorToSave, roomToSave, newLocationDetails);
                setIsAddingLocation(false);
                setNewFloor('ชั้น 1');
                setCustomFloor('');
                setNewRoom('ห้องรับแขก');
                setCustomRoom('');
                setNewLocationDetails('');
            } catch (error) {
                console.error('Error creating location:', error);
                alert('เกิดข้อผิดพลาดในการสร้างห้อง');
            }
        });
    };

    const handleCreateWindow = async (e: React.FormEvent<HTMLFormElement>, locId: string) => {
        e.preventDefault();
        const windowNameToSave = newWindowName === 'อื่นๆ' ? customWindowName : newWindowName;
        if (!windowNameToSave) return;

        startTransition(async () => {
            try {
                await createLocationWindow(locId, projectId, windowNameToSave, newWindowDetails, []);
                setAddingWindowForLocId(null);
                setNewWindowName('หน้าต่าง');
                setCustomWindowName('');
                setNewWindowDetails('');
                setExpandedRooms(prev => new Set(prev).add(locId));
            } catch (error) {
                console.error('Error creating window:', error);
                alert('เกิดข้อผิดพลาดในการสร้างตำแหน่งย่อย');
            }
        });
    };

    const groupedByFloor = projectLocations.reduce((acc: Record<string, ProjectLocation[]>, loc) => {
        const floor = loc.floor || 'ไม่ระบุชั้น';
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(loc);
        return acc;
    }, {});

    const renderList = () => {
        if (isAddingLocation) {
            return (
                <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <button onClick={() => setIsAddingLocation(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>เพิ่มห้องใหม่</h4>
                    </div>
                    <form onSubmit={handleCreateLocation}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>ชั้น *</label>
                            <select value={newFloor} onChange={(e) => setNewFloor(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)' }}>
                                {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            {newFloor === 'อื่นๆ' && (
                                <input type="text" value={customFloor} onChange={(e) => setCustomFloor(e.target.value)} required placeholder="พิมพ์ชื่อชั้น..." style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            )}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>ชื่อห้อง *</label>
                            <select value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)' }}>
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {newRoom === 'อื่นๆ' && (
                                <input type="text" value={customRoom} onChange={(e) => setCustomRoom(e.target.value)} required placeholder="พิมพ์ชื่อห้อง..." style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            )}
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                            <input type="text" value={newLocationDetails} onChange={(e) => setNewLocationDetails(e.target.value)} placeholder="เช่น ขนาดห้อง..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" onClick={() => setIsAddingLocation(false)} disabled={isSubmitting} className="btn-secondary">
                                ยกเลิก
                            </button>
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกห้องใหม่'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        }

        if (!projectLocations || projectLocations.length === 0) {
            return (
                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <MapPin size={48} style={{ color: 'var(--border)', opacity: 0.5, marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีสารบบตำแหน่งหน้างาน</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>สร้างโครงสร้างห้องและหน้าต่างแบบรวดเร็วได้ที่นี่</p>
                    <button onClick={() => setIsAddingLocation(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> สร้างห้องใหม่
                    </button>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-0.5rem' }}>
                    <button onClick={() => setIsAddingLocation(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Plus size={14} /> เพิ่มห้องใหม่
                    </button>
                </div>
                {Object.entries(groupedByFloor).map(([floor, locs]) => (
                    <div key={floor}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Building2 size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>{floor}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {locs.map((loc) => {
                                const isExpanded = expandedRooms.has(loc.id);
                                const windows = loc.windows || [];
                                return (
                                    <div key={loc.id} style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--bg-main)', overflow: 'hidden' }}>
                                        <div onClick={() => toggleRoom(loc.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                                            {isExpanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                                            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.4rem', borderRadius: '0.4rem', display: 'flex', flexShrink: 0 }}><MapPin size={18} /></div>
                                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', flex: 1 }}>
                                                {loc.room_name} {loc.details ? `(${loc.details})` : ''}
                                            </span>


                                        </div>

                                        {isExpanded && (
                                            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-subtle)' }}>
                                                {windows.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                        {windows.map((w: any) => (
                                                            <div key={w.id} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <Square size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                                                                        {w.name} {w.details ? `(${w.details})` : ''}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleSelectLocation(loc.id, w.id)}
                                                                    className="btn-secondary"
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                                >
                                                                    <Plus size={14} /> เลือกจุดนี้
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                                        ยังไม่มีการเพิ่มตำแหน่งย่อยในห้องนี้
                                                    </div>
                                                )}

                                                {/* Inline add window form */}
                                                {addingWindowForLocId === loc.id ? (
                                                    <form onSubmit={(e) => handleCreateWindow(e, loc.id)} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        <h5 style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text)' }}>เพิ่มตำแหน่งย่อยใหม่</h5>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <select
                                                                    value={newWindowName}
                                                                    onChange={e => setNewWindowName(e.target.value)}
                                                                    style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                                                                >
                                                                    {WINDOW_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                                                                </select>
                                                                <input type="text" value={newWindowDetails} onChange={e => setNewWindowDetails(e.target.value)} placeholder="รายละเอียด (ไม่บังคับ)" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }} />
                                                            </div>
                                                            {newWindowName === 'อื่นๆ' && (
                                                                <input
                                                                    type="text"
                                                                    value={customWindowName}
                                                                    onChange={e => setCustomWindowName(e.target.value)}
                                                                    required
                                                                    placeholder="พิมพ์ชื่อตำแหน่งย่อย..."
                                                                    style={{ padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                                                                />
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button type="button" onClick={() => setAddingWindowForLocId(null)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>ยกเลิก</button>
                                                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>เพิ่ม</button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <button onClick={() => setAddingWindowForLocId(loc.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        <Plus size={14} /> เพิ่มตำแหน่งย่อย
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSelectedForm = () => {
        const loc = projectLocations.find(l => l.id === selectedLocationId);
        const win = loc?.windows?.find((w: any) => w.id === selectedWindowId);

        const locName = loc ? `${loc.floor ? loc.floor + ' - ' : ''}${loc.room_name}${loc.details ? ' (' + loc.details + ')' : ''}` : '';
        const winName = win ? `${win.name}${win.details ? ' (' + win.details + ')' : ''}` : '';

        return (
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>ตำแหน่งที่เลือก</span>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1.05rem' }}>
                                {locName}
                                {winName && <span style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>{`> ${winName}`}</span>}
                            </div>
                        </div>
                        <button type="button" onClick={handleBackToList} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                            เปลี่ยนจุดอื่น
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                        รายละเอียดสรุปเบื้องต้นสำหรับจุดตัดนี้ (ไม่บังคับ)
                    </label>
                    <textarea
                        value={itemDetails}
                        onChange={(e) => setItemDetails(e.target.value)}
                        rows={3}
                        placeholder="เช่น ม่านจีบ 2 ชั้น (ทึบ+โปร่ง), ฟิล์มเซรามิค..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.6rem 1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)',
                            borderRadius: '0.5rem', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกเป็นรายการพื้นที่ที่วัด'}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <>
            <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} />เพิ่มตำแหน่งหน้างาน
            </button>

            <dialog ref={dialogRef} className="modal" style={{ padding: 0, border: 'none', borderRadius: '0.75rem', maxWidth: '600px', width: '100%', outline: 'none', background: 'var(--bg-main)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                        {selectedLocationId ? 'สร้างรายการพื้นที่หน้างาน' : 'เลือกตำแหน่งที่ต้องการวัด'}
                    </h3>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {selectedLocationId ? renderSelectedForm() : renderList()}
                </div>
            </dialog>

            <style>{`
                dialog::backdrop {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                }
            `}</style>
        </>
    );
}
