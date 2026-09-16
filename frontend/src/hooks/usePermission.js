import useAuthStore from '../store/authStore';

export const usePermission = () => {
    const { user } = useAuthStore();

    const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin' || (user?.roles || []).some(r => r.slug === 'super_admin' || r.slug === 'admin');

    const permissions = user?.permissions || [];

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
        if (user.role === roleSlug) return true;
        return (user.roles || []).some(r => r.slug === roleSlug);
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
