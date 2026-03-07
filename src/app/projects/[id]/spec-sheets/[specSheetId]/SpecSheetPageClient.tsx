'use client';

import { useState, useEffect, useTransition } from 'react';
import { ArrowLeft, Check, PackageSearch, FileText, Save, ChevronDown, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateSpecSheetItem, createQuotationFromSpecSheet, addItemsToSpecSheet } from '../actions';
import { getProducts, getProductCategories } from '@/app/products/actions';

interface SpecSheetPageClientProps {
    specSheet: any;
    items: any[];
    measurementItems: any[];
    projectId: string;
    projectNumber: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
};

export default function SpecSheetPageClient({ specSheet, items: initialItems, measurementItems, projectId, projectNumber }: SpecSheetPageClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [items, setItems] = useState(initialItems);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [savingItemId, setSavingItemId] = useState<string | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isAddingItems, setIsAddingItems] = useState(false);

    // Per-item category filter: { [itemId]: categoryId }
    const [itemCategoryFilter, setItemCategoryFilter] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        initialItems.forEach(item => {
            const linkedMi = measurementItems.find(mi => mi.id === item.measurement_item_id);
            if (linkedMi?.product_categories?.id) {
                initial[item.id] = linkedMi.product_categories.id;
            }
        });
        return initial;
    });

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    useEffect(() => {
        loadProductData();
    }, []);

    const loadProductData = async () => {
        try {
            const [prods, cats] = await Promise.all([getProducts(), getProductCategories()]);
            setProducts(prods);
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    };

    const handleAddItems = async () => {
        if (selectedItemIds.length === 0) return;
        setIsAddingItems(true);
        try {
            await addItemsToSpecSheet(specSheet.id, projectId, selectedItemIds);
            setShowAddModal(false);
            setSelectedItemIds([]);
        } catch (error) {
            console.error('Error adding items:', error);
            alert('เกิดข้อผิดพลาดในการดึงตำแหน่ง');
        } finally {
            setIsAddingItems(false);
        }
    };

    const handleProductSelect = async (itemId: string, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) {
            // Clear product selection
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, product_id: null, product_name: '', unit_price: 0 } : item
            ));
            setSavingItemId(itemId);
            try {
                await updateSpecSheetItem(itemId, {
                    product_id: null,
                    product_name: '',
                    unit_price: 0
                });
            } catch (error) {
                console.error('Error clearing product:', error);
                alert('เกิดข้อผิดพลาด');
            }
            setSavingItemId(null);
            return;
        }

        setItems(prev => prev.map(item =>
            item.id === itemId ? {
                ...item,
                product_id: product.id,
                product_name: product.name,
                unit_price: product.base_price
            } : item
        ));

        setSavingItemId(itemId);
        try {
            await updateSpecSheetItem(itemId, {
                product_id: product.id,
                product_name: product.name,
                unit_price: product.base_price
            });
        } catch (error) {
            console.error('Error updating item:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
        setSavingItemId(null);
    };

    const handleDesignOptionChange = async (itemId: string, optionName: string, value: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const currentOptions = item.design_options || {};
        const newOptions = { ...currentOptions, [optionName]: value };

        // Update local state
        setItems(prev => prev.map(i =>
            i.id === itemId ? { ...i, design_options: newOptions } : i
        ));

        setSavingItemId(itemId);
        try {
            await updateSpecSheetItem(itemId, {
                product_id: item.product_id,
                product_name: item.product_name,
                unit_price: item.unit_price,
                notes: item.notes,
                design_options: newOptions
            });
        } catch (error) {
            console.error('Error updating design option:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกตัวเลือก');
        }
        setSavingItemId(null);
    };

    const handleCreateQuotation = () => {
        const itemsWithProduct = items.filter(item => item.product_id);
        if (itemsWithProduct.length === 0) {
            alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนสร้างใบเสนอราคา');
            return;
        }
        if (!confirm(`ต้องการสร้างใบเสนอราคาจาก ${itemsWithProduct.length} รายการที่เลือกสเปกแล้วใช่หรือไม่?`)) return;

        startTransition(async () => {
            try {
                const res = await createQuotationFromSpecSheet(specSheet.id);
                if (res.success && res.quotationId) {
                    router.push(`/projects/${projectNumber}/quotations/${res.quotationId}`);
                }
            } catch (error) {
                console.error('Error creating quotation:', error);
                alert('เกิดข้อผิดพลาดในการสร้างใบเสนอราคา');
            }
        });
    };

    const itemsWithProduct = items.filter(i => i.product_id);
    const totalPrice = itemsWithProduct.reduce((sum, item) => sum + (item.unit_price || 0), 0);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href={`/projects/${projectNumber}`} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--border)', display: 'inline-flex' }}>
                        <ArrowLeft size={18} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                    <div>
                        <h1 className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            📋 ใบเลือกสเปก
                            <span style={{
                                fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                background: specSheet.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                color: specSheet.status === 'completed' ? '#16a34a' : '#d97706'
                            }}>
                                {specSheet.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังเลือก'}
                            </span>
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ดึงตำแหน่งจากบิลวัดพื้นที่ เลือกสินค้าให้แต่ละตำแหน่ง จากนั้นกดสร้างใบเสนอราคา
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
                    >
                        <Plus size={18} />
                        เพิ่มตำแหน่งจากบิลวัดพื้นที่
                    </button>
                    <button
                        onClick={handleCreateQuotation}
                        disabled={isPending || itemsWithProduct.length === 0}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem', opacity: isPending || itemsWithProduct.length === 0 ? 0.5 : 1 }}
                    >
                        <FileText size={18} />
                        {isPending ? 'กำลังสร้าง...' : 'สร้างใบเสนอราคา'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item, index) => (
                        <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden', border: item.product_id ? '1px solid #86efac' : '1px solid var(--border)' }}>
                            <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                {/* Index */}
                                <div style={{
                                    background: item.product_id ? '#16a34a' : 'var(--bg-subtle)',
                                    color: item.product_id ? '#fff' : 'var(--text-muted)',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 600, fontSize: '0.95rem', flexShrink: 0, transition: 'all 0.3s'
                                }}>
                                    {item.product_id ? <Check size={18} /> : index + 1}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Location name and Category */}
                                    {(() => {
                                        const linkedMi = measurementItems.find(mi => mi.id === item.measurement_item_id);
                                        const categoryName = item.category_name || linkedMi?.product_categories?.name || null;
                                        return (
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {item.location_name}
                                                {categoryName && (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', background: '#eff6ff', color: '#2563eb' }}>
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </h3>
                                        );
                                    })()}
                                    {/* Order dimensions */}
                                    {(item.order_width > 0 || item.order_height > 0) && (
                                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500, marginBottom: '0.5rem' }}>
                                            ขนาดสั่งผลิต: {item.order_width || '-'} × {item.order_height || '-'} cm
                                        </div>
                                    )}
                                    {item.notes && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            {item.notes}
                                        </div>
                                    )}

                                    {/* Category Filter + Product Selector */}
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                                            ประเภทสินค้า
                                        </label>
                                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                            <select
                                                value={itemCategoryFilter[item.id] || ''}
                                                onChange={(e) => setItemCategoryFilter(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                style={{
                                                    width: '100%', padding: '0.6rem 2rem 0.6rem 0.75rem',
                                                    borderRadius: '0.5rem', border: '1px solid var(--border)',
                                                    fontSize: '0.9rem', fontWeight: 500,
                                                    background: itemCategoryFilter[item.id] ? '#eff6ff' : '#fff',
                                                    color: itemCategoryFilter[item.id] ? '#2563eb' : 'var(--text)',
                                                    appearance: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <option value="">-- ทุกประเภท --</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>

                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
                                            เลือกสินค้า
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={item.product_id || ''}
                                                onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                                disabled={savingItemId === item.id}
                                                style={{
                                                    width: '100%', padding: '0.6rem 2rem 0.6rem 0.75rem',
                                                    borderRadius: '0.5rem', border: '1px solid var(--border)',
                                                    fontSize: '0.9rem', fontWeight: 500,
                                                    background: item.product_id ? '#f0fdf4' : '#fff',
                                                    color: item.product_id ? '#16a34a' : 'var(--text)',
                                                    appearance: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <option value="">-- เลือกสินค้า --</option>
                                                {(() => {
                                                    const filterCatId = itemCategoryFilter[item.id];
                                                    const filteredCategories = filterCatId
                                                        ? categories.filter(c => c.id === filterCatId)
                                                        : categories;
                                                    return filteredCategories.map(cat => {
                                                        const catProducts = products.filter(p => p.category_id === cat.id && p.is_active);
                                                        if (catProducts.length === 0) return null;
                                                        if (filterCatId) {
                                                            return catProducts.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} — {formatCurrency(p.base_price)}/{p.unit}
                                                                </option>
                                                            ));
                                                        }
                                                        return (
                                                            <optgroup key={cat.id} label={cat.name}>
                                                                {catProducts.map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} — {formatCurrency(p.base_price)}/{p.unit}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        );
                                                    });
                                                })()}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>

                                        {/* Design Options Selectors */}
                                        {(() => {
                                            const linkedMi = measurementItems.find(mi => mi.id === item.measurement_item_id);
                                            // Determine active category for this item
                                            const activeCatId = itemCategoryFilter[item.id] || linkedMi?.product_categories?.id;
                                            const activeCat = categories.find(c => c.id === activeCatId);

                                            // If category has design options, or if item already has saved design_options keys (fallback)
                                            if (activeCat && activeCat.design_options && activeCat.design_options.length > 0) {
                                                return (
                                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {activeCat.design_options.map((opt: any) => (
                                                            <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                                    {opt.option_name}
                                                                </label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <select
                                                                        value={item.design_options?.[opt.option_name] || ''}
                                                                        onChange={(e) => handleDesignOptionChange(item.id, opt.option_name, e.target.value)}
                                                                        disabled={savingItemId === item.id}
                                                                        style={{
                                                                            width: '100%', minWidth: '120px', padding: '0.5rem 2rem 0.5rem 0.6rem',
                                                                            borderRadius: '0.4rem', border: '1px solid var(--border)',
                                                                            fontSize: '0.85rem', fontWeight: 500, background: '#fff',
                                                                            color: 'var(--text)', appearance: 'none', cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <option value="">-- เลือก --</option>
                                                                        {(opt.choices || []).map((choice: string) => (
                                                                            <option key={choice} value={choice}>{choice}</option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown size={14} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {savingItemId === item.id && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                                กำลังบันทึก...
                                            </div>
                                        )}
                                    </div>

                                    {/* Price display */}
                                    {item.product_id && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 500 }}>{item.product_name}</div>
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16a34a' }}>
                                                {formatCurrency(item.unit_price)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <PackageSearch size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ใบเลือกสเปกยังว่างอยู่</h3>
                            <p style={{ marginBottom: '1.5rem' }}>เพิ่มตำแหน่งที่ต้องการจากบิลวัดพื้นที่เพื่อเริ่มเลือกสเปก</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
                            >
                                <Plus size={18} />
                                เพิ่มตำแหน่ง
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Sidebar */}
                <div className="card" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <h2 className="section-title" style={{ marginBottom: '1rem' }}>สรุป</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>ตำแหน่งทั้งหมด:</span>
                            <span>{items.length} จุด</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: '#16a34a', fontWeight: 500 }}>เลือกสเปกแล้ว:</span>
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>{itemsWithProduct.length} จุด</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>ยังไม่ได้เลือก:</span>
                            <span style={{ color: '#d97706', fontWeight: 500 }}>{items.length - itemsWithProduct.length} จุด</span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>ราคารวม:</span>
                            <span className="font-outfit" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {formatCurrency(totalPrice)}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <button
                            onClick={handleCreateQuotation}
                            disabled={isPending || itemsWithProduct.length === 0}
                            className="btn-primary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem', opacity: isPending || itemsWithProduct.length === 0 ? 0.5 : 1 }}
                        >
                            <FileText size={18} />
                            {isPending ? 'กำลังสร้าง...' : 'สร้างใบเสนอราคา'}
                        </button>
                        {itemsWithProduct.length === 0 && (
                            <p style={{ fontSize: '0.75rem', color: '#d97706', textAlign: 'center', marginTop: '0.5rem' }}>
                                กรุณาเลือกสินค้าอย่างน้อย 1 รายการ
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Items Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>เพิ่มตำแหน่งจากบิลวัดพื้นที่</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {measurementItems.filter(mi => !items.find(i => i.measurement_item_id === mi.id)).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                                    <PackageSearch size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                                    <p>ไม่มีตำแหน่งใหม่ที่สามารถเพิ่มได้</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                const availableItems = measurementItems.filter(mi => !items.find(i => i.measurement_item_id === mi.id));
                                                if (selectedItemIds.length === availableItems.length) {
                                                    setSelectedItemIds([]);
                                                } else {
                                                    setSelectedItemIds(availableItems.map(mi => mi.id));
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <div style={{ width: '1.2rem', height: '1.2rem', border: '1px solid var(--primary)', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedItemIds.length === measurementItems.filter(mi => !items.find(i => i.measurement_item_id === mi.id)).length ? 'var(--primary)' : 'transparent' }}>
                                                {selectedItemIds.length === measurementItems.filter(mi => !items.find(i => i.measurement_item_id === mi.id)).length && <Check size={14} color="white" />}
                                            </div>
                                            เลือกทั้งหมด
                                        </button>
                                    </div>
                                    {measurementItems.filter(mi => !items.find(i => i.measurement_item_id === mi.id)).map(mi => (
                                        <div key={mi.id}
                                            onClick={() => {
                                                if (selectedItemIds.includes(mi.id)) {
                                                    setSelectedItemIds(prev => prev.filter(id => id !== mi.id));
                                                } else {
                                                    setSelectedItemIds(prev => [...prev, mi.id]);
                                                }
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                                                border: `1px solid ${selectedItemIds.includes(mi.id) ? 'var(--primary)' : 'var(--border)'}`,
                                                borderRadius: '0.5rem', cursor: 'pointer',
                                                background: selectedItemIds.includes(mi.id) ? 'var(--bg-blue)' : 'var(--bg-main)'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.includes(mi.id)}
                                                readOnly
                                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {mi.location_name}
                                                    {(mi as any).product_categories?.name && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', background: '#eff6ff', color: '#2563eb' }}>
                                                            {(mi as any).product_categories.name}
                                                        </span>
                                                    )}
                                                    {mi.measurement_details?.category?.name && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                                                            {mi.measurement_details.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {(mi.measurement_details?.order?.width || mi.measurement_details?.order?.height) && (
                                                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500, marginTop: '0.25rem' }}>
                                                        ขนาดสั่งผลิต: {mi.measurement_details.order.width || '-'} × {mi.measurement_details.order.height || '-'} cm
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{mi.details || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn-outline"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAddItems}
                                disabled={isAddingItems || selectedItemIds.length === 0}
                                className="btn-primary"
                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isAddingItems ? 'กำลังเพิ่ม...' : `เพิ่ม ${selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
