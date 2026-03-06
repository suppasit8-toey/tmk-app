export interface Supplier {
    id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    products?: SupplierProduct[];
}

export interface SupplierProduct {
    id: string;
    supplier_id: string;
    category: string;
    product_code: string;
    name: string;
    description: string | null;
    tags: string[];
    unit: string;
    price_per_unit: number;
    is_active: boolean;
    created_at: string;
}
