const supabase = require('../lib/supabase');

const DEFAULT_ROLE_PERMS = {
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

/**
 * Fetch all effective permission slugs for a user.
 * @param {number|string} userId
 * @param {string} legacyRole
 * @returns {Promise<string[]>}
 */
const fetchUserPermissions = async (userId, legacyRole) => {
    const cleanLegacyRole = (legacyRole || '').toLowerCase().trim();

    // Super Administrator has all permissions unconditionally
    if (cleanLegacyRole === 'super_admin' || cleanLegacyRole === 'admin') {
        const { data: allPerms } = await supabase.from('permissions').select('slug');
        if (allPerms && allPerms.length > 0) {
            return allPerms.map(p => p.slug);
        }
        return ['*'];
    }

    try {
        // 1. Get role IDs assigned to user via user_roles
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id, role:roles(id, slug, status)')
            .eq('user_id', userId);

        let roleIds = [];
        let roleSlugs = [];

        if (userRoles && userRoles.length > 0) {
            userRoles
                .filter(ur => ur.role?.status !== 'inactive')
                .forEach(ur => {
                    if (ur.role_id) roleIds.push(ur.role_id);
                    if (ur.role?.slug) roleSlugs.push(ur.role.slug.toLowerCase());
                });
        }

        // Fallback: If user_roles is empty, find role by legacy role slug
        if (roleIds.length === 0 && cleanLegacyRole) {
            roleSlugs.push(cleanLegacyRole);
            const { data: matchedRole } = await supabase
                .from('roles')
                .select('id, slug')
                .ilike('slug', cleanLegacyRole)
                .single();
            if (matchedRole) {
                roleIds.push(matchedRole.id);
            }
        }

        // Gather fallback default perms from any matched roles
        let fallbackPerms = [];
        roleSlugs.forEach(slug => {
            if (DEFAULT_ROLE_PERMS[slug]) {
                fallbackPerms.push(...DEFAULT_ROLE_PERMS[slug]);
            }
        });

        if (roleIds.length === 0) {
            return [...new Set(fallbackPerms)];
        }

        // 2. Get permission IDs for these roles
        const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .in('role_id', roleIds);

        if (!rolePerms || rolePerms.length === 0) {
            return [...new Set(fallbackPerms)];
        }

        const permIds = [...new Set(rolePerms.map(rp => rp.permission_id))];

        // 3. Get permission slugs
        const { data: perms } = await supabase
            .from('permissions')
            .select('slug')
            .in('id', permIds);

        const dbPerms = (perms || []).map(p => p.slug);
        return [...new Set([...dbPerms, ...fallbackPerms])];
    } catch (err) {
        console.error('[fetchUserPermissions Error]', err);
        return DEFAULT_ROLE_PERMS[cleanLegacyRole] || [];
    }
};


/**
 * Middleware to require a specific permission.
 * Usage: router.get('/', requirePermission('users.view'), handler);
 * @param {string|string[]} requiredPermission - slug or array of acceptable slugs
 */
const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        // Super Admin bypass
        if (req.user.role === 'super_admin' || req.user.role === 'admin') {
            req.userPermissions = ['*'];
            return next();
        }

        const userPerms = await fetchUserPermissions(req.user.id, req.user.role);
        req.userPermissions = userPerms;

        const permsToCheck = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

        const hasAccess = userPerms.includes('*') || permsToCheck.some(p => userPerms.includes(p));

        if (!hasAccess) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action.',
                required_permission: requiredPermission
            });
        }

        next();
    };
};

module.exports = {
    fetchUserPermissions,
    requirePermission
};
