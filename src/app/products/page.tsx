'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { PackageSearch, Plus, Search, Edit, Trash2, X, ListTree, ChevronRight, ArrowLeft, Calculator, DollarSign, ShoppingBag, Save, ChevronDown, ChevronUp, Ruler, Palette, Tag, Settings } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory, createDesign, updateDesign, deleteDesign, createFabricCode, updateFabricCode, deleteFabricCode, createDesignOption, updateDesignOption, deleteDesignOption } from './actions';
import { Product, ProductCategory, CategoryDesign, FabricPriceCode, CategoryDesignOption } from '@/types/products';

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

const SOURCE_OPTIONS: { value: string; label: string }[] = [
    { value: 'frame_width', label: 'กว้างวงกบ' },
    { value: 'frame_height', label: 'สูงวงกบ' },
    { value: 'frame_top_floor', label: 'บน-พื้น' },
    { value: 'ceiling_full_width', label: 'กว้างเพดานเต็ม' },
    { value: 'ceiling_left', label: 'เพดานซ้าย' },
    { value: 'ceiling_center', label: 'เพดานกลาง' },
    { value: 'ceiling_right', label: 'เพดานขวา' },
    { value: 'ceiling_gen', label: 'เพดานตัวน้อยที่สุด' },
];

export default function ProductsPage() {
    // ========================================================================
    // STATE
    // ========================================================================
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

    const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');
    const [activeCategoryTab, setActiveCategoryTab] = useState<'designs' | 'calculation' | 'products' | 'options'>('designs');

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingAllProducts, setLoadingAllProducts] = useState(false);

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
        srr_price: 0,
        cost_price: 0,
        unit: 'ตร.ม.',
        is_active: true,
        category_id: '',
        price_tiers: [] as { min_width: number; max_width: number; price: number; platform_price: number; sort_order: number }[]
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
    });

    // Design State
    const designDialogRef = useRef<HTMLDialogElement>(null);
    const [editingDesign, setEditingDesign] = useState<CategoryDesign | null>(null);
    const [designForm, setDesignForm] = useState({
        name: '', width_source: 'frame_width', width_offset_left: 0, width_offset_right: 0, height_source: 'frame_height', height_offset_top: 0, height_offset_bottom: 0, floor_clearance_options: [] as { name: string; value: number }[]
    });
    const [newSubOption, setNewSubOption] = useState({ name: '', value: 0 });

    // Fabric Price Code State
    const fabricDialogRef = useRef<HTMLDialogElement>(null);
    const [editingFabricCode, setEditingFabricCode] = useState<FabricPriceCode | null>(null);
    const [fabricForm, setFabricForm] = useState({
        code_name: '', code_color: '#ef4444', fabric_width: 2.8,
        normal_sell_price: 0, normal_cost_price: 0, rotated_cost_per_yard: 0,
    });
    const [fabricConstants, setFabricConstants] = useState({
        fabric_multiplier: 2.5, rail_cost_per_meter: 100, sewing_cost_per_meter: 180,
        selling_markup: 2, height_allowance: 0.5, normal_height_deduction: 0.4, fabric_width_deduction: 0.2,
    });

    // Design Option State
    const designOptionDialogRef = useRef<HTMLDialogElement>(null);
    const [editingDesignOption, setEditingDesignOption] = useState<CategoryDesignOption | null>(null);
    const [designOptionForm, setDesignOptionForm] = useState({ option_name: '', choices: [] as string[] });
    const [newChoiceText, setNewChoiceText] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (activeTab === 'products') {
            loadAllProducts();
        }
    }, [activeTab]);

    const loadAllProducts = async () => {
        setLoadingAllProducts(true);
        try {
            const data = await getProducts();
            setAllProducts(data);
        } catch (error) {
            console.error('Failed to load all products:', error);
        } finally {
            setLoadingAllProducts(false);
        }
    };

    const loadCategories = async () => {
        setLoadingCategories(true);
        setCategoryError(null);
        try {
            const data = await getProductCategories();
            setCategories(data);
        } catch (error: any) {
            console.error('Failed to load categories:', error);
            setCategoryError(error?.message || String(error));
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
        setFabricConstants({
            fabric_multiplier: cat.fabric_multiplier ?? 2.5,
            rail_cost_per_meter: cat.rail_cost_per_meter ?? 100,
            sewing_cost_per_meter: cat.sewing_cost_per_meter ?? 180,
            selling_markup: cat.selling_markup ?? 2,
            height_allowance: cat.height_allowance ?? 0.5,
            normal_height_deduction: cat.normal_height_deduction ?? 0.4,
            fabric_width_deduction: cat.fabric_width_deduction ?? 0.2,
        });

        // Parse JSONB production reqs
        const defaultReqs = {
            frame_width: false, frame_height: false, frame_top_floor: false,
            ceiling_left: false, ceiling_center: false, ceiling_right: false, ceiling_full_width: false, ceiling_gen: false,
            clearance_left: false, clearance_right: false,
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

    // --- Design CRUD ---
    const getSourceLabel = (key: string) => SOURCE_OPTIONS.find(s => s.value === key)?.label || key;

    const handleOpenDesignModal = (design?: CategoryDesign) => {
        if (design) {
            setEditingDesign(design);
            setDesignForm({
                name: design.name,
                width_source: design.width_source,
                width_offset_left: design.width_offset_left,
                width_offset_right: design.width_offset_right,
                height_source: design.height_source,
                height_offset_top: design.height_offset_top,
                height_offset_bottom: design.height_offset_bottom,
                floor_clearance_options: design.floor_clearance_options || [],
            });
        } else {
            setEditingDesign(null);
            setDesignForm({ name: '', width_source: 'frame_width', width_offset_left: 0, width_offset_right: 0, height_source: 'frame_height', height_offset_top: 0, height_offset_bottom: 0, floor_clearance_options: [] });
        }
        setNewSubOption({ name: '', value: 0 });
        designDialogRef.current?.showModal();
    };

    const handleDesignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                if (editingDesign) {
                    await updateDesign(editingDesign.id, designForm);
                } else {
                    await createDesign({
                        ...designForm,
                        category_id: selectedCategory.id,
                        sort_order: (selectedCategory.designs?.length || 0),
                    });
                }
                designDialogRef.current?.close();
                const data = await getProductCategories();
                setCategories(data);
                const updated = data.find((c: ProductCategory) => c.id === selectedCategory.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error saving design:', error);
                alert('เกิดข้อผิดพลาด');
            }
        });
    };

    const handleDeleteDesign = async (id: string) => {
        if (!confirm('ลบดีไซส์นี้?')) return;
        startTransition(async () => {
            try {
                await deleteDesign(id);
                const data = await getProductCategories();
                setCategories(data);
                const updated = data.find((c: ProductCategory) => c.id === selectedCategory!.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error deleting design:', error);
            }
        });
    };
    const handleOpenProductModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductFormData({
                name: product.name,
                description: product.description || '',
                base_price: product.base_price,
                srr_price: product.srr_price || 0,
                cost_price: product.cost_price || 0,
                unit: product.unit,
                is_active: product.is_active,
                category_id: product.category_id || (selectedCategory ? selectedCategory.id : (categories[0]?.id || '')),
                price_tiers: product.price_tiers ? [...product.price_tiers] : []
            });
        } else {
            setEditingProduct(null);
            setProductFormData({
                name: '',
                description: '',
                base_price: 0,
                srr_price: 0,
                cost_price: 0,
                unit: 'ตร.ม.',
                is_active: true,
                category_id: selectedCategory ? selectedCategory.id : (categories[0]?.id || ''),
                price_tiers: []
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
        if (!productFormData.category_id) {
            alert('กรุณาเลือกหมวดหมู่');
            return;
        }
        startTransition(async () => {
            try {
                // Determine if category uses step pricing
                const selectedCat = categories.find(c => c.id === productFormData.category_id);
                const isStepPricing = selectedCat?.sales_calc_method === 'step_width' || selectedCat?.sales_calc_method === 'step_width_height';

                const finalData = {
                    ...productFormData,
                    category_id: productFormData.category_id,
                    // Force base prices to 0 if using step pricing
                    base_price: isStepPricing ? 0 : productFormData.base_price,
                    srr_price: isStepPricing ? 0 : productFormData.srr_price,
                    // Only send price tiers if it's step pricing
                    price_tiers: isStepPricing ? productFormData.price_tiers : []
                };

                if (editingProduct) {
                    await updateProduct(editingProduct.id, finalData);
                } else {
                    await createProduct(finalData);
                }
                handleCloseProductModal();
                if (selectedCategory) {
                    await loadCategoryProducts(selectedCategory.id);
                }
                if (activeTab === 'products') {
                    await loadAllProducts();
                }
            } catch (error) {
                console.error('Error saving product:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        });
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;
        startTransition(async () => {
            try {
                await deleteProduct(id);
                if (selectedCategory) {
                    await loadCategoryProducts(selectedCategory.id);
                }
                if (activeTab === 'products') {
                    await loadAllProducts();
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        });
    };

    // --- Fabric Code CRUD ---
    const handleOpenFabricModal = (fc?: FabricPriceCode) => {
        if (fc) {
            setEditingFabricCode(fc);
            setFabricForm({
                code_name: fc.code_name, code_color: fc.code_color || '#ef4444',
                fabric_width: fc.fabric_width, normal_sell_price: fc.normal_sell_price,
                normal_cost_price: fc.normal_cost_price, rotated_cost_per_yard: fc.rotated_cost_per_yard,
            });
        } else {
            setEditingFabricCode(null);
            setFabricForm({ code_name: '', code_color: '#ef4444', fabric_width: 2.8, normal_sell_price: 0, normal_cost_price: 0, rotated_cost_per_yard: 0 });
        }
        fabricDialogRef.current?.showModal();
    };

    const handleCloseFabricModal = () => {
        fabricDialogRef.current?.close();
        setEditingFabricCode(null);
    };

    const handleFabricSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                if (editingFabricCode) {
                    await updateFabricCode(editingFabricCode.id, fabricForm);
                } else {
                    await createFabricCode({ ...fabricForm, category_id: selectedCategory.id });
                }
                handleCloseFabricModal();
                const cats = await getProductCategories();
                setCategories(cats);
                const updated = cats.find((c: ProductCategory) => c.id === selectedCategory.id);
                if (updated) setSelectedCategory(updated);
            } catch (error: any) {
                console.error('Error saving fabric code:', error);
                alert(`เกิดข้อผิดพลาดในการบันทึก: ${error?.message || error}`);
            }
        });
    };

    const handleDeleteFabricCode = async (id: string) => {
        if (!confirm('ลบรหัสราคาผ้านี้?')) return;
        startTransition(async () => {
            try {
                await deleteFabricCode(id);
                const cats = await getProductCategories();
                setCategories(cats);
                const updated = cats.find((c: ProductCategory) => c.id === selectedCategory?.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error deleting fabric code:', error);
            }
        });
    };

    const handleSaveFabricConstants = async () => {
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                await updateProductCategory(selectedCategory.id, {
                    sales_calc_method: calcMethod,
                    ...areaConditions,
                    ...fabricConstants,
                    production_reqs: productionReqs,
                });
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
                const cats = await getProductCategories();
                setCategories(cats);
                const updated = cats.find((c: ProductCategory) => c.id === selectedCategory.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('เกิดข้อผิดพลาด');
            }
        });
    };

    // --- Design Options CRUD ---
    const handleOpenDesignOptionModal = (opt?: CategoryDesignOption) => {
        if (opt) {
            setEditingDesignOption(opt);
            setDesignOptionForm({ option_name: opt.option_name, choices: [...opt.choices] });
        } else {
            setEditingDesignOption(null);
            setDesignOptionForm({ option_name: '', choices: [] });
        }
        setNewChoiceText('');
        designOptionDialogRef.current?.showModal();
    };

    const handleDesignOptionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        startTransition(async () => {
            try {
                if (editingDesignOption) {
                    await updateDesignOption(editingDesignOption.id, designOptionForm);
                } else {
                    await createDesignOption({
                        ...designOptionForm,
                        category_id: selectedCategory.id,
                        sort_order: (selectedCategory.design_options?.length || 0),
                    });
                }
                designOptionDialogRef.current?.close();
                const data = await getProductCategories();
                setCategories(data);
                const updated = data.find((c: ProductCategory) => c.id === selectedCategory.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error saving design option:', error);
                alert('เกิดข้อผิดพลาด');
            }
        });
    };

    const handleDeleteDesignOption = async (id: string) => {
        if (!confirm('ลบตัวเลือกนี้?')) return;
        startTransition(async () => {
            try {
                await deleteDesignOption(id);
                const data = await getProductCategories();
                setCategories(data);
                const updated = data.find((c: ProductCategory) => c.id === selectedCategory!.id);
                if (updated) setSelectedCategory(updated);
            } catch (error) {
                console.error('Error deleting design option:', error);
            }
        });
    };

    const handleAddChoice = () => {
        const text = newChoiceText.trim();
        if (!text) return;
        setDesignOptionForm(prev => ({ ...prev, choices: [...prev.choices, text] }));
        setNewChoiceText('');
    };

    const handleRemoveChoice = (index: number) => {
        setDesignOptionForm(prev => ({
            ...prev,
            choices: prev.choices.filter((_, i) => i !== index)
        }));
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

                        {/* Category Detail Tabs */}
                        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                            <button
                                onClick={() => setActiveCategoryTab('designs')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.75rem 0',
                                    fontSize: '1rem', fontWeight: activeCategoryTab === 'designs' ? 600 : 500,
                                    color: activeCategoryTab === 'designs' ? 'var(--primary)' : 'var(--text-muted)',
                                    borderBottom: activeCategoryTab === 'designs' ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <Palette size={18} /> ดีไซส์
                            </button>
                            <button
                                onClick={() => setActiveCategoryTab('calculation')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.75rem 0',
                                    fontSize: '1rem', fontWeight: activeCategoryTab === 'calculation' ? 600 : 500,
                                    color: activeCategoryTab === 'calculation' ? 'var(--primary)' : 'var(--text-muted)',
                                    borderBottom: activeCategoryTab === 'calculation' ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <Calculator size={18} /> วิธีคำนวณ
                            </button>
                            <button
                                onClick={() => setActiveCategoryTab('products')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.75rem 0',
                                    fontSize: '1rem', fontWeight: activeCategoryTab === 'products' ? 600 : 500,
                                    color: activeCategoryTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
                                    borderBottom: activeCategoryTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <ShoppingBag size={18} /> รายการสั่งของ
                            </button>
                            <button
                                onClick={() => setActiveCategoryTab('options')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.75rem 0',
                                    fontSize: '1rem', fontWeight: activeCategoryTab === 'options' ? 600 : 500,
                                    color: activeCategoryTab === 'options' ? 'var(--primary)' : 'var(--text-muted)',
                                    borderBottom: activeCategoryTab === 'options' ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <Settings size={18} /> ตัวเลือก
                            </button>
                        </div>

                        {/* DESIGNS TAB */}
                        {activeCategoryTab === 'designs' && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Palette size={18} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ดีไซส์</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>สูตรคำนวณขนาดสั่งผลิต (กว้าง/สูง) จากค่าวัดจริง</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenDesignModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        <Plus size={16} /> เพิ่มดีไซส์
                                    </button>
                                </div>

                                {(selectedCategory.designs || []).length > 0 ? (
                                    <div>
                                        {(selectedCategory.designs || []).map(d => (
                                            <div key={d.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>{d.name}</div>
                                                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
                                                            กว้างสั่ง = {getSourceLabel(d.width_source)} + L{d.width_offset_left} + R{d.width_offset_right} cm
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                                                            สูงสั่ง = {getSourceLabel(d.height_source)} + ขึ้น{d.height_offset_top} + ลง{d.height_offset_bottom} cm
                                                        </span>
                                                        {(d.floor_clearance_options || []).length > 0 && (
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }}></span>
                                                                ตัวเลือกย่อย: {(d.floor_clearance_options as { name: string; value: number }[]).map(o => `${o.name} (${o.value >= 0 ? '+' : ''}${o.value})`).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                    <button onClick={() => handleOpenDesignModal(d)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem' }} title="แก้ไข"><Edit size={15} /></button>
                                                    <button onClick={() => handleDeleteDesign(d.id)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} title="ลบ" disabled={isSubmitting}><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#ec4899' }}>
                                            <Palette size={24} />
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>ยังไม่มีดีไซส์</p>
                                        <button onClick={() => handleOpenDesignModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <Plus size={16} /> เพิ่มดีไซส์แรก
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CALCULATION METHOD TAB */}
                        {activeCategoryTab === 'calculation' && (
                            <>
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

                                {/* ===== Fabric Price Codes Section ===== */}
                                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ระดับรหัสราคาผ้า</h3>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>จัดการรหัสราคาผ้าม่านสำหรับหมวดนี้</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenFabricModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                            <Plus size={16} /> เพิ่มรหัส
                                        </button>
                                    </div>

                                    {(selectedCategory?.fabric_price_codes ?? []).length > 0 ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-main)' }}>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>รหัส</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>หน้าผ้า (ม.)</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ขาย/ม.ราง</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ทุน/ม.ราง</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ผ้า/หลา</th>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedCategory?.fabric_price_codes ?? []).map(fc => (
                                                        <tr key={fc.id} style={{ borderTop: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: fc.code_color || '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{fc.code_name}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem' }}>{fc.fabric_width}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem', color: '#16a34a', fontWeight: 600 }}>{formatCurrency(fc.normal_sell_price)}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem' }}>{formatCurrency(fc.normal_cost_price)}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.9rem', color: '#8b5cf6', fontWeight: 600 }}>{formatCurrency(fc.rotated_cost_per_yard)}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <button onClick={() => handleOpenFabricModal(fc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}><Edit size={16} /></button>
                                                                    <button onClick={() => handleDeleteFabricCode(fc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#f59e0b' }}>
                                                <Tag size={24} />
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>ยังไม่มีรหัสราคาผ้า</p>
                                            <button onClick={() => handleOpenFabricModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <Plus size={16} /> เพิ่มรหัสแรก
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ===== Fabric Constants ===== */}
                                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Calculator size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ค่าคงที่สำหรับสูตรคำนวณ</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>ปรับค่าคงที่ที่ใช้ในสูตรคำนวณกลับหน้าผ้า</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>ตัวคูณผ้า (จีบ)</label>
                                            <input type="number" step="0.1" value={fabricConstants.fabric_multiplier} onChange={e => setFabricConstants(p => ({ ...p, fabric_multiplier: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>ค่าราง/เมตร</label>
                                            <input type="number" step="1" value={fabricConstants.rail_cost_per_meter} onChange={e => setFabricConstants(p => ({ ...p, rail_cost_per_meter: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>ค่าเย็บ/เมตร</label>
                                            <input type="number" step="1" value={fabricConstants.sewing_cost_per_meter} onChange={e => setFabricConstants(p => ({ ...p, sewing_cost_per_meter: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>ตัวคูณราคาขาย</label>
                                            <input type="number" step="0.1" value={fabricConstants.selling_markup} onChange={e => setFabricConstants(p => ({ ...p, selling_markup: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>เผื่อความสูง (ม.)</label>
                                            <input type="number" step="0.1" value={fabricConstants.height_allowance} onChange={e => setFabricConstants(p => ({ ...p, height_allowance: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>หักหน้าผ้าตรวจสอบ (ม.)</label>
                                            <input type="number" step="0.1" value={fabricConstants.normal_height_deduction} onChange={e => setFabricConstants(p => ({ ...p, normal_height_deduction: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>หักหน้าผ้าคำนวณ (ม.)</label>
                                            <input type="number" step="0.1" value={fabricConstants.fabric_width_deduction} onChange={e => setFabricConstants(p => ({ ...p, fabric_width_deduction: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* ===== Formula Reference Cards ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {/* Normal Method */}
                                    <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '1rem', border: '1px solid #a7f3d0', padding: '1.25rem' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ✅ วิธีปกติ
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', color: '#065f46', margin: '0 0 0.5rem' }}>
                                            <strong>เงื่อนไข:</strong> สูงสั่งผลิต ≤ หน้าผ้า − {fabricConstants.normal_height_deduction}ม.
                                        </p>
                                        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.85rem', color: '#064e3b', fontFamily: 'monospace' }}>
                                            ราคาขาย = กว้างสั่ง × ราคาขาย/ม.ราง<br />
                                            ราคาทุน = กว้างสั่ง × ราคาทุน/ม.ราง
                                        </div>
                                    </div>
                                    {/* Rotated Method */}
                                    <div style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', borderRadius: '1rem', border: '1px solid #c4b5fd', padding: '1.25rem' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7c3aed', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🔄 กลับหน้าผ้า
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', color: '#5b21b6', margin: '0 0 0.5rem' }}>
                                            <strong>เงื่อนไข:</strong> สูงสั่งผลิต {'>'} หน้าผ้า − {fabricConstants.normal_height_deduction}ม.
                                        </p>
                                        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.82rem', color: '#3b0764', fontFamily: 'monospace', lineHeight: 1.8 }}>
                                            ชิ้นผ้า = กว้าง×{fabricConstants.fabric_multiplier} ÷ (หน้าผ้า−{fabricConstants.fabric_width_deduction})<br />
                                            ทุน = ชิ้นผ้า×(สูง+{fabricConstants.height_allowance})×ราคา/หลา<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ ราง{fabricConstants.rail_cost_per_meter}×กว้าง + เย็บ{fabricConstants.sewing_cost_per_meter}×กว้าง<br />
                                            ขาย = ceil(ทุน×{fabricConstants.selling_markup} ÷100)×100
                                        </div>
                                    </div>
                                </div>

                                {/* Save Settings Button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', width: '100%' }}>
                                    <button
                                        onClick={handleSaveFabricConstants}
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
                            </>
                        )}
                        {/* TAB: PRODUCTS */}
                        {
                            activeCategoryTab === 'products' && (
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
                                                    <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคาปกติ</th>
                                                    <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคา SRR</th>
                                                    <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคาทุน</th>
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
                                                        <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--primary)' }}>
                                                            {formatCurrency(product.srr_price || 0)}
                                                        </td>
                                                        <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: '#dc2626' }}>
                                                            {formatCurrency(product.cost_price || 0)}
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
                            )}

                        {/* OPTIONS TAB */}
                        {activeCategoryTab === 'options' && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Settings size={18} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>ตัวเลือกดีไซน์</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>สร้างกลุ่มตัวเลือกสำหรับหมวดหมู่นี้ เช่น โซ่ขวา/ซ้าย, สี, รุ่น</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenDesignOptionModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        <Plus size={16} /> เพิ่มตัวเลือก
                                    </button>
                                </div>

                                {(selectedCategory.design_options || []).length > 0 ? (
                                    <div>
                                        {(selectedCategory.design_options || []).map(opt => (
                                            <div key={opt.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Settings size={16} style={{ color: '#f59e0b' }} />
                                                            {opt.option_name}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            {(opt.choices || []).map((choice, idx) => (
                                                                <span key={idx} style={{
                                                                    padding: '0.3rem 0.75rem', borderRadius: '2rem',
                                                                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                                                    color: '#92400e', fontSize: '0.8rem', fontWeight: 500,
                                                                    border: '1px solid #fcd34d'
                                                                }}>
                                                                    {choice}
                                                                </span>
                                                            ))}
                                                            {(opt.choices || []).length === 0 && (
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>ยังไม่มีตัวเลือกย่อย</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                                                        <button onClick={() => handleOpenDesignOptionModal(opt)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem' }} title="แก้ไข"><Edit size={15} /></button>
                                                        <button onClick={() => handleDeleteDesignOption(opt.id)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '0.5rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} title="ลบ" disabled={isSubmitting}><Trash2 size={15} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#f59e0b' }}>
                                            <Settings size={24} />
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>ยังไม่มีตัวเลือกดีไซน์</p>
                                        <button onClick={() => handleOpenDesignOptionModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <Plus size={16} /> เพิ่มตัวเลือกแรก
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Design Option Dialog */}
                    <dialog ref={designOptionDialogRef} style={{ border: 'none', borderRadius: '1.25rem', padding: 0, maxWidth: '500px', width: '90vw', background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => { if (e.target === designOptionDialogRef.current) designOptionDialogRef.current?.close(); }}>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                    {editingDesignOption ? 'แก้ไขตัวเลือก' : 'เพิ่มตัวเลือกใหม่'}
                                </h2>
                                <button onClick={() => designOptionDialogRef.current?.close()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleDesignOptionSubmit}>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem', display: 'block' }}>ชื่อกลุ่มตัวเลือก</label>
                                        <input
                                            type="text"
                                            value={designOptionForm.option_name}
                                            onChange={e => setDesignOptionForm(prev => ({ ...prev, option_name: e.target.value }))}
                                            placeholder="เช่น โซ่, สี, รุ่น"
                                            required
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.65rem' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.5rem', display: 'block' }}>ตัวเลือกย่อย</label>

                                        {/* Existing choices */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            {designOptionForm.choices.map((choice, idx) => (
                                                <span key={idx} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.35rem 0.75rem', borderRadius: '2rem',
                                                    background: '#fef3c7', color: '#92400e', fontSize: '0.85rem',
                                                    fontWeight: 500, border: '1px solid #fcd34d'
                                                }}>
                                                    {choice}
                                                    <button type="button" onClick={() => handleRemoveChoice(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0', display: 'flex', lineHeight: 1 }}>
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>

                                        {/* Add new choice */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={newChoiceText}
                                                onChange={e => setNewChoiceText(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChoice(); } }}
                                                placeholder="พิมพ์ชื่อตัวเลือก แล้วกด Enter หรือ +"
                                                className="input-field"
                                                style={{ flex: 1, padding: '0.55rem' }}
                                            />
                                            <button type="button" onClick={handleAddChoice} className="btn-primary" style={{ padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center' }}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" onClick={() => designOptionDialogRef.current?.close()} className="btn-secondary" style={{ padding: '0.6rem 1rem' }}>ยกเลิก</button>
                                    <button type="submit" disabled={isSubmitting || !designOptionForm.option_name.trim()} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                                        {isSubmitting ? 'กำลังบันทึก...' : editingDesignOption ? 'บันทึกการแก้ไข' : 'เพิ่มตัวเลือก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </dialog>

                    {/* Fabric Code Modal */}
                    <dialog ref={fabricDialogRef} style={{ border: 'none', borderRadius: '1.25rem', padding: 0, maxWidth: '500px', width: '90vw', background: 'var(--bg-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => { if (e.target === fabricDialogRef.current) handleCloseFabricModal(); }}>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                    {editingFabricCode ? 'แก้ไขรหัสราคาผ้า' : 'เพิ่มรหัสราคาผ้า'}
                                </h2>
                                <button onClick={handleCloseFabricModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleFabricSubmit}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem', display: 'block' }}>ชื่อรหัส</label>
                                            <input type="text" required value={fabricForm.code_name} onChange={e => setFabricForm(p => ({ ...p, code_name: e.target.value }))} className="input-field" style={{ width: '100%', padding: '0.65rem' }} placeholder="เช่น แดง, ส้ม, ฟ้า" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem', display: 'block' }}>สี</label>
                                            <input type="color" value={fabricForm.code_color} onChange={e => setFabricForm(p => ({ ...p, code_color: e.target.value }))} style={{ width: '44px', height: '38px', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', padding: '2px' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem', display: 'block' }}>ความกว้างหน้าผ้า (เมตร)</label>
                                        <input type="number" step="0.01" required value={fabricForm.fabric_width} onChange={e => setFabricForm(p => ({ ...p, fabric_width: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.65rem' }} />
                                    </div>
                                    <div style={{ background: '#ecfdf5', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #a7f3d0' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#059669', margin: '0 0 0.75rem' }}>วิธีปกติ (ไม่เกินหน้าผ้า)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#065f46', marginBottom: '0.25rem', display: 'block' }}>ราคาขาย/ม.ราง</label>
                                                <input type="number" step="1" value={fabricForm.normal_sell_price} onChange={e => setFabricForm(p => ({ ...p, normal_sell_price: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#065f46', marginBottom: '0.25rem', display: 'block' }}>ราคาทุน/ม.ราง</label>
                                                <input type="number" step="1" value={fabricForm.normal_cost_price} onChange={e => setFabricForm(p => ({ ...p, normal_cost_price: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: '#faf5ff', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #c4b5fd' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7c3aed', margin: '0 0 0.75rem' }}>กลับหน้าผ้า (เกินหน้าผ้า)</h4>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#5b21b6', marginBottom: '0.25rem', display: 'block' }}>ราคาผ้า/หลา</label>
                                            <input type="number" step="1" value={fabricForm.rotated_cost_per_yard} onChange={e => setFabricForm(p => ({ ...p, rotated_cost_per_yard: Number(e.target.value) }))} className="input-field" style={{ width: '100%', padding: '0.6rem' }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={handleCloseFabricModal} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>ยกเลิก</button>
                                    <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </dialog>

                </main >
            </div >
        );
    }

    return (
        <div style={{ padding: '2rem', height: '100vh', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>จัดการสินค้า</h1>
                        <p style={{ color: 'var(--text-muted)' }}>จัดการและตั้งค่ารายการสินค้าและหมวดหมู่ทั้งหมด</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {activeTab === 'products' ? (
                            <button onClick={() => handleOpenProductModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} />
                                เพิ่มสินค้า
                            </button>
                        ) : (
                            <button onClick={() => handleOpenCategoryModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} />
                                เพิ่มหมวดหมู่
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('categories')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 0',
                            fontSize: '1rem', fontWeight: activeTab === 'categories' ? 600 : 500,
                            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <ListTree size={18} /> หมวดหมู่
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 0',
                            fontSize: '1rem', fontWeight: activeTab === 'products' ? 600 : 500,
                            color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <PackageSearch size={18} /> รายการสินค้า
                    </button>
                </div>

                {/* Tab Content: Categories */}
                {
                    activeTab === 'categories' && (
                        <>
                            {categoryError && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem 1.5rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
                                    <strong>Debug:</strong> {categoryError}
                                </div>
                            )}
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
                        </>
                    )
                }

                {/* Tab Content: All Products */}
                {
                    activeTab === 'products' && (
                        <>
                            {loadingAllProducts ? (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
                            ) : allProducts.length > 0 ? (
                                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ชื่อรายการ</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>หมวดหมู่</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคาปกติ</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคา SRR</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ราคาทุน</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>หน่วย</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>สถานะ</th>
                                                <th style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allProducts.map((product) => {
                                                const cat = categories.find(c => c.id === product.category_id);
                                                return (
                                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                                                        <td style={{ padding: '0.8rem 1.5rem' }}>
                                                            <div style={{ fontWeight: 500, color: 'var(--text)' }}>{product.name}</div>
                                                            {product.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{product.description}</div>}
                                                        </td>
                                                        <td style={{ padding: '0.8rem 1.5rem' }}>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'inline-block' }}>
                                                                {cat?.name || 'ไม่พบหมวดหมู่'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--text)' }}>
                                                            {formatCurrency(product.base_price)}
                                                        </td>
                                                        <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--primary)' }}>
                                                            {formatCurrency(product.srr_price || 0)}
                                                        </td>
                                                        <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right', fontWeight: 500, color: '#dc2626' }}>
                                                            {formatCurrency(product.cost_price || 0)}
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
                                        <PackageSearch size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>ยังไม่มีสินค้า</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>เพิ่มสินค้าเข้าระบบเพื่อเริ่มต้นใช้งาน</p>
                                    <button onClick={() => handleOpenProductModal()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Plus size={18} />
                                        เพิ่มสินค้าแรก
                                    </button>
                                </div>
                            )}
                        </>
                    )
                }
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

            {/* Product Create/Edit Modal (duplicate for main view) */}
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
                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>หมวดหมู่</label>
                            <select
                                value={productFormData.category_id}
                                onChange={e => setProductFormData({ ...productFormData, category_id: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

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



                        {/* Show standard prices only if NOT step pricing */}
                        {(() => {
                            const selectedCat = categories.find(c => c.id === productFormData.category_id);
                            const isStepPricing = selectedCat?.sales_calc_method === 'step_width' || selectedCat?.sales_calc_method === 'step_width_height';

                            if (!isStepPricing) {
                                return (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>ราคาขายปกติ (บาท)</label>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>ราคา SRR <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: '#e0e7ff', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>บาท</span></label>
                                            <input
                                                type="number"
                                                min="0"
                                                required
                                                value={productFormData.srr_price}
                                                onChange={e => setProductFormData({ ...productFormData, srr_price: Number(e.target.value) })}
                                                className="input-field"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>ราคาทุน <span style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fee2e2', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>บาท</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={productFormData.cost_price}
                                    onChange={e => setProductFormData({ ...productFormData, cost_price: Number(e.target.value) })}
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

                        {/* Step Pricing UI Section */}
                        {(() => {
                            const selectedCat = categories.find(c => c.id === productFormData.category_id);
                            const isStepPricing = selectedCat?.sales_calc_method === 'step_width' || selectedCat?.sales_calc_method === 'step_width_height';

                            if (isStepPricing) {
                                return (
                                    <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.4rem', borderRadius: '0.5rem' }}>
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>กำหนดราคาตามช่วงความกว้าง</h3>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>กำหนดช่วงความกว้างและราคาสำหรับแต่ละช่วง</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newTiers = [...productFormData.price_tiers];
                                                    const lastTier = newTiers[newTiers.length - 1];
                                                    newTiers.push({
                                                        min_width: lastTier ? lastTier.max_width + 0.01 : 0.01,
                                                        max_width: lastTier ? lastTier.max_width + 0.50 : 0.50,
                                                        price: 0,
                                                        platform_price: 0,
                                                        sort_order: newTiers.length
                                                    });
                                                    setProductFormData({ ...productFormData, price_tiers: newTiers, base_price: 0, srr_price: 0 });
                                                }}
                                                style={{ background: '#000', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                            >
                                                <Plus size={14} />
                                                เพิ่มช่วงราคา
                                            </button>
                                        </div>

                                        {productFormData.price_tiers.length > 0 ? (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>ความกว้างเริ่มต้น (ม.)</th>
                                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>ถึงความกว้าง (ม.)</th>
                                                        <th style={{ padding: '0.5rem', fontWeight: 500 }}>ราคาปกติ (บาท)</th>
                                                        <th style={{ padding: '0.5rem', fontWeight: 500, color: '#f97316' }}>ราคา Platform</th>
                                                        <th style={{ padding: '0.5rem', width: '40px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {productFormData.price_tiers.map((tier, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '0.25rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', textAlign: 'center' }}
                                                                    value={tier.min_width}
                                                                    onChange={e => {
                                                                        const newTiers = [...productFormData.price_tiers];
                                                                        newTiers[index].min_width = Number(e.target.value);
                                                                        setProductFormData({ ...productFormData, price_tiers: newTiers });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.25rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', textAlign: 'center' }}
                                                                    value={tier.max_width}
                                                                    onChange={e => {
                                                                        const newTiers = [...productFormData.price_tiers];
                                                                        newTiers[index].max_width = Number(e.target.value);
                                                                        setProductFormData({ ...productFormData, price_tiers: newTiers });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.25rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', textAlign: 'center' }}
                                                                    value={tier.price}
                                                                    onChange={e => {
                                                                        const newTiers = [...productFormData.price_tiers];
                                                                        newTiers[index].price = Number(e.target.value);
                                                                        setProductFormData({ ...productFormData, price_tiers: newTiers });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.25rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #fed7aa', textAlign: 'center', color: '#ea580c' }}
                                                                    value={tier.platform_price}
                                                                    onChange={e => {
                                                                        const newTiers = [...productFormData.price_tiers];
                                                                        newTiers[index].platform_price = Number(e.target.value);
                                                                        setProductFormData({ ...productFormData, price_tiers: newTiers });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newTiers = productFormData.price_tiers.filter((_, i) => i !== index);
                                                                        // Update sort_order for remaining
                                                                        newTiers.forEach((t, i) => t.sort_order = i);
                                                                        setProductFormData({ ...productFormData, price_tiers: newTiers });
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.2rem' }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                ยังไม่มีช่วงราคา กรุณากดปุ่ม "+ เพิ่มช่วงราคา" เพื่อเริ่มต้น
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })()}

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
        </div>
    );
}
