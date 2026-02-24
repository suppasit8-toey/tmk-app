'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { PackageSearch, Plus, Search, Edit, Trash2, X, ListTree, ChevronRight, ArrowLeft, Calculator, DollarSign, ShoppingBag, Save, ChevronDown, ChevronUp, Ruler } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory } from './actions';
import { Product, ProductCategory } from '@/types/products';

const CALC_METHODS = [
    { value: 'area_sqm', label: 'คำนวณตามพื้นที่ (ตร.ม.)' },
    { value: 'area_sqyd', label: 'คำนวณตามพื้นที่ (ตร.หลา)' },
    { value: 'width_rail', label: 'คำนวณตามความกว้างราง' },
    { value: 'quantity', label: 'คำนวณตามจำนวน (กล่อง/ม้วน)' },
    { value: 'fixed_price', label: 'ราคาคงที่ (ต่อชิ้น/ชุด)' },
    { value: 'step_width', label: 'Step ราคาตามความกว้าง' },
    { value: 'step_width_height', label: 'Step ราคาตามความกว้างและสูง' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
};

const UNITS = ['ตร.ม.', 'เมตร', 'ชุด', 'ชิ้น', 'ม้วน', 'หลา'];

export default function ProductsPage() {
    // Categories State
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Selected Category (detail view)
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

    // Products for selected category
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [isSubmitting, startTransition] = useTransition();

    // Category Modal State
    const categoryDialogRef = useRef<HTMLDialogElement>(null);
    const [editingCategoryName, setEditingCategoryName] = useState<ProductCategory | null>(null);
    const [categoryName, setCategoryName] = useState('');

    // Product Modal State
    const productDialogRef = useRef<HTMLDialogElement>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        base_price: 0,
        unit: 'ตร.ม.',
        is_active: true
    });

    // Category Settings State (for editing calc method)
    const [calcMethod, setCalcMethod] = useState('area_sqm');
    const [settingsSaved, setSettingsSaved] = useState(false);

    // Area Calculation Conditions
    const [areaConditionsOpen, setAreaConditionsOpen] = useState(true);
    const [areaConditions, setAreaConditions] = useState({
        min_width_enabled: false, min_width: 0,
        max_width_enabled: false, max_width: 0,
        max_height_enabled: false, max_height: 0,
        min_price_width_enabled: false, min_price_width: 0,
        min_price_height_enabled: false, min_price_height: 0,
        height_step_enabled: false, height_step: 0,
        min_area_enabled: false, min_area: 0,
        area_factor_enabled: false, area_factor: 1,
        area_rounding_enabled: false, area_rounding: 0,
    });

    const [productionReqsOpen, setProductionReqsOpen] = useState(true);
    const [productionReqs, setProductionReqs] = useState<Record<string, boolean>>({
        frame_width: false, frame_height: false, frame_top_floor: false,
        ceiling_left: false, ceiling_center: false, ceiling_right: false, ceiling_full_width: false, ceiling_gen: false,
        clearance_left: false, clearance_right: false,
        production_width: false, production_height: false
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await getProductCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadCategoryProducts = async (categoryId: string) => {
        setLoadingProducts(true);
        try {
            const allProducts = await getProducts();
            setCategoryProducts(allProducts.filter((p: Product) => p.category_id === categoryId));
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSelectCategory = (cat: ProductCategory) => {
        setSelectedCategory(cat);
        setCalcMethod(cat.sales_calc_method || 'area_sqm');
        setAreaConditions({
            min_width_enabled: cat.min_width_enabled ?? false, min_width: cat.min_width ?? 0,
            max_width_enabled: cat.max_width_enabled ?? false, max_width: cat.max_width ?? 0,
            max_height_enabled: cat.max_height_enabled ?? false, max_height: cat.max_height ?? 0,
            min_price_width_enabled: cat.min_price_width_enabled ?? false, min_price_width: cat.min_price_width ?? 0,
            min_price_height_enabled: cat.min_price_height_enabled ?? false, min_price_height: cat.min_price_height ?? 0,
            height_step_enabled: cat.height_step_enabled ?? false, height_step: cat.height_step ?? 0,
            min_area_enabled: cat.min_area_enabled ?? false, min_area: cat.min_area ?? 0,
            area_factor_enabled: cat.area_factor_enabled ?? false, area_factor: cat.area_factor ?? 1,
            area_rounding_enabled: cat.area_rounding_enabled ?? false, area_rounding: cat.area_rounding ?? 0,
        });

        // Parse JSONB production reqs
        const defaultReqs = {
            frame_width: false, frame_height: false, frame_top_floor: false,
            ceiling_left: false, ceiling_center: false, ceiling_right: false, ceiling_full_width: false, ceiling_gen: false,
            clearance_left: false, clearance_right: false,
            production_width: false, production_height: false
        };
        const savedReqs = cat.production_reqs || {};
        setProductionReqs({ ...defaultReqs, ...savedReqs });

        setSettingsSaved(false);
        loadCategoryProducts(cat.id);
    };

    const handleBackToList = () => {
        setSelectedCategory(null);
        setCategoryProducts([]);
    };

    // --- Category CRUD ---
    const handleOpenCategoryModal = (cat?: ProductCategory) => {
        if (cat) {
            setEditingCategoryName(cat);
            setCategoryName(cat.name);
        } else {
            setEditingCategoryName(null);
            setCategoryName('');
        }
        categoryDialogRef.current?.showModal();
    };

    const handleCloseCategoryModal = () => {
        categoryDialogRef.current?.close();
        setEditingCategoryName(null);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                if (editingCategoryName) {
                    await updateProductCategory(editingCategoryName.id, {
                        name: categoryName
                    });
                } else {
                    await createProductCategory(categoryName);
                }
                handleCloseCategoryModal();
                await loadCategories();
            } catch (error) {
                console.error('Error saving category:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        });
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?')) return;
        startTransition(async () => {
            try {
                await deleteProductCategory(id);
                await loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('เกิดข้อผิดพลาดในการลบหมวดหมู่');
            }
        });
    };

    // --- Save Category Settings ---
    const handleSaveSettings = async () => {
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                await updateProductCategory(selectedCategory.id, {
                    name: selectedCategory.name,
                    sales_calc_method: calcMethod,
                    ...areaConditions,
                    production_reqs: productionReqs
                });
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
                // Refresh categories list
                const data = await getProductCategories();
                setCategories(data);
                const updated = data.find((c: ProductCategory) => c.id === selectedCategory.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกตั้งค่า');
            }
        });
    };

    // --- Product CRUD ---
    const handleOpenProductModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductFormData({
                name: product.name,
                description: product.description || '',
                base_price: product.base_price,
                unit: product.unit,
                is_active: product.is_active
            });
        } else {
            setEditingProduct(null);
            setProductFormData({
                name: '',
                description: '',
                base_price: 0,
                unit: 'ตร.ม.',
                is_active: true
            });
        }
        productDialogRef.current?.showModal();
    };

    const handleCloseProductModal = () => {
        productDialogRef.current?.close();
        setEditingProduct(null);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                if (editingProduct) {
                    await updateProduct(editingProduct.id, {
                        ...productFormData,
                        category_id: selectedCategory.id
                    });
                } else {
                    await createProduct({
                        ...productFormData,
                        category_id: selectedCategory.id
                    });
                }
                handleCloseProductModal();
                await loadCategoryProducts(selectedCategory.id);
            } catch (error) {
                console.error('Error saving product:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        });
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                await deleteProduct(id);
                await loadCategoryProducts(selectedCategory.id);
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        });
    };

    // ========================================================================
    // RENDER: Category Detail View
    // ========================================================================
    if (selectedCategory) {
        return (
            <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                        {/* Back Button */}
                        <button
                            onClick={handleBackToList}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0 }}
                        >
                            <ArrowLeft size={18} />
                            กลับไปยังรายการหมวดหมู่
                        </button>

                        {/* Category Header */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                                {selectedCategory.name}
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ตั้งค่าวิธีคำนวณราคาและจัดการรายการสั่งของในหมวดหมู่นี้</p>
                        </div>

                        {/* Settings Cards (Calc Methods) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                            {/* Calculation Method */}
                            <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <Calculator size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>วิธีคำนวณ</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>เลือกวิธีการคิดราคาสำหรับหมวดนี้</p>
                                    </div>
                                </div>
                                <select
                                    value={calcMethod}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCalcMethod(val);
                                        if (val === 'area_sqyd') {
                                            setAreaConditions(prev => ({ ...prev, area_factor: 1.2, area_factor_enabled: true }));
                                        } else if (val === 'area_sqm') {
                                            setAreaConditions(prev => ({ ...prev, area_factor: 1, area_factor_enabled: prev.area_factor_enabled }));
                                        }
                                    }}
                                    className="input-field"
                                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                                >
                                    {CALC_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Save Settings Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSubmitting}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
                            >
                                <Save size={16} />
                                {settingsSaved ? '✓ บันทึกแล้ว' : isSubmitting ? 'กำลังบันทึก...' : 'บันทึกตั้งค่า'}
                            </button>
                        </div>

                        {/* Dynamic Conditions Section */}
                        {(calcMethod === 'area_sqm' || calcMethod === 'area_sqyd' || calcMethod === 'width_rail') && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '2rem' }}>
                                <button
                                    onClick={() => setAreaConditionsOpen(!areaConditionsOpen)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Ruler size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                                                {calcMethod === 'width_rail' ? 'เงื่อนไขการคำนวณราง' : 'เงื่อนไขการคำนวณพื้นที่'}
                                            </h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>คลิกเพื่อ{areaConditionsOpen ? 'ซ่อน' : 'แสดง'}เงื่อนไข</p>
                                        </div>
                                    </div>
                                    {areaConditionsOpen ? <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
                                </button>

                                {areaConditionsOpen && (
                                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', paddingTop: '1.5rem' }}>

                                            {/* ===== RAIL CONDITIONS (width_rail) ===== */}
                                            {calcMethod === 'width_rail' && (<>
                                                {/* MIN PRICE WIDTH */}
                                                <div style={{ opacity: areaConditions.min_price_width_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความกว้างขั้นต่ำคิดราคา</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.min_price_width_enabled} onChange={e => setAreaConditions({ ...areaConditions, min_price_width_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.min_price_width_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.min_price_width_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.min_price_width ?? ''} onChange={e => setAreaConditions({ ...areaConditions, min_price_width: Number(e.target.value) })} disabled={!areaConditions.min_price_width_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* HEIGHT STEP */}
                                                <div style={{ opacity: areaConditions.height_step_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>คิดราคาทุกๆ (STEP)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.height_step_enabled} onChange={e => setAreaConditions({ ...areaConditions, height_step_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.height_step_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.height_step_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.height_step ?? ''} onChange={e => setAreaConditions({ ...areaConditions, height_step: Number(e.target.value) })} disabled={!areaConditions.height_step_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MAX HEIGHT */}
                                                <div style={{ opacity: areaConditions.max_height_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความสูงสูงสุด (MAX HEIGHT)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.max_height_enabled} onChange={e => setAreaConditions({ ...areaConditions, max_height_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.max_height_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.max_height_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.max_height ?? ''} onChange={e => setAreaConditions({ ...areaConditions, max_height: Number(e.target.value) })} disabled={!areaConditions.max_height_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>
                                            </>)}

                                            {/* ===== AREA CONDITIONS (area_sqm / area_sqyd) ===== */}
                                            {(calcMethod === 'area_sqm' || calcMethod === 'area_sqyd') && (<>
                                                {/* MIN WIDTH */}
                                                <div style={{ opacity: areaConditions.min_width_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความกว้างต่ำสุด (MIN WIDTH)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.min_width_enabled} onChange={e => setAreaConditions({ ...areaConditions, min_width_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.min_width_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.min_width_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.min_width ?? ''} onChange={e => setAreaConditions({ ...areaConditions, min_width: Number(e.target.value) })} disabled={!areaConditions.min_width_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MAX WIDTH */}
                                                <div style={{ opacity: areaConditions.max_width_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความกว้างสูงสุด (MAX WIDTH)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.max_width_enabled} onChange={e => setAreaConditions({ ...areaConditions, max_width_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.max_width_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.max_width_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.max_width ?? ''} onChange={e => setAreaConditions({ ...areaConditions, max_width: Number(e.target.value) })} disabled={!areaConditions.max_width_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MAX HEIGHT */}
                                                <div style={{ opacity: areaConditions.max_height_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความสูงสูงสุด (MAX HEIGHT)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.max_height_enabled} onChange={e => setAreaConditions({ ...areaConditions, max_height_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.max_height_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.max_height_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.max_height ?? ''} onChange={e => setAreaConditions({ ...areaConditions, max_height: Number(e.target.value) })} disabled={!areaConditions.max_height_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MIN PRICE WIDTH */}
                                                <div style={{ opacity: areaConditions.min_price_width_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความกว้างขั้นต่ำคิดราคา</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.min_price_width_enabled} onChange={e => setAreaConditions({ ...areaConditions, min_price_width_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.min_price_width_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.min_price_width_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.min_price_width ?? ''} onChange={e => setAreaConditions({ ...areaConditions, min_price_width: Number(e.target.value) })} disabled={!areaConditions.min_price_width_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MIN PRICE HEIGHT */}
                                                <div style={{ opacity: areaConditions.min_price_height_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ความสูงขั้นต่ำคิดราคา</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.min_price_height_enabled} onChange={e => setAreaConditions({ ...areaConditions, min_price_height_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.min_price_height_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.min_price_height_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.min_price_height ?? ''} onChange={e => setAreaConditions({ ...areaConditions, min_price_height: Number(e.target.value) })} disabled={!areaConditions.min_price_height_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* HEIGHT STEP */}
                                                <div style={{ opacity: areaConditions.height_step_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>คิดความสูงทุกๆ (STEP)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.height_step_enabled} onChange={e => setAreaConditions({ ...areaConditions, height_step_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.height_step_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.height_step_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.height_step ?? ''} onChange={e => setAreaConditions({ ...areaConditions, height_step: Number(e.target.value) })} disabled={!areaConditions.height_step_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>เมตร</span>
                                                    </div>
                                                </div>

                                                {/* MIN AREA */}
                                                <div style={{ opacity: areaConditions.min_area_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>พื้นที่ขั้นต่ำ (MIN AREA)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.min_area_enabled} onChange={e => setAreaConditions({ ...areaConditions, min_area_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.min_area_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.min_area_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.min_area ?? ''} onChange={e => setAreaConditions({ ...areaConditions, min_area: Number(e.target.value) })} disabled={!areaConditions.min_area_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{calcMethod === 'area_sqyd' ? 'ตร.หลา' : 'ตร.ม.'}</span>
                                                    </div>
                                                </div>

                                                {/* AREA FACTOR */}
                                                <div style={{ opacity: areaConditions.area_factor_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ตัวคูณพื้นที่ (FACTOR)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.area_factor_enabled} onChange={e => setAreaConditions({ ...areaConditions, area_factor_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.area_factor_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.area_factor_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.0001" value={areaConditions.area_factor ?? ''} onChange={e => setAreaConditions({ ...areaConditions, area_factor: Number(e.target.value) })} disabled={!areaConditions.area_factor_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '2rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>X</span>
                                                    </div>
                                                </div>

                                                {/* AREA ROUNDING */}
                                                <div style={{ opacity: areaConditions.area_rounding_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>ปัดเศษพื้นที่ขึ้นเป็น (ROUNDING)</label>
                                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                                            <input type="checkbox" checked={areaConditions.area_rounding_enabled} onChange={e => setAreaConditions({ ...areaConditions, area_rounding_enabled: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: areaConditions.area_rounding_enabled ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: areaConditions.area_rounding_enabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="number" step="0.01" value={areaConditions.area_rounding ?? ''} onChange={e => setAreaConditions({ ...areaConditions, area_rounding: Number(e.target.value) })} disabled={!areaConditions.area_rounding_enabled} className="input-field" style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem' }} placeholder="-" />
                                                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{calcMethod === 'area_sqyd' ? 'ตร.หลา' : 'ตร.ม.'}</span>
                                                    </div>
                                                </div>
                                            </>)}

                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- Required Production Measurements Section --- */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: productionReqsOpen ? 'var(--bg-card-hover)' : 'transparent',
                                }}
                                onClick={() => setProductionReqsOpen(!productionReqsOpen)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ruler size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)', fontWeight: 600 }}>ระยะที่ต้องใช้สั่งผลิต</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>คลิกเพื่อ{productionReqsOpen ? 'ซ่อน' : 'แสดง'}การตั้งค่าระยะของหมวดหมู่นี้</p>
                                    </div>
                                </div>
                                {productionReqsOpen ? <ChevronUp color="var(--text-muted)" /> : <ChevronDown color="var(--text-muted)" />}
                            </div>

                            {productionReqsOpen && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                                        {/* วงกบ (Frame) */}
                                        <div>
                                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 4, height: 16, background: '#3b82f6', borderRadius: 2 }}></div> วงกบ
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.frame_width} onChange={e => setProductionReqs({ ...productionReqs, frame_width: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>กว้าง (cm)</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.frame_height} onChange={e => setProductionReqs({ ...productionReqs, frame_height: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>สูง (cm)</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.frame_top_floor} onChange={e => setProductionReqs({ ...productionReqs, frame_top_floor: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>บน-พื้น (cm)</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* เพดาน (Ceiling) */}
                                        <div>
                                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 4, height: 16, background: '#8b5cf6', borderRadius: 2 }}></div> เพดาน
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.ceiling_left} onChange={e => setProductionReqs({ ...productionReqs, ceiling_left: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>เพดานซ้าย</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.ceiling_center} onChange={e => setProductionReqs({ ...productionReqs, ceiling_center: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>เพดานกลาง</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.ceiling_right} onChange={e => setProductionReqs({ ...productionReqs, ceiling_right: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>เพดานขวา</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.ceiling_full_width} onChange={e => setProductionReqs({ ...productionReqs, ceiling_full_width: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>กว้างเต็ม (cm)</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* เพดานตัวน้อยที่สุด (Gen) */}
                                        <div>
                                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 4, height: 16, background: '#a855f7', borderRadius: 2 }}></div> เพดานตัวน้อยที่สุด
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={productionReqs.ceiling_gen} onChange={e => setProductionReqs({ ...productionReqs, ceiling_gen: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                    <span style={{ fontSize: '0.9rem' }}>ต้องการค่านี้</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* ระยะออกข้าง & ขนาดสั่งผลิต */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: 4, height: 16, background: '#f59e0b', borderRadius: 2 }}></div> ระยะออกข้าง (บันทึกเพิ่มเติม)
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={productionReqs.clearance_left} onChange={e => setProductionReqs({ ...productionReqs, clearance_left: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                        <span style={{ fontSize: '0.9rem' }}>ซ้าย</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={productionReqs.clearance_right} onChange={e => setProductionReqs({ ...productionReqs, clearance_right: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                        <span style={{ fontSize: '0.9rem' }}>ขวา</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: 4, height: 16, background: '#10b981', borderRadius: 2 }}></div> ขนาดสั่งผลิต
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={productionReqs.production_width} onChange={e => setProductionReqs({ ...productionReqs, production_width: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                        <span style={{ fontSize: '0.9rem' }}>กว้าง (cm)</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={productionReqs.production_height} onChange={e => setProductionReqs({ ...productionReqs, production_height: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                                                        <span style={{ fontSize: '0.9rem' }}>สูง (cm)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items Section */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>รายการสั่งของ</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>รายการสินค้าที่สั่งผลิตในหมวดหมู่ "{selectedCategory.name}"</p>
                                    </div>
                                </div>
                                <button onClick={() => handleOpenProductModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    <Plus size={16} />
                                    เพิ่มรายการ
                                </button>
                            </div>

                            {loadingProducts ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
                            ) : categoryProducts.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ชื่อรายการ</th>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคาเริ่มต้น</th>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>หน่วย</th>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>สถานะ</th>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryProducts.map((product) => (
                                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                                                <td style={{ padding: '0.8rem 1.5rem' }}>
                                                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{product.name}</div>
                                                    {product.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{product.description}</div>}
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text)' }}>
                                                    {formatCurrency(product.base_price)}
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    {product.unit}
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem', textAlign: 'center' }}>
                                                    {product.is_active ? (
                                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#dcfce7', color: '#166534', fontSize: '0.8rem' }}>ใช้งาน</span>
                                                    ) : (
                                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#f3f4f6', color: '#4b5563', fontSize: '0.8rem' }}>ระงับ</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button onClick={() => handleOpenProductModal(product)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem' }} title="แก้ไข">
                                                            <Edit size={15} />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} title="ลบ" disabled={isSubmitting}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
                                        <ShoppingBag size={28} />
                                    </div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีรายการสั่งของในหมวดหมู่นี้</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>เพิ่มรายการเพื่อใช้ในระบบเสนอราคาและคำนวณต้นทุน</p>
                                    <button onClick={() => handleOpenProductModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <Plus size={16} />
                                        เพิ่มรายการแรก
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Create/Edit Modal */}
                    <dialog ref={productDialogRef} style={{ padding: 0, border: 'none', borderRadius: '1rem', background: 'transparent', width: '100%', maxWidth: '480px' }}>
                        <div style={{ background: 'var(--bg-main)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                                    {editingProduct ? 'แก้ไขรายการ' : 'เพิ่มรายการสั่งของ'}
                                </h2>
                                <button onClick={handleCloseProductModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleProductSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>ชื่อรายการ</label>
                                    <input
                                        type="text"
                                        required
                                        value={productFormData.name}
                                        onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="เช่น ผ้าม่าน, รางอลูมิเนียม"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>ราคาเริ่มต้น (บาท)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={productFormData.base_price}
                                            onChange={e => setProductFormData({ ...productFormData, base_price: Number(e.target.value) })}
                                            className="input-field"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '120px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>หน่วย</label>
                                        <select
                                            value={productFormData.unit}
                                            onChange={e => setProductFormData({ ...productFormData, unit: e.target.value })}
                                            className="input-field"
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>สถานะ</label>
                                    <select
                                        value={productFormData.is_active ? 'true' : 'false'}
                                        onChange={e => setProductFormData({ ...productFormData, is_active: e.target.value === 'true' })}
                                        className="input-field"
                                    >
                                        <option value="true">ใช้งาน</option>
                                        <option value="false">ระงับ</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>คำอธิบายเพิ่มเติม</label>
                                    <textarea
                                        value={productFormData.description}
                                        onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                                        className="input-field"
                                        rows={2}
                                        placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={handleCloseProductModal} className="btn-secondary">
                                        ยกเลิก
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ minWidth: '110px' }}>
                                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                </main>
            </div>
        );
    }

    // ========================================================================
    // RENDER: Category List View
    // ========================================================================
    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
            <main style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>จัดการสินค้า</h1>
                            <p style={{ color: 'var(--text-muted)' }}>เลือกหมวดหมู่เพื่อตั้งค่าวิธีคำนวณราคาและรายการสั่งของ</p>
                        </div>
                        <button onClick={() => handleOpenCategoryModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} />
                            เพิ่มหมวดหมู่
                        </button>
                    </div>

                    {/* Category Grid */}
                    {loadingCategories ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
                    ) : categories.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => handleSelectCategory(cat)}
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--border)',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <ListTree size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1.05rem' }}>{cat.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {CALC_METHODS.find(m => m.value === cat.sales_calc_method)?.label || 'ยังไม่ได้ตั้งค่า'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(cat); }}
                                            className="btn-secondary"
                                            style={{ padding: '0.4rem', borderRadius: '0.5rem' }}
                                            title="แก้ไขชื่อ"
                                        >
                                            <Edit size={15} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteCategory(e, cat.id)}
                                            className="btn-secondary"
                                            style={{ padding: '0.4rem', borderRadius: '0.5rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }}
                                            title="ลบ"
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
                                <ListTree size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีหมวดหมู่สินค้า</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>เพิ่มหมวดหมู่เพื่อจัดกลุ่มสินค้าของคุณ</p>
                            <button onClick={() => handleOpenCategoryModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} />
                                เพิ่มหมวดหมู่แรก
                            </button>
                        </div>
                    )}
                </div>

                {/* Category Name Create/Edit Modal */}
                <dialog ref={categoryDialogRef} style={{ padding: 0, border: 'none', borderRadius: '1rem', background: 'transparent', width: '100%', maxWidth: '400px' }}>
                    <div style={{ background: 'var(--bg-main)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                                {editingCategoryName ? 'แก้ไขชื่อหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                            </h2>
                            <button onClick={handleCloseCategoryModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>ชื่อหมวดหมู่</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    className="input-field"
                                    placeholder="เช่น ม่านลอน, วอลเปเปอร์"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={handleCloseCategoryModal} className="btn-secondary">
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={isSubmitting || !categoryName.trim()} className="btn-primary" style={{ minWidth: '100px' }}>
                                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </dialog>
            </main>
        </div>
    );
}
