'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Truck, Plus, Search, Edit, Trash2, X, ArrowLeft, Package, Tag, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, createSupplierProduct, updateSupplierProduct, deleteSupplierProduct } from './actions';
import { Supplier, SupplierProduct } from '@/types/suppliers';

const UNITS = ['เมตร', 'ชิ้น', 'ชุด', 'ม้วน', 'หลา', 'กล่อง', 'ตัว', 'อัน', 'แผ่น', 'เส้น'];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
};

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Supplier modal
    const supplierDialogRef = useRef<HTMLDialogElement>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierForm, setSupplierForm] = useState({
        name: '', contact_name: '', phone: '', email: '', address: '', notes: ''
    });

    // Product modal
    const productDialogRef = useRef<HTMLDialogElement>(null);
    const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
    const [productForm, setProductForm] = useState({
        category: '', product_code: '', name: '', description: '', tags: [] as string[], unit: 'ชิ้น', price_per_unit: 0
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => { loadSuppliers(); }, []);

    async function loadSuppliers() {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
            if (selectedSupplier) {
                const updated = data.find((s: Supplier) => s.id === selectedSupplier.id);
                if (updated) setSelectedSupplier(updated);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    // ---- Supplier handlers ----
    function openSupplierModal(supplier?: Supplier) {
        if (supplier) {
            setEditingSupplier(supplier);
            setSupplierForm({
                name: supplier.name,
                contact_name: supplier.contact_name || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                notes: supplier.notes || '',
            });
        } else {
            setEditingSupplier(null);
            setSupplierForm({ name: '', contact_name: '', phone: '', email: '', address: '', notes: '' });
        }
        supplierDialogRef.current?.showModal();
    }

    function handleSupplierSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            try {
                if (editingSupplier) {
                    await updateSupplier(editingSupplier.id, supplierForm);
                } else {
                    await createSupplier(supplierForm);
                }
                supplierDialogRef.current?.close();
                await loadSuppliers();
            } catch (err) { console.error(err); }
        });
    }

    function handleDeleteSupplier(id: string) {
        if (!confirm('ลบซัพพลายเออร์นี้?')) return;
        startTransition(async () => {
            await deleteSupplier(id);
            if (selectedSupplier?.id === id) setSelectedSupplier(null);
            await loadSuppliers();
        });
    }

    // ---- Product handlers ----
    function openProductModal(product?: SupplierProduct) {
        if (product) {
            setEditingProduct(product);
            setProductForm({
                category: product.category,
                product_code: product.product_code,
                name: product.name,
                description: product.description || '',
                tags: product.tags || [],
                unit: product.unit,
                price_per_unit: product.price_per_unit,
            });
        } else {
            setEditingProduct(null);
            setProductForm({ category: '', product_code: '', name: '', description: '', tags: [], unit: 'ชิ้น', price_per_unit: 0 });
        }
        setTagInput('');
        productDialogRef.current?.showModal();
    }

    function handleProductSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSupplier) return;
        startTransition(async () => {
            try {
                if (editingProduct) {
                    await updateSupplierProduct(editingProduct.id, productForm);
                } else {
                    await createSupplierProduct({ ...productForm, supplier_id: selectedSupplier.id });
                }
                productDialogRef.current?.close();
                await loadSuppliers();
            } catch (err) { console.error(err); }
        });
    }

    function handleDeleteProduct(id: string) {
        if (!confirm('ลบสินค้านี้?')) return;
        startTransition(async () => {
            await deleteSupplierProduct(id);
            await loadSuppliers();
        });
    }

    function addTag() {
        const t = tagInput.trim();
        if (t && !productForm.tags.includes(t)) {
            setProductForm({ ...productForm, tags: [...productForm.tags, t] });
        }
        setTagInput('');
    }

    function removeTag(tag: string) {
        setProductForm({ ...productForm, tags: productForm.tags.filter(t => t !== tag) });
    }

    // ---- Filters ----
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const products = selectedSupplier?.products || [];
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.product_code.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(productSearch.toLowerCase()))
    );

    // ---- Categories for grouping ----
    const categories = [...new Set(filteredProducts.map(p => p.category || 'ไม่มีประเภท'))];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    // ========== SUPPLIER DETAIL VIEW ==========
    if (selectedSupplier) {
        return (
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <button onClick={() => setSelectedSupplier(null)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none',
                    color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0,
                }}>
                    <ArrowLeft size={16} /> กลับไปยังรายการซัพพลายเออร์
                </button>

                {/* Supplier Header */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Truck size={24} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{selectedSupplier.name}</h1>
                                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                    {selectedSupplier.contact_name && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={13} /> {selectedSupplier.contact_name}</span>
                                    )}
                                    {selectedSupplier.phone && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={13} /> {selectedSupplier.phone}</span>
                                    )}
                                    {selectedSupplier.email && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={13} /> {selectedSupplier.email}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => openSupplierModal(selectedSupplier)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <Edit size={14} /> แก้ไขข้อมูล
                        </button>
                    </div>
                </div>

                {/* Products Section */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Package size={18} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>สินค้า</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{products.length} รายการ</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="ค้นหาสินค้า..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                                    className="input-field" style={{ paddingLeft: '2.25rem', width: '220px', fontSize: '0.85rem' }} />
                            </div>
                            <button onClick={() => openProductModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                <Plus size={16} /> เพิ่มสินค้า
                            </button>
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div>
                            {categories.map(cat => {
                                const catProducts = filteredProducts.filter(p => (p.category || 'ไม่มีประเภท') === cat);
                                if (catProducts.length === 0) return null;
                                return (
                                    <div key={cat}>
                                        <div style={{ padding: '0.6rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            {cat}
                                        </div>
                                        {catProducts.map(p => (
                                            <div key={p.id} style={{
                                                padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border)',
                                                display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
                                                alignItems: 'center', gap: '1rem', transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{p.name}</span>
                                                        {p.product_code && (
                                                            <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{p.product_code}</span>
                                                        )}
                                                    </div>
                                                    {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{p.description}</p>}
                                                    {(p.tags || []).length > 0 && (
                                                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                                                            {p.tags.map(t => (
                                                                <span key={t} style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', padding: '0.1rem 0.5rem', borderRadius: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{t}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.unit}</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>{formatCurrency(p.price_per_unit)}</span>
                                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#16a34a' : '#dc2626' }}>
                                                    {p.is_active ? 'ใช้งาน' : 'ปิด'}
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => openProductModal(p)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '0.4rem' }}><Edit size={14} /></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '0.4rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} disabled={isPending}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <Package size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.4 }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>ยังไม่มีสินค้า</p>
                            <button onClick={() => openProductModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={16} /> เพิ่มสินค้าแรก
                            </button>
                        </div>
                    )}
                </div>

                {/* Product Modal */}
                <dialog ref={productDialogRef} style={{ border: 'none', borderRadius: '1.25rem', padding: 0, maxWidth: '560px', width: '95vw', background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                    <form onSubmit={handleProductSubmit}>
                        <div style={{ padding: '1.75rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)' }}>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
                            <button type="button" onClick={() => productDialogRef.current?.close()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={22} /></button>
                        </div>
                        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ประเภทสินค้า</label>
                                    <input type="text" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} placeholder="เช่น ผ้าม่าน" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>รหัสสินค้า</label>
                                    <input type="text" value={productForm.product_code} onChange={e => setProductForm({ ...productForm, product_code: e.target.value })} placeholder="เช่น CUR-001" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ชื่อสินค้า *</label>
                                <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="ชื่อสินค้า" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>รายละเอียด</label>
                                <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="รายละเอียดเพิ่มเติม" rows={2} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            {/* Tags */}
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>TAG</label>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: productForm.tags.length > 0 ? '0.5rem' : 0 }}>
                                    {productForm.tags.map(t => (
                                        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', padding: '0.3rem 0.6rem', borderRadius: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                            {t}
                                            <button type="button" onClick={() => removeTag(t)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, display: 'flex' }}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        placeholder="พิมพ์แล้วกด Enter" style={{ flex: 1, padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                    <button type="button" onClick={addTag} style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                                        <Tag size={16} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>หน่วย *</label>
                                    <select value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }}>
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ราคา/ต่อหน่วย (฿) *</label>
                                    <input type="number" step="0.01" min="0" required value={productForm.price_per_unit} onChange={e => setProductForm({ ...productForm, price_per_unit: Number(e.target.value) })} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '0 2rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" onClick={() => productDialogRef.current?.close()} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>ยกเลิก</button>
                            <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, minWidth: '120px' }}>
                                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </form>
                </dialog>

                {/* Supplier Edit dialog (reused) */}
                <dialog ref={supplierDialogRef} style={{ border: 'none', borderRadius: '1.25rem', padding: 0, maxWidth: '520px', width: '95vw', background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                    <form onSubmit={handleSupplierSubmit}>
                        <div style={{ padding: '1.75rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)' }}>{editingSupplier ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์'}</h2>
                            <button type="button" onClick={() => supplierDialogRef.current?.close()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={22} /></button>
                        </div>
                        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ชื่อซัพพลายเออร์ *</label>
                                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="เช่น บริษัท ABC" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ผู้ติดต่อ</label>
                                    <input type="text" value={supplierForm.contact_name} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} placeholder="ชื่อผู้ติดต่อ" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>เบอร์โทร</label>
                                    <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="0xx-xxx-xxxx" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>อีเมล</label>
                                <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="example@email.com" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ที่อยู่</label>
                                <textarea value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="ที่อยู่ซัพพลายเออร์" rows={2} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>หมายเหตุ</label>
                                <textarea value={supplierForm.notes} onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })} placeholder="หมายเหตุเพิ่มเติม" rows={2} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div style={{ padding: '0 2rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" onClick={() => supplierDialogRef.current?.close()} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>ยกเลิก</button>
                            <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, minWidth: '120px' }}>
                                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </form>
                </dialog>
            </div>
        );
    }

    // ========== SUPPLIER LIST VIEW ==========
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Truck size={22} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>ซัพพลายเออร์</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem', marginLeft: '3.25rem' }}>จัดการข้อมูลซัพพลายเออร์และสินค้าสำหรับคำนวณต้นทุนสั่งของ</p>
            </div>

            {/* Search + Add */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="ค้นหาซัพพลายเออร์..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="input-field" style={{ paddingLeft: '2.25rem', width: '100%' }} />
                </div>
                <button onClick={() => openSupplierModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
                    <Plus size={16} /> เพิ่มซัพพลายเออร์
                </button>
            </div>

            {/* Supplier Cards */}
            {filteredSuppliers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                    {filteredSuppliers.map(s => (
                        <div key={s.id} onClick={() => setSelectedSupplier(s)} style={{
                            background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)',
                            padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s',
                            position: 'relative', overflow: 'hidden',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '0.65rem', background: s.is_active ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{s.name}</h3>
                                        {s.contact_name && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{s.contact_name}</p>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openSupplierModal(s)} className="btn-secondary" style={{ padding: '0.3rem', borderRadius: '0.4rem' }}><Edit size={13} /></button>
                                    <button onClick={() => handleDeleteSupplier(s.id)} className="btn-secondary" style={{ padding: '0.3rem', borderRadius: '0.4rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} disabled={isPending}><Trash2 size={13} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} /> {s.phone}</span>}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Package size={12} /> {(s.products || []).length} สินค้า</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#f97316' }}>
                        <Truck size={28} />
                    </div>
                    <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีซัพพลายเออร์</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>เพิ่มซัพพลายเออร์เพื่อจัดการสินค้าและคำนวณต้นทุน</p>
                    <button onClick={() => openSupplierModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> เพิ่มซัพพลายเออร์แรก
                    </button>
                </div>
            )}

            {/* Supplier Modal */}
            <dialog ref={supplierDialogRef} style={{ border: 'none', borderRadius: '1.25rem', padding: 0, maxWidth: '520px', width: '95vw', background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                <form onSubmit={handleSupplierSubmit}>
                    <div style={{ padding: '1.75rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)' }}>{editingSupplier ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์'}</h2>
                        <button type="button" onClick={() => supplierDialogRef.current?.close()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={22} /></button>
                    </div>
                    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ชื่อซัพพลายเออร์ *</label>
                            <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="เช่น บริษัท ABC" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ผู้ติดต่อ</label>
                                <input type="text" value={supplierForm.contact_name} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} placeholder="ชื่อผู้ติดต่อ" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>เบอร์โทร</label>
                                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="0xx-xxx-xxxx" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>อีเมล</label>
                            <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="example@email.com" style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>ที่อยู่</label>
                            <textarea value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="ที่อยู่ซัพพลายเออร์" rows={2} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>หมายเหตุ</label>
                            <textarea value={supplierForm.notes} onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })} placeholder="หมายเหตุเพิ่มเติม" rows={2} style={{ width: '100%', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.75rem', background: '#f3f4f6', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                    </div>
                    <div style={{ padding: '0 2rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={() => supplierDialogRef.current?.close()} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>ยกเลิก</button>
                        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, minWidth: '120px' }}>
                            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </dialog>
        </div>
    );
}
