import useAuthStore from '../store/authStore';

const DEFAULT_ROLE_PERMISSIONS = {
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
    ]
};

export const usePermission = () => {
    const { user } = useAuthStore();

    const userRoles = [
        user?.role?.toLowerCase(),
        ...(user?.roles || []).map(r => r.slug?.toLowerCase() || r.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_')),
        ...(user?.role_names || []).map(r => r.toLowerCase().replace(/[^a-z0-9]+/g, '_'))
    ].filter(Boolean);

    const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('admin');

    // Combine database permissions and role fallback permissions
    const rawPermissions = user?.permissions || [];
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
        const target = roleSlug?.toLowerCase();
        return userRoles.includes(target);
    };

    return {
        user,
        permissions,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole
    };
};

export default usePermission;

