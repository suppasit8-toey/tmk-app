export type JobStatus = 'pending' | 'measuring' | 'measured' | 'installing' | 'completed' | 'cancelled';

export interface InstallationJob {
    id: string;
    job_number: string;
    quotation_id: string | null;
    customer_id: string | null;
    status: JobStatus;
    assigned_to: string | null;
    scheduled_date: string | null;
    scheduled_time: string | null;
    address: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;

    // Joined relations
    customer?: {
        first_name: string;
        last_name: string;
        phone: string | null;
        line_id: string | null;
        address: string | null;
    };
    quotation?: {
        quotation_number: string;
        grand_total: number;
        status: string;
    };
    assignee?: {
        first_name: string;
        last_name: string;
    };
}

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'รอดำเนินการ', color: '#f59e0b', bg: '#fef3e2' },
    measuring: { label: 'กำลังวัดงาน', color: '#3b82f6', bg: '#dbeafe' },
    measured: { label: 'วัดเสร็จแล้ว', color: '#8b5cf6', bg: '#f5f3ff' },
    installing: { label: 'กำลังติดตั้ง', color: '#f97316', bg: '#fff7ed' },
    completed: { label: 'เสร็จสิ้น', color: '#22c55e', bg: '#dcfce7' },
    cancelled: { label: 'ยกเลิก', color: '#94a3b8', bg: '#f1f5f9' },
};
