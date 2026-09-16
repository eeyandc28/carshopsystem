import useAuthStore from '../store/authStore';

export const getUserRoles = (user) => {
    if (!user) return [];
    const roles = new Set();

    // 1. Direct role property
    if (typeof user.role === 'string' && user.role.trim()) {
        const clean = user.role.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
        roles.add(clean);
    } else if (user.role && typeof user.role === 'object') {
        if (user.role.slug) roles.add(String(user.role.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
        if (user.role.name) roles.add(String(user.role.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
    }

    // 2. Roles array (can be array of strings or array of objects)
    if (Array.isArray(user.roles)) {
        user.roles.forEach(r => {
            if (typeof r === 'string' && r.trim()) {
                roles.add(r.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
            } else if (r && typeof r === 'object') {
                if (r.slug) roles.add(String(r.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
                if (r.name) roles.add(String(r.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
            }
        });
    }

    // 3. Role names array
    if (Array.isArray(user.role_names)) {
        user.role_names.forEach(r => {
            if (typeof r === 'string' && r.trim()) {
                roles.add(r.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
            }
        });
    }

    // 4. Fallback from email/username if roles still empty
    if (roles.size === 0) {
        const textToScan = `${user.email || ''} ${user.username || ''} ${user.name || ''}`.toLowerCase();
        if (textToScan.includes('cashier')) roles.add('cashier');
        if (textToScan.includes('super_admin') || textToScan.includes('superadmin')) roles.add('super_admin');
        else if (textToScan.includes('admin')) roles.add('admin');
        if (textToScan.includes('mechanic')) roles.add('mechanic');
        if (textToScan.includes('inventory')) roles.add('inventory_staff');
        if (textToScan.includes('advisor')) roles.add('service_advisor');
    }

    return Array.from(roles).filter(Boolean);
};

export const DEFAULT_ROLE_PERMISSIONS = {
    super_admin: ['*'],
    admin: ['*'],
    cashier: [
        'dashboard.view',
        'payments.view', 'payments.create', 'payments.print', 'payments.void',
        'invoices.view', 'invoices.create', 'invoices.print',
        'job_orders.view',
        'reports.sales', 'reports.financial'
    ],
    service_advisor: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit',
        'vehicles.view', 'vehicles.create', 'vehicles.edit',
        'job_orders.view', 'job_orders.create', 'job_orders.edit', 'job_orders.estimate', 'job_orders.diagnose', 'job_orders.complete',
        'inventory.view', 'inventory.stock_in', 'suppliers.view'
    ],
    mechanic: [
        'dashboard.view',
        'job_orders.view', 'job_orders.diagnose', 'job_orders.complete'
    ],
    inventory_staff: [
        'dashboard.view',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.stock_in',
        'suppliers.view', 'suppliers.create', 'suppliers.edit',
        'reports.inventory'
    ],
    receptionist: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit',
        'vehicles.view', 'vehicles.create', 'vehicles.edit'
    ],
    general_manager: [
        'dashboard.view',
        'reports.sales', 'reports.financial', 'reports.inventory',
        'job_orders.view', 'customers.view', 'vehicles.view', 'inventory.view'
    ],
    accountant: [
        'dashboard.view',
        'payments.view', 'invoices.view',
        'reports.sales', 'reports.financial'
    ],
    sales_staff: [
        'dashboard.view',
        'customers.view', 'customers.create', 'customers.edit',
        'vehicles.view', 'vehicles.create', 'vehicles.edit',
        'reports.sales'
    ]
};

export const usePermission = () => {
    const { user } = useAuthStore();

    const userRoles = getUserRoles(user);
    const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('admin');

    // Combine database permissions and role fallback permissions
    const rawPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
    let fallbackPerms = [];
    userRoles.forEach(r => {
        if (DEFAULT_ROLE_PERMISSIONS[r]) {
            fallbackPerms.push(...DEFAULT_ROLE_PERMISSIONS[r]);
        }
    });

    const permissions = [...new Set([...rawPermissions, ...fallbackPerms])];

    const hasPermission = (permission) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes('*')) return true;
        if (!permission) return true;

        if (Array.isArray(permission)) {
            return permission.some(p => permissions.includes(p));
        }

        return permissions.includes(permission);
    };

    const hasAnyPermission = (permList = []) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes('*')) return true;
        return permList.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (permList = []) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        if (permissions.includes('*')) return true;
        return permList.every(p => permissions.includes(p));
    };

    const hasRole = (roleSlug) => {
        if (!user) return false;
        const target = String(roleSlug || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
        return userRoles.includes(target);
    };

    return {
        user,
        userRoles,
        permissions,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole
    };
};

export default usePermission;


