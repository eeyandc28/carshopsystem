const supabase = require('../lib/supabase');

/**
 * Fetch all effective permission slugs for a user.
 * @param {number|string} userId
 * @param {string} legacyRole
 * @returns {Promise<string[]>}
 */
const fetchUserPermissions = async (userId, legacyRole) => {
    // Super Administrator has all permissions unconditionally
    if (legacyRole === 'super_admin' || legacyRole === 'admin') {
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
        if (userRoles && userRoles.length > 0) {
            roleIds = userRoles
                .filter(ur => ur.role?.status !== 'inactive')
                .map(ur => ur.role_id);
        }

        // Fallback: If user_roles is empty, find role by legacy role slug
        if (roleIds.length === 0 && legacyRole) {
            const { data: matchedRole } = await supabase
                .from('roles')
                .select('id')
                .or(`slug.eq.${legacyRole},slug.eq.${legacyRole.toLowerCase()}`)
                .single();
            if (matchedRole) {
                roleIds.push(matchedRole.id);
            }
        }

        if (roleIds.length === 0) {
            return [];
        }

        // 2. Get permission IDs for these roles
        const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .in('role_id', roleIds);

        if (!rolePerms || rolePerms.length === 0) {
            return [];
        }

        const permIds = [...new Set(rolePerms.map(rp => rp.permission_id))];

        // 3. Get permission slugs
        const { data: perms } = await supabase
            .from('permissions')
            .select('slug')
            .in('id', permIds);

        return (perms || []).map(p => p.slug);
    } catch (err) {
        console.error('[fetchUserPermissions Error]', err);
        return [];
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
