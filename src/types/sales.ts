export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';

export interface Store {
    id: string;
    name: string;
    tax_id: string | null;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
}


export interface Referrer {
    id: string;
    name: string;
    phone: string | null;
    line_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    line_id: string | null;
    address: string | null;
    location_url: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    referrer_id?: string | null;
    referrer?: Referrer | null;
}

export interface CorporateCustomer {
    id: string;
    company_name: string;
    tax_id: string | null;
    contact_person: string | null;
    phone: string | null;
    line_id: string | null;
    address: string | null;
    location_url: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    referrer_id?: string | null;
    referrer?: Referrer | null;
}

export interface Quotation {
    id: string;
    quotation_number: string;
    customer_id: string | null;
    salesperson_id: string | null;
    status: QuotationStatus;
    total_amount: number;
    tax_amount: number;
    grand_total: number;
    valid_until: string | null;
    notes: string | null;
    project_id?: string | null;
    corporate_customer_id?: string | null;
    store_id?: string | null;
    created_at: string;
    updated_at: string;

    // Joined relations if we fetch them
    customer?: Customer;
    corporate_customer?: CorporateCustomer;
    salesperson?: any; // AppProfile ideally
    store?: Store;
}

export interface QuotationItem {
    id: string;
    quotation_id: string | null;
    product_name: string;
    description: string | null;
    width: number | null;
    height: number | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
}
