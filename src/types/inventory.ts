export type ItemCategory = 'fabric' | 'rail' | 'accessory' | 'other';
export type POStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: ItemCategory;
    unit: string;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    sell_price: number;
    supplier: string | null;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    supplier: string;
    status: POStatus;
    total_amount: number;
    notes: string | null;
    ordered_by: string | null;
    created_at: string;
    updated_at: string;
    items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string | null;
    inventory_item_id: string | null;
    item_name: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    created_at: string;
}

export const CATEGORY_CONFIG: Record<ItemCategory, { label: string; color: string; bg: string }> = {
    fabric: { label: 'ผ้า', color: '#8b5cf6', bg: '#f5f3ff' },
    rail: { label: 'ราง', color: '#3b82f6', bg: '#dbeafe' },
    accessory: { label: 'อุปกรณ์', color: '#f59e0b', bg: '#fef3e2' },
    other: { label: 'อื่นๆ', color: '#64748b', bg: '#f1f5f9' },
};

export const PO_STATUS_CONFIG: Record<POStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'ฉบับร่าง', color: '#64748b', bg: '#f1f5f9' },
    ordered: { label: 'สั่งแล้ว', color: '#3b82f6', bg: '#dbeafe' },
    received: { label: 'รับของแล้ว', color: '#22c55e', bg: '#dcfce7' },
    cancelled: { label: 'ยกเลิก', color: '#94a3b8', bg: '#f1f5f9' },
};
