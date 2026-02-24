export interface Product {
    id: string;
    name: string;
    category_id: string;
    description: string | null;
    base_price: number;
    unit: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductCategory {
    id: string;
    name: string;
    sales_calc_method: string;
    cost_calc_method: string;
    // Area calculation conditions
    min_width_enabled: boolean;
    min_width: number;
    max_width_enabled: boolean;
    max_width: number;
    max_height_enabled: boolean;
    max_height: number;
    min_price_width_enabled: boolean;
    min_price_width: number;
    min_price_height_enabled: boolean;
    min_price_height: number;
    height_step_enabled: boolean;
    height_step: number;
    min_area_enabled: boolean;
    min_area: number;
    area_factor_enabled: boolean;
    area_factor: number;
    area_rounding_enabled: boolean;
    area_rounding: number;
    production_reqs?: Record<string, boolean>;
    created_at: string;
    updated_at: string;
}
