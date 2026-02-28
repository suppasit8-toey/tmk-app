export type AppRole =
    | 'admin'
    | 'customer_service'
    | 'sales_measurement'
    | 'technician'
    | 'supervisor'
    | 'stock_checker'
    | 'purchasing'
    | 'accounting'
    | 'quotation'
    | 'marketing';

export const routePermissions: Record<string, AppRole[]> = {
    '/dashboard': [
        'admin',
        'customer_service',
        'sales_measurement',
        'technician',
        'supervisor',
        'stock_checker',
        'purchasing',
        'accounting',
        'quotation',
        'marketing',
    ],
    '/projects': ['admin', 'customer_service', 'sales_measurement', 'quotation', 'technician', 'supervisor', 'stock_checker', 'purchasing', 'accounting', 'marketing'],
    '/customers': ['admin', 'customer_service', 'sales_measurement', 'quotation', 'technician', 'supervisor', 'stock_checker', 'purchasing', 'accounting', 'marketing'],
    '/accounting': ['admin', 'customer_service', 'sales_measurement', 'technician', 'supervisor', 'stock_checker', 'purchasing', 'accounting', 'quotation', 'marketing'],
    '/marketing': ['admin', 'marketing'],
    '/settings': [
        'admin',
        'customer_service',
        'sales_measurement',
        'technician',
        'supervisor',
        'stock_checker',
        'purchasing',
        'accounting',
        'quotation',
        'marketing',
    ],
};

export function hasAccess(userRole: AppRole | null | undefined, path: string): boolean {
    if (!userRole) return false;
    if (userRole === 'admin') return true;

    // Exact path match
    if (routePermissions[path] && routePermissions[path].includes(userRole)) {
        return true;
    }

    // Prefix match for sub-routes (e.g., /customers/123)
    if (path.startsWith('/customers/')) {
        const allowedRoles = routePermissions['/customers'];
        return allowedRoles ? allowedRoles.includes(userRole) : false;
    }
    for (const route in routePermissions) {
        if (path.startsWith(route) && routePermissions[route].includes(userRole)) {
            return true;
        }
    }

    return false;
}
