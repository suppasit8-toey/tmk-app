'use client';

import { useState, useTransition, useRef } from 'react';
import { ProjectLocation, LocationWindow } from '@/types/projects';
import { MapPin, Plus, Trash2, X, FileText, Building2, ChevronDown, ChevronRight, Square, Camera, Image as ImageIcon } from 'lucide-react';
import { createProjectLocation, deleteProjectLocation, createLocationWindow, deleteLocationWindow } from './locations-actions';
import { cloudinaryConfig } from '@/lib/cloudinary';

interface ProjectLocationsTabProps {
    projectId: string;
    locations: ProjectLocation[];
}

const FLOORS = [
    'ชั้น 1', 'ชั้น 2', 'ชั้น 3', 'ชั้น 4', 'ชั้น 5',
    'ชั้นลอย', 'ชั้นดาดฟ้า', 'ชั้นใต้ดิน', 'อื่นๆ'
];

const ROOMS = [
    'ห้องรับแขก', 'ห้องนั่งเล่น', 'ห้องนอนใหญ่', 'ห้องนอนเล็ก',
    'ห้องครัว', 'ห้องทำงาน', 'ห้องน้ำ', 'ห้องอาหาร',
    'ระเบียง', 'ทางเดิน', 'บันได', 'ห้องเก็บของ',
    'ห้องประชุม', 'ห้องพระ', 'อื่นๆ'
];

const SUB_POSITIONS = [
    'หน้าต่าง', 'ประตู', 'ผนังซ้าย', 'ผนังขวา', 'อื่นๆ'
];

async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset || '');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    return data.secure_url;
}

