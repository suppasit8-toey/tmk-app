export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export interface Project {
    id: string;
    project_number: string;
    name: string;
    customer_id: string | null;
    referrer_id?: string | null;
    status: ProjectStatus;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;

    // Joined
    customer?: any; // from Customer
}

export interface LocationWindow {
    id: string;
    location_id: string;
    name: string;
    details: string | null;
    image_urls: string[];
    created_at: string;
}

export interface ProjectLocation {
    id: string;
    project_id: string;
    floor: string;
    room_name: string;
    details: string | null;
    created_at: string;
    updated_at: string;
    windows?: LocationWindow[];
}
