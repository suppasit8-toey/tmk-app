export type DocType = 'invoice' | 'receipt' | 'expense';
export type DocStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'credit' | 'other';

export interface AccountingDoc {
    id: string;
    doc_number: string;
    doc_type: DocType;
    status: DocStatus;
    customer_id: string | null;
    quotation_id: string | null;
    amount: number;
    tax_rate: number;
    tax_amount: number;
    grand_total: number;
    payment_method: PaymentMethod | null;
    payment_date: string | null;
    due_date: string | null;
    description: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;

    customer?: {
        first_name: string;
        last_name: string;
    };
    quotation?: {
        quotation_number: string;
    };
}

export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; bg: string; prefix: string }> = {
    invoice: { label: 'ใบแจ้งหนี้', color: '#3b82f6', bg: '#dbeafe', prefix: 'INV' },
    receipt: { label: 'ใบเสร็จรับเงิน', color: '#22c55e', bg: '#dcfce7', prefix: 'REC' },
    expense: { label: 'ค่าใช้จ่าย', color: '#f59e0b', bg: '#fef3e2', prefix: 'EXP' },
};

export const DOC_STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'ฉบับร่าง', color: '#64748b', bg: '#f1f5f9' },
    issued: { label: 'ออกแล้ว', color: '#3b82f6', bg: '#dbeafe' },
    paid: { label: 'ชำระแล้ว', color: '#22c55e', bg: '#dcfce7' },
    overdue: { label: 'เกินกำหนด', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: 'ยกเลิก', color: '#94a3b8', bg: '#f1f5f9' },
};

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, string> = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    credit: 'บัตรเครดิต',
    other: 'อื่นๆ',
};
