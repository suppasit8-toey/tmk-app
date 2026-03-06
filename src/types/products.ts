export interface Product {
    id: string;
    name: string;
    category_id: string;
    description: string | null;
    base_price: number;
    srr_price: number;
    cost_price: number;
    unit: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    price_tiers?: ProductPriceTier[]; // Added for nested relation
}

export interface ProductPriceTier {
    id: string;
    product_id: string;
    min_width: number;
    max_width: number;
    price: number;
    platform_price: number;
    sort_order: number;
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
    // Fabric calculation constants
    fabric_multiplier: number;
    rail_cost_per_meter: number;
    sewing_cost_per_meter: number;
    selling_markup: number;
    height_allowance: number;
    normal_height_deduction: number;
    fabric_width_deduction: number;
    production_reqs?: Record<string, boolean>;
    designs?: CategoryDesign[];
    fabric_price_codes?: FabricPriceCode[];
    design_options?: CategoryDesignOption[];
    created_at: string;
    updated_at: string;
}

export interface CategoryDesign {
    id: string;
    category_id: string;
    name: string;
    width_source: string;
    width_offset_left: number;
    width_offset_right: number;
    height_source: string;
    height_offset_top: number;
    height_offset_bottom: number;
    floor_clearance_options: { name: string; value: number }[];
    sort_order: number;
    created_at: string;
}

export interface FabricPriceCode {
    id: string;
    category_id: string;
    code_name: string;
    code_color: string;
    fabric_width: number;
    normal_sell_price: number;
    normal_cost_price: number;
    rotated_cost_per_yard: number;
    sort_order: number;
    created_at: string;
}

export interface CategoryDesignOption {
    id: string;
    category_id: string;
    option_name: string;
    choices: string[];
    sort_order: number;
    created_at: string;
}

