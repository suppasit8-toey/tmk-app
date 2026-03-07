export type SpecSheetStatus = 'draft' | 'completed';

export interface SpecSheet {
    id: string;
    project_id: string;
    bill_id: string;
    document_no: string;
    status: string;
    created_at: string;
    updated_at: string;
    items?: SpecSheetItem[];
}

export interface SpecSheetItem {
    id: string;
    spec_sheet_id: string;
    measurement_item_id: string | null;
    location_name: string;
    category_name: string | null;
    order_width: number;
    order_height: number;
    product_id: string | null;
    product_name: string;
    unit_price: number;
    notes: string | null;
    design_options?: any;
    created_at: string;
}
