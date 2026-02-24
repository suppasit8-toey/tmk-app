export type MeasurementBillStatus = 'draft' | 'completed' | 'cancelled';
export type MeasurementMode = 'curtain' | 'wallpaper' | 'film';

export interface MeasurementItem {
    id: string;
    bill_id: string;
    location_name: string;
    details: string | null;
    image_urls: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface MeasurementBill {
    id: string;
    bill_number: string;
    project_id: string | null;
    customer_id: string | null;
    measurer_id: string | null;
    measurement_date: string | null;
    measurement_mode: MeasurementMode;
    status: MeasurementBillStatus;
    notes: string | null;
    file_url: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;

    // Joined relations
    measurer?: { first_name: string | null, last_name: string | null };
    items?: MeasurementItem[];
}
