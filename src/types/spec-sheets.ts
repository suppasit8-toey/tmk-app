export type SpecSheetStatus = 'draft' | 'completed';

export interface SpecSheet {
    id: string;
    project_id: string;
    bill_id: string;
    status: SpecSheetStatus;
    created_at: string;
    updated_at: string;
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
    created_at: string;
}