export default function ProjectLocationsTab({ projectId, locations }: ProjectLocationsTabProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const windowDialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedFloor, setSelectedFloor] = useState('ชั้น 1');
    const [customFloor, setCustomFloor] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('ห้องรับแขก');
    const [customRoom, setCustomRoom] = useState('');
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
    const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
    const [windowImages, setWindowImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedSubPos, setSelectedSubPos] = useState('หน้าต่าง');
    const [customSubPos, setCustomSubPos] = useState('');

    const openModal = () => {
        setSelectedFloor('ชั้น 1');
        setCustomFloor('');
        setSelectedRoom('ห้องรับแขก');
        setCustomRoom('');
        dialogRef.current?.showModal();
    };
    const closeModal = () => dialogRef.current?.close();

    const openWindowModal = (locationId: string) => {
        setActiveLocationId(locationId);
        setWindowImages([]);
        setSelectedSubPos('หน้าต่าง');
        setCustomSubPos('');
        windowDialogRef.current?.showModal();
    };
    const closeWindowModal = () => windowDialogRef.current?.close();

    const toggleRoom = (id: string) => {
        setExpandedRooms(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            const urls = await Promise.all(Array.from(files).map(f => uploadToCloudinary(f)));
            setWindowImages(prev => [...prev, ...urls]);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setWindowImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const details = formData.get('details') as string;
        const floor = selectedFloor === 'อื่นๆ' ? customFloor : selectedFloor;
        const roomName = selectedRoom === 'อื่นๆ' ? customRoom : selectedRoom;
        if (!roomName) return;
        startTransition(async () => {
            try {
                await createProjectLocation(projectId, floor, roomName, details);
                closeModal();
            } catch (error) {
                console.error('Error creating location:', error);
                alert('เกิดข้อผิดพลาดในการเพิ่มตำแหน่งงาน');
            }
        });
    };

    const handleWindowSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeLocationId) return;
        const formData = new FormData(e.currentTarget);
        const name = selectedSubPos === 'อื่นๆ' ? customSubPos : selectedSubPos;
        const details = formData.get('details') as string;
        if (!name) return;
        startTransition(async () => {
            try {
                await createLocationWindow(activeLocationId, projectId, name, details, windowImages);
                closeWindowModal();
                setExpandedRooms(prev => new Set(prev).add(activeLocationId));
            } catch (error) {
                console.error('Error creating sub-position:', error);
                alert('เกิดข้อผิดพลาดในการเพิ่มตำแหน่งย่อย');
            }
        });
    };

    const handleDelete = (locationId: string) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งงานนี้?')) {
            startTransition(async () => {
                try { await deleteProjectLocation(locationId, projectId); }
                catch { alert('เกิดข้อผิดพลาดในการลบตำแหน่งงาน'); }
            });
        }
    };

    const handleDeleteWindow = (windowId: string) => {
        if (confirm('ต้องการลบตำแหน่งย่อยนี้?')) {
            startTransition(async () => {
                try { await deleteLocationWindow(windowId, projectId); }
                catch { alert('เกิดข้อผิดพลาดในการลบตำแหน่งย่อย'); }
            });
        }
    };

    const groupedByFloor = locations.reduce((acc: Record<string, ProjectLocation[]>, loc) => {
        const floor = loc.floor || 'ไม่ระบุชั้น';
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(loc);
        return acc;
    }, {});

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>สารบบตำแหน่งหน้างาน</h3>
                <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> เพิ่มตำแหน่งงาน
                </button>
            </div>

            {locations && locations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(groupedByFloor).map(([floor, locs]) => (
                        <div key={floor}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Building2 size={16} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>{floor}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>{locs.length} ห้อง</span>
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
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>{windows.length} ตำแหน่งย่อย</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', opacity: isPending ? 0.5 : 1 }} disabled={isPending} title="ลบห้อง"><Trash2 size={14} /></button>
                                            </div>

                                            {isExpanded && (
                                                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-subtle)' }}>
                                                    {windows.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                            {windows.map((w) => (
                                                                <div key={w.id} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        <Square size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                                                                            {w.name} {w.details ? `(${w.details})` : ''}
                                                                        </span>
                                                                        <button onClick={() => handleDeleteWindow(w.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.15rem', opacity: isPending ? 0.5 : 1 }} disabled={isPending} title="ลบ"><Trash2 size={12} /></button>
                                                                    </div>
                                                                    {w.image_urls && w.image_urls.length > 0 && (
                                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem', marginLeft: '1.75rem' }}>
                                                                            {w.image_urls.map((url, i) => (
                                                                                <img key={i} src={url} alt={`${w.name} ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.4rem', border: '1px solid var(--border)', cursor: 'pointer' }}
                                                                                    onClick={() => window.open(url, '_blank')} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <button onClick={() => openWindowModal(loc.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        <Plus size={14} /> เพิ่มตำแหน่งย่อย
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <MapPin size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีข้อมูลตำแหน่งงาน</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>เริ่มเพิ่มตำแหน่งห้องต่างๆ ในโปรเจกต์เพื่อใช้อ้างอิง</p>
                    <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> เพิ่มตำแหน่งงาน</button>
                </div>
            )}

            {/* Add Location Modal */}
            <dialog ref={dialogRef} className="modal" style={{ padding: 0, border: 'none', borderRadius: '0.75rem', maxWidth: '440px', width: '100%', outline: 'none', background: 'var(--bg-main)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>เพิ่มตำแหน่งงาน</h3>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                            <Building2 size={14} style={{ color: 'var(--text-muted)' }} /> ชั้น <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <select value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        {selectedFloor === 'อื่นๆ' && (
                            <input type="text" value={customFloor} onChange={(e) => setCustomFloor(e.target.value)} placeholder="พิมพ์ชื่อชั้น..."
                                style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        )}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>ชื่อห้อง <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {selectedRoom === 'อื่นๆ' && (
                            <input type="text" value={customRoom} onChange={(e) => setCustomRoom(e.target.value)} placeholder="พิมพ์ชื่อห้อง..."
                                style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        )}
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                            <FileText size={14} style={{ color: 'var(--text-muted)' }} /> รายละเอียดเพิ่มเติม (ไม่บังคับ)
                        </label>
                        <textarea name="details" rows={3} placeholder="เช่น ขนาดห้อง, จำนวนหน้าต่าง, หมายเหตุ..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={closeModal} style={{ padding: '0.6rem 1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>ยกเลิก</button>
                        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', opacity: isPending ? 0.7 : 1 }}>{isPending ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                </form>
            </dialog>

            {/* Add Sub-position Modal */}
            <dialog ref={windowDialogRef} className="modal" style={{ padding: 0, border: 'none', borderRadius: '0.75rem', maxWidth: '440px', width: '100%', outline: 'none', background: 'var(--bg-main)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>เพิ่มตำแหน่งย่อย</h3>
                    <button onClick={closeWindowModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleWindowSubmit} style={{ padding: '1.5rem' }}>
                    {/* 1. Sub-position name dropdown */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                            ชื่อตำแหน่งย่อย <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <select value={selectedSubPos} onChange={(e) => setSelectedSubPos(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            {SUB_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {selectedSubPos === 'อื่นๆ' && (
                            <input type="text" value={customSubPos} onChange={(e) => setCustomSubPos(e.target.value)} placeholder="พิมพ์ชื่อตำแหน่งย่อย..."
                                style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        )}
                    </div>

                    {/* 2. Details */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>รายละเอียด</label>
                        <textarea name="details" rows={3} placeholder="เช่น บานเลื่อน 2 บาน, กระจกใส, ขนาด 150x200 cm..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', resize: 'vertical' }} />
                    </div>

                    {/* 3. Image upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                            <Camera size={14} style={{ color: 'var(--text-muted)' }} /> เพิ่มรูป
                        </label>

                        {windowImages.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                {windowImages.map((url, i) => (
                                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                        <img src={url} alt={`preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.4rem', border: '1px solid var(--border)' }} />
                                        <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, opacity: isUploading ? 0.6 : 1 }}>
                            {isUploading ? <>กำลังอัปโหลด...</> : <><ImageIcon size={14} /> เลือกรูปภาพ</>}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={closeWindowModal} style={{ padding: '0.6rem 1rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>ยกเลิก</button>
                        <button type="submit" disabled={isPending || isUploading} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', opacity: (isPending || isUploading) ? 0.7 : 1 }}>
                            {isPending ? 'กำลังบันทึก...' : 'เพิ่มตำแหน่งย่อย'}
                        </button>
                    </div>
                </form>
            </dialog>

            <style>{`
                dialog::backdrop {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                }
            `}</style>
        </div>
    );
}
