import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { InventoryItem, PurchaseOrder, CATEGORY_CONFIG, PO_STATUS_CONFIG, ItemCategory } from '@/types/inventory';
import { addInventoryItem, updateStock, deleteInventoryItem, createPurchaseOrder, updatePOStatus } from './actions';
import { Package, Plus, AlertTriangle, Trash2, ArrowUpDown, ShoppingCart, TrendingUp, TrendingDown, Archive } from 'lucide-react';

export default async function InventoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/inventory')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    const { data: itemsData } = await supabase
        .from('inventory_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
    const items = (itemsData || []) as InventoryItem[];

    const { data: posData } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    const purchaseOrders = (posData || []) as PurchaseOrder[];

    // Stats
    const totalItems = items.length;
    const lowStock = items.filter(i => Number(i.quantity) <= Number(i.min_quantity) && Number(i.min_quantity) > 0).length;
    const totalValue = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.cost_price), 0);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 className="page-title">
                สต็อก / สั่งของ
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6', width: '2.5rem', height: '2.5rem' }}>
                        <Package size={16} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>รายการทั้งหมด</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalItems}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: lowStock > 0 ? '#fee2e2' : '#dcfce7', color: lowStock > 0 ? '#ef4444' : '#22c55e', width: '2.5rem', height: '2.5rem' }}>
                        <AlertTriangle size={16} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>สต็อกต่ำ</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700, color: lowStock > 0 ? '#ef4444' : 'inherit' }}>{lowStock}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '2.5rem', height: '2.5rem' }}>
                        <Archive size={16} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>มูลค่าคงเหลือ</p>
                        <p className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700 }}>฿{totalValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Inventory Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><Package size={18} /></div>
                            <h2 className="section-title">รายการสินค้า</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={thStyle}>SKU</th>
                                        <th style={thStyle}>ชื่อสินค้า</th>
                                        <th style={thStyle}>หมวดหมู่</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>คงเหลือ</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>ต้นทุน</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>ปรับสต็อก</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>ลบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const isLow = Number(item.quantity) <= Number(item.min_quantity) && Number(item.min_quantity) > 0;
                                        const catCfg = CATEGORY_CONFIG[item.category as ItemCategory] || CATEGORY_CONFIG.other;
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: isLow ? '#fff5f5' : 'transparent' }}>
                                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-dim)', background: 'var(--bg-input)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{item.sku}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                    {item.supplier && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.supplier}</div>}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span className="badge" style={{ background: catCfg.bg, color: catCfg.color }}>{catCfg.label}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                    <span style={{ color: isLow ? '#ef4444' : 'inherit' }}>
                                                        {Number(item.quantity).toLocaleString()} {item.unit}
                                                    </span>
                                                    {isLow && <AlertTriangle size={12} style={{ color: '#ef4444', marginLeft: '0.3rem', verticalAlign: 'middle' }} />}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                    ฿{Number(item.cost_price).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                                    <form action={updateStock} style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', alignItems: 'center' }}>
                                                        <input type="hidden" name="itemId" value={item.id} />
                                                        <input name="adjustment" type="number" step="0.01" placeholder="±" style={{ width: '4.5rem', textAlign: 'center', padding: '0.35rem', fontSize: '0.75rem' }} />
                                                        <button type="submit" style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', border: 'none', background: '#dbeafe', color: '#3b82f6', cursor: 'pointer', display: 'flex' }}>
                                                            <ArrowUpDown size={12} />
                                                        </button>
                                                    </form>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <form action={async () => { 'use server'; await deleteInventoryItem(item.id); }}>
                                                        <button type="submit" style={{ padding: '0.3rem', borderRadius: '0.35rem', border: 'none', color: '#ef4444', background: '#fee2e2', cursor: 'pointer' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </form>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr><td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <Package size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                                            <p>ยังไม่มีรายการสินค้า</p>
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>เพิ่มสินค้าจากฟอร์มด้านขวา</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Purchase Orders */}
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><ShoppingCart size={18} /></div>
                            <h2 className="section-title">ใบสั่งซื้อล่าสุด</h2>
                        </div>
                        {purchaseOrders.map(po => {
                            const cfg = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.draft;
                            return (
                                <div key={po.id} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{po.po_number}</span>
                                        <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{po.supplier}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                        {po.status === 'draft' && (
                                            <form action={async () => { 'use server'; await updatePOStatus(po.id, 'ordered'); }}>
                                                <button type="submit" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '999px', border: 'none', background: '#dbeafe', color: '#3b82f6', fontWeight: 500, cursor: 'pointer' }}>
                                                    สั่งซื้อ
                                                </button>
                                            </form>
                                        )}
                                        {po.status === 'ordered' && (
                                            <form action={async () => { 'use server'; await updatePOStatus(po.id, 'received'); }}>
                                                <button type="submit" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '999px', border: 'none', background: '#dcfce7', color: '#22c55e', fontWeight: 500, cursor: 'pointer' }}>
                                                    รับของแล้ว
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {purchaseOrders.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                ยังไม่มีใบสั่งซื้อ
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel — Add Item + Create PO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1rem', height: 'fit-content' }}>
                    {/* Add Inventory Item */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><Plus size={18} /></div>
                            <h2 className="section-title">เพิ่มสินค้า</h2>
                        </div>
                        <form action={addInventoryItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>SKU *</label>
                                    <input name="sku" type="text" required placeholder="FAB-001" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>หมวดหมู่</label>
                                    <select name="category" style={{ width: '100%' }}>
                                        <option value="fabric">ผ้า</option>
                                        <option value="rail">ราง</option>
                                        <option value="accessory">อุปกรณ์</option>
                                        <option value="other">อื่นๆ</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>ชื่อสินค้า *</label>
                                <input name="name" type="text" required placeholder="ชื่อผ้า / ราง / อุปกรณ์" style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>จำนวน</label>
                                    <input name="quantity" type="number" step="0.01" defaultValue="0" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>หน่วย</label>
                                    <select name="unit" style={{ width: '100%' }}>
                                        <option value="เมตร">เมตร</option>
                                        <option value="ม้วน">ม้วน</option>
                                        <option value="ชิ้น">ชิ้น</option>
                                        <option value="ชุด">ชุด</option>
                                        <option value="อัน">อัน</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>ราคาทุน</label>
                                    <input name="costPrice" type="number" step="0.01" defaultValue="0" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>ราคาขาย</label>
                                    <input name="sellPrice" type="number" step="0.01" defaultValue="0" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>สต็อกขั้นต่ำ (แจ้งเตือน)</label>
                                <input name="minQuantity" type="number" step="0.01" defaultValue="0" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>ผู้จำหน่าย</label>
                                <input name="supplier" type="text" placeholder="ชื่อร้าน/ผู้จำหน่าย" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>ที่เก็บ</label>
                                <input name="location" type="text" placeholder="ตำแหน่งจัดเก็บ" style={{ width: '100%' }} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                <Plus size={16} /> เพิ่มสินค้า
                            </button>
                        </form>
                    </div>

                    {/* Create PO */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <div className="header-icon" style={{ background: '#fef3e2', color: '#f59e0b' }}><ShoppingCart size={18} /></div>
                            <h2 className="section-title">สร้างใบสั่งซื้อ</h2>
                        </div>
                        <form action={createPurchaseOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>ผู้จำหน่าย *</label>
                                <input name="supplier" type="text" required placeholder="ชื่อร้าน/ผู้จำหน่าย" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>หมายเหตุ</label>
                                <textarea name="notes" rows={2} placeholder="บันทึกเพิ่มเติม..." style={{ width: '100%', resize: 'none' }}></textarea>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                <ShoppingCart size={16} /> สร้างใบสั่งซื้อ
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.65rem 1rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-dim)',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.3rem',
};
